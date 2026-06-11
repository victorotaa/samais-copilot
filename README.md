# Samais CoPilot OS

> Sistema operacional de despacho APH com IA assistencial. Triagem NLP, regulação médica, auditoria LGPD. Para centrais 192 do SAMU, hospitais, planos de saúde e operadoras de transporte sanitário.

## Estado atual

Protótipo navegável de alta fidelidade. Front-end React 19 + Vite + Tailwind v4, single-file (`src/App.tsx`). Dados 100% mockados — sem backend, sem LLM real, sem persistência. Roteiro completo de evolução em [`docs/02-roadmap-backlog.md`](./docs/02-roadmap-backlog.md).

## Documentação

| Doc | Conteúdo |
|-----|----------|
| [`docs/00-analise-atual.md`](./docs/00-analise-atual.md) | Snapshot técnico do código, dependências, módulos, gaps |
| [`docs/01-visao-produto.md`](./docs/01-visao-produto.md) | Tese de produto, posicionamento, horizonte APH-BR |
| [`docs/02-roadmap-backlog.md`](./docs/02-roadmap-backlog.md) | Backlog priorizado por sprint, com sinalização de bloqueios |
| [`docs/03-landing-page-spec.md`](./docs/03-landing-page-spec.md) | Spec da LP B2B (gestor público / plano / hospital) |
| [`docs/04-design-system.md`](./docs/04-design-system.md) | Tokens, tipografia, componentes, dual theme |

## Rodando local

Pré-requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env.local   # opcional; sem chave, segue rodando com mocks
npm run dev                  # http://localhost:3000
```

Outros comandos:

```bash
npm run build      # build de produção em dist/
npm run preview    # preview do build
npm run lint       # tsc --noEmit (typecheck)
npm run clean      # rm -rf dist
```

## Estrutura

```
samais-copilot/
├── docs/                       # documentação estratégica e técnica
├── master-plan-rota/           # documento institucional (HTML standalone)
├── src/
│   ├── App.tsx                 # aplicação (todos os módulos)
│   ├── lib/theme.ts            # hook de dual theme (dark/light)
│   ├── main.tsx
│   └── index.css               # tokens primitivos + semânticos
├── index.html                  # com bootstrap de tema (sem FOUC)
├── vercel.json                 # config de deploy do app principal
└── package.json
```

## Módulos do app

`IDLE → AML → TARM → REGULADOR → VIATURA → DASHBOARD`

Cada módulo simula uma etapa do ciclo de uma chamada APH. Detalhes funcionais em [`docs/00-analise-atual.md`](./docs/00-analise-atual.md).

## Deploy

Build é Vite padrão (`dist/`). `vercel.json` na raiz já configura framework, rewrites SPA e headers de segurança. Conectar repo ao Vercel e fazer deploy.

Para preview/produção, configurar em **Project Settings → Environment Variables**:

| Var | Quando | Como obter |
|-----|--------|-----------|
| `GEMINI_API_KEY` | Quando IA real entrar (Sprint 3) | https://aistudio.google.com/apikey |

## Identidade visual

Tema dark é o padrão. Light está implementado via `data-theme` no `<html>` com toggle no header (persiste em `localStorage`, respeita `prefers-color-scheme`). Migração componente a componente para tokens semânticos está documentada em [`docs/04-design-system.md`](./docs/04-design-system.md).

Paridade visual com PEP OS depende do acesso ao repo `victorotaa/samais-pep` (atualmente fora do escopo desta sessão).

## Status das PRs

- **#1 (open / draft)** — Proposta Samais Taboão da Serra v5. Documento de venda. Decisão pendente: merge ou mover para repo separado.
- **#2 (merged)** — Master Plan ROTA. Note que o módulo `MASTER_ROTA` declarado no PR não foi de fato adicionado ao `App.tsx`; apenas o HTML institucional foi commitado. Ver §2 do `00-analise-atual.md`.

## Licença

Proprietário — Samais Gestão em Saúde. Todos os direitos reservados.
