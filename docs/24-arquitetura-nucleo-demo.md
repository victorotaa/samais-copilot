# 24 — Arquitetura núcleo × demo (Fase 1)

> Pedido do Ota (24/08): *"desenhe a separação núcleo × demo"*. Este documento
> registra o desenho executado na Fase 1: a fronteira FÍSICA entre o produto e o
> teatro de demonstração — o que mudou de lugar, o contrato entre os dois lados,
> o interruptor de build e as guardas que impedem a fronteira de apodrecer.

## 1. O problema

O `App.tsx` era um monólito de 3,2 mil linhas onde produto e teatro dividiam as
mesmas constantes, os mesmos effects e o mesmo JSX. Os dois eixos que existiam
(`hasBackend`, `connected`) **não desligavam o teatro**: os motores de
demonstração — chamada automática em 10s, jitter de ETA, fila viva, despacho
automático da viatura — rodavam incondicionalmente, e o estado do produto era
*tipado pelos mocks* (`typeof MOCK_CALLERS[0]`). Não existia forma de gerar um
build sem teatro, nem de provar que um build não o continha.

## 2. O mapa de módulos

```
src/
├── App.tsx            # telas + orquestração (Fase 2 quebra as telas)
├── core/              # produto puro — NUNCA importa de src/demo/
│   ├── tipos.ts       # Risco, ExtracaoClinica, Chamador, Veiculo, FalaRoteiro…
│   ├── calendario.ts  # startOfWeek/isoDate/TURNO_* (planner de escalas)
│   └── teatro.ts      # CONTRATOS: FonteDeTranscricao · AnalisadorDeTexto · PacoteDemo
└── demo/              # teatro — importa core, nunca o contrário
    ├── index.tsx      # o pacote real (demo: PacoteDemo, ativo: true)
    ├── inerte.tsx     # o plugue de operação (ativo: false, teatro nenhum)
    ├── fonte-roteiro.ts   # RoteiroComoFonte implements FonteDeTranscricao
    ├── analise-texto.ts   # extrairDeTexto (modo digitação) — simulação rotulada
    ├── componentes.tsx    # TypingMessage, AudioWaveform, MapaEsquematico,
    │                      #   OverlayChamada, SeletorDeCenarios, SeloSimulacao
    └── dados/             # chamadores · roteiros · cenários · frota · equipe ·
                           #   regulação · fila · estatísticas do dashboard
```

Regra de dependência: `demo → core → (nada)`. O App importa o teatro por **um
único ponto** — `import { demo } from '@demo'`.

**Fica no núcleo** (é produto, não teatro): RISCO_UI, META_CHAMADA_S,
CronometroMeta, playSound, memos de mapa, persistência Supabase, e
`aoItemTranscricao` — o que uma fala transcrita *faz* no estado é produto; o
STT real entregará o mesmo shape.

## 3. O contrato (`src/core/teatro.ts`)

- **`FonteDeTranscricao`** `{ iniciar(aoItem) · pausar() · retomar(aoItem) ·
  encerrar() }` — cadência e dedup vivem **dentro** da fonte. A demo implementa
  com roteiros e timers (`RoteiroComoFonte`); o produto implementará com o
  stream de STT do espelho SIPREC (docs/05 §3). O kill switch é `pausar()` — e
  continua não tocando a gravação, que é obrigação da central.
- **`AnalisadorDeTexto`** — o modo 2 (IA sobre digitação, docs/05 §2). Na demo,
  o classificador determinístico rotulado; em operação, `null` até haver modelo.
- **`PacoteDemo`** — tudo que o teatro fornece: a fonte, o analisador,
  `prepararCenario` (bolsa de sorteio interna), `personaLogin`,
  `snapshotRegulacao`, `casosRegulacao`, sementes de estado (frota, equipe,
  escala, fila, manutenção), `indicadores` do dashboard e os componentes de
  teatro (`OverlayChamada`, `SeletorDeCenarios`, `MensagemTranscrita`,
  `Waveform`, `MapaLocal`, `SeloSimulacao`).

Duas decisões de tipagem que são doutrina:
1. `ativo` é **anotado `boolean`** — inferido literal (`true`/`false`) faria o
   tsc tratar `!demo.ativo` como `never` e acusar código morto.
2. Os DOIS pacotes carregam a anotação `: PacoteDemo` — como ambos entram no
   typecheck, a paridade index ↔ inerte é verificada em todo `npm run lint`.

## 4. O interruptor: alias por `mode` (zero `define` — parecer F-04)

```ts
// vite.config.ts
'@demo': path.resolve(__dirname, mode === 'operacao' ? 'src/demo/inerte.tsx' : 'src/demo/index.tsx')
```

- `npm run build` / `vite dev` → pacote real. **O deploy Vercel atual permanece
  demo, byte a byte** — nada muda para a demonstração hospedada.
- `npm run build:operacao` → `--mode operacao`, saída em `dist-operacao/`. O
  pacote de demonstração inteiro fica **fora do grafo de módulos** — exclusão
  estrutural, não dead-code-elimination (não se torce pelo minificador).
- Alternativas descartadas: `define` (substituição textual no bundle público —
  exatamente o que o parecer F-04 veta), import dinâmico (exclusão dependeria
  de DCE + introduziria assincronia no boot da demo), entrypoints separados
  (mexeria no deploy sem necessidade na Fase 1).
- `build:operacao` deliberadamente **não copia** `lp/` e `apresentacao-ms/` —
  são peças de marketing cheias de vocabulário de demonstração; contaminariam
  a guarda e não pertencem a um console operacional.

## 5. As guardas — a fronteira se prova, não se promete

**Guarda de bundle (`tests/guarda-operacao.mjs`), dupla:**
1. Nenhum dos marcadores de teatro aparece em `dist-operacao/`.
2. **Controle anti-apodrecimento:** todo marcador aparece no bundle demo
   (`dist/assets`). Marcador que sumiu de lá = lista desatualizada = a guarda
   FALHA — em vez de passar cega para sempre.

Regra de ouro dos marcadores: só **string literal de conteúdo** sobrevive à
minificação ('pizzaria', 'Demonstração · próxima chamada', 'João da Silva',
'SIMULAR ATENDIMENTO NA CENTRAL'…); identificadores (`MOCK_SCRIPTS`) são
redundância que só pega build não-minificado. O comparador desfaz `\uXXXX`
antes de casar (o minificador pode escapar não-ASCII).

**Smoke de operação (`tests/smoke-operacao.mjs`):** serve `dist-operacao/` num
static server próprio (:3100) e prova o comportamento honesto sem backend —
login renderiza sem menção a demonstração, **recusa** com aviso e permanece na
tela, 15s sem chamada automática, zero pageerror. Hermético: sem env, o
`hasBackend` é `false` e nada toca a rede.

Ambos rodam no CI (`test:operacao` local encadeia build → guarda → smoke).

## 6. Três eixos que NÃO se colapsam

| Eixo | Quando se decide | O que decide |
|---|---|---|
| `demo.ativo` | **build** (alias por mode) | o teatro existe no bundle? |
| `hasBackend` | **configuração** (env `VITE_SUPABASE_*`) | iframe de mapa real × mapa local; tentar login real |
| `connected` | **runtime** (login real bem-sucedido) | persistência e realtime |

São perguntas diferentes com donos diferentes — os ~18 usos de `connected`
não mudaram nesta fase, e nenhum dos três substitui outro.

## 7. Comportamento honesto do modo operação (sem backend)

- **O login não entra**: "Backend indisponível — esta instalação exige o
  backend Samais configurado". Console operacional não abre sessão anônima —
  isso seria teatro de outro tipo. (O smoke pegou um bug real aqui: o toast só
  renderizava no layout autenticado — a recusa acontecia antes de autenticar e
  ninguém veria o aviso. Corrigido: o toast renderiza nos dois estados.)
- Com backend: frota/escala/fila vêm do banco; sem chamada não há triagem — os
  empty states existentes dizem a verdade ("Aguardando chamada entrante...");
  Dashboard mostra '—' e séries vazias até os dados reais cobrirem cada série;
  `FleetMarkers` (GPS simulado) **nunca** renderiza sobre frota real.

## 8. Fase 2 — registrada, não iniciada

Quebrar as TELAS em componentes com extração de estado (`features/{idle,tarm,
regulador,viatura,gestor}`), estado global da chamada fora do App, e o teatro
recebendo as telas por injeção — pré-requisito do épico F1 (fila multi-caso do
regulador, docs/20 §4). A Fase 1 aceitou o App como orquestrador para não
mudar comportamento; a Fase 2 só começa com as baterias cobrindo o que ela
tocar.

## Registro

- **Pedido:** Ota, 24/08/2026 — "dê merge no #38 e desenhe a separação núcleo ×
  demo". Desenho validado por inventário linha a linha do monólito (3 245
  linhas) + agente de arquitetura (3 acoplamentos achados além do inventário:
  gate de justificativa lendo MOCK_VEHICLES direto; tipos por `typeof` de mock;
  strings de teatro no JSX do App — todos tratados nos commits da Fase 1).
- **Execução:** 6 commits (tipos → dados → seam → pacote+guardas → strings →
  build+CI), cada um com tsc + 4 baterias e2e verdes e **zero edição nos
  testes existentes** — paridade de comportamento do modo demo era o critério
  de aceite.
- **Fontes:** docs/05 §2–3 (modos de IA e fontes de sinalização) · docs/09 §1
  (fluxo shadow) · docs/17 F-04 (veto ao `define`) · docs/20 §4 (épico F1) ·
  docs/23 (cenários shadow que o produto implementará sobre este seam).
