# Design System Samais — Tokens, Dual Theme, Componentes

> Fonte única de verdade para a identidade visual da Samais no CoPilot OS.
> **A paleta canônica da marca vive no PEP OS** (`samais-pep/design/samais-pep-os-design-tokens.json`, v1.0, Maio 2026) — este documento registra como o CoPilot a consome e o que foi decidido na unificação (Sprint 1).

## 1. Decisão de unificação (Sprint 1 — resolvida)

As três paletas divergentes foram unificadas. **O PEP OS venceu como referencial canônico** — é o artefato mais maduro, com tokens formais (Tokens Studio schema), design system documentado e dual theme implementado.

| Artefato | Antes | Depois |
|----------|-------|--------|
| `src/index.css` (App) | `#090A0F` / gold `#D3A05C` / Inter | Canônico PEP (`#070708` / gold `#BF9A3D` / Plus Jakarta Sans) |
| `master-plan-rota.html` | `#070708` / gold `#C9A84C` | Canônico PEP (vars atualizadas in loco) |
| PEP OS | Canônico v1.0 | Inalterado (referência) |
| `lp/index.html` (LP B2B) | — (novo) | Nasceu canônico |

A migração dos componentes do `App.tsx` para tokens semânticos foi feita **big-bang nesta rodada** (não restam classes `s-*` legadas). O mapeamento aplicado:

| Token legado | Token semântico | Valor dark |
|--------------|-----------------|------------|
| `s-dark` | `canvas` | `#070708` |
| `s-surf` | `surface` | `#0E0E10` |
| `s-surf2` | `elevated` | `#161618` |
| `s-ivory` | `ink-primary` | `#F4F4F5` |
| `s-nude` | `ink-secondary` | `#A8A8B0` |
| `s-gold` | `gold-500` | `#BF9A3D` |
| `s-terra` | `gold-700` | `#7E6624` (gradientes tonais da marca) |
| `s-bdr` (borda) | `border-subtle` | `#1F1F22` |
| `s-bdr` (bg de hover) | `hover` | `#22232A` |
| `text-s-dark` (texto sobre ouro) | `ink-inverse` | `#070708` (constante nos dois temas) |

Decisões de calibração específicas do CoPilot:

- **Sinais operacionais vivos.** No CoPilot, `ok`/`warn`/`danger`/`info` apontam para a paleta **Manchester** do PEP (`#43A047`/`#FDD835`/`#E53935`/`#1E88E5`), não para os sinais dessaturados — em sala de despacho, a classificação de risco precisa gritar. Os sinais dessaturados do PEP (`signal-*`) existem como primitivos para UI administrativa (deltas, banners).
- **`ai` (#00D4A8)** é extensão da família, exclusiva do CoPilot — marca elementos gerados por IA. Documentada aqui para eventual upstream no PEP.
- **Bordas neutras.** As bordas gold-tintadas legadas viraram bordas neutras (`border-subtle`), seguindo o princípio do PEP: *"ouro como sinal, não como decoração"*. Ouro em borda ficou reservado à assinatura Samais (top border 2px em `card-data`).
- **Tipografia: Plus Jakarta Sans** vence como sans canônica (Inter saiu do bundle de fontes). Syne segue display; JetBrains Mono segue dados/eyebrows.

## 2. Estratégia de tokens em duas camadas

### Camada 1 — Tokens primitivos (valor literal)

Em `@theme` no `src/index.css`: escala gold 50–900 (espelho do PEP), `signal-*` dessaturados, `manchester-*` protocolares, fontes.

### Camada 2 — Tokens semânticos (intenção, theme-aware)

Vars CSS em `:root[data-theme="dark"]` (padrão) e `:root[data-theme="light"]`, expostas como utilities Tailwind v4 via `@theme inline`:

```
bg-canvas · bg-surface · bg-elevated · bg-overlay · bg-hover · bg-pressed
text-ink-primary · text-ink-secondary · text-ink-tertiary · text-ink-inverse
border-border-subtle · border-border-default · border-border-strong
text-gold-300 · bg-gold-500 (theme-aware: escurecem no light p/ contraste AA)
text-ok / warn / danger / info / ai (theme-aware)
```

Componentes usam **apenas** a camada semântica. Swap de tema é mudança de variável, não refactor de classe. Modificadores de opacidade (`bg-canvas/80`) funcionam via `color-mix`.

## 3. Paleta canônica (= PEP OS v1.0)

### Dark (padrão de produção — sala de central 24/7)

```
canvas   #070708     surface  #0E0E10     elevated #161618
overlay  #1F1F22     hover    #22232A     pressed  #2A2B33
border   #1F1F22 / #2A2B33 / #3A3B45 (subtle/default/strong)
ink      #F4F4F5 / #A8A8B0 / #6E6E78 / #3A3B45 (primary/secondary/tertiary/disabled)
gold     50 #FAF3DD · 100 #F5E8B8 · 200 #EAD78E · 300 #EAC97A · 400 #D4B45E
         500 #BF9A3D ← marca · 600 #A18230 · 700 #7E6624 · 800 #5C4A1A · 900 #3D3110
signal   success #5C8F6E · warning #C9A84C · danger #B8554E · info #6E8AAA
manchester red #E53935 · orange #FB8C00 · yellow #FDD835 · green #43A047 · blue #1E88E5
ai       #00D4A8 (extensão CoPilot)
```

### Light (opção de usuário — fadiga visual / preferência)

```
canvas   #FAFAF7     surface  #FFFFFF     elevated #F1F1ED
ink      #1A1A17 / #52524C / #828279
gold-300 #8A6E28 · gold-500 #A88230 (escurecidos p/ AA sobre branco)
ok #2E7D32 · warn #B58A00 · danger #C62828 · info #1565C0 · ai #00875F
```

### Tipografia

```
--font-disp:  "Syne" (500–800) — títulos, marca, hero
--font-sans:  "Plus Jakarta Sans" (400–800) — corpo, formulários, navegação
--font-mono:  "JetBrains Mono" (400–500) — dados, eyebrows, códigos, KPIs
```

Eyebrow editorial Samais (classe `.eyebrow`): JetBrains Mono 500, 11px, tracking 0.08–0.12em, UPPERCASE, gold-300 — sempre acima de títulos importantes.

### Raios, sombras e motion (PEP)

```
radius: 6px padrão (inputs/botões) · 8px cards · 12px modais · nunca >12px em UI principal
shadow-glow: 0 0 24px rgba(191,154,61,0.15) — ações primárias
motion: 240ms cubic-bezier(0.22,1,0.36,1) (easing editorial) · hover 180ms · nunca bounce/elastic
```

### Assinatura Samais

**Top border ouro 2px** em cards de dados (`.card-data`). Foco visível: anel ouro 3px com offset 2px. Selection: ouro sobre `ink-inverse`.

## 4. Componentes do design system

Classes compostas já migradas para semânticos em `src/index.css`: `.gp` (panel), `.inp`, `.lbl`, `.chip-{ok|warn|danger|ai|nude}`, `.eyebrow`, `.card-data`, `.fu`.

A extração para componentes React (`src/ui/`: Button, Chip, Panel, Input, Modal…) segue no Sprint 5 (modularização do App.tsx) — a migração de tokens desta rodada garante que isso será refactor de estrutura, não de cor.

## 5. Estado da implementação

| Etapa | Status |
|-------|--------|
| Camada semântica dual theme em `src/index.css` | ✅ |
| Theme toggle persistente (`samais.theme` em localStorage) | ✅ (Sprint 0) |
| Migração big-bang do App.tsx para tokens semânticos | ✅ (Sprint 1) |
| Unificação `master-plan-rota.html` | ✅ (Sprint 1) |
| LP B2B nascida canônica (`lp/index.html`) | ✅ (Sprint 1) |
| Validação visual lado a lado PEP × CoPilot (prints) | ◻ pendente (item 1.5) |
| Gráficos Recharts theme-aware (hoje têm cores fixas dark) | ◻ Sprint 5 |
| Extração de componentes React | ◻ Sprint 5 |

> Nota de interoperabilidade: o PEP usa classe `.light` no `<html>` (Tailwind 3 + Next), o CoPilot usa `data-theme="light"` (Tailwind v4 + Vite). Os **valores** são idênticos; convergir o mecanismo é tarefa do Sprint 5/monorepo. A chave de localStorage já é a mesma (`samais.theme`).

## 6. Acessibilidade

- Contraste WCAG AA mínimo em todos os pares texto/fundo (gold-300/500 escurecem no light para isso). AAA onde possível no produto operacional (12h de plantão).
- Foco visível com anel ouro em todos os elementos interativos.
- `prefers-reduced-motion: reduce` desliga animações de pulso, ping, gradiente animado.
- `aria-label` em todos os botões só-ícone.
- Hit area mínima: 44×44px (mobile-first).
- Modo de alta-densidade (toggle futuro) reduz padding em 30% para monitor secundário.
