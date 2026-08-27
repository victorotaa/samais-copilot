# 25 — Handoff de atualização — análise das mudanças de ago/2026 (Hugo)

> **Este documento é público** (o repositório é público): nada de dado pessoal,
> valor de contrato, estratégia comercial ou bastidor — isso vive fora do repo.
>
> **Para quê:** o parecer independente do Hugo (13/08, `docs/17`) foi verificado
> (`docs/18`) e respondido (`docs/19`). Desde então o repositório mudou de forma.
> Este documento é o **mapa do delta** + o **prompt de revisão pronto** para o
> Hugo colar num agente de IA (Claude ou Codex), se preferir revisar assistido.
> Sucede o `docs/16` como pedido de análise; o `docs/15` continua sendo o
> onboarding-base.

## 1. O delta desde o parecer (13/08 → 27/08)

Em ordem de chegada, com onde ler e onde está o código:

1. **CI + suíte de verificação** — GitHub Actions (`.github/workflows/ci.yml`)
   roda em todo push/PR: typecheck, build demo + build de operação, lint de
   vocabulário vetado (`tests/lint-vetado.mjs`), guarda de bundle, **4 baterias
   e2e Playwright** (~72 asserts: cenários, cronômetro, modo digitação, mobile
   390/768) e smoke do modo operação. Responde diretamente ao achado D-02/E-22
   do parecer ("zero teste, zero CI") — e na ordem que o parecer pediu: CI
   veio **antes** do refactor.
2. **Fidelidade shadow do fluxo** (`docs/09` §1 · `docs/10` §5) — a tela-gate
   de AML morreu: em shadow, quando o TARM atende na central a transcrição já
   começa; a localização virou painel dentro da triagem (editável, nunca
   bloqueia). Encerramento tipificado (trote · engano · queda), **queda
   preserva contexto e o mesmo número religando reassocia** (anti-duplicidade
   por telefone), fila do PABX rotulada "leitura passiva", header auto-hide no
   mobile, cronômetro de etapa com meta/teto parametrizados (`META_CHAMADA_S`).
3. **Três modos de IA** (`docs/05` §2) — Escuta · Digitação (IA sobre o texto
   que o TARM digita; extrator determinístico **rotulado** "sem modelo real") ·
   Manual. O kill switch nunca desliga a **gravação** — gravação é obrigação
   normativa da central (CFM 2.110/2014), não nossa feature.
4. **Cenários de demonstração pareados** — 7 roteiros (IAM, trauma, OVACE com
   reversão, trote, AVC, obstétrico, verde) em pares coerentes roteiro ↔
   chamador, com seletor no IDLE e sorteio por bolsa.
5. **AML = implementação futura** (decisão 24/08, `docs/23`) — o produto adota
   localização automática quando regulamentação e infraestrutura das centrais
   amadurecerem; até lá, endereço por voz é o padrão e a demo simula rotulado.
   O `docs/23` cataloga **todos os cenários da operação em shadow** (T1–T15
   TARM · M1–M8 regulação) com o que é demonstrável × futuro.
6. **Separação núcleo × demo — Fase 1** (`docs/24`) — a maior mudança
   estrutural: produto em `src/core/` (tipos + contratos), teatro em
   `src/demo/` (dados, roteiros, componentes, pacote), App importando o teatro
   por um único ponto (`@demo`). **Build de operação** (`--mode operacao`)
   troca o pacote pelo plugue inerte por resolução de módulo — zero `define`
   (o F-04 do parecer aplicado também aqui) — com **guarda dupla de bundle**
   (nenhum marcador de teatro no build de operação E todos vivos no build
   demo) e **smoke** provando a recusa honesta de login sem backend.

**O que NÃO mudou** — continua não existindo STT/LLM real (a IA segue roteiro
determinístico rotulado), integração de telefonia, GPS real, offline-first. O
deploy demo (`main` → Vercel) segue intocado. A matriz real × simulação vigente
é a do `docs/10` §2 (com as correções de registro do §6).

## 2. O rumo (para calibrar a revisão)

- **Shadow-first, copiloto-não-piloto**: o sistema escuta cópia da linha
  (SIPREC) e eventos do PABX em modo leitura; nunca atende, transfere, disca ou
  derruba. A UI corresponde à linha de voz — nunca a comanda. Fontes de
  sinalização e degradação honesta: `docs/05` §3.
- **Doutrina de antecipação** (topo do `docs/23`): o panorama real das
  aplicações só existirá no Go Live; até lá, antecipamos cenários via código —
  cada capacidade nova nasce com rótulo honesto do que é real × simulado
  (SEC-20).
- **Próxima fase estrutural**: Fase 2 da modularização (telas em componentes +
  estado por ocorrência, `docs/24` §8) — pré-requisito da fila multi-caso (F1,
  `docs/10` §4.1), a lacuna funcional nº 1.

## 3. Ordem de leitura sugerida

1. `README.md` (5 min — estado, comandos, estrutura)
2. `docs/10` — real × simulação vigente (com §6, correções de registro)
3. `docs/24` — arquitetura núcleo × demo (contratos, alias, guardas)
4. `docs/23` — cenários shadow (o que o produto fará sobre esse seam)
5. `docs/22` — roteiro de demonstração (o arco que a demo conta)
6. Código, nesta ordem: `src/core/teatro.ts` (contratos) →
   `src/demo/index.tsx` + `src/demo/inerte.tsx` (os dois pacotes) →
   `src/demo/fonte-roteiro.ts` (a fonte) → `src/App.tsx` (orquestração) →
   `tests/*.mjs` → `.github/workflows/ci.yml`.

## 4. O que pedimos da análise

1. **A fronteira núcleo × demo fecha?** Contrato `PacoteDemo`, alias por modo,
   guarda dupla — há furo por onde teatro vaza para operação, ou acoplamento
   núcleo→demo que escapou?
2. **O seam `FonteDeTranscricao` serve ao STT real?** (SIPREC → stream →
   `iniciar/pausar/retomar/encerrar` + `aoItem`). O que falta no contrato para
   um Deepgram/Whisper streaming de verdade (confiança por trecho,
   diarização, correções retroativas de transcrição)?
3. **Riscos no caminho da Fase 2 / F1** (multi-caso): o que na base atual vai
   doer ao extrair as telas e o estado por ocorrência?
4. **Cobertura de teste**: o que a suíte NÃO cobre e deveria (a régua é o que
   quebraria uma demonstração ao vivo ou uma futura operação)?
5. **Segurança**: alguma regressão contra `docs/07`/`docs/17`? Os achados do
   parecer seguem tratados nos lugares certos?

Formato do retorno: livre — mas achado com **arquivo e trecho citados**, e
severidade separada de opinião, como no parecer original (`docs/17` fez escola
aqui).

## 5. Prompt pronto para revisão assistida por IA

O bloco abaixo é autocontido: cole num agente (Claude/Codex) com acesso ao
repositório — clone público ou workspace conectado. Ajuste só o que estiver
entre colchetes.

```text
Você é um revisor técnico sênior fazendo a SEGUNDA análise independente do
repositório público victorotaa/samais-copilot (Samais CoPilot OS — apoio à
decisão para centrais 192/SAMU). A primeira análise está registrada em
docs/17-parecer-hugo.md (13/08), foi verificada em docs/18 e respondida em
docs/19. Sua tarefa é revisar O DELTA desde então e o rumo — não repetir a
primeira análise.

CONTEXTO OBRIGATÓRIO (leia antes de opinar, nesta ordem):
README.md · docs/10 (real × simulação — inclui §6 com correções de registro) ·
docs/24 (arquitetura núcleo × demo) · docs/23 (cenários shadow) · docs/25 §1
(o delta). Código: src/core/teatro.ts → src/demo/index.tsx e inerte.tsx →
src/demo/fonte-roteiro.ts → src/App.tsx → tests/*.mjs → .github/workflows/ci.yml.

PREMISSAS QUE VOCÊ DEVE RESPEITAR (decisões registradas, não bugs):
- A IA da demo é roteiro determinístico ROTULADO — não existe STT/LLM real
  ainda, por decisão de sequência (CI e fronteira antes de modelo).
- Postura shadow 100% passiva: o sistema nunca atende/transfere/disca.
- AML é implementação futura (decisão de 24/08, docs/23).
- Sem `define` no Vite para segredo ou flag (parecer F-04); a separação
  demo × operação é por alias de resolução de módulo.
- Vocabulário vetado em qualquer superfície: lucro, margem, lucratividade,
  ROI, "economia gerada" (doutrina comercial da empresa — tests/lint-vetado.mjs).
Divergir dessas decisões é permitido APENAS como divergência fundamentada e
sinalizada como tal — nunca como "correção" silenciosa.

RESPONDA, COM ARQUIVO E TRECHO CITADOS EM CADA ACHADO:
1. A fronteira núcleo × demo fecha? (furos de vazamento de teatro para o
   build de operação; acoplamentos núcleo→demo remanescentes; a guarda dupla
   de tests/guarda-operacao.mjs tem ponto cego?)
2. O contrato FonteDeTranscricao (src/core/teatro.ts) comporta um STT
   streaming real? O que falta (confiança, diarização, correção retroativa,
   backpressure) e onde isso deveria entrar sem quebrar a demo?
3. Quais riscos concretos a Fase 2 (docs/24 §8 — telas em componentes +
   estado por ocorrência) vai encontrar nesta base?
4. O que a suíte de testes NÃO cobre e deveria? (régua: o que quebraria uma
   demonstração ao vivo ou uma operação futura)
5. Alguma regressão de segurança vs docs/07 e docs/17? Os fixes do parecer
   continuam de pé?
6. Livre: o que mais você viu que nós não perguntamos.

REGRAS DE HONESTIDADE (as mesmas do repo):
- Nunca invente comportamento: se não conferiu no código, diga "não conferi".
- Separe FATO (com citação) de HIPÓTESE (sinalizada).
- Severidade em 3 níveis (crítico / relevante / cosmético), cada achado com a
  MENOR correção suficiente proposta.
- Não proponha mexer em segredo, senha ou infraestrutura fora do repositório.

Formato: relatório em markdown, achados numerados, tabela-resumo no fim
(id · achado · severidade · arquivo · correção proposta).
```

## 6. Verificação local em 5 minutos

```bash
git clone https://github.com/victorotaa/samais-copilot.git && cd samais-copilot
npm ci
npm run dev               # app em :3000 (modo demo puro sem .env)
npm test                  # lint de vocabulário + 4 baterias e2e (exige o dev server acima)
npm run test:operacao     # build sem teatro + guarda de bundle + smoke
```

## Registro

- **Pedido:** Ota, 27/08/2026 — preparar o repo e os comentários para uma nova
  leitura de atualização e rumo, com a possibilidade de o Hugo usar Claude ou
  Codex como revisor assistente.
- **Junto deste doc:** correções de registro em `docs/10` §3/§4.11/§6 (a dívida
  "zero testes, zero CI" estava marcada como aberta e já foi resolvida),
  `docs/08` (comandos e estado da modularização) e `docs/15` (aviso de
  atualização no topo) — para que nenhum doc minta por desatualização na frente
  de um revisor, humano ou máquina.
- **Fontes:** docs/09 §1 · docs/10 · docs/17–19 (ciclo do parecer) · docs/20 §5
  (CI) · docs/23 · docs/24.
