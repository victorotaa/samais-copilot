# Backend Supabase — guia de criação (10 minutos, ação do Victor)

> O agente não cria a conta: o cadastro exige a sua identidade (e-mail/GitHub) e o
> ambiente desta sessão não alcança supabase.com. Tudo o mais está pronto —
> schema, RLS e desenho de auth. Criada a conta, o wiring é uma sessão.

## Passo a passo

1. **Criar conta/projeto**: [supabase.com](https://supabase.com) → Sign up com o GitHub da Samais → New project:
   - Organization: `Samais`
   - Name: `samais-copilot`
   - Region: **South America (São Paulo)** ← importante (LGPD + latência)
   - Database password: gerar e guardar no gerenciador de senhas.
2. **Aplicar o schema**: painel → SQL Editor → colar o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql) → Run.
3. **Auth**: Authentication → Providers → deixar só **Email** habilitado (login por matrícula usa e-mail sintético `matricula@tenant.samais.app`); em **MFA**, habilitar TOTP.
4. **Chaves**: Settings → API → copiar **Project URL** e **anon public key** e me mandar no chat (são publicáveis; a segurança vem do RLS).

## O que acontece na sessão seguinte (meu lado)

- `@supabase/supabase-js` no app; login real por matrícula+senha (+TOTP).
- Estados da demo (frota, escala, fila, ocorrências) lidos/gravados no banco.
- Realtime: mudança de status de viatura propaga para todas as telas do tenant.
- Seeds do tenant demo (`cru-sao-paulo`) com os dados mock atuais.

## Decisões de desenho já embutidas no schema

- **Isolamento por tenant via RLS** — cada CRU só enxerga as próprias linhas.
- **Gestor sem PII**: não lê `ocorrencias`; consome a view agregada `metricas_gestor`.
- **Escala por login** (esquema PEP): cada matrícula vê a própria; Gestor administra todas.
- **T0–T4 no banco** (`despachos`): os botões de missão do tablet gravam os timestamps que viram SLA no dashboard.
- **Auditoria append-only** com hash encadeado — o lastro real do banner LGPD.
- **Explicabilidade persiste** (`fatores_ia`) e **divergência do Regulador** também — a base de retreino prevista na visão de produto.
