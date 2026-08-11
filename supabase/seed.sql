-- ═══════════════════════════════════════════════════════════════════
-- Samais CoPilot OS — Seed do tenant demo (CRU São Paulo)
-- Rodar DEPOIS do schema.sql, no SQL Editor do Supabase.
-- Cria os 4 logins operacionais: tarm-04 / reg-02 / usa-01 / gestor-01
-- ⚠️ ANTES DE RODAR: substitua TROQUE_ESTA_SENHA pela senha do ambiente de
--    demonstração (nunca comitar a senha real neste arquivo).
-- ⚠️ Ambiente com dado real: NÃO usar este seed — criar usuários pelo painel
--    com senha individual e MFA/TOTP obrigatório (SEC-03).
-- ═══════════════════════════════════════════════════════════════════

-- Tenant e unidades
insert into tenants (id, slug, name) values
  ('11111111-1111-1111-1111-111111111111', 'cru-sao-paulo', 'CRU São Paulo — Demo');

insert into unidades (id, tenant_id, name, kind, lat, lng) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'CRU Central', 'CRU', -23.5505, -46.6333),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Base Central', 'BASE', -23.5505, -46.6333),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'Base Leste', 'BASE', -23.5400, -46.4800);

-- Usuários de autenticação (GoTrue) — e-mail sintético por matrícula
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333301',
   'authenticated', 'authenticated', 'tarm-04@cru-sao-paulo.samais.app',
   crypt('TROQUE_ESTA_SENHA', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333302',
   'authenticated', 'authenticated', 'gestor-01@cru-sao-paulo.samais.app',
   crypt('TROQUE_ESTA_SENHA', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333303',
   'authenticated', 'authenticated', 'reg-02@cru-sao-paulo.samais.app',
   crypt('TROQUE_ESTA_SENHA', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333304',
   'authenticated', 'authenticated', 'usa-01@cru-sao-paulo.samais.app',
   crypt('TROQUE_ESTA_SENHA', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now()
from auth.users u
where u.email in ('tarm-04@cru-sao-paulo.samais.app', 'gestor-01@cru-sao-paulo.samais.app',
                  'reg-02@cru-sao-paulo.samais.app', 'usa-01@cru-sao-paulo.samais.app');

-- Vínculo operacional (os 4 papéis da demo)
insert into usuarios (id, tenant_id, matricula, name, role) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', 'TARM-04', 'Mariana S.', 'TARM'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', 'GESTOR-01', 'Carlos M.', 'GESTOR'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', 'REG-02', 'Dr. Paulo R.', 'REGULADOR'),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', 'USA-01', 'Equipe USA-01', 'VIATURA');

-- Frota (espelha o mock atual da demo)
insert into viaturas (tenant_id, codigo, tipo, base_id, status, manutencao_prevista) values
  ('11111111-1111-1111-1111-111111111111', 'USA-01', 'USA', '22222222-2222-2222-2222-222222222202', 'DISPONIVEL', null),
  ('11111111-1111-1111-1111-111111111111', 'USB-04', 'USB', '22222222-2222-2222-2222-222222222203', 'DISPONIVEL', null),
  ('11111111-1111-1111-1111-111111111111', 'MOT-01', 'MOTOLANCIA', '22222222-2222-2222-2222-222222222202', 'DISPONIVEL', null),
  ('11111111-1111-1111-1111-111111111111', 'USA-02', 'USA', '22222222-2222-2222-2222-222222222202', 'EM_ATENDIMENTO', null),
  ('11111111-1111-1111-1111-111111111111', 'USB-05', 'USB', '22222222-2222-2222-2222-222222222203', 'RETORNO', null),
  ('11111111-1111-1111-1111-111111111111', 'MOT-02', 'MOTOLANCIA', '22222222-2222-2222-2222-222222222203', 'MANUTENCAO', '2026-06-14');

-- Escala da semana (TARM-04 e GESTOR-01), 08–14/06/2026
insert into escalas (tenant_id, usuario_id, dia, turno, hora_inicio, hora_fim, unidade_id, status)
select '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333301',
       d.dia, d.turno, d.hi, d.hf, '22222222-2222-2222-2222-222222222201', d.st
from (values
  ('2026-06-08'::date, 'DIURNO', '07:00'::time, '19:00'::time, 'EM_PLANTAO'),
  ('2026-06-09'::date, 'DIURNO', '07:00'::time, '19:00'::time, 'EM_PLANTAO'),
  ('2026-06-10'::date, 'DIURNO', '07:00'::time, '19:00'::time, 'EM_PLANTAO'),
  ('2026-06-11'::date, 'FOLGA', null, null, 'FOLGA'),
  ('2026-06-12'::date, 'FOLGA', null, null, 'FOLGA'),
  ('2026-06-13'::date, 'DIURNO', '07:00'::time, '19:00'::time, 'PROGRAMADO'),
  ('2026-06-14'::date, 'DIURNO', '07:00'::time, '19:00'::time, 'PROGRAMADO')
) as d(dia, turno, hi, hf, st);

insert into escalas (tenant_id, usuario_id, dia, turno, hora_inicio, hora_fim, unidade_id, status)
select '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333302',
       d.dia, d.turno, d.hi, d.hf, '22222222-2222-2222-2222-222222222201', d.st
from (values
  ('2026-06-08'::date, 'ADMINISTRATIVO', '08:00'::time, '18:00'::time, 'EM_PLANTAO'),
  ('2026-06-09'::date, 'ADMINISTRATIVO', '08:00'::time, '18:00'::time, 'EM_PLANTAO'),
  ('2026-06-10'::date, 'ADMINISTRATIVO', '08:00'::time, '18:00'::time, 'EM_PLANTAO'),
  ('2026-06-11'::date, 'ADMINISTRATIVO', '08:00'::time, '18:00'::time, 'PROGRAMADO'),
  ('2026-06-12'::date, 'ADMINISTRATIVO', '08:00'::time, '18:00'::time, 'PROGRAMADO'),
  ('2026-06-13'::date, 'SOBREAVISO', null, null, 'PROGRAMADO'),
  ('2026-06-14'::date, 'FOLGA', null, null, 'FOLGA')
) as d(dia, turno, hi, hf, st);

-- Habilita realtime na frota (status ao vivo em todas as telas do tenant)
alter publication supabase_realtime add table viaturas;
