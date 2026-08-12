---
name: samais-brand-guidelines
description: Aplica a identidade visual institucional da Samais Gestão em Saúde (dark-luxury, Syne/Plus Jakarta Sans/JetBrains Mono, navy-black e dourado) a qualquer artefato visual — dossiês HTML, apresentações, PDFs, documentos, teasers, propostas, slides, gráficos e peças de marketing. Use SEMPRE que o entregável for da Samais ou mencionar Samais, SAMU, dossiê, estudo municipal, proposta comercial, teaser, apresentação institucional, ou quando Ota pedir "padrão Samais", "identidade Samais" ou "dark-luxury". Também vale para revisar/corrigir peças existentes fora do padrão.
license: MIT (fork de anthropics/skills brand-guidelines, adaptado para Samais)
---

# Samais — Identidade Visual Institucional

## Visão geral

Sistema de design institucional da Samais Gestão em Saúde. Estética
dark-luxury editorial: profundidade, sobriedade e autoridade técnica.
Distinta da paleta operacional de campo do SAMU (navy/vermelho/branco) —
esta identidade é para peças INSTITUCIONAIS (dossiês, propostas,
apresentações a secretarias e investidores), não para material operacional
de ambulância/uniforme.

**Keywords**: Samais, dossiê, dark-luxury, identidade institucional,
proposta, teaser, estudo municipal, apresentação, branding saúde.

## Tokens de cor

> **Fonte única de tokens:** `samais-pep/design/samais-pep-os-design-tokens.json`
> (v1.0). Implementação de referência publicada: `lp/index.html` em
> `samais-copilot`. Em divergência, vence o JSON; depois a LP; este
> documento por último. **Sincronize este arquivo, nunca o contrário.**
>
> ⚠ Este arquivo existe em duas cópias — a sincronizada na conta
> (`~/.claude/skills/synced/`) e a do repositório. **A carregada é a
> sincronizada.** Toda correção precisa chegar nela, ou não vale.

O sistema é de **escalas nomeadas**, não de cores avulsas. Copie o bloco
inteiro; não invente variações intermediárias.

```css
:root{
  --canvas:#070708; --surface:#0E0E10; --elevated:#161618;
  --border-subtle:#1F1F22; --border-default:#2A2B33; --border-strong:#3A3B45;
  --ink:#F4F4F5; --ink-2:#A8A8B0; --ink-3:#6E6E78; --on-gold:#070708;
  --gold-300:#EAC97A; --gold-500:#BF9A3D; --gold-600:#A18230; --gold-rgb:191,154,61;
  --ok:#43A047; --warn:#FDD835; --danger:#E53935; --info:#1E88E5; --ai:#00D4A8;
  --ease:cubic-bezier(0.22,1,0.36,1);
  color-scheme:dark;
}
:root[data-theme="light"]{
  --canvas:#FAFAF7; --surface:#FFFFFF; --elevated:#F1F1ED;
  --border-subtle:#E4E4DE; --border-default:#D1D1C9; --border-strong:#B7B7AD;
  --ink:#1A1A17; --ink-2:#52524C; --ink-3:#828279; --on-gold:#070708;
  --gold-300:#8A6E28; --gold-500:#A88230; --gold-600:#7E6624;
  --ok:#2E7D32; --warn:#B58A00; --danger:#C62828; --info:#1565C0; --ai:#00875F;
  color-scheme:light;
}
```

**Como usar cada escala:**
- `--canvas` é o fundo da página; `--surface` são cards e blocos;
  `--elevated` é o estado de hover ou o segundo nível de elevação
- `--gold-500` é o ouro de assinatura — bordas, ícones, números-chave.
  `--gold-300` é o ouro claro, para eyebrows e labels sobre escuro.
  `--gold-600` fecha gradientes e estados pressionados
- `--ink` / `--ink-2` / `--ink-3` são texto primário, secundário e
  terciário. Nunca `#FFFFFF` puro em bloco longo
- `--ai:#00D4A8` marca superfícies de IA e CoPilot OS — é o único acento
  não-dourado do sistema, e não deve aparecer em peça sem componente de IA

**Detalhes que fazem a peça parecer nossa:**
```css
::selection{background:var(--gold-500);color:var(--on-gold)}
:focus-visible{outline:3px solid var(--gold-500);outline-offset:2px;border-radius:6px}
.eyebrow{color:var(--gold-300)}
.eyebrow::before{content:'';width:28px;height:1px;background:var(--gold-500);opacity:.6}
```

## Tipografia

- **Display/Títulos**: Syne (600–800) — headlines, números de seção,
  dados de impacto. Fallback: Arial Black.
- **Corpo**: Plus Jakarta Sans (400/500/600) — parágrafos, tabelas, UI.
  Fallback: `system-ui, sans-serif`. **Não usar Inter** — foi uma iteração
  descartada e destoa das peças publicadas.
- **Dados/Labels técnicos**: JetBrains Mono (400/500) — valores
  monetários, métricas, códigos de lei, IDs, eixos de gráfico.
  Fallback: Courier New.
- Import padrão (HTML) — o mesmo da LP:
  `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap`
- Em **Artifact** da claude.ai o CSP bloqueia CDN de fonte: baixar os WOFF2
  (subsets `latin` e `latin-ext`) e embutir como `@font-face` data URI,
  senão a peça cai silenciosamente para Arial.

## Regras de aplicação

1. **Hierarquia**: kicker em caps pequenas douradas → título Syne grande
   → deck/parágrafo de abertura em Plus Jakarta Sans com line-height
   generoso (1.6+).
2. **Dados sempre em JetBrains Mono** — valores em R$, percentuais, BDI,
   populações, frotas. Nunca dados em Syne.
3. **Dourado é escasso**: no máximo ~10% da superfície visual. Se tudo é
   dourado, nada é. Uso: números-chave, uma linha divisória, ícones de
   seção.
4. **Documentos de audiência EXTERNA** (secretarias, prefeitos, órgãos de
   controle): aplicar padrão FRIO — neutro, factual, sem advocacy — a
   identidade visual permanece, mas sem linguagem persuasiva interna e
   sem expor metodologia de cálculo proprietária.
5. **Separação de camadas em dossiês**: camada FACTUAL (edital, lei,
   dados) visualmente distinta da camada de INTERPRETAÇÃO ESTRATÉGICA
   (ex: blocos com borda âmbar para interpretação). Nunca fundir.
6. **Precificação**: sempre BDI decomposto por rubrica em tabela mono;
   nunca a palavra "lucro" ou "taxa de administração".
7. **Cenários**: Mínimo / Base / Amplo, sempre nesta ordem, em cards ou
   colunas comparáveis.
8. **Gráficos** (Chart.js/Recharts): fundo transparente, grid
   `rgba(255,255,255,.05)`, série principal em `var(--gold-500)`, séries
   secundárias em tons de cinza-quente; labels em JetBrains Mono.

## Aplicação por tipo de artefato

- **HTML single-file (dossiês/estudos)**: dark mode obrigatório,
  navegação lateral fixa em desktop, seções numeradas (00, 01, 02...),
  responsivo até 380px.
- **Slides/PPTX**: fundo `var(--canvas)` `#070708`, um conceito por slide, número de
  destaque em Syne + dourado, corpo mínimo.
- **PDF/impresso**: manter dark-luxury em capas e divisórias; miolo pode
  invertido (fundo claro `#FAF9F5`, texto `#141413`, acentos dourados)
  para legibilidade de impressão.
- **Docs Word/relatórios FRIO**: sóbrio, tipografia Plus Jakarta Sans, dourado apenas
  em elementos estruturais (linhas, numeração).

## O que NUNCA fazer

- Misturar a paleta institucional com a paleta operacional SAMU
  (vermelho vivo) na mesma peça.
- Usar brasões municipais em peças de vídeo/institucionais.
- Gradientes coloridos, neon, glassmorphism genérico de template.
- Emojis em documentos institucionais.


---

## Regras acumuladas (jun–jul/2026)

Itens 1 e 2 do antigo Adendo v2 foram absorvidos nas seções de Tokens e
Tipografia acima — não há mais conflito a resolver. O que segue são as
regras que não têm seção própria:

1. **Regra de contraste do logotipo (obrigatória):** nunca cor fixa em UI — variantes currentColor herdando token semântico; wordmark branca no escuro / preta no claro; monograma SA+ sempre gold-500 semântico; contraste ≥3:1 (WCAG 1.4.11); em `<img>` currentColor NÃO funciona — inline o SVG.
2. **Dataviz Samais:** nunca dual-axis; nunca pizza >3 fatias; golds tonais NÃO formam paleta categórica (reprovam CVD) — usar série única por gráfico ou cores de status/Manchester com rótulo direto; validar paleta por script antes de publicar.
3. **Voz e claims:** linha-mestra "cada segundo conta"; postura do CoPilot é **100% passiva** (escuta, não interfere); **nenhum claim sem lastro** — ex.: taxa de trote real nacional é 5,8–9,7% (nunca usar 29%); métricas de demo sempre rotuladas.
4. **Assinatura visual:** top border ouro 2px em cards de dados; eyebrow mono uppercase gold-300; easing editorial 240ms cubic-bezier(0.22,1,0.36,1); ouro é sinal, não decoração (bordas neutras).
5. **Fotografia:** somente banco documental Samais (Drive → Samais 2026/Banco de Imagens) — zero stock.
