# Decisões de Tecnologia e Infraestrutura — Samais CoPilot OS

> Stack **settada** para a maturação ao estágio de produção (ago/2026). Formato de cada
> decisão: o que fica, por quê, o que foi recusado e em que fase entra. Preços citados
> com fonte e data; sem fonte = **"a cotar"** (Princípio da Realidade — nunca número
> inventado). Pareie com `docs/10` (estado), `docs/12` (operação/fases) e `docs/07`
> (segurança).

---

## 1. Decisões por camada

### 1.1 Front-end — MANTER React 19 + Vite 6 + TypeScript + Tailwind v4
- **Por quê:** stack atual funciona, o time conhece, e o custo está na dívida interna
  (monolito), não na tecnologia. Evolução: `strict: true` progressivo, ESLint/Prettier,
  **Zustand** para estado global da ocorrência e **router** (TanStack ou React Router) —
  a modularização (Sprint 5) é pré-requisito da fila multi-ocorrência (`docs/10` §4.1).
- **Recusado:** rewrite em Next.js — SSR não agrega em app autenticado de sala de
  central; custo de migração sem contrapartida. O Samais-OS registra os produtos por
  ritmo próprio (PEP = Next, CoPilot = Vite) — não há exigência de convergência.
- **Fase:** F0 (lint/CI) · F1 (modularização + estado + router).

### 1.2 Backend e dados — MANTER Supabase, região São Paulo (`sa-east-1`)
- **Por quê:** já em uso com schema multi-tenant + RLS provados (gestor sem PII por
  view); Auth com TOTP nativo (SEC-03); Realtime para frota; residência São Paulo
  atende LGPD (SEC-07). Plano **Pro** já no início do piloto (backups diários) e
  **Team** quando houver contrato com dado real (SOC2/ISO 27001 + SLA — ver §2).
- **Nota de doutrina:** as duas recusas de Supabase registradas no Samais-OS
  (`CLAUDE.md` do OS, decisão de 08/08/2026) são **escopadas às ferramentas internas**
  (briefing e despesas) — não vetam o produto. Os dois argumentos que se transferem
  viram mitigação formal: dado de saúde em servidor de terceiro exige **DPA assinado**
  (SEC-17) e chave em repo público exige **repo privado na org `samais`** + segredos
  só por env (SEC-01).
- **Recusado:** Firebase (regras inferiores a RLS SQL para auditoria clínica);
  Postgres self-hosted **agora** (custo de operação prematuro). **Plano B contratual:**
  se edital/contrato exigir on-prem, o schema é Postgres puro — migra para
  infraestrutura dedicada sem reescrita; decisão reavaliada por contrato.
- **Fase:** F0 (Tier 0 sobre o projeto atual) · F2 (upgrade de plano + DPA).

### 1.3 STT (transcrição) — Deepgram Nova-3 streaming, atrás de `TranscriptProvider`
- **Por quê:** melhor relação latência×acurácia em PT-BR streaming com keyword boosting
  para jargão APH (AVPU, OVACE, PCR, USA/USB) sem treinar modelo (`docs/05` §2).
  **Preço público (11/08/2026, deepgram.com/pricing): US$ 0,0048/min streaming
  (Nova-3 monolingual) · US$ 0,0058/min (multilingual)** — pay as you go.
- **Contrato:** DPA obrigatório (SEC-17) + mapeamento de região de processamento
  (SEC-07). Gravação bruta separada em storage WORM (S3/R2 — a cotar).
- **Recusado como primário:** Google Speech v2 (sem vantagem de preço/latência
  registrada) e Whisper self-hosted (exige GPU dedicada — vira **plano B homologado**
  para contrato que exija 100% on-prem, viável pela abstração `TranscriptProvider`).
- **Fase:** F1.

### 1.4 LLM (extração clínica + sugestão Manchester) — Gemini, atrás de `LLMProvider`
- **Por quê:** SDK `@google/genai` já no repo; família Flash cobre extração estruturada
  em streaming com custo marginal (ver §3). Prompts versionados no repo; explicabilidade
  persistida em `ocorrencias.fatores_ia`; divergência do regulador como base de
  avaliação contínua. **Preço público (11/08/2026, ai.google.dev): Flash-Lite
  US$ 0,30/1M tokens entrada · US$ 2,50/1M saída; Flash US$ 1,50 entrada · US$ 7,50–9,00
  saída; Pro US$ 2,00 · US$ 12,00.**
- **Regra de decisão:** o modelo final sai do **backtest da F1** (gate ≥90% de acurácia
  Manchester em ≥1.000 chamadas anonimizadas) medindo acurácia × latência × custo —
  começar em Flash; escalar para Pro apenas se o backtest exigir.
- **Recusado agora:** fine-tuning/modelo próprio on-prem (horizonte APH-BR, depois de
  SEC-31); qualquer envio de PII desnecessária ao modelo (minimização no prompt —
  SEC-17/LGPD).
- **Fase:** F1.

### 1.5 Telefonia — SIPREC-first (RFC 7865/7866), 100% passivo
- **Por quê:** espelhamento de mídia pelo SBC/PABX da CRU **sem tocar o fluxo do 192**
  (zero risco de derrubar chamada); padrão suportado por Asterisk moderno e SBCs
  comerciais (`docs/05` §3). Alternativa homologada: fork de mídia no Asterisk
  (ARI/externalMedia). Último recurso: tap físico E1 (Khomp/AudioCodes) como **serviço
  de implantação** para PABX legado.
- **Regra de produto:** o CoPilot **não substitui** a telefonia da CRU na fase 1 — ele
  escuta. Primeira pergunta do diagnóstico de implantação: *"qual é o PABX e quem o
  mantém"* (`docs/12` §1).
- **Custo:** media gateway próprio (desenvolvimento F2) + hardware de tap **apenas**
  onde E1 legado (a cotar por implantação).
- **Fase:** F2.

### 1.6 Mapas e navegação — Google Maps Platform
- **Por quê:** já em uso (Embed); deep link `dir_action=navigate` resolve navegação da
  viatura na fase 1 com custo zero e confiança do motorista. Navigation SDK só quando
  houver hardware padronizado. Chave **exclusivamente por env** (`VITE_GOOGLE_MAPS_API_KEY`
  — hardcode removido em ago/2026), restrita por referrer, billing com alerta.
- **Recusado agora:** Mapbox (theming não paga a migração; reavaliar se o custo do
  Google escalar). Preço: Embed API é gratuita; Dynamic Maps/Routes **a cotar** contra a
  tabela vigente do Google Maps Platform quando o AVL real (F1–F2) definir volume.
- **Fase:** contínua.

### 1.7 Hosting e observabilidade — Vercel + Supabase + Sentry
- **Por quê:** Vercel já serve o produto (org `samais` com simetria GitHub↔Vercel,
  decisão de 30/07/2026 no OS); Sentry para erro/performance de front (a cotar; tier
  inicial baixo). Uptime/alertas: monitor externo simples (a cotar). Logs de auditoria
  vivem no próprio Postgres (append-only + hash-chain SEC-05).
- **Headers de segurança:** HSTS + CSP adicionados ao `vercel.json` em ago/2026 (SEC-02).
- **Fase:** F0.

### 1.8 Tablets, MDM e conectividade embarcada
- **Decisão (docs/05 §6, mantida):** Android robusto (classe Samsung Tab Active/Zebra)
  em **modo quiosque via MDM** com wipe remoto (SEC-18); **dual-SIM (duas operadoras) em
  100% da frota**; **Starlink Flat por CRU como redundância de uplink (padrão de
  contrato)**; Starlink Mini embarcado **apenas** em cobertura rural/longa distância
  (~20–30% da frota típica). **Offline-first no app é requisito de software
  independente da antena** (`docs/10` §4.4).
- **Custos:** tablet, suporte veicular, MDM, planos de dados e Starlink — **a cotar**
  (tabela §2). Capex de tablet entra por viatura; amortização a definir com o CEO.
- **Fase:** F2.

### 1.9 CI e cadeia de suprimentos — GitHub Actions na org `samais`
- **Por quê:** SEC-14 — CodeQL (SAST) bloqueando finding crítico, Dependabot, secret
  scanning + push protection, SBOM no build. Depende da transferência dos repos para a
  org (execução do proprietário da conta; decisão já registrada no OS).
- **Fase:** F0.

### 1.10 Interoperabilidade oficial — e-SUS SAMU e RNDS
- **Decisão:** desenhar o registro para **exportar no formato oficial** (evitar duplo
  registro) e tratar RNDS como integração de F3 — exige certificado ICP-Brasil,
  credenciamento e homologação junto ao DATASUS. **Nada disso se promete como ativo**
  até a agenda técnica acontecer (`docs/12` §1). FHIR R4 permanece como formato-alvo
  interno (a pré-visualização da UI está rotulada como formato, não como integração).
- **Fase:** F3.

## 2. Assinaturas e contratos — tabela consolidada

Colunas: custo com **fonte e data** quando público; senão **a cotar** (URL do vendor).
Autorização de orçamento: **André (CEO)**. Execução de contas/chaves: **Ota**.
DPA = contrato de tratamento de dados como sub-processador (SEC-17).

| Serviço | Para quê | Custo (fonte · data) | DPA? | Fase |
|---|---|---|---|---|
| Supabase Pro → Team | Banco/Auth/Realtime; Team = SOC2/ISO + SLA | **US$ 25/mês (Pro) · US$ 599/mês (Team)** — supabase.com/pricing · 11/08/2026; PITR como add-on a confirmar | Sim | F0 → F2 |
| Vercel Pro (time `samais`) | Deploy do produto + previews | **a cotar** — vercel.com/pricing (ordem US$ 20/usuário/mês, confirmar no checkout) | Sim | F0 |
| Deepgram | STT streaming PT-BR | **US$ 0,0048–0,0058/min** — deepgram.com/pricing · 11/08/2026 | Sim | F1 |
| Google Gemini API | Extração clínica + Manchester | **US$ 0,30–1,50/1M tokens entrada · 2,50–9,00/1M saída (Flash)** — ai.google.dev · 11/08/2026 | Sim | F1 |
| Google Maps Platform | Mapas, rotas, AVL | Embed gratuito; Routes/Dynamic **a cotar** conforme volume | Sim | F1–F2 |
| Storage WORM (S3/R2) | Gravação bruta de áudio, cadeia de custódia | **a cotar** (ordem de centavos/GB·mês) | Sim | F2 |
| Sentry (ou equivalente) | Erros/performance | **a cotar** — sentry.io/pricing | Sim | F0 |
| Monitor de uptime | Alerta de indisponibilidade | **a cotar** (tiers gratuitos existem) | — | F0 |
| MDM (Scalefusion/Hexnode/etc.) | Quiosque + wipe dos tablets | **a cotar** (ordem US$ 2–5/dispositivo/mês, confirmar) | Sim | F2 |
| Tablets robustos + suporte veicular | 1 por viatura | **a cotar** (capex por viatura) | — | F2 |
| Planos de dados dual-SIM | Conectividade base da frota | **a cotar** (2 operadoras × viatura) | — | F2 |
| Starlink Flat (CRU) + Mini (frota rural) | Redundância de uplink | **a cotar** — starlink.com (BR) | — | F2 |
| TSA RFC 3161 | Carimbo de tempo da auditoria (SEC-12) | **a cotar**; OpenTimestamps como âncora complementar ~custo zero (SEC-32) | — | F2 |
| Pentest terceirizado | SEC-15 (web + API) | **a cotar** (pontual, por rodada) | — | F2 |
| DPO (interno ou serviço) | SEC-16, encarregado LGPD | **a cotar** | — | F0–F2 |
| Certificado ICP-Brasil (e-CNPJ) | RNDS + assinaturas | **a cotar** (tabela das ACs) | — | F3 |

**Não assinar:** DLT/blockchain completa (avaliada e descartada — SEC-32), Remotion
(licença paga; vídeo programático da casa é HyperFrames), live view de cena (descartado).

## 3. Modelo de custo operacional projetado — por CRU/mês

Modelo de ordem de grandeza para uma CRU de referência, com **premissas declaradas**
(ajustar por frente com dado real do briefing). É a fonte da seção "custos operacionais
esperados" da apresentação institucional (`docs/13`) — sempre como **projeção**.

**Premissas (referenciais do benchmark do Samais-OS):**
- Município médio, **~300 mil habitantes**; demanda 0,12–0,18 chamadas/hab/ano →
  **3.000–4.500 ligações/mês**; duração média tratada de **3 min** (premissa a calibrar
  no piloto).
- Toda ligação transcrita (streaming); extração LLM por ligação ~5k tokens totais
  (premissa a calibrar).

| Componente | Conta | Ordem de custo |
|---|---|---|
| STT (Deepgram Nova-3) | 9.000–13.500 min/mês × US$ 0,0048–0,0058 | **US$ 43–78/mês** |
| LLM (Gemini Flash) | 15–23M tokens/mês mistos | **US$ 25–90/mês** |
| Banco/Auth/Realtime | Supabase Pro→Team (rateado entre CRUs) | **US$ 25–599/mês** |
| Storage de áudio (WORM) | ~450–680 h/mês de áudio | **a cotar** (ordem de poucos US$/mês) |
| Observabilidade + uptime | Sentry + monitor | **a cotar** (ordem de dezenas de US$/mês) |
| Tablets + MDM + dados | por viatura (capex + 2 chips + MDM) | **a cotar** por frota |
| Starlink (CRU + rural) | 1 Flat + Minis seletivos | **a cotar** |
| Suporte N1/N2 e engenharia | equipe Samais | interno (rubrica de tecnologia da operação) |

**Leitura honesta (e forte):** o custo **variável de IA por ligação é da ordem de
centavos de real** (~US$ 0,015–0,03/ligação de 3 min = R$ 0,08–0,17 ao câmbio de
referência — declarar o câmbio ao apresentar). O custo relevante do produto não é a IA:
é **engenharia, implantação, tablets/conectividade e conformidade** (pentest,
certificações, DPO). Isso sustenta duas afirmações da peça institucional: a tecnologia
**escala a custo marginal baixo** e o investimento decisivo é **institucional**
(integração, treinamento, auditoria), não de consumo de API.

## 4. Papéis e autorização

| Ação | Quem |
|---|---|
| Autorizar orçamento/assinaturas e calibragem final | **André (CEO)** |
| Criar contas, chaves, DPAs, org GitHub `samais`, envs Vercel/Supabase | **Ota** |
| Executar Tier 0 no projeto Supabase (runbook `docs/14`) | Ota + dev de segurança |
| Validar decisão clínica de prompts/protocolos e o backtest | Médico regulador de referência (RT) |
| Nomear DPO/encarregado | Diretoria (SEC-16) |

## 5. Decisões que permanecem externas a este documento

1. **Transferência dos repos para a org GitHub `samais`** — decidida em 30/07/2026 no
   OS; execução é do proprietário da conta (preserva issues/PRs e redireciona URLs).
2. **Elevação de plano Supabase e momento do DPA** — gatilho: primeiro dado real.
3. **On-prem por exigência contratual** — reavaliar por edital (plano B §1.2/§1.3).
4. **CRU piloto** — decisão de diretoria em aberto; critérios em `docs/12` §6.
