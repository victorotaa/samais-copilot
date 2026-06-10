# Review Operacional — CoPilot OS

> Review completo solicitado por Victor (jun/2026): estado visual e funcional do produto, e recomendações de arquitetura para STT, integração PABX/CRU, tela de viatura, live view, conectividade embarcada (tablet + Starlink) e multi-tenancy com perfil Gestor.

## 1. Estado visual após esta rodada

| Frente | Estado |
|--------|--------|
| Paleta canônica PEP OS | ✅ aplicada (Sprint 1) |
| Tipografia (Plus Jakarta + Syne + JetBrains Mono) | ✅ unificada |
| Ícones | ✅ migrados Font Awesome → **Lucide** (stroke 1.5, padrão PEP) — wrapper em `src/ui/Icon.tsx`, CDN do FA removido |
| Logotipo oficial (monograma SA+ ouro + wordmark) | ✅ aplicado em login, header, favicon e LP (`public/brand/`) |
| Theme toggle | ✅ ícone único de lua |
| Mapa real na tela de espera | ✅ Google Maps Embed (com `VITE_GOOGLE_MAPS_API_KEY`; fallback keyless) |
| Chamada teste | ✅ atraso de 10s após entrar em espera |
| LP B2B | ✅ linguagem para leigos, foco em "cada segundo conta" |

O que ainda falta para paridade plena com o PEP (próxima rodada):
- **Gráficos Recharts** com cores fixas dark (não theme-aware).
- **Densidade/spacing** das tabelas seguindo a régua do PEP (alta 32–36px, média 40–48px).
- **Componentes compartilhados** — extração para `src/ui/` (Sprint 5) e, no horizonte, um pacote `@samais/ui` consumido por CoPilot e PEP.
- Convergir o mecanismo de tema (PEP usa classe `.light`; CoPilot usa `data-theme`) — valores já idênticos.

## 2. STT (speech-to-text) — recomendação de infraestrutura

Requisito de produto: streaming em PT-BR com latência parcial < 300ms, diarização (solicitante × TARM), vocabulário APH (AVPU, OVACE, PCR, USA/USB), e operação contínua 24/7.

**Recomendação: Deepgram Nova-2/Nova-3 (streaming WebSocket) como motor primário.**

- Melhor relação latência×acurácia em PT-BR streaming hoje; preço por minuto competitivo (~US$ 0,0043/min em streaming, escala linear com canais simultâneos).
- Keyword boosting para o jargão APH sem precisar treinar modelo.
- A UI atual já cita Nova-2 — vira verdade em vez de teatro.

**Arquitetura:**

```
PABX/SBC ──RTP/SIPREC──▶ Media Gateway (forka o áudio)
                              │
                              ├──▶ Gravação bruta (S3/R2, WORM, cadeia de custódia)
                              └──▶ Deepgram streaming ──▶ transcrição parcial (WS)
                                                              │
                                                              ▼
                                              Backend CoPilot ──▶ LLM (extração clínica,
                                                              sugestão Manchester)
                                                              ▼
                                              UI TARM/Regulador (WebSocket)
```

- **Fallback degradado:** se o STT cair, a chamada continua (áudio nunca depende da IA); a UI marca "transcrição indisponível" e o TARM digita como hoje. Princípio: *a IA é copiloto, não piloto* — vale também para disponibilidade.
- **Plano B de vendor:** abstrair o provider atrás de uma interface (`TranscriptProvider`) para poder trocar por Google Speech v2 ou Whisper streaming self-hosted (GPU) se contrato público exigir dado 100% on-prem.
- **LGPD:** áudio é dado sensível. Gravação cifrada em repouso, retenção por política contratual, transcrição com PII minimizada no log.

## 3. Plug com o PABX das CRUs — como se faz na prática

As CRUs brasileiras rodam majoritariamente Asterisk/Issabel, Khomp ou PABX legado TDM. Três caminhos, do mais comum ao mais limpo:

1. **SIPREC (RFC 7865/7866)** — o padrão correto. O SBC/PABX espelha a mídia da chamada para o nosso Session Recording Server. Não toca no fluxo da chamada (zero risco de derrubar o 192). Asterisk moderno e SBCs comerciais (AudioCodes, Oracle, Sangoma) suportam.
2. **Fork de mídia no Asterisk** (`MixMonitor`/ARI + externalMedia) — quando a CRU roda Asterisk e dá acesso ao dialplan. Mais barato, exige janela de manutenção e homologação local.
3. **Gateway físico em paralelo** (tap E1/SIP) — para PABX TDM legado que ninguém quer tocar. Hardware Khomp/AudioCodes tapeando o tronco. Último recurso, mas destrava licitações com infra antiga.

**Recomendação de produto:** padronizar a oferta em **SIPREC-first**, com o item 2 como alternativa homologada e o item 3 como serviço de implantação. No diagnóstico de implantação (já citado na LP/FAQ), a primeira pergunta técnica é "qual o PABX e quem o mantém".

Importante: o CoPilot **não substitui** a telefonia da CRU na fase 1 — ele escuta. Isso reduz o risco percebido pelo gestor e elimina objeção de "e se o sistema de vocês cair?".

## 4. Tela de viatura — proposta de redesenho

Concordo com o desconforto. A tela atual é um "mapa com telemetria" — bonita em demo, mas não responde às três perguntas da equipe embarcada: **para onde vou, o que vou encontrar, o que faço quando chegar.**

Proposta — **modo tablet (paisagem), 3 zonas, zero scroll:**

```
┌────────────────────────────────┬──────────────────────────┐
│  ROTA (60%)                    │  PACIENTE (40%)          │
│  mapa navegável, turn-by-turn  │  badge Manchester gigante│
│  ETA gigante (mono, 44px+)     │  nome · idade · sexo     │
│  próxima manobra               │  queixa: "dor torácica   │
│                                │  irradiada, sudorese"    │
│                                │  comorbidades: HAS, DM   │
│                                │  protocolo: IAM → USA    │
│                                │  alergias (se houver)    │
├────────────────────────────────┴──────────────────────────┤
│  BARRA DE MISSÃO: J3 ETA 6min · botões de status de 1 toque│
│  [A CAMINHO] [NO LOCAL] [TRANSPORTANDO] [NO HOSPITAL]      │
└────────────────────────────────────────────────────────────┘
```

Princípios:
- **Luva e vibração:** alvos de toque ≥ 64px, sem gesto fino, sem dropdown. Os 4 botões de status são o coração — alimentam os tempos T0–T4 do dashboard do gestor sem ninguém digitar nada.
- **Briefing falado:** ao despachar, o resumo clínico pode ser lido por TTS no tablet ("Masculino, 58, dor torácica irradiada, HAS, protocolo IAM") — a equipe ouve enquanto dirige, não lê.
- **Atualização ao vivo:** se o Regulador adiciona observação ("paciente agora inconsciente"), a tela pulsa e atualiza o badge.
- **Modo noturno automático** (já temos dark) + brilho alto para sol — toggle rápido na barra.
- O turn-by-turn nativo exige Google Navigation SDK (Android) ou handoff para Waze/Google Maps com deep link — recomendo **deep link na fase 1** (zero custo, motorista já confia) e SDK quando houver hardware padronizado.

## 5. Live view — o que indica e quando vale

O modal "câmera ao vivo" hoje é placeholder. O que ele **deve** ser, em ordem de valor real:

1. **Vídeo do solicitante → Regulador (fase 1, alto valor):** link SMS para o celular de quem ligou abre WebRTC com a câmera — o Regulador vê a cena/vítima antes de decidir recurso. É o padrão emergente em centrais europeias/americanas (ex.: GoodSAM Instant-On-Scene). Reduz despacho às cegas e USA evitável — e é só software.
2. **Câmera da viatura → Regulador (fase 2):** contexto da cena ao chegar; útil para regulação de apoio (segunda viatura? PM?).
3. **Telemedicina no transporte (fase 3):** médico orienta procedimento durante o transporte, vira diferencial contratual com hospital de destino.

Recomendo declarar o live view como **item 1** no produto: barato (WebRTC + TURN), impacto narrativo enorme na demo, e mensurável (% de regulações com vídeo).

## 6. Tablet por viatura + Starlink — minha leitura

**Tablet: sim, sem hesitação.** Android robusto (Samsung Tab Active ou Zebra), suporte veicular com carga, modo quiosque (MDM) rodando só o CoPilot. O tablet é o que transforma a viatura de ponto cego em nó de dados: status de 1 toque, GPS contínuo, handoff digital, foto de documento/cena.

**Starlink: sim nas CRUs, seletivo nas viaturas.**

- **CRU com Starlink = redundância de uplink** (failover do link terrestre). Central 192 sem internet é central parada; um Flat High Performance por CRU é barato perto do custo de uma hora de central offline. Recomendo como **padrão de contrato**.
- **Viatura com Starlink Mini = depende do território.** Em cidade com 4G decente, um roteador dual-SIM (duas operadoras) custa uma fração e resolve 95%. Starlink Mini embarcado brilha no **interior/área rural/estrada** — exatamente onde consórcios intermunicipais (CISNORPI-like) operam. Proposta: **conectividade em camadas** — 4G dual-SIM como base em todas, Starlink Mini nas viaturas de cobertura rural/longa distância.
- O app do tablet precisa de **offline-first** de qualquer forma (fila local com sync) — túnel, garagem e sombra de sinal existem mesmo com Starlink. Isso é requisito de software, não de antena.

Resumo do custo-sentido: Starlink em 100% das CRUs, Starlink Mini em ~20–30% da frota (rural), dual-SIM em 100% da frota, offline-first no app sempre.

## 7. Multi-tenancy e perfis — alinhado ao PEP

Pedido do Victor: tenants como no PEP, perfil **Gestor** só-métricas, e login/senha por colaborador de CRU.

**Modelo proposto (Sprint 4, junto com o backend):**

```
Tenant (CRU / consórcio / operação)
 └─ Unidades (bases, hospitais de referência)
 └─ Usuários (vínculo com matrícula operacional)
     ├─ TARM        → recepção/triagem; vê PII da ocorrência ativa
     ├─ REGULADOR   → decisão clínica; vê PII + histórico clínico
     ├─ VIATURA     → conta por viatura/plantão; vê só a ocorrência atribuída
     ├─ GESTOR      → dashboards e SLA AGREGADOS; **sem PII** (k-anonimato
     │                nos drill-downs; exporta relatório, não ocorrência)
     └─ ADMIN_TENANT→ gestão de usuários e configuração da operação
```

- **Isolamento por tenant no banco** (RLS por `tenant_id` se Supabase/Postgres — reforça a recomendação do roadmap 4.1).
- **Login = matrícula + senha + MFA TOTP** (biometria quando houver wrapper nativo no tablet). A matrícula já é o identificador natural da operação (a UI de login atual já pede TARM-04).
- **Auditoria por usuário**: cada decisão clínica e cada acesso a PII logado com matrícula — isso é o lastro real do banner LGPD.
- O perfil GESTOR materializa o workspace `EXECUTIVE` previsto na visão de produto (§4 de `01-visao-produto.md`) e vira argumento direto de venda: o contratante tem a própria tela desde o dia 1, sem enxergar dado sensível.

## 8. Riscos abertos (sem mudança desde o último review)

1. Backend inexistente — bloqueia tenants, auth real, persistência e o lastro dos claims LGPD. **Decisão 4.1 (Supabase × alternativas) é o gargalo de tudo da seção 7.**
2. IA mockada — a recomendação da seção 2 destrava o plano real.
3. `App.tsx` monolítico (1.9k linhas) — modularização (Sprint 5) antes de crescer mais.
4. Sem testes — qualquer refactor grande (como o desta rodada) depende de QA visual manual.
