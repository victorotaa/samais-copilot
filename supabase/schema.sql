-- ═══════════════════════════════════════════════════════════════════
-- Samais CoPilot OS — Schema Supabase v0.1 (multi-tenant)
-- Colar integralmente no SQL Editor do projeto Supabase (Region: São Paulo).
-- Desenho: docs/06-backend-supabase.md · Tenancy: RLS por tenant_id.
-- ═══════════════════════════════════════════════════════════════════

-- Tenants: cada CRU / consórcio / operação contratante
create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,            -- ex: 'cru-sao-paulo'
  name text not null,
  created_at timestamptz not null default now()
);

create table unidades (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,                   -- ex: 'Base Central'
  kind text not null check (kind in ('CRU', 'BASE', 'HOSPITAL')),
  lat double precision,
  lng double precision
);

-- Usuários: vínculo da matrícula operacional com o auth do Supabase.
-- Login = e-mail sintético `<matricula>@<tenant-slug>.samais.app` + senha + MFA TOTP.
create table usuarios (
  id uuid primary key references auth.users(id),
  tenant_id uuid not null references tenants(id),
  matricula text not null,              -- ex: 'TARM-04'
  name text not null,
  role text not null check (role in ('TARM', 'REGULADOR', 'VIATURA', 'GESTOR', 'ADMIN_TENANT')),
  active boolean not null default true,
  unique (tenant_id, matricula)
);

create table viaturas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  codigo text not null,                 -- ex: 'USA-01'
  tipo text not null check (tipo in ('USA', 'USB', 'MOTOLANCIA')),
  base_id uuid references unidades(id),
  status text not null default 'DISPONIVEL'
    check (status in ('DISPONIVEL', 'EM_ATENDIMENTO', 'RETORNO', 'MANUTENCAO')),
  manutencao_prevista date,
  unique (tenant_id, codigo)
);

-- Escalas: cada login enxerga a própria; gestor administra todas (esquema PEP)
create table escalas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  usuario_id uuid not null references usuarios(id),
  dia date not null,
  turno text not null check (turno in ('DIURNO', 'NOTURNO', 'ADMINISTRATIVO', 'SOBREAVISO', 'FOLGA')),
  hora_inicio time,
  hora_fim time,
  unidade_id uuid references unidades(id),
  status text not null default 'PROGRAMADO'
    check (status in ('PROGRAMADO', 'EM_PLANTAO', 'FOLGA', 'FERIAS', 'ATESTADO', 'TROCA_SOLICITADA')),
  unique (usuario_id, dia)
);

-- Ciclo da ocorrência: chamada → triagem → regulação → despacho → desfecho
create table ocorrencias (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  numero serial,
  telefone text,
  aml jsonb,                            -- localização AML (lat/lng/endereço)
  transcricao jsonb,                    -- turnos da conversa (speaker, texto, ts)
  extracao jsonb,                       -- sintomas, comorbidades, paciente (IA)
  risco_sugerido text check (risco_sugerido in ('RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE')),
  fatores_ia jsonb,                     -- explicabilidade: fatores e pesos
  risco_final text check (risco_final in ('RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE')),
  divergencia_justificativa text,       -- preenchida quando regulador discorda da IA
  regulador_id uuid references usuarios(id),
  tarm_id uuid references usuarios(id),
  created_at timestamptz not null default now(),
  encerrada_at timestamptz
);

create table despachos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  ocorrencia_id uuid not null references ocorrencias(id),
  viatura_id uuid not null references viaturas(id),
  justificativa text,
  -- timestamps de missão (T0–T4) alimentados pelos botões de 1 toque do tablet
  t0_despacho timestamptz not null default now(),
  t1_a_caminho timestamptz,
  t2_no_local timestamptz,
  t3_transportando timestamptz,
  t4_no_hospital timestamptz
);

-- Auditoria append-only: nenhuma linha é alterada ou apagada (cadeia de custódia)
create table auditoria (
  id bigserial primary key,
  tenant_id uuid not null references tenants(id),
  usuario_id uuid references usuarios(id),
  acao text not null,                   -- ex: 'OCORRENCIA_CLASSIFICADA'
  alvo jsonb,
  hash_anterior text,                   -- encadeamento p/ imutabilidade verificável
  created_at timestamptz not null default now()
);
-- TRUNCATE tem privilégio próprio (não coberto por update/delete) e não passa por RLS
-- nem por trigger de linha — revogar explicitamente (parecer docs/17 F-03).
revoke update, delete, truncate on auditoria from anon, authenticated;

-- ── RLS: isolamento estrito por tenant ──
alter table tenants enable row level security;
alter table unidades enable row level security;
alter table usuarios enable row level security;
alter table viaturas enable row level security;
alter table escalas enable row level security;
alter table ocorrencias enable row level security;
alter table despachos enable row level security;
alter table auditoria enable row level security;

create or replace function meu_tenant() returns uuid
language sql stable security definer set search_path = public as
$$ select tenant_id from usuarios where id = auth.uid() $$;

create or replace function meu_role() returns text
language sql stable security definer set search_path = public as
$$ select role from usuarios where id = auth.uid() $$;

create policy tenant_select on tenants for select using (id = meu_tenant());
create policy unidades_all on unidades for all using (tenant_id = meu_tenant());
create policy usuarios_select on usuarios for select using (tenant_id = meu_tenant());
create policy viaturas_select on viaturas for select using (tenant_id = meu_tenant());
create policy viaturas_gestor on viaturas for update
  using (tenant_id = meu_tenant() and meu_role() in ('GESTOR', 'ADMIN_TENANT'));

-- Escala: cada um vê a sua; gestor vê e edita todas do tenant
create policy escala_propria on escalas for select
  using (tenant_id = meu_tenant() and (usuario_id = auth.uid() or meu_role() in ('GESTOR', 'ADMIN_TENANT')));
create policy escala_gestor on escalas for all
  using (tenant_id = meu_tenant() and meu_role() in ('GESTOR', 'ADMIN_TENANT'));

-- Ocorrências: operação vê tudo do tenant; GESTOR NÃO acessa PII
-- (gestor consome apenas a view agregada abaixo)
create policy ocorrencias_operacao on ocorrencias for all
  using (tenant_id = meu_tenant() and meu_role() in ('TARM', 'REGULADOR', 'VIATURA', 'ADMIN_TENANT'));
create policy despachos_operacao on despachos for all
  using (tenant_id = meu_tenant() and meu_role() in ('TARM', 'REGULADOR', 'VIATURA', 'ADMIN_TENANT'));
-- usuario_id preso ao auth.uid(): sem isso, qualquer usuário do tenant insere registro
-- de auditoria em nome de outro operador (parecer docs/17 F-02).
create policy auditoria_insert on auditoria for insert
  with check (tenant_id = meu_tenant() and usuario_id = auth.uid());
create policy auditoria_gestor on auditoria for select
  using (tenant_id = meu_tenant() and meu_role() in ('GESTOR', 'ADMIN_TENANT'));

-- Métricas agregadas, sem PII — é isto que o painel do Gestor consome.
-- A view É definer de propósito: GESTOR não tem policy de select em `ocorrencias`
-- ("gestor sem PII por construção"), então `security_invoker = true` o deixaria sem
-- painel. O isolamento entre centrais vem do predicado de tenant DENTRO da view —
-- sem ele, a view definer contorna o RLS das tabelas base e entrega o agregado de
-- todos os tenants a qualquer autenticado (parecer docs/17 F-01). Para `anon`,
-- meu_tenant() é null e o predicado zera o resultado; o revoke abaixo é o cinto.
create view metricas_gestor with (security_invoker = false) as
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
