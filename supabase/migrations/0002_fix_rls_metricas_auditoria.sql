-- ═══════════════════════════════════════════════════════════════════
-- Migration 0002 — Isolamento da view de métricas e autoria da auditoria
-- (SEC-08 e SEC-09 · parecer independente docs/17, achados F-01 e F-02)
--
-- Retrofit para projeto onde supabase/schema.sql JÁ FOI colado (o schema.sql
-- atualizado já nasce corrigido — este arquivo aplica o mesmo estado por cima).
-- Idempotente: pode rodar mais de uma vez. Aplicar no SQL Editor; ordem em
-- relação à 0001 é indiferente (objetos distintos).
-- ═══════════════════════════════════════════════════════════════════

-- F-01 · metricas_gestor vazava agregados de TODAS as centrais.
-- A view É definer de propósito (GESTOR não tem select em `ocorrencias` — doutrina
-- "gestor sem PII por construção"); o isolamento vem do predicado de tenant DENTRO
-- dela. Para `anon`, meu_tenant() é null → resultado vazio; o revoke é o cinto.
create or replace view metricas_gestor with (security_invoker = false) as
select
  o.tenant_id,
  date_trunc('day', o.created_at) as dia,
  count(*) as chamadas,
  count(*) filter (where o.risco_final = 'RED') as vermelhos,
  count(*) filter (where o.divergencia_justificativa is not null) as divergencias,
  avg(extract(epoch from (d.t2_no_local - d.t0_despacho))) as t_resposta_medio_s
from ocorrencias o
left join despachos d on d.ocorrencia_id = o.id
where o.tenant_id = meu_tenant()
group by 1, 2;
revoke all on metricas_gestor from anon;

-- F-02 · auditoria aceitava insert em nome de qualquer operador do tenant.
-- usuario_id preso ao auth.uid(); o único caminho de escrita do app já envia o
-- próprio id (src/App.tsx, função audit), então nada legítimo quebra.
drop policy if exists auditoria_insert on auditoria;
create policy auditoria_insert on auditoria for insert
  with check (tenant_id = meu_tenant() and usuario_id = auth.uid());

-- F-03 (parte de grants) · TRUNCATE tem privilégio próprio, fora de update/delete
-- e fora do RLS — os grants default do Supabase o incluem. A 0001 v2 também cria
-- o gatilho de comando; aqui garante-se o revoke mesmo sem a 0001 aplicada.
revoke truncate on auditoria from anon, authenticated;

-- ── Conferência (rodar depois de aplicar; resultados esperados no comentário) ──
-- 1. Predicado presente na view:
--    select pg_get_viewdef('metricas_gestor'::regclass, true);
--      → deve conter "o.tenant_id = meu_tenant()"
-- 2. Policy estrita:
--    select polname, pg_get_expr(polwithcheck, polrelid) from pg_policy
--     where polrelid = 'auditoria'::regclass and polname = 'auditoria_insert';
--      → deve conter "usuario_id = auth.uid()"
-- 3. TRUNCATE revogado (não deve retornar linha para anon/authenticated):
--    select grantee, privilege_type from information_schema.role_table_grants
--     where table_name in ('auditoria','metricas_gestor')
--       and grantee in ('anon','authenticated')
--       and privilege_type = 'TRUNCATE';
-- 4. Isolamento na prática: logado como usuário de um tenant,
--    select distinct tenant_id from metricas_gestor;
--      → exatamente 1 linha, o próprio tenant.
