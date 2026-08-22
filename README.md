# Samais CoPilot OS

> Apoio à decisão na regulação médica das urgências. Triagem assistida, regulação, despacho e auditoria para centrais 192 do SAMU.

## Estado atual

**Protótipo navegável de alta fidelidade com backend inicial** — cerca de 15–20% do
caminho para produto. Retrato completo e honesto em
[`docs/10-analise-maturidade.md`](./docs/10-analise-maturidade.md).

O que é **real** (quando conectado ao Supabase): login por matrícula com perfis, frota e
escalas em tempo real, ciclo da ocorrência persistido ponta a ponta (atendimento →
handoff → despacho → T0–T4 → desfecho), trilha de auditoria, painel do gestor sem dado
pessoal e exportação do relatório de indicadores.

O que ainda é **simulação**: toda a camada de inteligência artificial (transcrição e
extração clínica vêm de roteiros determinísticos, não de STT/LLM), a integração com a
telefonia da central, o GPS das viaturas e a interoperabilidade externa. Sem backend
disponível, o app cai em modo demonstração e os dados voltam a ser locais.

## Documentação

| Doc | Conteúdo |
|-----|----------|
| [`docs/00-analise-atual.md`](./docs/00-analise-atual.md) | Snapshot histórico (pré-backend) — mantido como registro |
| [`docs/01-visao-produto.md`](./docs/01-visao-produto.md) | Tese de produto, posicionamento, horizonte APH-BR |
| [`docs/02-roadmap-backlog.md`](./docs/02-roadmap-backlog.md) | Backlog por sprint, com sinalização de bloqueios |
| [`docs/03-landing-page-spec.md`](./docs/03-landing-page-spec.md) | Spec da LP B2B |
| [`docs/04-design-system.md`](./docs/04-design-system.md) | Tokens, tipografia, componentes, dual theme |
| [`docs/05-review-operacional.md`](./docs/05-review-operacional.md) | Arquitetura de STT, plug no PABX, tela de viatura, conectividade, multi-tenancy |
| [`docs/06-backend-supabase.md`](./docs/06-backend-supabase.md) | Criação do projeto Supabase |
| [`docs/07-seguranca-backlog.md`](./docs/07-seguranca-backlog.md) | Tickets SEC-01…SEC-32 em três tiers |
| [`docs/08-handoff-dev.md`](./docs/08-handoff-dev.md) | Onboarding do dev |
| [`docs/09-fluxo-cru-metricas-implantacao.md`](./docs/09-fluxo-cru-metricas-implantacao.md) | Fluxo normativo da CRU, dicionário de métricas, dores com fonte |
| **[`docs/10-analise-maturidade.md`](./docs/10-analise-maturidade.md)** | **Estado vigente: real × simulação, dívidas, lacunas para CRU real** |
| **[`docs/11-decisoes-tecnologia-infra.md`](./docs/11-decisoes-tecnologia-infra.md)** | **Stack settada, assinaturas com preço e fonte, custo operacional projetado** |
| **[`docs/12-operacao-implantacao-treinamento-testes.md`](./docs/12-operacao-implantacao-treinamento-testes.md)** | **Stakeholders, operação, treinamento NEP, testes e fases com gates** |
| **[`docs/13-apresentacao-ms.md`](./docs/13-apresentacao-ms.md)** | **Briefing da apresentação institucional ao Ministério da Saúde** |
| **[`docs/14-runbook-tier0.md`](./docs/14-runbook-tier0.md)** | **Ações de segurança fora do repositório (Supabase, Vercel, GitHub)** |
| [`docs/15-onboarding-hugo.md`](./docs/15-onboarding-hugo.md) | Onboarding de colaborador (Hugo): estado real, frentes, regras |
| [`docs/16-handoff-analise-hugo.md`](./docs/16-handoff-analise-hugo.md) | Prompt de análise independente enviado ao Hugo |
| **[`docs/17-parecer-hugo.md`](./docs/17-parecer-hugo.md)** | **Parecer técnico independente recebido (13/08) — registrado verbatim** |
| **[`docs/18-verificacao-parecer-hugo.md`](./docs/18-verificacao-parecer-hugo.md)** | **Verificação achado a achado do parecer: o que confirmou, o que corrigiu, o que mudou** |
| [`docs/19-retorno-parecer-hugo.md`](./docs/19-retorno-parecer-hugo.md) | Resposta formal ao parecer — o documento que se envia ao Hugo |
| [`SECURITY.md`](./SECURITY.md) | Postura de segurança e o que ainda é roadmap |

## Rodando local

Pré-requisitos: Node.js 20+.

```bash
npm ci
cp .env.example .env      # opcional; sem variáveis o app roda em modo demonstração
npm run dev               # http://localhost:3000
```

Outros comandos:

```bash
npm run build      # build de produção em dist/ (app + LP em dist/lp/)
npm run preview    # preview do build
npm run lint       # tsc --noEmit (typecheck)
npm run clean      # rm -rf dist
```

## Variáveis de ambiente

Ver [`.env.example`](./.env.example). Nenhum segredo vive no código-fonte.

| Variável | Para quê |
|---|---|
| `VITE_SUPABASE_URL` · `VITE_SUPABASE_KEY` | Backend. A chave publishable vai ao cliente por design — a segurança vem do RLS. **Nunca** usar a `service_role`. |
| `VITE_GOOGLE_MAPS_API_KEY` | Mapas. Sem ela, o app usa o embed público keyless. |

## Estrutura

```
samais-copilot/
├── docs/                       # documentação estratégica e técnica (00–19)
├── apresentacao-ms/            # peça institucional (HTML único, servida em /apresentacao-ms/)
├── lp/                         # landing page B2B (servida em /lp)
├── master-plan-rota/           # documento institucional de outro vertical (ROTA)
├── supabase/
│   ├── schema.sql              # tenants, usuários, viaturas, ocorrências, despachos, auditoria
│   ├── seed.sql                # tenant de demonstração e os 4 papéis
│   └── migrations/             # 0001 — cadeia de hash da auditoria (a aplicar)
├── src/
│   ├── App.tsx                 # aplicação (modularização é dívida conhecida)
│   ├── lib/{supabase,theme}.ts
│   ├── ui/{Icon,Brand}.tsx
│   └── index.css               # tokens primitivos + semânticos
├── index.html · vercel.json · package.json
```

## Módulos do app

`LOGIN → IDLE → AML → TARM → REGULADOR → VIATURA` e, para o perfil de gestão,
`GESTOR → FROTA · ESCALAS · DASHBOARD`. O ciclo completo e o dicionário de métricas
estão em [`docs/09`](./docs/09-fluxo-cru-metricas-implantacao.md).

## Deploy

Build Vite padrão (`dist/`). O `vercel.json` configura framework, rewrites de SPA e
headers de segurança (incluindo HSTS e CSP). A LP é copiada para `dist/lp/` no build.
A peça em `apresentacao-ms/` **não** entra no deploy.

⚠️ Se o script inline de tema no `index.html` mudar, recalcular o hash do CSP —
instruções em [`docs/14`](./docs/14-runbook-tier0.md) §2.

## Identidade visual

Dark é o padrão; light existe via `data-theme` no `<html>`, com toggle no header que
persiste em `localStorage` e respeita `prefers-color-scheme`. Tokens em
[`docs/04-design-system.md`](./docs/04-design-system.md).

## Licença

Proprietário — Samais Gestão em Saúde. Todos os direitos reservados.
