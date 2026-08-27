# 26 — Auditoria de seis visões (socorrista · médico · TARM · gestor+ente · designer · dev)

> Pedido do Ota (27/08): auditar o produto vestindo cada bata — o que cada
> persona precisa que a lente normativa (SUS/portarias) não enxerga. Cada achado
> tem **estado**: ✅ implementado agora · 📋 backlog priorizado · 🔮 futuro ·
> ⛔ dispensado (decisão registrada). A primeira leva implementada nasceu desta
> auditoria: cenário PCR/T-CPR, relógio de janela clínica e instruções
> pré-chegada por protocolo.

## 1. Médico (regulador)

| # | Achado | Estado |
|---|---|---|
| M-1 | **PCR com RCP guiada por telefone (T-CPR)** — o caso da regulação estava fora dos roteiros. Operador guia compressões pela linha da CENTRAL (shadow); o CoPilot mostra o protocolo e **carimba o tempo até a 1ª compressão** (indicador de sobrevida, AHA). | ✅ roteiro 8 + marco `rcp_iniciada` + chip nas 3 telas (cenário T16, docs/23) |
| M-2 | **Relógio de JANELA CLÍNICA** — o tempo do paciente, não o da nossa etapa: decorrido desde o início dos sintomas relatado ("faz vinte minutos" → carimbo), contra a janela do protocolo (AVC 4h30). Decide destino. | ✅ campo `inicioSintomasMinutos` + chip `JANELA hh mm` (TARM/regulação/viatura) |
| M-3 | **Instruções pré-chegada por protocolo** — instrução de IAM lida numa parada é erro clínico; o conjunto agora segue o protocolo em foco (PCR ≠ AVC ≠ clínico geral). | ✅ mapa `INSTRUCOES_PRE_CHEGADA` |
| M-4 | **Alergias na extração** — campo obrigatório de avaliação; chip vermelho na viatura. | 📋 |
| M-5 | **Pediátrico destacado** — idade pediátrica acende peso estimado por idade (referência de dose/material). | 📋 |
| M-6 | **Desfechos do plantão** — "minhas regulações · desfechos": o loop de aprendizado clínico e de retreino (docs/23 M8). | 🔮 (depende de persistência ponta a ponta em volume) |
| M-7 | Discriminadores Manchester reais por queixa (o checklist atual é ilustrativo — rotulado). | 🔮 (biblioteca por protocolo; validação clínica) |

## 2. Socorrista (equipe embarcada)

| # | Achado | Estado |
|---|---|---|
| S-1 | **Painel Cena & Acesso** — segurança da cena antes do paciente: riscos (violência, animal, via), apoio acionado (PM/bombeiros), acesso (andar/elevador/referência), mobilidade/peso do paciente. Decide o que desce da viatura. | 📋 (próxima leva) |
| S-2 | **Cancelamento/atualização EM ROTA** — ocorrência cancelada chega visual, com "ciente" de 1 toque. | 📋 |
| S-3 | **Destino com o porquê** ao marcar TRANSPORTANDO (hospital + pré-notificação) — já lacuna 4.8 do docs/10; a bata de campo sobe a prioridade. | 📋/F3 |
| S-4 | Registro clínico embarcado (sinais vitais, evolução) **não entra** — é PEP-OS; a viatura segue display-first (docs/05 §4). | ⛔ fronteira mantida |

## 3. TARM

| # | Achado | Estado |
|---|---|---|
| T-1 | **Telefone de retorno como ação explícita** — o protocolo real sempre confirma; nossa reassociação pós-queda depende dele. | 📋 (barato; amarra mecanismo existente) |
| T-2 | **Protocolo de interrogatório guiado** — checklist de perguntas obrigatórias que se marca sozinho conforme a extração preenche e aponta a próxima; instrumento de treino NEP. | 📋 |
| T-3 | **"O que falta" antes do handoff** — pendências (endereço sem número, idade) como chips na triagem. | 📋 |
| T-4 | **Histórico do número em 1 toque** — abre as ocorrências do telefone (rechamada/cobrança — docs/23 T6). | 📋 (já em backlog; prioridade confirmada) |
| T-5 | **Atalhos de teclado** (handoff, encerrar, modos) — TARM opera de headset e teclado; segundos são o produto. | 📋 |

## 4. Gestor (operações Samais) + acesso do ENTE

| # | Achado | Estado |
|---|---|---|
| G-1 | **O relatório é o CONTRATO**: meta contratual × realizado × método declarado (tempo-resposta por prioridade, atendimento ≤ N s, abandono, **viatura-hora disponível × contratada** — a régua da casa, hora e não evento). Preenche o cabeçalho 1.010/2012 que já existe na impressão. | 📋 topo do épico F1 (docs/10 §4.10) |
| G-2 | **Gestão por exceção** — painel "o que exige ação hoje": escala furada, viatura parada há N dias, meta estourando, fila acumulando. | 📋 |
| G-3 | **Período fechado e comparável** (mês × anterior × meta) — o date picker decorativo vira funcional ou sai. | 📋 |
| G-4 | **Procedência em cada número** (real × demonstração × período/método) — SEC-20 aplicado à gestão; o que sobrevive a controle externo. | 📋 |
| G-5 | **Papel ENTE (secretário/prefeito/assessor)** — transparência por construção: read-only, agregado, **sem PII por construção** (eventos anonimizados: nº, prioridade, T0–T4, desfecho operacional, região — nunca nome/telefone/endereço exato/transcrição; escala nominal da equipe também não). Uma tela de celular: os números do contrato com semáforo. Regra de ouro: o gestor Samais vê o MESMO painel e recebe o alerta ANTES. LGPD: o interesse legítimo do contratante são os indicadores; caso a caso é pedido formal com base legal, não um login. | 📋 (novo papel; RLS comporta — lacuna 4.13 do docs/10) |
| G-6 | Nada de custo/finança nesta superfície — a camada econômica vive no Samais-OS interno. | ⛔ fronteira mantida |

## 5. Designer

| # | Achado | Estado |
|---|---|---|
| D-1 | **Passe de legibilidade operacional** — dado primário hoje em 0.55–0.65rem mono uppercase: piso de tamanho + contraste AA (teste dos 3 segundos: risco, tempo, endereço a 2 metros). | 📋 |
| D-2 | **Pulso com propósito** — reservar `animate-pulse` ao que exige ação agora (teto excedido, vermelho); aquietar GPS/chips decorativos. + `prefers-reduced-motion`. | 📋 |
| D-3 | **Degradação desenhada** — estados de erro por módulo ("backend caiu, operando local, nada se perdeu"), não só toast. | 📋 |
| D-4 | **Acessibilidade de edital** — `user-scalable=no` (WCAG 1.4.4), focus trap em modais, cor+palavra em todo estado (regra do RISCO_LABEL estendida). | 📋 (Sprint 7.4) |
| D-5 | Modo madrugada (ajuste noturno automático). | ⛔ **dispensado pelo Ota (27/08)** |

## 6. Dev

| # | Achado | Estado |
|---|---|---|
| V-1 | **TS `strict` incremental AGORA** — a Fase 1 criou os contratos; ligar strict ficou barato e trava regressão na fronteira. Antes da Fase 2. | 📋 (1º da fila técnica) |
| V-2 | **Erro silencioso** — writes Supabase `.then()` sem catch: wrapper de mutação com retry + aviso; `ErrorBoundary` por módulo (tela branca em plantão não existe). | 📋 (docs/10 §3.4–3.5, prioridade elevada) |
| V-3 | **Vitest na lógica pura recém-extraída** — `extrairDeTexto`, `RoteiroComoFonte` (cadências/dedup), `CronometroMeta`, `JanelaClinica`: os e2e provam a demo; o unitário prova o motor. | 📋 |
| V-4 | **Relógio sem re-render global** — `time` re-renderiza a árvore por segundo; isolar é o maior ganho por linha. Depois `manualChunks` (bundle 920 kB) e FleetMarkers. | 📋 |
| V-5 | **Chão de fábrica** — Node 22 no CI (aviso de depreciação do 20 já apareceu no runner), ESLint/Prettier antes do segundo dev, dependabot + actions pinadas (SEC-14). | 📋 |

## Ordem de ataque consolidada

1. ✅ **Feita nesta leva:** PCR/T-CPR + janela clínica + instruções por protocolo (M-1..3).
2. **Fundação técnica** (V-1, V-2): strict + mutações com catch/ErrorBoundary — antes da Fase 2.
3. **Corte contratual do gestor + papel ENTE** (G-1, G-4, G-5): o que se mostra ao comprador.
4. **Leva barata de operação** (T-1, T-3, S-1, M-4): retorno confirmado, pendências de handoff, Cena & Acesso, alergias.
5. **Passe de design** (D-1, D-2, D-3): legibilidade, pulso, degradação.

## Registro

- **Pedido:** Ota, 27/08/2026 — em quatro mensagens: visão de socorrista e médico
  ("além de especialista SUS"), depois designer e dev, depois gestor (reportando
  a secretário/prefeito/assessor, com possibilidade de acesso direto do ente) e
  TARM; **modo madrugada dispensado** na mesma rodada.
- **Execução da 1ª leva:** roteiro 8 (PCR), campos `marco`/`inicioSintomasMinutos`
  no `ExtratoFala` (o STT real entregará o mesmo shape), chips `ChipRcp`/
  `JanelaClinica` nas telas de triagem, regulação e viatura, e
  `INSTRUCOES_PRE_CHEGADA` por protocolo — com asserts novos na bateria de
  cenários.
- **Fontes:** docs/05 §2–4 · docs/09 §1 · docs/10 §3–4 · docs/20 §2/§4 ·
  docs/23 · docs/24 §8.
