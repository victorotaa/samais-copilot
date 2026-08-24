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
- **Três modos de operação da IA (doutrina — nota do Ota, 24/08/2026).** O kill switch
  não é binário; entre a IA plena e o manual total existe o modo que preserva o fluxo
  que as centrais já operam hoje:
  1. **IA plena** — escuta shadow da chamada atendida (SIPREC) + digitação do TARM;
     transcrição, extração clínica e sugestão Manchester em tempo real.
  2. **IA sobre digitação** — sem escuta. O TARM segue o fluxo habitual das CRUs:
     digita em paralelo ao atendimento telefônico, como já faz no sistema próprio da
     central. A IA faz o **mesmo** rankeamento e chaveamento de quadros/prioridades a
     partir do texto digitado — mesma extração, outra fonte de entrada. É o fallback
     natural do item acima e o caminho de menor atrito para pilotar **antes** do plug
     SIPREC: nenhuma mudança no hábito do operador, nenhum toque na telefonia.
  3. **Manual total** — kill switch integral, com janela sem IA marcada e auditada
     (já implementado na demo).
  **Regra:** desligar a escuta **nunca** pode degradar o atendimento abaixo do que a
  central já faz sem nós — o modo 2 é a prova operacional disso, e é requisito de
  convivência com os softwares de regulação em uso nas CRUs (parâmetros do fluxo de
  digitação em levantamento — `docs/22`).
- **Plano B de vendor:** abstrair o provider atrás de uma interface (`TranscriptProvider`) para poder trocar por Google Speech v2 ou Whisper streaming self-hosted (GPU) se contrato público exigir dado 100% on-prem.
- **LGPD:** áudio é dado sensível. Gravação cifrada em repouso, retenção por política contratual, transcrição com PII minimizada no log.

## 3. Plug com o PABX das CRUs — como se faz na prática

As CRUs brasileiras rodam majoritariamente Asterisk/Issabel, Khomp ou PABX legado TDM. Três caminhos, do mais comum ao mais limpo:

1. **SIPREC (RFC 7865/7866)** — o padrão correto. O SBC/PABX espelha a mídia da chamada para o nosso Session Recording Server. Não toca no fluxo da chamada (zero risco de derrubar o 192). Asterisk moderno e SBCs comerciais (AudioCodes, Oracle, Sangoma) suportam.
2. **Fork de mídia no Asterisk** (`MixMonitor`/ARI + externalMedia) — quando a CRU roda Asterisk e dá acesso ao dialplan. Mais barato, exige janela de manutenção e homologação local.
3. **Gateway físico em paralelo** (tap E1/SIP) — para PABX TDM legado que ninguém quer tocar. Hardware Khomp/AudioCodes tapeando o tronco. Último recurso, mas destrava licitações com infra antiga.

**Recomendação de produto:** padronizar a oferta em **SIPREC-first**, com o item 2 como alternativa homologada e o item 3 como serviço de implantação. No diagnóstico de implantação (já citado na LP/FAQ), a primeira pergunta técnica é "qual o PABX e quem o mantém".

Importante: o CoPilot **não substitui** a telefonia da CRU na fase 1 — ele escuta. Isso reduz o risco percebido pelo gestor e elimina objeção de "e se o sistema de vocês cair?".

## 4. Tela de viatura — redesenho IMPLEMENTADO (jun/2026)

> O layout abaixo está em produção na demo: rota 60% + ETA gigante, painel do paciente 40% com badge Manchester, e barra de missão com 4 botões de status de 1 toque (alvos ≥60px). Briefing TTS e deep link de navegação seguem como evolução de produto.

### Proposta original

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

## 5. Live view — DESCARTADO (decisão Victor, jun/2026)

Decisão de produto: live view **não entra**. Traria carga e complexidade à operação sem necessidade — a regulação permanece dentro da CRU, e as equipes de viatura, que sabem o que fazer em cena, **ligam para a CRU** quando precisam de consulta ou apoio médico adicional.

Reflexo no produto: o placeholder de câmera foi removido da tela de viatura e substituído por uma ação única e real — **"Falar com a CRU · Apoio Médico"**. Os botões sem função do menu da viatura (pânico, navegação solta, walkie-talkie) também foram removidos.

## 6. Tablet por viatura + Starlink — minha leitura

**Tablet: sim, sem hesitação.** Android robusto (Samsung Tab Active ou Zebra), suporte veicular com carga, modo quiosque (MDM) rodando só o CoPilot. O tablet é o que transforma a viatura de ponto cego em nó de dados: status de 1 toque, GPS contínuo, handoff digital, foto de documento/cena.

**Starlink: sim nas CRUs, seletivo nas viaturas.**

- **CRU com Starlink = redundância de uplink** (failover do link terrestre). Central 192 sem internet é central parada; um Flat High Performance por CRU é barato perto do custo de uma hora de central offline. Recomendo como **padrão de contrato**.
- **Viatura com Starlink Mini = depende do território.** Em cidade com 4G decente, um roteador dual-SIM (duas operadoras) custa uma fração e resolve 95%. Starlink Mini embarcado brilha no **interior/área rural/estrada** — exatamente onde consórcios intermunicipais (CISNORPI-like) operam. Proposta: **conectividade em camadas** — 4G dual-SIM como base em todas, Starlink Mini nas viaturas de cobertura rural/longa distância.
- O app do tablet precisa de **offline-first** de qualquer forma (fila local com sync) — túnel, garagem e sombra de sinal existem mesmo com Starlink. Isso é requisito de software, não de antena.

Resumo do custo-sentido: Starlink em 100% das CRUs, Starlink Mini em ~20–30% da frota (rural), dual-SIM em 100% da frota, offline-first no app sempre.

## 7. Multi-tenancy e perfis — alinhado ao PEP

> **Status (jun/2026):** o perfil **Gestor** já existe na demo — seletor de perfil no login (padrão tenants do PEP demo), painel de gestão com frota (status editável + manutenção programável), equipe/escala (turno e status editáveis) e KPIs vivos derivados do estado. O fluxo de operação atual ficou intacto. O modelo abaixo é a versão de produção (backend).

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

## 8. Decisões adicionais (jun/2026)

- **LP sem formulário e não pública** — será sempre apresentada diretamente a entes públicos; CTAs apontam para a demo ao vivo.
- **Escala por login (esquema PEP):** módulo "Minha Escala" na demo — cada matrícula vê a semana designada a ela; trocas passam pela coordenação/Gestor.
- **IA explicável no TARM:** card de risco mostra os fatores que pesaram (sintomas + agravantes com pesos) e o lembrete de autoridade do Regulador.
- **Fila de espera viva** na demo (tempos reais, entrada/saída de chamadas).
- **Google Maps:** demo roda keyless; chave restrita de prototipagem é criada pelo Victor no Google Cloud (instruções na conversa) e entra como `VITE_GOOGLE_MAPS_API_KEY` no Vercel.

## 8b. Riscos abertos (sem mudança desde o último review)

1. Backend inexistente — bloqueia tenants, auth real, persistência e o lastro dos claims LGPD. **Decisão 4.1 (Supabase × alternativas) é o gargalo de tudo da seção 7.**
2. IA mockada — a recomendação da seção 2 destrava o plano real.
3. `App.tsx` monolítico (1.9k linhas) — modularização (Sprint 5) antes de crescer mais.
4. Sem testes — qualquer refactor grande (como o desta rodada) depende de QA visual manual.
