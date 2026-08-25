# 23 — Cenários e possibilidades da operação em shadow (TARM e regulação)

> **Doutrina que abre este documento (Ota, 24/08/2026):** o panorama real das
> aplicações do programa só existirá **no Go Live** — o produto se desenvolve à
> medida que tecnologias e mercado se regulamentam e amadurecem. Até lá, o que se
> pode fazer é **antecipar todos os cenários** e antever os passos através do
> código. Este documento é esse exercício, sistemático: tudo o que pode acontecer
> numa linha que escutamos em shadow, o que o CoPilot enxerga em cada caso, como
> responde, e o que já é demonstrável hoje × o que fica registrado para o futuro.
> **AML é implementação futura** — adotamos quando regulamentação e infraestrutura
> das centrais amadurecerem; a demo antecipa o cenário rotulado como simulação.

## 1. Premissas — o que o shadow VÊ e o que NUNCA controla

**Fontes (docs/05 §3):** SIPREC (chamadas atendidas: áudio + metadados + início/fim
em tempo real) · eventos do PABX em modo leitura (fila, abandono, HangupCause —
quando a central expõe) · **a nossa própria base** (histórico por telefone,
ocorrências, endereços de atendimentos anteriores — fonte 100% shadow-compatível
que cresce a cada dia de operação).

**O que nunca fazemos:** atender, transferir, distribuir (ACD), discar, derrubar.
A UI corresponde à linha de voz — nunca a comanda. Toda sugestão é confirmável
pelo operador em um toque; ausência de fonte é lacuna declarada, nunca inventada.

**Estados possíveis de qualquer chamada, vistos do shadow:**
`aguardando (fonte 2)` → `atendida (fonte 1 abre)` → { `transferida ao médico` ·
`encerrada normal` · `encerrada anormal (queda)` · `abandonada antes de atender
(fonte 2)` } — e cada transição tem timestamp de sinalização, que é o que alimenta
os cronômetros de etapa e o T0.

## 2. Cenários — etapa do TARM

| # | Cenário | O que o shadow vê | Resposta do CoPilot | Estado |
|---|---|---|---|---|
| T1 | Chamada normal atendida | Sessão SIPREC abre; áudio flui | Triagem abre sozinha; transcrição + extração + sugestão Manchester; cronômetro da etapa | ✅ demonstrável (roteiro simulado) |
| T2 | Fila e abandono pré-atendimento | Só com eventos do PABX (fonte 2) | Painel de fila passivo com tempo de espera e abandono; sem a fonte, indisponibilidade declarada | ✅ UI · integração = Go Live |
| T3 | Trote / engano | Áudio sem quadro clínico | Nenhuma classificação automática; encerramento tipificado pelo operador, auditado | ✅ demonstrável |
| T4 | Queda de ligação | Fim de sessão anormal (HangupCause quando houver; senão inferência) | TARM tipifica em um toque; contexto preservado na espera; protocolo de retorno | ✅ demonstrável |
| T5 | Retorno após queda (mesmo número) | Nova chamada, telefone igual ao da ocorrência aberta | **Reassociação automática** — complementa, não duplica | ✅ demonstrável |
| T6 | Rechamada sobre ocorrência já despachada ("cadê a ambulância?") | Telefone com ocorrência ativa | Painel de últimas ligações 24h + tipo "cobrança"; a tela abre já no estado da ocorrência (viatura, ETA) | Backlog (docs/20 §2) |
| T7 | Segunda chamada da MESMA emergência por OUTRO número (transeunte) | Endereço/local coincidente | Anti-duplicidade por endereço — sugerir associação, decisão do TARM | Backlog (exige match de endereço) |
| T8 | Localização | **Hoje: voz é o padrão** — o TARM colhe o endereço falado; histórico da nossa base pode sugerir o último endereço conhecido do número | Painel editável não-bloqueante; sugestão por histórico com procedência | ✅ painel · sugestão por histórico = backlog curto |
| T8f | AML / localização automática | SMS/HTTPS do aparelho ao atender 192 | Painel auto-preenchido ±5m, confirmável | 🔮 **FUTURO** (regulamentação + infra da central; demo simula, rotulado) |
| T9 | Chamada muda / silenciosa | Áudio sem fala detectável | Protocolo local de confirmação; sinal "sem fala detectada" ao TARM | Futuro (depende de STT real medindo energia/fala) |
| T10 | Solicitante em pânico ou agressivo | Fala desorganizada, sobreposição | O TARM mantém o protocolo; a IA continua extraindo o que houver — sem sinal, PENDENTE | Catalogado (roteiro de treino NEP; extração robusta = evolução de modelo) |
| T11 | Múltiplas vítimas (AMV) | Termos de acidente de massa na fala | Marcar prioridade AMV (existe nos sistemas reais — MV usa AMUV) e alertar a regulação | Backlog (flag no extract + chip) |
| T12 | Idioma estrangeiro / forte sotaque | STT com baixa confiança | Confiança exibida cai; TARM digita (modo 2 já cobre) | ✅ modo digitação · tradução = futuro |
| T13 | Kill switch / modos de IA | — | Escuta · Digitação · Manual, janela auditada; gravação da central intocada | ✅ demonstrável |
| T14 | Central sem NENHUMA fonte de eventos | Só SIPREC | Fila indisponível declarada; todo o resto funciona | ✅ registrado (docs/05 §3) |
| T15 | Divergência entre o nosso registro e o do sistema da central | — | Conciliação por telefone+horário no relatório (nunca em tempo real — não tocamos o CAD da central) | Análise · Go Live |

## 3. Cenários — etapa da REGULAÇÃO MÉDICA

O médico também opera por voz — com o solicitante transferido, com a equipe na
cena, com hospitais. Em shadow, a linha dele é tão escutável quanto a do TARM.

| # | Cenário | O que o shadow vê | Resposta do CoPilot | Estado |
|---|---|---|---|---|
| M1 | Chamada transferida do TARM | A MESMA sessão de voz continua (transferência com a ligação junto — padrão dos sistemas reais, docs/21 §2.4) | Handoff digital com contexto + **transcrição contínua na tela do médico** (a conversa não recomeça do zero) | Handoff ✅ · transcrição contínua no médico = backlog curto |
| M2 | Orientação médica por telefone (caso verde, instrução pré-chegada) | Fala do médico na linha | Registro automático da orientação dada — lastro CFM da conduta (a gravação é obrigação da central; a transcrição é nosso índice dela) | Futuro (STT real) — doutrina registrada |
| M3 | Contato com a equipe na cena | Só se rádio/telefonia da frota passar por sistema gravado da central | Onde passar: mesma esteira; onde não: fora do shadow — lacuna declarada | Análise por central (diagnóstico docs/12) |
| M4 | Busca de vaga (ligações a hospitais) | Chamadas do médico/NIR na linha | Transcrição + carimbo de tempo = medir o **tempo-vaga** (dor real das centrais) sem digitação extra | Futuro forte (argumento de produto) |
| M5 | Divergência IA × médico | — | Classificação explícita, justificativa obrigatória, retreino | ✅ demonstrável |
| M6 | Sobrecarga da fila de regulação | Handoffs se acumulando | Fila multi-caso com envelhecimento visível e vermelho furando | F1 (modularização) |
| M7 | Médico pede retorno de ligação ao solicitante | Discagem é da CENTRAL; nós vemos a nova sessão | Nova chamada do mesmo número reassocia (T5) — o callback herda o contexto | ✅ mecanismo pronto (T5) |
| M8 | Conclusão clínica × desfecho operacional | — | Equipe marca o desfecho em um toque (libera viatura); conclusão é do médico | ✅ rotulado na demo |

## 4. O que esta análise devolve ao código (ordem de valor)

1. **Transcrição contínua na tela do médico** (M1) — a demo mostra o handoff, mas
   a conversa "morre" na transferência; no produto ela continua. Barato de
   demonstrar (o roteiro segue rodando na tela do REGULADOR).
2. **Endereço sugerido pelo histórico da base** (T8) — chamador recorrente recebe
   o último endereço conhecido como sugestão com procedência ("da ocorrência de
   12/08 — confirmar"). 100% shadow, 100% nosso, nenhum AML necessário.
3. **Rechamada/cobrança** (T6) e **anti-duplicidade por endereço** (T7) — já em
   backlog (docs/20 §2); esta análise os prioriza nessa ordem.
4. **Flag AMV** (T11) — chip + alerta; pequeno.
5. **Tempo-vaga** (M4) — registrar como argumento de produto para o Go Live
   (docs/01/09) — nasce da mesma esteira de transcrição, custo marginal.

## Registro

- **Pedido:** Ota, 24/08/2026 — "analise cenários e possibilidades, considerando
  que vamos operar em shadow mode da linha, seja para TARM, seja para médico" +
  decisão de que **AML é implementação futura** (produto evolui com regulamentação
  e mercado; panorama real no Go Live; até lá, antecipação de cenários via código).
- **Fontes:** docs/05 §3 (fontes de sinalização) · docs/09 §1 (fluxo e decisões de
  24/08) · docs/20 §2 (catálogo de estresse) · docs/21 (fluxos e mecanismos dos
  sistemas reais) · docs/22 (arco de demonstração).
- A demo rotula o AML como **"futuro (simulado)"** no painel de localização — a
  regra SEC-20 (claim mapeado a roadmap) aplicada à localização automática.
