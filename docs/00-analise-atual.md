# Análise do Estado Atual — Samais CoPilot OS

> Snapshot técnico e de produto do repositório `victorotaa/samais-copilot` na branch `claude/nice-thompson-biqdli`.

## 1. Stack e configuração

| Item | Estado | Observação |
|------|--------|------------|
| Framework | React 19 + Vite 6 + TypeScript 5.8 | OK |
| Styling | Tailwind v4 (`@tailwindcss/vite`) + CSS vars | OK, design system declarado em `src/index.css` |
| Gráficos | Recharts 3.8 | OK, usado no Dashboard |
| Animação | `motion` 12.23 | Instalado, **não usado** no código |
| Ícones | `lucide-react` 0.546 | Instalado, mas o código usa Font Awesome via CDN (`index.html`) — **duplicação** |
| LLM SDK | `@google/genai` 1.29 | Instalado, **não importado** em lugar nenhum (Gemini é apenas mockado via `MOCK_SCRIPTS`) |
| Server | `express` 4.21 + `tsx` | Instalado, **não há server.ts** — dependência morta |
| Deploy | `vercel.json` existe **apenas em `master-plan-rota/`** | App principal não tem config de deploy |
| Lint/Test | `tsc --noEmit` apenas | Sem ESLint, Prettier, vitest |

## 2. Arquitetura do código

**Single-file app.** Todo o produto vive em `src/App.tsx` (1.861 linhas). Não há separação por módulo, componente reutilizável, store global, router ou hooks customizados.

### Módulos funcionais (state machine via `currentModule`)

| Módulo | Função | Estado |
|--------|--------|--------|
| `IDLE` | Tela de espera com relógio gigante, status da frota (6 viaturas mock), mapa GMaps embed | Funcional |
| `AML` | Recepção da chamada — identificação do solicitante, localização AML (Automatic Location), anti-trote | Funcional |
| `TARM` | Triagem com transcrição em tempo real (mockada via `MOCK_SCRIPTS`), extração NLP (mockada), classificação Manchester (RED/YELLOW/GREEN), fila de espera | Funcional |
| `REGULADOR` | Apoio à decisão clínica, validação Manchester checklist, justificativa divergente, seleção de viatura, despacho | Funcional |
| `VIATURA` | Visão da equipe em campo — mapa fullscreen, telemetria GPS/velocidade/MQTT, handoff médico bottom-sheet | Funcional |
| `DASHBOARD` | BI operacional — KPIs (chamadas, trotes filtrados, T. resposta, despachos USA), Recharts (volume×tempo, classificação), histórico, banner LGPD | Funcional |

> ⚠️ **Discrepância detectada**: A PR #2 (merged) declara ter adicionado um módulo `MASTER_ROTA` a `App.tsx`, mas o módulo não está presente no código atual (a union `currentModule` não inclui essa opção e o dock não tem o botão). Apenas o documento HTML institucional foi de fato commitado. Precisa decidir: implementar de verdade, ou ajustar a descrição.

### Cenários simulados (NLP mock)

Três scripts pré-gravados em `MOCK_SCRIPTS`:
1. IAM (Infarto Agudo do Miocárdio) — RED
2. Trauma (acidente moto x carro) — YELLOW
3. OVACE Lactente (engasgo bebê) — RED → YELLOW após reversão

A IA "extrai" sintomas, comorbidades, nome, idade, sexo, e classifica risco. **Tudo determinístico, sem chamada real ao Gemini.**

## 3. Design system existente

Declarado em `src/index.css` via Tailwind v4 `@theme`:

```
--color-s-ivory: #FFF5E9   /* texto/highlight em fundo escuro */
--color-s-nude:  #FCD7B8   /* sub-textos */
--color-s-terra: #A95F41   /* secundária */
--color-s-gold:  #D3A05C   /* primária (CTA) */
--color-s-dark:  #090A0F   /* background */
--color-s-surf:  #141720   /* superfície 1 */
--color-s-surf2: #1B202C   /* superfície 2 */
--color-ai:      #00d4a8   /* IA / cyan */
--color-danger / ok / warn (semânticas)

--font-sans:  Inter
--font-disp:  Syne
--font-mono:  JetBrains Mono
```

Componentes Tailwind compostos: `.gp` (glass panel), `.inp` (input), `.lbl` (label), `.chip-{ok|warn|danger|ai|nude}`.

> ⚠️ **Divergência com `master-plan-rota.html`**: o documento institucional usa paleta levemente diferente (`#070708`, `#C9A84C`, `Plus Jakarta Sans` em vez de `Inter`). Precisa de tokens unificados antes de criar a LP.

## 4. Tema e UX

- **Single mode (dark only).** Não há toggle de tema. Não há infraestrutura para light mode (todas as classes Tailwind são literais: `bg-s-dark`, `text-s-ivory`).
- **Login bypass.** Form aceita qualquer credencial e autentica após 1.5s (mock).
- **Sound on/off** já existe (Web Audio API gera tons sintéticos para call/vehicle/alert).
- **Responsivo.** Layout adapta para mobile (sticky CTAs, bottom-sheet em VIATURA).
- **Acessibilidade.** Não auditada. Sem `aria-*`, sem `prefers-reduced-motion`, contrastes não validados.

## 5. Dados e backend

**Zero backend real.** Tudo são mocks em memória:

- `MOCK_CALLERS` (5 chamadores em São Paulo)
- `MOCK_VEHICLES` (6 viaturas)
- `MOCK_RECENT_CALLS`, `MOCK_QUEUE`, `MOCK_SCRIPTS`
- Mapa via iframe Google Maps (sem API key, embed público)
- Nenhuma persistência, nenhuma API, nenhum WebSocket

## 6. Segurança e LGPD

- Banner LGPD presente na Dashboard (visual).
- Nada implementado de verdade: sem auth real, sem criptografia, sem cadeia de custódia, sem audit log.
- O painel afirma "AES-256", "SHA-256", "TCU/MP/ANPD" — **claims visuais sem implementação**.

## 7. PRs e branches

| PR | Status | Conteúdo | Ação |
|----|--------|----------|------|
| #1 | Open / Draft | Proposta Samais Taboão da Serra v5 (15 páginas A4 print-ready) + assets de viatura em `public/uploads/` | Decidir se merge ou mantém isolada |
| #2 | Merged | Master Plan ROTA — só o HTML institucional foi commitado; o módulo `MASTER_ROTA` no App.tsx **não chegou** | Discrepância — ver §2 |

Branches remotas: `main`, `claude/nice-thompson-biqdli` (work branch atual).

## 8. Gaps críticos para virar produto

Em ordem de prioridade:

1. **Sem backend.** Não há onde persistir nada. Toda a tese de "dados que retroalimentam a IA" não acontece.
2. **LLM mockado.** O `@google/genai` está no `package.json` mas não é chamado. Triagem NLP é teatro.
3. **Sem deploy do app principal.** Só o documento HTML tem `vercel.json`.
4. **Auth fake.** Não há MFA, biometria, nem mesmo um login form que valide nada.
5. **App monolítico.** 1.861 linhas em um arquivo dificulta evolução, testes e onboarding de devs.
6. **Sem light mode.** Bloqueia paridade com PEP OS.
7. **Sem testes.** Nenhum framework de teste configurado.
8. **Identidade visual divergente** entre `App.tsx`, `master-plan-rota.html` e (provavelmente) PEP OS.
9. **LP B2B inexistente.** Há documento para investidor/parceiro (master plan), mas não há landing comercial para gestores de saúde.
10. **Claims de compliance sem lastro técnico.** Risco reputacional se demonstrado a um comprador sério.

## 9. O que está bom e deve ser preservado

- **Densidade de informação e narrativa do fluxo APH** — o flow IDLE→AML→TARM→REGULADOR→VIATURA→DASHBOARD é coerente com a realidade SAMU.
- **Tipografia e paleta gold/dark** — premium, distintivo, evita o "mar de azul" dos concorrentes de healthtech.
- **Microinterações** — som sintético, waveform de áudio, animação de chamada entrante, pulsos de mapa. Vendem o produto.
- **Densidade de UX clínica** — chips de sintomas, confidence score, checklist Manchester, justificativa divergente. Mostra domínio.
- **Dashboard com claims auditáveis** (Acurácia 96.8%, T. médio 1m12s) — bom hook B2B desde que sustentado por dados reais.
