# Handoff — Onboarding do dev

> Para quem assume a engenharia do Samais CoPilot OS. Leitura honesta: o que é real, o que é teatro de demo, onde mexer primeiro. Pareie com `docs/05-review-operacional.md` (decisões de produto) e `docs/07-seguranca-backlog.md` (segurança).

## TL;DR
Protótipo navegável de alta fidelidade + backend inicial no Supabase. **~15–20% do caminho** para produto. A tese (IA copiloto no APH) é sólida; a parte difícil (IA real sobre áudio de emergência) **ainda não existe** — é mock determinístico.

## Stack
- **Front:** React 19 + Vite 6 + TS + Tailwind v4. App quase todo em `src/App.tsx` (monolito ~2k linhas — modularização é dívida conhecida, "Sprint 5").
- **Backend:** Supabase (Postgres + Auth + RLS + Realtime). Cliente em `src/lib/supabase.ts`.
- **Deploy:** Vercel. Produção = branch `main` → `samais-copilot-demo.vercel.app`. LP servida em `/lp/` no mesmo deploy.
- **Mapas:** Google Maps Embed API (chave de demo, restrita por referrer).

## Real × Mock (não se engane com a demo)
| Área | Real | Mock / pendente |
|---|---|---|
| Login por matrícula, perfis (TARM/Médico/Viatura/Gestor) | ✅ Supabase Auth (cai em modo demo se offline) | MFA ainda não obrigatório (SEC-03) |
| Frota, escalas (planner do gestor) | ✅ persistem no banco + realtime | — |
| **Triagem por IA (STT + NLP + Manchester)** | ❌ | **`MOCK_SCRIPTS` determinístico** — sem Deepgram, sem LLM |
| Integração com PABX da CRU | ❌ | Não existe (arquitetura SIPREC em `docs/05` §3) |
| Ocorrências ponta a ponta (chamada→despacho→T0–T4) | ❌ | Não persistem ainda — **próximo grande item** |
| FHIR R4 / APH-BR | ❌ | `JSON.stringify` de mock no Dashboard, não pipeline |
| Compliance (AES/SHA/audit) | ❌ | Claims declarativos — ver `SECURITY.md` e SEC-20 |

## Rodando localmente
```
npm ci
npm run dev            # app + /lp
npm run build          # vite build + copia lp/ e assets para dist/
npx tsc --noEmit       # typecheck (não há ESLint/test ainda — dívida)
```
Variáveis (`.env`, ver `.env.example`): `VITE_GOOGLE_MAPS_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`. A chave `publishable`/anon do Supabase vai ao cliente **por design** — a segurança vem do RLS. Nunca colocar `service_role` no front.

## Banco
- `supabase/schema.sql` — tenants, unidades, usuários (por matrícula), viaturas, escalas, ocorrências (com explicabilidade + divergência), despachos (T0–T4), `auditoria` append-only, view `metricas_gestor` (sem PII).
- `supabase/seed.sql` — tenant demo `cru-sao-paulo`, logins `TARM-04`/`REG-02`/`USA-01`/`GESTOR-01` (senha `SamaisDemo2026`).
- `supabase/migrations/0001_audit_hash_chain.sql` — **revisar e aplicar**: implementa o hash-chain da auditoria (hoje a coluna existe mas nada a computa — SEC-05).

## Onde mexer primeiro (ordem sugerida)
1. **Tier 0 de segurança** (`docs/07`) — inclui rotacionar a senha do banco (foi exposta em chat no desenvolvimento) e aplicar a migration 0001.
2. **IA real** substituindo `MOCK_SCRIPTS` — Deepgram (STT streaming) + LLM para extração/Manchester, com fallback degradado (arquitetura em `docs/05` §2). É o que tira o produto do "teatro".
3. **Persistir ocorrências ponta a ponta** → desbloqueia métricas reais no Dashboard (view já existe) e o lastro do APH-BR.
4. **Modularizar `App.tsx`** + ESLint + testes (Vitest/Playwright) + CI seguro (SEC-14).

## Riscos conhecidos (ditos na cara)
- **Segredo exposto:** senha do banco passou por chat — rotacionar (SEC-01).
- **Claims sem lastro:** banner LGPD afirma controles não implementados (SEC-20).
- **Defensabilidade baixa hoje:** o moat real é dado (APH-BR), que é circular (precisa operar p/ ter dado). Ver doc de valuation no vault.
- **Monolito `App.tsx`:** dificulta evolução; refator é dívida priorizada mas não-bloqueante.

## Contexto estratégico (vault Obsidian, pasta Samais)
- "Valuation honesto (com e sem APH-BR)"
- "Cibersegurança, blockchain e ângulo UE-Brasil" — inclui a leitura da adequação de dados UE↔Brasil (jan/2026), que é o que dá tração ao APH-BR.
