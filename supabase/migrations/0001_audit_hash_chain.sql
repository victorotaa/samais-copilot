-- ═══════════════════════════════════════════════════════════════════
-- Migration 0001 — Audit log com hash encadeado verificável (SEC-05)
-- Torna a tabela `auditoria` imutável e à prova de adulteração SEM blockchain:
-- cada registro carrega o hash do anterior; alterar qualquer linha quebra a cadeia.
--
-- Revisar antes de aplicar (handoff ao dev de segurança). Aplicar no SQL Editor
-- DEPOIS de supabase/schema.sql. Idempotente onde possível.
-- ═══════════════════════════════════════════════════════════════════

-- Colunas de encadeamento (hash_anterior já existe no schema base; adiciona hash_atual).
alter table auditoria add column if not exists hash_atual text;

-- Payload canônico determinístico do registro (ordem fixa de campos).
create or replace function _auditoria_payload(r auditoria) returns text
language sql immutable as $$
  select coalesce(r.tenant_id::text,'') || '|' ||
         coalesce(r.usuario_id::text,'') || '|' ||
         coalesce(r.acao,'') || '|' ||
         coalesce(r.alvo::text,'') || '|' ||
         coalesce(r.created_at::text,'')
$$;

-- Trigger: calcula hash_anterior (último hash_atual do tenant) e hash_atual (sha256 encadeado).
create or replace function auditoria_encadear() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  prev text;
begin
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

-- Imutabilidade: bloqueia UPDATE/DELETE para QUALQUER papel (inclusive authenticated).
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

-- Requer a extensão pgcrypto para digest()/sha256 (Supabase já habilita; garantir):
create extension if not exists pgcrypto;
