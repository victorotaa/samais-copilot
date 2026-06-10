# Design System Samais — Tokens, Dual Theme, Componentes

> Fonte única de verdade para a identidade visual da Samais. Vale para o CoPilot OS, o PEP OS (quando integrarmos), o master-plan-rota e qualquer LP futura.

## 1. Estado atual e o problema

Hoje existem **três paletas levemente diferentes** circulando:

| Arquivo | Background primário | Gold | Fonte sans |
|---------|---------------------|------|------------|
| `src/index.css` (App) | `#090A0F` | `#D3A05C` | Inter |
| `master-plan-rota.html` | `#070708` | `#C9A84C` | Plus Jakarta Sans |
| PEP OS (não acessado nesta sessão) | ? | ? | ? |

Antes de qualquer paridade visual ampla, é preciso **escolher uma única paleta canônica** e migrar os outros artefatos. Este documento propõe uma estrutura que aceita os tokens definitivos sem precisar reescrever componentes.

## 2. Estratégia de tokens em duas camadas

### Camada 1 — Tokens primitivos (valor literal)

Cores, fontes, raios, sombras, espaçamentos com valor concreto. Não usar diretamente em componentes.

```css
@theme {
  --color-gold-400: #D3A05C;
  --color-ivory-50: #FFF5E9;
  --color-onyx-950: #090A0F;
  /* ... */
}
```

### Camada 2 — Tokens semânticos (intenção)

Apontam para um primitivo, mas mudam de valor conforme o tema ativo. **Usar estes em componentes.**

```css
:root[data-theme="dark"] {
  --color-bg:        var(--color-onyx-950);
  --color-surface:   var(--color-onyx-900);
  --color-surface-2: var(--color-onyx-800);
  --color-content:   var(--color-ivory-50);
  --color-content-2: var(--color-ivory-200);
  --color-accent:    var(--color-gold-400);
  --color-border:    rgb(211 160 92 / 0.20);
}

:root[data-theme="light"] {
  --color-bg:        var(--color-ivory-50);
  --color-surface:   #FFFFFF;
  --color-surface-2: var(--color-ivory-100);
  --color-content:   var(--color-onyx-950);
  --color-content-2: var(--color-onyx-700);
  --color-accent:    var(--color-gold-500);  /* slight shade darker for AA contrast */
  --color-border:    rgb(169 95 65 / 0.18);
}
```

Os componentes usam só os semânticos (`bg-surface`, `text-content`, `border-border`). Swap de tema vira **mudança de variável**, não refactor de classe.

## 3. Paleta canônica proposta (pendente confirmação com PEP OS)

### Primitivas — escala completa

```
GOLD (acento primário)
  100  #FAEDD3
  200  #F0D8A4
  300  #E2BC78
  400  #D3A05C  ← atual App.tsx
  500  #C9A84C  ← atual master-plan-rota
  600  #A98342
  700  #816636

TERRA (acento secundário, hover de CTA)
  300  #C7846A
  400  #A95F41  ← atual

IVORY (conteúdo claro / bg light)
  50   #FFF5E9
  100  #F7EBDB
  200  #FCD7B8  ← s-nude atual

ONYX (bg dark / conteúdo escuro)
  700  #2A2E3A
  800  #1B202C  ← s-surf2
  900  #141720  ← s-surf
  950  #090A0F  ← s-dark

AI (cyan)
  400  #00D4A8  ← s-ai

SEMANTIC
  ok:     #10B981
  warn:   #F59E0B
  danger: #EF4444
  info:   #3B82F6
```

### Tipografia

```
--font-display:  "Syne", system-ui, sans-serif
--font-sans:     "Plus Jakarta Sans", "Inter", system-ui, sans-serif
--font-mono:     "JetBrains Mono", ui-monospace, monospace
```

> Decisão pendente: o App usa **Inter** (mais técnico, mais "OS"), o master-plan usa **Plus Jakarta** (mais editorial). Recomendo padronizar em **Plus Jakarta para o produto inteiro**, mantendo Inter como fallback até a decisão. Aguarda input PEP OS.

### Escala tipográfica

```
display-xl   72px / 1.05 / -0.03em / Syne 800
display      54px / 1.08 / -0.025em / Syne 800
heading-1    32px / 1.15 / -0.02em / Syne 700
heading-2    22px / 1.2  / -0.01em / Syne 700
body         15.5px / 1.75 / 0     / Jakarta 400
body-bold    15.5px / 1.75 / 0     / Jakarta 600
small        13px / 1.6  / 0       / Jakarta 400
caption      11px / 1.4  / 0.12em  / JetBrains Mono 500
overline     10px / 1.3  / 0.2em   / JetBrains Mono 600 UPPERCASE
```

### Raios e sombras

```
--radius-sm:   4px
--radius-md:   8px   ← inputs, chips
--radius-lg:   12px  ← cards
--radius-xl:   16px  ← painéis principais
--radius-2xl:  24px  ← modais
--radius-full: 9999px

--shadow-glow-gold:  0 0 30px rgb(211 160 92 / 0.20)
--shadow-glow-ai:    0 0 30px rgb(0 212 168 / 0.20)
--shadow-glow-danger:0 0 30px rgb(239 68 68 / 0.30)
--shadow-panel:      0 8px 32px rgb(0 0 0 / 0.55)
```

### Espaçamento

Múltiplos de 4px (`0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 100`). Tailwind default cobre.

## 4. Componentes do design system

### Atoms

- `Button` (variants: `primary` = gold gradient, `secondary` = surface outlined, `danger`, `ghost`, `link`)
- `IconButton`
- `Input` (text, password, search)
- `Textarea`
- `Checkbox`, `Switch`
- `Chip` / `Badge` (variants: `ok`, `warn`, `danger`, `ai`, `nude`, `neutral`)
- `Avatar`
- `Tooltip`

### Molecules

- `Panel` (glass + border, replaces `.gp`)
- `Card` (variants: `kpi`, `vehicle`, `caller`)
- `Modal`
- `Toast`
- `DataTable`
- `EmptyState`

### Organisms (específicos do CoPilot)

- `IncomingCallOverlay`
- `TranscriptionChat`
- `ExtractedClinicalPanel`
- `VehicleList`
- `MapPanel`
- `ManchesterChecklist`
- `JustificationPicker`

## 5. Implementação progressiva (caminho real)

A migração completa demanda refator do App.tsx inteiro (Sprint 5 do roadmap). Para esta rodada, a estratégia adotada é:

1. **Adicionar a camada semântica** ao `src/index.css` com `data-theme="dark"` (default) e `data-theme="light"`.
2. **Manter as variáveis primitivas legadas** (`--color-s-*`) intactas, para que nenhuma classe Tailwind existente quebre.
3. **Adicionar um Theme Toggle funcional** que muda `data-theme` no `<html>` e persiste em `localStorage`.
4. **Aplicar tokens semânticos imediatamente apenas no `body`** (cor de fundo e texto) — assim o swap de tema é visível e validável, mesmo sem ter migrado todos os componentes.
5. **Documentar a migração componente a componente** (Sprint 5).

Resultado: a infraestrutura está pronta, o toggle funciona, e a migração interna pode ser feita aos poucos sem big-bang.

## 6. Como aplicar PEP OS quando ele for liberado

1. Adicionar `victorotaa/samais-pep` ao escopo da sessão.
2. Ler os tokens equivalentes nesse repo (provavelmente em `src/styles/tokens.css` ou `tailwind.config`).
3. Confirmar (com você) qual paleta vence em cada conflito — geralmente o produto mais maduro é o referencial.
4. Atualizar a camada primitiva deste documento. A camada semântica não muda.
5. Eliminar a divergência do `master-plan-rota.html` (substituir cores literais por `var(--color-*)`).

## 7. Acessibilidade

- Contraste WCAG AA mínimo em todos os pares texto/fundo. AAA onde possível para o produto operacional (cansaço visual em 12h de plantão).
- Foco visível com outline gold em todos os elementos interativos.
- `prefers-reduced-motion: reduce` desliga animações de pulso, ping, gradiente animado.
- `aria-label` em todos os botões só-ícone.
- Tamanho mínimo de hit area: 44×44px (mobile-first).
- Modo de alta-densidade (toggle futuro) reduz padding em 30% para usuários em monitor secundário/lateral.
