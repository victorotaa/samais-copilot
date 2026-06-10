# Landing Page B2B — Spec

> LP do Samais CoPilot OS para compradores operacionais: Secretarias Municipais de Saúde, consórcios intermunicipais, planos de saúde, hospitais e operadoras de transporte sanitário. **Não é página de investidor** (para isso, o `master-plan-rota.html` já cumpre o papel).

## 1. Objetivo único

Marcar uma demo agendada com o time comercial da Samais em ≤ 5 minutos a partir do primeiro pixel.

CTA principal: **"Agendar demonstração da central"**. CTA secundário: **"Baixar dossiê técnico (PDF)"**.

## 2. Voz e tom

- Operacional, não acadêmico. Frase curta, número exato, verbo no presente.
- Zero buzzword genérico ("revolucionário", "disruptivo", "inteligente"). Use métrica.
- Forte ancoragem no SAMU como padrão de referência, mas o produto não é exclusivo SAMU.
- Português Brasil. Sem inglês desnecessário (mantém "CoPilot OS", "TARM", "AVPU", "Manchester" porque são jargão real).

## 3. Identidade visual

Aguardando paridade com PEP OS (Sprint 1 do roadmap). Enquanto não está liberado, usar tokens unificados do design system (`docs/04-design-system.md`) — dark como padrão, light disponível em toggle no topo.

## 4. Estrutura (top → bottom)

### 4.1 Hero — "Cada minuto importa, e cada minuto está no Samais"

- **Eyebrow:** `SAMAIS · CO-PILOTO DE DESPACHO APH`
- **Title (Syne 800, 56px):** _Cada minuto da central, auditado, classificado, e a caminho._
- **Subtítulo (Plus Jakarta 18px, sub):** Sistema operacional para centrais 192 e despachos APH, com IA que ouve a chamada, identifica risco e justifica decisões para o Médico Regulador.
- **CTA primário:** Agendar demonstração → form modal
- **CTA secundário:** Ver o CoPilot rodando (link âncora para §4.4)
- **Plano de fundo:** grade dourada sutil + glow radial (mesmo do master-plan-rota), mas em paleta unificada com PEP OS.
- **Bottom-stat strip:** três chips fixos no rodapé do hero — `T. médio regulação: 1m12s · Trotes filtrados: 29% · Acurácia Manchester: 96.8%`. **Apenas se sustentado por dados reais** quando entrar em produção; caso contrário, marcar como "Métricas de pilot" ou ocultar.

### 4.2 Problema — "O que acontece em 90% das centrais hoje"

Três cards lado a lado:

1. **TARM sobrecarregado** — escuta, digita, classifica, transfere. Sem IA, perde 22s por chamada em retrabalho.
2. **Regulação às cegas** — decisão clínica sob pressão, sem trilha do que foi dito de fato pelo solicitante.
3. **Viatura sem contexto** — chega no local sem saber se é trauma, parada, ou crise de ansiedade.

Cada card termina com um número de mercado citável (fonte: relatórios SAMU, OMS, etc.) — **não inventar números**.

### 4.3 Como o CoPilot resolve

Quatro pilares em grid 2×2:

| Pilar | Descrição curta | Métrica de impacto |
|-------|-----------------|--------------------|
| 🎧 **Triagem IA em tempo real** | STT + NLP em português, transcreve, extrai sintomas e classifica Manchester | -45s no T. médio de regulação |
| 🩺 **Apoio à decisão clínica** | Protocolo sugerido + checklist Manchester + alternativas | Acurácia auditável vs ground truth |
| 🚑 **Despacho otimizado** | Recurso recomendado por ETA e gravidade, com justificativa registrada | -18% de despachos USA evitáveis |
| 📊 **Auditoria e BI** | Cadeia de custódia LGPD, dashboard de SLA contratual | Pronto para ANPD, TCU, MP |

### 4.4 "Veja o CoPilot rodando" — demo embarcada

Vídeo de 90s autoplay-muted ou GIF longo do flow IDLE→AML→TARM→REGULADOR→VIATURA, com narração visual sobreposta (callouts apontando o "trote score 98%", "sintomas extraídos", "protocolo IAM sugerido").

CTA: **Entrar na demo interativa** → abre `/app` (a aplicação React atual).

### 4.5 Quem usa

Carrossel ou logos discretos de operações cobertas, com case curto de uma frase cada:

- SAMU Ourinhos — _"Reduziu T. de despacho USA em 31% em 6 meses."_
- CISNORPI — _"Padronizou regulação em 14 municípios."_
- Campos Gerais — _"Auditoria ANPD aprovada em primeira visita."_

> ⚠️ Depende de autorização formal dos parceiros para uso do nome (item 2.3 do backlog).

### 4.6 Modelos de contratação

Três cards transparentes:

1. **Operação completa** — Samais opera sua central 192 ponta a ponta. Modelo da PR #1 (Taboão).
2. **Licença CoPilot OS** — você opera, nosso software faz a inteligência. Por seat de TARM/Regulador ou por chamada.
3. **API APH-BR (em breve)** — integração de dados anonimizados para planos, seguradoras e pesquisa. _Lista de espera._

### 4.7 Compliance e segurança

Banner técnico (não decorativo), com claims que **só entram aqui se já estiverem implementados**:

- Conformidade LGPD (Lei 13.709/2018) — DPIA disponível sob NDA
- Criptografia AES-256 em repouso e TLS 1.3 em trânsito
- Audit log append-only com hash SHA-256 encadeado
- Hospedagem em região br-saopaulo (Vercel/Cloudflare/AWS conforme contrato)
- Pronto para auditoria TCU/MP/ANPD

> Se algum desses itens não estiver de fato implementado, **remover ou marcar como roadmap**. Não venda compliance que não existe.

### 4.8 FAQ

Perguntas que aparecem em conversa comercial real (não FAQ genérica de SaaS):

- "Como funciona com o nosso PABX atual?"
- "Os dados ficam onde? Quem acessa?"
- "Se a IA errar a classificação, o que acontece?"
- "Conseguimos exportar tudo se trocarmos de fornecedor?"
- "Funciona com SAMU SUS ou apenas privado?"
- "Em quanto tempo fica de pé numa central nova?"
- "Treinamento da equipe está incluso?"
- "Qual o SLA contratual de uptime?"

### 4.9 CTA final + rodapé

Bloco escuro de fechamento:

- **Title:** _A próxima chamada da sua central vai ser melhor._
- **CTA:** Agendar demonstração
- **Subtitle:** Resposta comercial em ≤ 24h úteis.

Rodapé: logos de redes (LinkedIn), CNPJ, endereço, e-mail comercial, link para Política de Privacidade e Termos de Uso.

## 5. Implementação técnica

### Opções de hospedagem da LP

| Opção | Quando usar | Custo de mudança |
|-------|-------------|------------------|
| **A.** LP como rota `/` do mesmo app, app vai para `/app` | Mais barato, menos infra | Médio: precisa router + isolamento de CSS |
| **B.** LP como subpasta `lp/` com `vercel.json` próprio (igual master-plan-rota) | Independência total, deploy separado | Baixo: replica padrão existente |
| **C.** LP em repo `samais-lp` separado, no domínio raiz, app em `app.samais.com.br` | Mais limpo a longo prazo | Alto: novo repo, DNS |

**Recomendação:** começar com **B** (HTML/CSS standalone no padrão do `master-plan-rota.html`), migrar para **C** quando faturamento justificar.

### Stack sugerida

Para a opção B:
- HTML5 single-file ou Vite + React com `vite-plugin-pages`
- Tailwind v4 com mesmos tokens do app (importado de `@/styles/tokens.css`)
- Lucide-react para ícones (substituir Font Awesome do app eventualmente)
- Form: HTML form + endpoint serverless em `/api/contact` (Resend ou SendGrid para email)
- Analytics: Plausible ou Vercel Analytics (sem cookies, LGPD-friendly)

### SEO

- `<title>`: `Samais CoPilot OS · Despacho APH com IA para centrais 192`
- `<meta description>`: 155 chars, com "central 192", "SAMU", "IA", "regulação médica"
- OG image: hero do produto com tipografia Samais
- Schema.org: `SoftwareApplication` + `Organization`
- Sitemap.xml + robots.txt

### Performance

- LCP ≤ 1.8s em 4G; CLS ≤ 0.05; INP ≤ 200ms
- Imagens em AVIF/WebP, lazy-load abaixo da dobra
- Fontes via `font-display: swap`, subset latin

## 6. Métricas de sucesso da LP

- **Conversão demo agendada / visita única ≥ 4%** (benchmark B2B saúde)
- **Tempo na página ≥ 2min** (sinal de leitura real, não bounce)
- **Origem do tráfego** rastreada: LinkedIn (sales-led), Google (intenção), eventos (boca-a-boca)
- **Qualificação do lead** capturada no form: tipo (gestor público / plano / hospital), tamanho da central (chamadas/dia), urgência (este mês / trimestre / sem prazo)
