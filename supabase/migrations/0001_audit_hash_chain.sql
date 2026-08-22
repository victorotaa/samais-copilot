-- ═══════════════════════════════════════════════════════════════════
-- Migration 0001 v2 — Audit log com hash encadeado verificável (SEC-05 / SEC-09)
-- Torna a tabela `auditoria` imutável e à prova de adulteração SEM blockchain:
-- cada registro carrega o hash do anterior; alterar qualquer linha quebra a cadeia.
--
-- v2 (revisada após o parecer independente docs/17 F-03, ANTES de qualquer
-- aplicação — a v1 nunca foi aplicada). Quatro defeitos corrigidos:
--   1. corrida na leitura do último hash (dois inserts concorrentes bifurcavam a
--      cadeia e a verificação acusava adulteração falsa) → lock consultivo por tenant;
--   2. payload com `created_at::text`, que muda com DateStyle/TimeZone da sessão
--      (a mesma linha verificava ou não conforme quem verificasse) → to_char em UTC
--      com formato fixo;
--   3. TRUNCATE não disparava os gatilhos de linha → gatilho de comando + revoke;
--   4. (achado na revisão de 22/08, ausente do parecer) linhas JÁ EXISTENTES na
--      tabela não têm hash — sem backfill, `verificar_cadeia_auditoria` acusaria a
--      primeira linha histórica como adulterada. O backfill roda sob o mesmo lock,
--      ANTES dos gatilhos de imutabilidade (que bloqueariam o próprio backfill).
--
-- Aplicar no SQL Editor DEPOIS de supabase/schema.sql. Idempotente onde possível
-- (o backfill só toca linha com hash_atual nulo).
-- ═══════════════════════════════════════════════════════════════════

-- pgcrypto primeiro: digest() é usado já no backfill (Supabase habilita; garantir).
create extension if not exists pgcrypto;

-- Colunas de encadeamento (hash_anterior já existe no schema base; adiciona hash_atual).
alter table auditoria add column if not exists hash_atual text;

-- Payload canônico determinístico do registro (ordem fixa de campos).
-- `stable`, não `immutable`: to_char consta como stable no catálogo (formatos TM/nome
-- de mês dependem de locale); com este formato puramente numérico a saída é
-- determinística — e é isso que a verificação exige. jsonb::text é canônico.
create or replace function _auditoria_payload(r auditoria) returns text
language sql stable as $$
  select coalesce(r.tenant_id::text,'') || '|' ||
         coalesce(r.usuario_id::text,'') || '|' ||
         coalesce(r.acao,'') || '|' ||
         coalesce(r.alvo::text,'') || '|' ||
         coalesce(to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),'')
$$;

-- Trigger: calcula hash_anterior (último hash_atual do tenant) e hash_atual (sha256 encadeado).
-- O lock consultivo serializa os inserts DO MESMO tenant até o commit: sem ele, dois
-- inserts concorrentes leem o mesmo `prev` e a cadeia bifurca (o caso normal numa CRU
-- com dezenas de operadores). Custo: serializa só a auditoria, só dentro do tenant.
create or replace function auditoria_encadear() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  prev text;
begin
  perform pg_advisory_xact_lock(hashtextextended('auditoria:' || new.tenant_id::text, 0));

  select hash_atual into prev
    from auditoria
   where tenant_id = new.tenant_id
   order by id desc
   limit 1;

  new.hash_anterior := coalesce(prev, repeat('0', 64)); -- genesis por tenant
  new.hash_atual := encode(
    digest(new.hash_anterior || '|' || _auditoria_payload(new), 'sha256'),
    'hex'
  );
  return new;
end;
$$;

drop trigger if exists trg_auditoria_encadear on auditoria;
create trigger trg_auditoria_encadear
  before insert on auditoria
  for each row execute function auditoria_encadear();

-- BACKFILL das linhas pré-existentes (defeito 4): encadeia o histórico em ordem de id,
-- por tenant, sob o mesmo lock do trigger — um insert ao vivo durante o backfill espera,
-- em vez de encadear no meio de uma cadeia pela metade. Só toca linha sem hash_atual.
-- PRECISA rodar antes dos gatilhos de imutabilidade abaixo (que bloqueiam UPDATE).
do $$
declare
  t uuid;
  r auditoria;
  prev text;
  calc text;
begin
  for t in select distinct tenant_id from auditoria loop
    perform pg_advisory_xact_lock(hashtextextended('auditoria:' || t::text, 0));
    prev := repeat('0', 64);
    for r in select * from auditoria where tenant_id = t order by id asc loop
      if r.hash_atual is null then
        calc := encode(digest(prev || '|' || _auditoria_payload(r), 'sha256'), 'hex');
        update auditoria set hash_anterior = prev, hash_atual = calc where id = r.id;
        prev := calc;
      else
        prev := r.hash_atual;
      end if;
    end loop;
  end loop;
end;
$$;

-- Imutabilidade: bloqueia UPDATE/DELETE/TRUNCATE para QUALQUER papel (inclusive authenticated).
create or replace function auditoria_imutavel() returns trigger
language plpgsql as $$
begin
  raise exception 'auditoria é append-only: % proibido', tg_op;
end;
$$;

drop trigger if exists trg_auditoria_no_update on auditoria;
create trigger trg_auditoria_no_update
  before update or delete on auditoria
  for each row execute function auditoria_imutavel();

-- TRUNCATE não dispara gatilho de linha nem passa por RLS: gatilho de comando + revoke
-- do privilégio (que é separado de update/delete e vem nos grants default do Supabase).
drop trigger if exists trg_auditoria_no_truncate on auditoria;
create trigger trg_auditoria_no_truncate
  before truncate on auditoria
  for each statement execute function auditoria_imutavel();
revoke truncate on auditoria from anon, authenticated;

-- Verificação: recomputa a cadeia do tenant e retorna o 1º id adulterado (NULL = íntegra).
create or replace function verificar_cadeia_auditoria(p_tenant uuid)
returns table(primeiro_id_adulterado bigint)
language plpgsql security definer set search_path = public as $$
declare
  r auditoria;
  prev text := repeat('0', 64);
  calc text;
begin
  for r in
    select * from auditoria where tenant_id = p_tenant order by id asc
  loop
    calc := encode(digest(prev || '|' || _auditoria_payload(r), 'sha256'), 'hex');
    if r.hash_anterior is distinct from prev or r.hash_atual is distinct from calc then
      primeiro_id_adulterado := r.id;
      return next;
      return;
    end if;
    prev := r.hash_atual;
  end loop;
  primeiro_id_adulterado := null;
  return next;
end;
$$;

-- ── Conferência (rodar logo após aplicar) ──
-- select * from verificar_cadeia_auditoria('11111111-1111-1111-1111-111111111111');
--   → primeiro_id_adulterado = NULL (cadeia íntegra, histórico incluído)
-- select count(*) filter (where hash_atual is null) as sem_hash from auditoria;
--   → sem_hash = 0
