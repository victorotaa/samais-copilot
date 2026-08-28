# 27 — Implantação gradual em contrato: a central opera, o CoPilot aprende

> **Doutrina que abre este documento (Ota, 28/08/2026):** na implantação dos
> contratos onde formos operar, **a central de regulação permanece atuando como
> sempre atuou, normalmente**. Gradativamente se fazem testes e se implementam os
> usos do CoPilot — e é exatamente esse período que ensina ao sistema a realidade
> local (**sotaques, gírias, vocabulário do território**) e permite treinar a IA
> corretamente nesse contexto, antes de qualquer tela influenciar decisão.
>
> **Relação com o `docs/12` §5 (não confundir):** aquilo é o programa de
> maturação do **produto** — F0–F3, executado uma vez, até a primeira CRU plena.
> **Este documento é o roteiro por contrato** — o que se repete em **cada**
> central nova, mesmo com o produto já maduro. O primeiro piloto executa os dois
> ao mesmo tempo; do segundo contrato em diante, só este.
>
> **Relação com o `docs/23`:** a doutrina de antecipação cobre o *antes* do
> contrato (antecipar cenários via código, rotulados). Este documento é o
> *depois da assinatura*: como o antecipado encontra a realidade — e aprende
> com ela.

## 1. A doutrina em três frases

1. **Dia 1 = zero mudança operacional.** O CoPilot não substitui tela, fluxo nem
   responsabilidade de ninguém. A central nem precisa saber operar nada novo para
   o contrato partir — a partida do serviço (frota, equipe, base) não depende do
   sistema, e o sistema não atrapalha a partida.
2. **Adoção por evidência, nunca por calendário.** Cada etapa só avança quando
   cumpre um critério **definido antes de a etapa começar** — régua definida
   depois do resultado é autoengano com método.
3. **O gradualismo é ativo, não é só prudência.** O período em que ninguém vê o
   sistema é o período em que o sistema **vê a central**: é ali que se coleta o
   sotaque real, a gíria real, o nome de bairro que não está em dicionário — e se
   adapta a IA a esse território. Shadow não é espera; é treino.

## 2. As quatro etapas por contrato (E0–E3)

Nomeadas E0–E3 para não colidir com as fases F0–F3 do produto (`docs/12` §5).

### E0 — Diagnóstico e fundação local (antes de ligar qualquer coisa)

- **Telefonia:** "qual é o PABX e quem o mantém" é a primeira pergunta técnica
  (`docs/12` §1.2). Caminho de espelhamento (SIPREC × fork × tap) conforme
  `docs/05` §3 — **com canais separados** (perna do TARM × perna do chamador):
  capturado por canal, saber quem falou vem de graça da telefonia, sem modelo de
  diarização. Eventos de fila em modo leitura, quando a central expuser.
- **LGPD:** base legal formalizada com o ente (controladora = secretaria de
  saúde; DPA; ver `docs/12` §1.2). A finalidade declarada inclui a **adaptação
  de modelos com dado anonimizado** — sem isso, a E1 não tem lastro jurídico.
- **Instalação:** servidor local e espelhamento em paralelo — nada toca o fluxo
  do 192 (postura shadow, `docs/05` §3).

**Gate E0:** espelho de áudio validado · canais separados confirmados (ou a
lacuna declarada — mono somado muda o plano da E1, não o esconde) · base legal
assinada · **zero impacto medido** na operação da central.

### E1 — Shadow silencioso (o sistema vê, ninguém vê o sistema)

O pipeline completo roda — transcrição → extração → sugestão — **sem nenhuma
superfície para a operação**. As saídas vão apenas para armazenamento interno de
medição. O que se constrói aqui:

- **Golden set local:** chamadas reais (ordem de centenas) com transcrição
  humana e quadro clínico validado pelo médico responsável técnico — a régua
  **congelada** deste contrato. É trabalho humano de semanas, e é o ativo que
  torna todo o resto medível.
- **Léxico local:** bairros, logradouros, apelidos de lugares, gírias e
  expressões regionais → vocabulário do reconhecedor e da extração.
- **Adaptação do modelo de transcrição** ao áudio real desta central (codec,
  ruído, sotaque). O modelo genérico entra na E1; **o modelo local sai dela**.
- **Medição contra o golden set:** erro de transcrição **por entidade crítica**
  (endereço, sintoma, número — nunca só a taxa geral), medido **no canal do
  chamador** (o difícil; o canal do TARM, de headset, é métrica separada);
  qualidade da extração; sensibilidade da sugestão de prioridade **com
  assimetria declarada** — caso vermelho não sinalizado pesa mais que qualquer
  outra métrica. Instrumento e critérios: o bake-off com áudio real de
  `docs/11` §1.3 e o backtest de `docs/12` §4.

**Gate E1:** métricas ≥ régua acordada com o médico responsável **antes** do
início da etapa.

### E2 — Piloto assistido (poucos veem, ninguém depende)

Um ou dois operadores **voluntários** por turno passam a ver o painel **ao
lado** do sistema oficial da central — leitura apenas; o fluxo oficial não muda
em nada. O que se coleta:

- **Correções** — transcrição editada, campo de extração corrigido,
  classificação da qual o operador discordou. **Cada correção é rótulo de
  treino** (ver §3).
- **Pareamento sugestão × decisão oficial** — o que o CoPilot sugeriu contra o
  que a regulação de fato decidiu, chamada a chamada.
- **Utilidade e atrapalho** — medição com/sem painel (`docs/12` F2), incluindo o
  que interrompe sem ajudar: alarme falso tem custo de atenção, e atenção é o
  recurso mais escasso de uma central.

**Gate E2:** acurácia sustentada **em produção** (não só no golden set) ·
adoção voluntária crescente · aceite formal do médico responsável.

### E3 — Uso operacional (todos usam — como copiloto, permanente)

Rollout para todos os operadores com treinamento formal (NEP, `docs/12` §3); o
painel vira parte do posto de trabalho. E a governança que nunca termina:

- **Re-treino periódico** com as correções acumuladas, sempre avaliado contra o
  golden set congelado antes de promover.
- **Auditoria amostral mensal** pelo médico responsável.
- **Monitoramento de drift:** queda de métrica devolve o componente afetado à
  E2 — regressão de qualidade não se administra em produção plena.

**Não existe E4.** A sugestão nunca vira decisão automática — doutrina
copiloto-não-piloto (`docs/05`), válida em todas as etapas e para sempre.

## 3. O ciclo de aprendizado local (por que a ordem é essa)

O loop que as etapas implementam: **capturar → anotar → medir → adaptar →
promover**. O golden set congelado é a régua; a correção do operador é o rótulo;
o modelo local de cada contrato é um ativo que a operação produz enquanto
trabalha. Princípios de arquitetura de IA já assumidos (a decisão de stack é
interna; formalização própria quando batido o martelo):

- **Transcrição auto-hospedada e adaptável por contrato** — o áudio da chamada
  não sai da central.
- **Extração com citação obrigatória:** todo campo extraído aponta o trecho de
  fala de origem; campo sem citação não entra no quadro (anti-alucinação
  estrutural — a mesma regra que a demo já encena com "sem sinal → PENDENTE,
  nunca palpite").
- **O modelo de linguagem extrai; quem classifica são regras determinísticas e
  explicáveis** sobre a extração. O médico vê qual discriminador acionou; a
  auditoria reproduz a decisão.
- **Assimetria de erro no desenho:** o sistema pode sugerir *subir* prioridade;
  nunca sugere rebaixar.

## 4. Requisitos de produto derivados (para o dev)

O que o produto precisa suportar para este roteiro existir — em ordem de
precedência:

- **R1 · Modo shadow real.** O pipeline completo executável **sem UI de
  operação**, com telemetria e persistência de medição como primeira classe
  (não como debug). É a E1 inteira.
- **R2 · Estágio de implantação como configuração por contrato/tenant**
  (E0–E3), decidindo quais superfícies existem para quem. A Fase 2 da
  modularização (`docs/24` §8) é habilitadora.
- **R3 · Captura de rótulo em toda correção.** O par (sugerido, corrigido,
  quem, quando) persiste em **todas** as superfícies editáveis — transcrição,
  extração, classificação, localização. Estende a auditoria já existente; é
  requisito de schema desde já, porque dado que não foi capturado na época não
  se reconstrói.
- **R4 · Pareamento sugestão × decisão oficial.** Por integração quando a
  central tiver como expor a decisão; por amostragem manual quando não — e a
  lacuna é declarada, nunca preenchida por suposição.
- **R5 · Ferramenta de anotação do golden set.** Transcrever e rotular centenas
  de chamadas é trabalho de semanas; precisa de tela própria (ouvir, corrigir,
  validar), ainda que simples.
- **R6 · Versionamento de modelo e léxico por contrato**, com rollback e
  registro de **qual versão rodou em qual chamada** — sem isso, nenhuma métrica
  de E1–E3 é comparável no tempo.

## 5. Conexões

- `docs/12` §5 — programa do produto (F0–F3); §1.2 — stakeholders por ente;
  §3 — NEP; §4 — backtest e critérios clínicos.
- `docs/23` — doutrina de antecipação (o *antes*; este doc é o *depois*).
- `docs/24` §8 — Fase 2 da modularização habilita R2.
- `docs/26` — visão do gestor e do ente: os relatórios de progresso da
  implantação saem das métricas de E1–E2.
- `docs/11` §1.3 — bake-off de STT com áudio real (instrumento da E1).

## Registro

- **Doutrina:** Ota, 28/08/2026 — "na implantação de contratos onde formos
  operar, a central de regulação permanecerá atuando como sempre atuou,
  normalmente. Mas gradativamente faremos testes, e iremos implementar os usos
  da ferramenta do CoPilot no projeto. Assim poderemos entender a realidade
  local, as gírias, os sotaques e treinar a IA corretamente nesse contexto."
- **Desenho E0–E3, ciclo de aprendizado e R1–R6:** proposta técnica desta data,
  a validar (e corrigir) no primeiro contrato implantado.
