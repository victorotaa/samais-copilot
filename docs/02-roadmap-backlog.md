# Roadmap e Backlog — Samais CoPilot OS

> Backlog priorizado, com sinalização clara do que dá para fechar dentro desta sessão (Claude no repo) e do que **depende de você** (decisão de produto, credenciais, integrações externas, infra).

## Legenda

- 🟢 **Posso fechar aqui** — código, docs, configuração no repo
- 🟡 **Posso preparar, mas depende de input seu** — esqueleto pronto, decisão/credencial necessária antes de finalizar
- 🔴 **Depende exclusivamente de você** — credenciais, contratos, infra externa, decisão de negócio

---

## Sprint 0 — Build pronta e identidade unificada (esta rodada)

| # | Item | Status | Tipo |
|---|------|--------|------|
| 0.1 | Análise do estado atual (`docs/00-analise-atual.md`) | ✅ entregue | 🟢 |
| 0.2 | Visão de produto (`docs/01-visao-produto.md`) | ✅ entregue | 🟢 |
| 0.3 | Roadmap (este doc) | ✅ entregue | 🟢 |
| 0.4 | Spec da LP B2B (`docs/03-landing-page-spec.md`) | ✅ entregue | 🟢 |
| 0.5 | Design system + dual theme (`docs/04-design-system.md`) | ✅ entregue | 🟢 |
| 0.6 | `vercel.json` no root do app principal | ✅ entregue | 🟢 |
| 0.7 | Theme toggle dark/light funcional (infra + botão no header, persiste em localStorage) | ✅ entregue | 🟢 |
| 0.8 | `index.html` com meta tags, OG, favicon-ready | ✅ entregue | 🟢 |
| 0.9 | README real (substitui boilerplate AI Studio) | ✅ entregue | 🟢 |
| 0.10 | `package.json` com nome/descrição corretos, dependências mortas removidas | ✅ entregue | 🟢 |

## Sprint 1 — Paridade visual com PEP OS

| # | Item | Status | Tipo |
|---|------|--------|------|
| 1.1 | Adicionar `victorotaa/samais-pep` ao escopo da sessão | ✅ liberado | 🔴 |
| 1.2 | Extrair tokens visuais do PEP OS (paleta exata, raios, sombras, type scale) | ✅ entregue (fonte: `design/samais-pep-os-design-tokens.json` v1.0) | 🟢 |
| 1.3 | Aplicar tokens ao `--theme` do CoPilot — **migração big-bang do App.tsx para tokens semânticos** | ✅ entregue | 🟢 |
| 1.4 | Unificar paleta entre `App.tsx` e `master-plan-rota.html` | ✅ entregue | 🟢 |
| 1.5 | Validar paridade light/dark com prints lado a lado PEP × CoPilot | pendente (requer revisão visual sua) | 🟡 |

## Sprint 2 — Landing Page B2B

| # | Item | Status | Tipo |
|---|------|--------|------|
| 2.1 | Implementar LP seguindo `03-landing-page-spec.md` — opção B: `lp/` standalone com `vercel.json` próprio | ✅ entregue | 🟢 |
| 2.2 | Forms de contato comercial (gestor público, plano, hospital) | a fazer | 🟡 (precisa: para onde envia? Resend? webhook? CRM?) |
| 2.3 | Provas sociais (cases Ourinhos, CISNORPI, Campos Gerais já citados na PR #1) | a fazer | 🟡 (precisa: autorização para usar nome dos parceiros) |
| 2.4 | Vídeo demo de 90s do CoPilot | não iniciado | 🔴 (gravação) |

## Sprint 3 — IA real (substituir mock)

| # | Item | Status | Tipo |
|---|------|--------|------|
| 3.1 | Wiring do `@google/genai` para extração de sintomas/risco a partir de texto de transcrição | a fazer | 🟡 (precisa: `GEMINI_API_KEY` em produção) |
| 3.2 | Provider de STT (Deepgram Nova-2 está citado na UI — usar de fato?) | a fazer | 🔴 (decisão + credencial Deepgram ou alternativa) |
| 3.3 | Prompt engineering para protocolo Manchester + AVPU em português | a fazer | 🟢 (posso prototipar prompts; validar com regulador depois) |
| 3.4 | Modo offline/degradado quando IA falha | a fazer | 🟢 |

## Sprint 4 — Persistência e backend

| # | Item | Status | Tipo |
|---|------|--------|------|
| 4.1 | Decisão de stack: Supabase × Vercel Postgres × Firebase × self-hosted | bloqueado | 🔴 |
| 4.2 | Schema da ocorrência (call → caller → patient → dispatch → outcome) | a fazer | 🟡 (posso desenhar quando 4.1 estiver fechada) |
| 4.3 | Auth real (matrícula + MFA TOTP — biometria depende de wrapper nativo) | a fazer | 🟡 (precisa: política de autenticação Samais) |
| 4.4 | Audit log imutável (append-only, hash de cadeia) | a fazer | 🟢 (após 4.1) |
| 4.5 | Migrations + seeds para dev local | a fazer | 🟢 (após 4.1) |

## Sprint 5 — Modularização do front

| # | Item | Status | Tipo |
|---|------|--------|------|
| 5.1 | Quebrar `App.tsx` em módulos (`features/{auth,idle,aml,tarm,regulador,viatura,dashboard}`) | a fazer | 🟢 |
| 5.2 | Extrair design system para `src/ui/` (Button, Chip, Panel, Input, etc.) | a fazer | 🟢 |
| 5.3 | Adicionar Zustand ou Jotai para estado global da chamada | a fazer | 🟢 |
| 5.4 | Router (TanStack Router ou React Router 7) — substituir state machine manual | a fazer | 🟢 |

## Sprint 6 — Integrações operacionais

| # | Item | Status | Tipo |
|---|------|--------|------|
| 6.1 | Telefonia (qual PABX/SBC entrega o áudio? Twilio? Asterisk on-prem?) | bloqueado | 🔴 |
| 6.2 | Mapa real (Google Maps API key, ou Mapbox para custom theming) | bloqueado | 🔴 (credencial) |
| 6.3 | Telemetria de viatura (MQTT broker, gateway, hardware) | bloqueado | 🔴 |
| 6.4 | Câmera ao vivo da cena (atualmente só modal placeholder) | bloqueado | 🔴 |
| 6.5 | Gravação WORM da chamada (media gateway → S3/R2, cadeia de custódia) — cópia probatória na fase shadow; opção "gravador oficial da central" com gate de conformidade (CFM 2.110/2014; requisito em `docs/05` §2) | não iniciado | 🔴 (depende de 6.1) |

## Sprint 7 — Qualidade

| # | Item | Status | Tipo |
|---|------|--------|------|
| 7.1 | Vitest + React Testing Library, suite mínima sobre o state machine | a fazer | 🟢 |
| 7.2 | Playwright e2e: fluxo IDLE→AML→TARM→REGULADOR→VIATURA→DASHBOARD | a fazer | 🟢 |
| 7.3 | ESLint + Prettier + lint-staged | a fazer | 🟢 |
| 7.4 | Acessibilidade WCAG AA (contrastes, foco, `aria-*`, prefers-reduced-motion) | a fazer | 🟢 |
| 7.5 | Performance budget + Lighthouse CI | a fazer | 🟢 |

---

## O que preciso de você para destravar (lista curta e prática)

1. ~~Adicionar `victorotaa/samais-pep` ao escopo da sessão~~ — ✅ feito; Sprint 1 executada (resta sua revisão visual, item 1.5).
2. **Decidir backend** (Supabase é o caminho mais rápido para um produto multi-tenant; me confirme e eu monto schema + auth + RLS).
3. **Credenciais para a build de produção**:
   - `GEMINI_API_KEY` (Vercel env)
   - Provider de STT (Deepgram? Google Speech? AssemblyAI?)
   - Google Maps API key (ou trocar para Mapbox)
4. **Decisão sobre PR #1** (Taboão proposal): merge na main como peça permanente do repo, ou manter em branch isolado/movida para um repo `samais-propostas`?
5. **Aprovação da identidade visual unificada** depois que PEP OS for liberado — vou mandar comparativo lado a lado.

---

**Épico F1 — Painéis guiados pelo OS (23/08/2026):** frota-hora da transferência
inter-hospitalar, cobertura de escala (FC implícito), metas contratuais com metodologia,
ficha da operação, NEP, obrigações da operação, carga da central e aba de sustentação —
fundamentos, fontes e os 5 campos de schema em `docs/20-auditoria-padrao-ouro.md` §4.
