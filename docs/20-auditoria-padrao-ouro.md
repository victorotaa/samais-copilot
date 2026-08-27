# Auditoria padrão-ouro da demo — defeitos, cenários de estresse e expansão guiada pelo OS

> Rodada de 23/08/2026, a pedido do Ota: *"a demo deve ser nosso padrão ouro e devemos
> detectar múltiplos cenários, antecipando situações de estresse do lado de atendimento
> e atendente que são comuns e que também podem surgir de nossas soluções."*
>
> Método: leitura de código + bateria Playwright nos 4 papéis (1440/768/390, temas claro
> e escuro, medição elementwise) + garimpo sistemático do Samais-OS (repo privado) por
> aprendizados de estudo e operação aplicáveis ao produto. Todos os defeitos abaixo foram
> **reproduzidos antes** e **verificados depois** da correção.

---

## 1. Defeitos encontrados e CORRIGIDOS nesta rodada

| # | Defeito | Gravidade | Correção |
|---|---|---|---|
| G1 | **O médico não tinha instrumento para decidir**: nenhum controle para mudar a classificação — só aceitar a sugestão da IA ou despachar | **Doutrinária** | Bloco "Classificação de risco — decisão do regulador": 5 cores Manchester, sugestão marcada, escolha explícita auditada (`RISCO_CLASSIFICADO`) |
| G2 | **`risco_final` virava YELLOW por default silencioso** ao despachar com risco pendente — o sistema inventava classificação e persistia | **Doutrinária** | Despacho **bloqueado** sem classificação; grava a escolha do médico, nunca default. Dica em tela diz o que falta |
| G2b | **Divergência sem justificativa obrigatória** — o campo existia mas era opcional, e só para viatura | Alta | Risco divergente ⇒ justificativa **obrigatória** (gate do despacho); gravada em `divergencia_justificativa` e na auditoria com sugestão × decisão |
| G3 | **Botões T sem trava**: pulo T1→T4 aceito (T2/T3 nulos), regressão e **re-toque sobrescreviam timestamp em silêncio** — num produto de tempo probatório | Alta | Só o **próximo** passo é acionável; marca feita é **imutável** e mostra o horário no botão; pular exige 2 toques ("PULAR ATÉ AQUI?", desarma em 4s) e registra `MISSAO_SALTO_CONFIRMADO` com a lista do que ficou sem marca |
| G4 | Copy **"Designação automática … o sistema aciona"** afirmava piloto | Alta (SEC-20) | "Recomendação de despacho: o sistema sugere; a decisão e o acionamento são da regulação" |
| G5 | **A faixa do dock engolia cliques** nos últimos 48px do desktop (provado: "Confirmar AML" com a metade de baixo morta) | Alta | Invólucro `pointer-events-none`; só a faixa fina de hover, a área de toque mobile e a nav recebem eventos. Clique real verificado |
| G13 | **Kill switch cosmético**: desligar a IA não cancelava os timers — a "transcrição" continuava chegando com a IA desligada | **Doutrinária** | Timers registrados e **cancelados de fato**; congela com marca visível ("— transcrição interrompida às HH:MM:SS —"), audita a **janela sem IA** (`IA_DESLIGADA`/`IA_RELIGADA`) e retoma com marca ao religar — o modo degradado do parecer (docs/17 §A.2.6) demonstrado na demo |
| G14 | **Chamada sem extração conclusiva TRAVAVA o TARM** — os dois botões de handoff exigem risco definido; trote/engano/queda não tinham saída | Alta | Botão terciário sempre habilitado: "Encerrar sem regulação · trote / engano / queda", auditado (`CHAMADA_ENCERRADA_SEM_REGULACAO`). Quem decide que é trote é o operador; o sistema só registra |
| G6 | **Header colidia em 640–1024px**: pílula absoluta × relógio × subtítulo empilhados (visto a 768) | Média | Pílula entra no fluxo abaixo de `lg`; relógio some abaixo de `lg`; espaçamentos comprimidos abaixo de `sm`. Interseção zero verificada a 390 e 768 |
| G7 | **Mapa quebrado sem rede/sem chave**: ícone de imagem quebrada ocupando meia tela | Média | `MapaEsquematico` local (SVG, tokens do tema, selo "mapa esquemático · demonstração") em modo demo — zero iframe, zero rede. Com backend, embed como antes |
| G8 | Overflow horizontal a 390px (header, cartão de recomendação, chips) | Média | Medição elementwise **zerada** em TARM/REGULADOR/GESTOR a 390 |
| G9 | Viatura em prontidão exibia **"EM CHAMADA"** | Baixa | Pílula "PRONTIDÃO" (sem vermelho) quando não há ocorrência |
| G10 | Login demo de **Médico aterrissava no IDLE** (o papel promete regulação) | Baixa | Entra direto na regulação com handoff pronto, como no login real |
| G11 | "Equipe em Plantão **0**/8" — o seed dava FOLGA geral no fim de semana (SAMU é 24/7) | Baixa | Escala 12×36: metade da equipe operacional por dia, fim de semana incluído |
| G12 | `ERR_CONNECTION_RESET` no console em demo puro | Baixa | Era o iframe do mapa tentando rede — resolvido por G7; demo pura agora não toca a rede |

### 1a. Prints de produção no celular (Ota, 24/08) — 3 defeitos de view corrigidos

- **P1 · Realce por substring**: "dor" acendia dentro de "regula**dor**" no chat (e
  "braço" acenderia dentro de "abraço"). Causa: regex de keywords sem fronteira de
  palavra — e `\b` do JavaScript falha com acento, então a correção usa lookaround
  Unicode (`\p{L}`). Verificado: "regulador" íntegro, "dor no peito" e "braço"
  continuam acendendo como palavras inteiras.
- **P2 · Viatura mobile: ETA sobre o botão de navegação**: os dois viviam no topo do
  mapa (`top-4` esquerda/direita) e a 390px se sobrepunham. O botão desceu ao pé do
  mapa no mobile (`bottom-12`, livre do selo de demonstração); no desktop segue no topo.
- **P3 · Cronômetro discreto demais no celular**: o chip do cabeçalho do chat rola
  para fora da tela. Agora o **tempo vive também na pílula do header**, que ficou
  **sticky no mobile** — sempre à vista, com a cor do estado (neutro → âmbar → vermelho);
  em tela ≤430px o tempo substitui o rótulo "EM CHAMADA" para não estourar. E o toast
  do ATENDER anuncia "cronômetro da etapa iniciado (meta 1 min)" — o pop-up pedido,
  sem modal no meio do atendimento (fadiga de alarme, §3).

### 1b. Rodada fidelidade shadow (Ota, 24/08 — pós-#38)

- **F1 · Gate de AML removido**: "Confirmar AML & Iniciar Triagem" encenava um passo
  que o produto não tem — em shadow a triagem abre no atendimento. A localização
  virou painel dentro da triagem (auto-preenchida, editável, com "Confirmar
  localização" opcional e auditado). O cenário sem-AML abre o painel em "colher por
  voz", com a triagem já rodando.
- **F2 · Semântica do atender**: o botão dizia "ATENDER" — mas nós nunca atendemos.
  Virou "Simular atendimento na central" (com "Dispensar · demo"), e a nota do
  overlay explica que no produto a triagem abre sozinha. A fila ganhou "sinalização
  colhida · leitura passiva".
- **F3 · Encerramento tipificado + queda com contexto**: o motivo virou escolha
  explícita (trote · engano · queda — taxonomia e-SUS, saiu do backlog). Queda
  preserva o rascunho na espera ("ocorrência em aberto"), com retomar/arquivar
  auditados — e o **mesmo número religando reassocia automaticamente** (o
  complemento dos sistemas reais, vivo na demo).
- **F4 · Botão de despacho truncava a viatura** (print do Ota): "CONFIRMAR DESPACHO ·
  USA-…" com reticências num CTA de despacho é inaceitável — o código da viatura
  agora quebra linha e fica sempre integral.
- **F5 · Header fixo era grosseiro** (feedback do Ota): o header voltou a rolar; um
  mini-chip flutuante do cronômetro aparece no canto quando o header sai da tela,
  só em chamada.
- **F6 · Desfecho com o nome certo**: "Desfecho operacional · 1 toque libera a
  viatura — a conclusão clínica é da regulação".

## 2. Cenários de estresse — implementados na demo

O princípio: a demo mostra o produto **sob o pior dia**, não só o roteiro feliz — e o
estresse que as nossas próprias soluções criam (IA cai, IA erra, operador diverge)
aparece com o mesmo destaque que o estresse da rua.

| Cenário | Onde | O que demonstra |
|---|---|---|
| **Queda/desligamento da IA no meio da chamada** | kill switch do TARM | Transcrição congela com marca visível e horário; campos seguem manuais; janela sem IA auditada; retomada marcada. É a especificação do modo degradado do parecer, viva |
| **Trote** | roteiro novo no sorteio + botão de encerramento | Chamada sem extração conclusiva; encerramento sem regulação, auditado. Detecção **não** é automática — decide o operador |
| **Chamada sem localização automática** | chamador novo (linha fixa/VoIP, `aml: null`) | Banner "colete o endereço por voz", triagem **não bloqueia** ("Iniciar Triagem — endereço por voz"), sem mapa fantasma |
| **Divergência clínica** | REGULADOR | O médico discorda da IA → justificativa obrigatória → vira dado de treino e auditoria |
| **Toque errado com luva** | barra T da viatura | Passo fora de ordem arma confirmação em vez de executar; marca não se sobrescreve |

**Kill switch não é binário (nota do Ota, 24/08):** entre a IA plena e o manual total
existe o modo **IA sobre digitação** — sem escuta, o TARM digita em paralelo ao telefone
como já faz no software próprio da CRU, e a IA faz o mesmo rankeamento e chaveamento de
quadros a partir do texto digitado. Desligar a escuta nunca degrada o fluxo abaixo do
que a central já opera sem nós. Registro doutrinário em `docs/05` §2; benchmark dos
softwares em uso nas centrais e do fluxo de digitação do TARM em `docs/21`.
✅ **Demonstrável desde 24/08**: seletor Escuta · Digitação · Manual no cabeçalho da
transcrição — em Digitação o TARM digita e a classificação reage ao texto (extração
determinística rotulada como simulação; sem sinal → pendente). Bateria própria no CI.

### 2a. Variabilidade de cenários — seletor de demonstração (24/08)

A tela de espera ganhou o painel **"Demonstração · próxima chamada"**: o apresentador
dirige o cenário da chamada seguinte, ou deixa em **Aleatório** — que usa bolsa
embaralhada (todos os cenários saem antes de qualquer um repetir; o sorteio antigo podia
repetir o mesmo roteiro três vezes seguidas). Cada cenário pareia roteiro e chamador
**coerentes** — o sorteio antigo combinava qualquer roteiro com qualquer telefone, e um
trote podia chegar de um número com cinco ocorrências de histórico.

| Cenário | Classificação | Chamador (anti-trote) | O que demonstra |
|---|---|---|---|
| IAM | VERMELHO | Esposa, cadastro com histórico | Fluxo completo feliz, USA |
| Trauma (auto × moto) | AMARELO | Terceiro no local, sem cadastro | Vítima desconhecida, via pública |
| OVACE (lactente) | VERMELHO → AMARELO | Mãe, sem cadastro | Instrução pré-chegada guiada e **reclassificação na própria chamada** após reversão |
| AVC | LARANJA | Filho, 2 ocorrências anteriores | Cor Manchester intermediária; janela terapêutica com hora de início registrada |
| Obstétrico (parto iminente) | LARANJA | Marido, sem cadastro | Protocolo obstétrico; orientação pré-chegada |
| Verde — orientação | VERDE | O próprio paciente, 5 ocorrências | Encaminhamento à UBS **sem despacho** — a frota protegida do acionamento desnecessário |
| Trote | sem extração | Sem cadastro | Nenhuma classificação automática; encerramento sem regulação, auditado |
| Sem localização (AML) | VERMELHO (IAM) | Linha fixa, sem AML | Coleta de endereço por voz; a triagem **não bloqueia** |

Nota de fidelidade: a paleta Manchester completa (RED/ORANGE/YELLOW/GREEN/BLUE) agora
vem de um mapa único de estilo (`RISCO_UI`) — antes, LARANJA caía no estilo de "não-RED"
e renderizava como se fosse verde/amarelo em três superfícies (painel do TARM, chips do
REGULADOR, banner da viatura).

**Backlog de cenários (dependem da F1/modularização — registrar, não improvisar):**
fila multi-ocorrência com vermelho furando a fila e 2ª chamada em espera no TARM ·
viatura offline com fila local e sincronização ao reconectar (padrão local-first já
provado no OS em `ferramentas/despesas` — IndexedDB + consolidação) · queda de rede da
central com degradação a papel/rádio treinada · sobrecarga do REGULADOR (mais casos que
capacidade, envelhecimento visível da fila) · chamada muda/silenciosa (protocolo de
confirmação) · solicitante agressivo/em pânico com TARM mantendo o protocolo ·
**tipificação do encerramento** pela taxonomia dos sistemas reais (trote / engano /
queda / desistência / orientação como tipos distintos — no e-SUS SAMU trote e engano
encerram automaticamente; `docs/21` §2.2a) · **painel de últimas ligações 24h** por
telefone/bairro/endereço com mecanismo de **complemento** em vez de nova ocorrência
(anti-duplicidade presente nos dois sistemas com manual público; `docs/21` §2.4).

## 3. Recomendações de visual e usabilidade (Samais-OS + bom senso de regulação)

Aplicadas nesta rodada: timestamps **nos próprios botões** T (o tablet vira registro
legível); estados de bloqueio **explicando o que falta** (nunca botão morto sem
explicação); rótulos Manchester em PT nas superfícies (código só em dado); alvos ≥46px
nos controles novos; mapa local com selo de demonstração (procedência visual); seletor
de cenário no IDLE como **ferramenta de apresentação** (§2a) — quem demonstra dirige a
próxima chamada em vez de torcer pelo sorteio; **cronômetro de etapa com meta** (pedido
do Ota, 24/08) — nasce no ATENDER (nunca antes — shadow), neutro dentro da meta, âmbar
acima dela, vermelho no teto, no TARM e na regulação (desde o handoff). É o padrão vivo
dos sistemas reais: o MV-PR alterna a cor do contador e avisa "tempo médio de
atendimento foi excedido" (`docs/21` §2.2b). ⚠️ Procedência declarada no próprio chip
(tooltip): **o limiar é parâmetro da central, não constante nacional** — a demo usa
1/3 min do protocolo local de Fortaleza (`docs/21` §3.3); em produto, config por tenant.

Recomendadas para as próximas rodadas, em ordem de valor:

1. **Procedência por KPI no painel do gestor** (✅ medido · ⚠️ estimado · ○ sem dado) e
   marca-d'água persistente no modo demonstração — Princípio da Realidade na tela;
   lacuna declarada nunca vira zero. É a regra nº 1 do garimpo do OS e a mais barata.
2. **Uma tela = uma decisão.** O REGULADOR decide em uma tela sem rolar (a 1440 já
   quase; consolidar quando a fila multi-caso chegar). O TARM opera **sem mouse**:
   atalhos de teclado (atender, classificar, handoff) — TARM de verdade não larga o
   teclado.
3. **Som com reconhecimento**: alerta sonoro novo exige *acknowledge* (toque/tecla) —
   alarme que ninguém confirma vira ruído de fundo em central (fadiga de alarme).
4. **Renomear "ociosidade" para "Reserva operacional disponível"** com a faixa saudável
   (15–25%) marcada — o mesmo número enquadrado como retaguarda, não como gordura
   (benchmark do OS; evita convite ao corte de frota na renovação).
5. **Lint de vocabulário vetado** nas superfícies (`lucro`, `margem`, `ROI`, `economia
   gerada`…) — doutrina de precificação como teste automatizado quando o CI nascer.
6. **Tema escuro como padrão operacional** (plantão noturno) — já é; manter o claro
   para sala iluminada de gestão. Contraste AA nos chips `/70` do tema claro a conferir
   na rodada WCAG (D-07).

## 4. Garimpo do Samais-OS — aprendizados que viram produto

Fonte: varredura do repo privado (CLAUDE.md/regras do CEO e do Ota, frentes, roteiro de
implantação, questionário de briefing, obrigações, benchmarks). Os 12 achados, condensados
— cada um com a funcionalidade que financia:

1. **Viatura-hora da transferência inter-hospitalar** (regra do CEO, ago/2026; frentes
   Osasco/Taboão/Belém): o número que decide dimensionamento não existe em fonte pública
   — e o produto está a **dois campos** de medi-lo ao vivo: `ocorrencias.tipo`
   (primária × secundária) e `despachos.t5_disponivel` (retorno à base — o ciclo hoje
   morre em T4 e subestima a ocupação). Painel **Frota-hora**: viatura-hora/mês,
   viaturas equivalentes (÷730), % da frota-hora com motolância fora do denominador e
   teto físico ~60% sinalizado como achado. Na superfície do contratante vão **horas e
   equivalentes, nunca R$**.
2. **FC implícito medido** (lição Manaus 379÷151=2,51; Taboão 148 vs 80): KPI Cobertura
   de escala — postos exigidos × escalados, postos descobertos nas próximas 72h. O
   achado comercial mais forte da casa, calculado continuamente em vez de à mão.
3. **Ficha da Operação**: o produto responde sozinho ~10 das 40 perguntas do briefing
   (série de atendimentos, tempo-resposta mediano por prioridade, transferências, frota
   operante, absenteísmo…) com `estado` explícito (`respondido`/`nao-existe`/`a-levantar`).
   Renovação e expansão param de rodar com premissa. Falta um campo: `ocorrencias.natureza`
   (clínica/trauma/obstétrica/psiquiátrica) — gravidade não é natureza.
4. **Metas Contratuais com metodologia declarada**: glosa se perde por ausência de método
   de apuração, não por desempenho (red flag do checklist de licitação). Cada meta:
   indicador, alvo, fonte do dado (tabela do próprio CoPilot), quem apura, frequência.
5. **Procedência por KPI** (item 1 das recomendações acima).
6. **Absenteísmo medido** (`escalas.status` já tem FÉRIAS/ATESTADO): o número que entra
   como premissa no estudo e sai como meta com glosa — dos dois lados hoje é chute.
7. **Jornada: alerta ANTES da violação** (regra de 20/08 — medir sem custear é documentar
   passivo): o planner valida >44h/semana, interjornada <11h e mostra a folga do pool
   **no agendamento**; painel de horas é interno (GESTOR/ADMIN), nunca superfície do
   contratante; hora estourada alimenta provisão declarada.
8. **Causa da viatura parada** (`viaturas.motivo` + timestamps): a frota é do ente (regra
   R1) e chega sucateada — sem causa registrada, toda indisponibilidade é imputada à
   contratada na glosa. Disponibilidade segmentada por parte imputável.
9. **NEP como turno** (`CAPACITACAO` no enum de escalas — lição Canoas: 1.850h/mês que
   quase ficaram fora do estudo): horas exigidas × realizadas, conflito com plantão
   sinalizado antes de agendar.
10. **Obrigações da operação no painel** (alvará das bases, CNES, relatório semestral da
    PT 1.010 — que o produto já emite sem saber que tem prazo): criticidade **derivada da
    data**, padrão provado no OS.
11. **Carga da central** (achado Manaus: 14 pessoas para 2 mi hab — "o elo mais fraco, e
    é onde o CoPilot entra"): chamadas atendidas/hora, posições simultâneas, tempo de
    regulação; abandono e tempo de atendimento entram como **○ sem dado** com a
    dependência declarada ("requer sinalização SIPREC"), nunca número de demo.
12. **Aba Sustentação**: o CoPilot é linha nomeada de 5,0% no BDI decomposto e a doutrina
    exige linha **verificável** ("diluído ≠ não-identificável"): disponibilidade do mês,
    versões entregues, chamados, horas de treinamento — a rubrica de sustentação com
    comprovação, que protege a renovação.

**Consequência de schema (migration `0003`+, junto com `desfecho`):** `ocorrencias.tipo`,
`ocorrencias.natureza`, `despachos.t5_disponivel`, `viaturas.motivo` + par de timestamps
de parada, turno `CAPACITACAO`. São cinco campos que transformam o registro operacional
que o produto já faz nos cinco painéis que nenhum concorrente tem como sustentar — porque
nascem da doutrina de quem opera.

## 5. Verificação desta rodada

**As baterias viraram CI (24/08):** `tests/` guarda o lint de vocabulário vetado
(fronteira Unicode — "invólucro" não acusa "lucro") e as três baterias e2e
(cenários · cronômetro · mobile), e `.github/workflows/ci.yml` roda typecheck,
build, lint e as baterias em Chromium a cada push/PR, com capturas como artefato.
Antes disso toda verificação vivia na sessão de quem auditava e morria com ela —
agora cada afirmação deste documento é re-provada a cada commit. Local:
`npm test` (dev server em :3000; `PW_CHROMIUM` aponta o binário se necessário).

- `npx tsc --noEmit` e `npm run build` verdes.
- Bateria v2 (Playwright/Chromium): médico aterrissa na regulação · 5 chips · despacho
  bloqueado→liberado→bloqueado por divergência→liberado por justificativa · viatura arma
  e desarma o salto, marca imutável com horário, salto confirmado audita · kill switch
  congela (zero mensagem com IA off, medido por 6,5s), marca e retoma · gestor com mapa
  esquemático (zero iframe), plantão 3/8 · header 768 sem interseção · **overflow
  elementwise zero** a 390 nos três módulos·
- Console limpo em demo puro (a única requisição era o mapa — eliminada).

## Registro

Produzido em 23/08/2026. Pareia com `docs/17`–`docs/19` (ciclo do parecer), `docs/10`
(matriz real×mock — regra de fidelidade shadow) e `docs/02` (backlog — os painéis do §4
entram como épico F1). O garimpo do OS citou arquivos do repositório privado `samais-os`;
os trechos aqui são resumo — a fonte fica lá, onde é confidencial.
