# Operação, Implantação, Treinamento e Testes — Samais CoPilot OS

> O programa de maturação completo (ago/2026): com quem falar e o que validar, como a
> operação roda no dia a dia, como a equipe é treinada (NEP), como o produto é testado, e
> as fases com critérios de gate. Consolida `docs/02` (sprints), `docs/07` (tiers de
> segurança) e `docs/09` (fases) num roadmap único. Decisões de stack em `docs/11`;
> runbook das ações no Supabase/Vercel em `docs/14`.

---

## 1. Mapa de stakeholders — com quem falar, para validar o quê

### 1.1 Interno (Samais)
| Quem | Valida/decide | Quando |
|---|---|---|
| **André (CEO)** | Orçamento de assinaturas (`docs/11` §2), momento do piloto, calibragem final | F0, antes de cada gate |
| **Ota (Consigliere)** | Arquitetura, contas/chaves/org GitHub, execução do runbook `docs/14` | contínuo |
| **Dev de segurança** (handoff `docs/08`) | Tier 0/1 (`docs/07`), revisão da migration 0001, testes de RLS | F0–F2 |
| **Médico regulador de referência (RT)** | Prompts e protocolos clínicos, checklist Manchester, aceite do backtest, aceite do shadow | F1–F2 |
| **DPO/encarregado (a nomear — SEC-16)** | DPIA/RIPD, runbook de incidente, DPAs | F0–F2 |

### 1.2 Por CRU/ente (repetir em cada implantação)
| Quem | O que se valida com essa pessoa | Instrumento |
|---|---|---|
| Secretaria de saúde (controladora LGPD) | Base legal, contrato de tratamento de dados, finalidade, retenção | Contrato + DPA (SEC-17) |
| Coordenação da CRU | Fluxo operacional local, escala, papéis (RO existe? como opera?) | Diagnóstico de implantação |
| Responsável técnico médico | Protocolos locais, autoridade do regulador (CFM 2.077/2014), aceite clínico | Termo de aceite por fase |
| Coordenação de enfermagem | Rotinas de USA/USB (COFEN 0375/2011), uso do tablet | Treinamento NEP |
| **TI/telefonia do ente** | **"Qual é o PABX e quem o mantém"** — 1ª pergunta técnica; caminho SIPREC × fork Asterisk × tap E1 (`docs/05` §3) | Diagnóstico de telefonia |
| NEP local | Carga horária, calendário e certificação do treinamento | Plano de capacitação |
| Hospital(is) de referência | Registro de destino; futuro handoff/contra-referência | F3 |
| Operadora/mantenedor do PABX | Espelhamento SIPREC, janela de homologação | Ordem de serviço técnica |

**Levantamento de campo — as perguntas que destravam tudo** (parecer `docs/17` §A.3.4 e
§B.3; cabem numa visita, e nenhuma linha de integração se escreve antes das respostas):

1. Qual PABX/SBC, versão, e **quem o opera** (equipe própria? terceirizada? quem autoriza
   mudança?) — define SIPREC × fork Asterisk/FreeSWITCH × tap.
2. Suporta SIPREC? Precisa de **licença adicional**? (Em vários fornecedores, precisa.)
3. Tronco SIP puro ou E1/R2 legado? (TDM = gateway no caminho, custo e fornecedor a mais.)
4. **Qual codec** — G.711 ou G.729? (Compressão degrada o STT; verificar, não presumir.)
5. Que máquina existe na central e há espaço em rack? (Decide se o STT na borda cabe.)
6. **Link de internet**: banda, operadora, redundância? (Decide o que pode sair do prédio
   — áudio é pesado e contínuo; texto é leve. Link ruim condena áudio na nuvem, não a
   arquitetura web.)
7. LAN da central: aguenta o fork RTP? VLAN, portas SIP, faixa RTP, firewall, NAT?
8. Estações dos TARMs (navegador, capacidade) e conectividade real dos tablets em campo.
9. **NTP** entre PABX, gravador e aplicação — sem relógio comum, T0 e áudio divergem e a
   trilha perde valor probatório.
10. **Base legal da gravação hoje**: a CRU já grava? Sob qual amparo? Aviso ao chamador?
11. **Eventos de telefonia em modo leitura**: o PABX expõe eventos de fila/canal
    (AMI read-only, feed do SBC)? Qual o critério de distribuição do ACD entre os
    TARMs? Sem essa fonte, o painel de fila declara indisponibilidade (docs/05 §3).
    Retenção, cifragem, quem pode ouvir? (Herdar consentimento inexistente é erro que só
    aparece na fiscalização.)

### 1.3 Nacional (institucional)
| Quem | O quê | Estado |
|---|---|---|
| **Coordenação de urgência do MS** | Apresentação institucional do produto (`docs/13` + `apresentacao-ms/`) | interesse manifestado — agenda a marcar |
| **DATASUS** | Agenda técnica: formato e-SUS SAMU (export oficial) e credenciamento RNDS (ICP-Brasil + homologação) | **a validar — nada se promete como ativo antes disso** |
| SAIPS/cofinanciamento | Habilitações e custeio das CRUs atendidas (contexto de contrato, não do produto) | por frente |
| **AML (localização avançada do chamador)** | Depende de acordo com plataformas/operadoras; **não existe hoje no Brasil para uso direto** | **a validar — nunca prometer** |

## 2. Plano operacional (como roda em produção)

- **Rotina por papel:** TARM atende com transcrição ao vivo e extração assistida (ou
  digita, se IA pausada/indisponível); médico regula com CDS + checklist + divergência
  registrada; viatura opera o tablet (T1–T4 + desfecho de 1 toque); gestor acompanha
  agregados sem PII; RO (quando ativado) despacha e acompanha frota.
- **Modo degradado (inegociável):** a chamada **nunca** depende da IA. STT caiu →
  "transcrição indisponível", TARM digita; LLM caiu → campos manuais; rede da viatura
  caiu → fila offline local com sync (F1). Kill switch visível permanece.
- **Suporte:** N1 (operação — dúvida de uso, reset de senha) e N2 (engenharia — on-call
  com SLA interno a definir por contrato); canal direto da CRU; status page simples.
- **Incidente de segurança/dados:** runbook SEC-16 — contenção, avaliação, notificação
  ANPD e titulares quando aplicável, post-mortem; DPO aciona o fluxo.
- **Gestão de mudança:** release notes por versão; mudanças que afetam fluxo clínico
  passam pelo RT do tenant antes de habilitar (feature flag por tenant).
- **Onboarding de tenant (checklist):** criar tenant/unidades/usuários/viaturas
  (console ADMIN — F2; até lá, script assistido), configurar bases/geografia, aplicar
  escalas, treinar (NEP §3), homologar telefonia, ligar em shadow.

## 3. Programa de treinamento (NEP)

**Lastro de custo:** a rubrica já existe na Composição do Valor Contratual da Samais —
"formação continuada em IA e tecnologia APH (~0,5%)". Carga horária obrigatória e
remunerada **conforme contrato de cada frente** (lição do OS: quantificar sempre — em
Canoas essa rubrica quase ficou de fora do estudo).

| Papel | Conteúdo | Formato | Carga sugerida* |
|---|---|---|---|
| TARM | Painel de triagem, leitura da extração, **quando pausar a IA**, fallback manual, LGPD do atendimento (número mascarado, minimização) | presencial + simulado | 4h + reciclagem NEP |
| Médico regulador | CDS e limites da sugestão, checklist Manchester, **divergência como ato de autoridade** (registrada e valorizada), explicabilidade | presencial com RT | 4h + casos mensais |
| Equipe de viatura | Tablet 3 zonas, T1–T4 e desfecho de 1 toque, modo offline, cuidado do dispositivo | presencial na base | 2h |
| Gestor | Dashboard sem PII, PDF Portaria 1.010, leitura de indicadores | remoto | 2h |
| RO (quando ativo) | Despacho, acompanhamento de frota, rádio × sistema | presencial | 4h |

\* Sugestão a ajustar ao contrato/NEP local. **O modo demo do próprio produto é o
simulador de treinamento** (roteiros guiados sem dado real) — vantagem direta de manter
o fallback demo no código.

**Princípios didáticos:** shadow mode é treinamento em serviço (a equipe vê o painel
sem depender dele); "champions" por turno; material EAD curto por papel; certificação
interna registrada no NEP; adoção medida (uso do painel, taxa de pausa da IA,
divergências registradas) — adoção baixa é sinal de treinamento insuficiente, não de
culpa do usuário.

## 4. Programa de testes

| Teste | O que prova | Fase | Critério de aceite |
|---|---|---|---|
| Unit/integration (Vitest) | Lógica de estado, providers, formatação clínica | F0→ | suite verde no CI |
| E2E (Playwright) | Fluxo completo IDLE→AML→TARM→REG→VIATURA→desfecho | F1 | cenários felizes + degradados |
| **Testes de RLS** (SEC-04) | Tenant A não lê B; GESTOR = 0 rows em PII; VIATURA só o próprio despacho | F0 | automatizado no CI |
| Restore drill (SEC-06) | Backup restaura de verdade | F0 | RTO/RPO medidos e documentados |
| **Backtest de IA** | Acurácia Manchester vs regulação real | F1 (gate) | **≥90% em ≥1.000 chamadas anonimizadas** E **critério assimétrico de sub-triagem: taxa de vermelhos rebaixados ≤ limite definido pelo RT** (parecer `docs/17`: 90% agregado esconde a distribuição que importa — um sistema com 95% global e 12% de vermelhos rebaixados é pior que um com 85% e zero; concordância mede alinhamento com a prática, não acerto clínico, então a matriz de confusão revisada pelo RT é parte do gate, não anexo); casos obstétricos/psiquiátricos representados |
| Shadow mode | Valor operacional real | F2 (gate) | ≥8 semanas; T. de regulação com/sem painel medido; aceite do RT |
| Carga/realtime | Fila cheia + N viaturas simultâneas | F1–F2 | alvo de latência definido e cumprido |
| Pentest (SEC-15) | Segurança externa validada | F2 | sem críticos/altos abertos |
| DPIA/RIPD (SEC-16) | Conformidade LGPD por finalidade | F2 | aprovada pelo DPO |
| WCAG AA | Acessibilidade | F1 | zoom liberado, foco, modais, contraste |
| UAT com operadores | Usabilidade com TARMs/reguladores reais | F2 | tarefas-chave sem assistência |

**Fonte das chamadas do backtest:** gravações históricas anonimizadas da própria CRU
(base legal e anonimização validadas pelo DPO **antes** de qualquer uso — sem esse
parecer, o backtest não começa). Se a CRU não tiver acervo aproveitável, a sequência do
parecer `docs/17` §A.3.5 assume o lugar: **captação passiva primeiro** — SIPREC/fork
gravando só em arquivo, sem IA e sem nada na tela — prova que o fork não afeta a chamada
e **forma o acervo** que o backtest e o futuro fine-tuning exigem (um levantamento serve
aos dois). Nesse caso o backtest desliza para dentro da F2, e o gate F1 fecha com os
demais critérios + captação passiva operante.

## 5. Programa em fases com gates

Sete workstreams: Segurança/LGPD · Engenharia · IA/Dados · Integrações · Operação ·
Treinamento · Institucional. Durações em ordem de grandeza honesta; **total ~6–9 meses
até operação plena em 1 CRU**, condicionado ao acesso à CRU piloto (decisão §6).

> **Nota (28/08/2026):** estas fases são o programa do **produto**, executado uma
> vez. O roteiro **por contrato** — como cada central nova recebe o CoPilot
> (shadow silencioso → piloto assistido → uso operacional, etapas E0–E3, com a
> central operando como sempre desde o dia 1) — está em `docs/27`, que traz
> também o ciclo de aprendizado local e os requisitos de produto derivados
> (R1–R6). O primeiro piloto executa os dois programas ao mesmo tempo.

### F0 — Fundação e higiene (2–4 semanas)
- Segurança: **Tier 0 completo** — SEC-01 (rotação da senha exposta), SEC-02 (HSTS/CSP
  ok; documentar repouso), SEC-03 (MFA TOTP), SEC-04 (testes RLS), SEC-05 (aplicar
  migration 0001 **v2**), SEC-06 (restore drill), SEC-07 (região documentada), **SEC-08 e
  SEC-09 (aplicar migration 0002 — correções do parecer `docs/17`)**. Runbook: `docs/14`.
- Engenharia: **CI seguro (SEC-14) primeiro** — ESLint+Prettier, Vitest base, `.catch` em
  toda mutação, seed 4/4 aplicado, migration 0003 (`desfecho`). Dep morta `@google/genai`
  removida em 16/08. Ordem adotada do parecer: CI é o instrumento que torna o resto
  seguro, e teria pego sozinho os três erros de registro que a auditoria externa achou.
- Institucional: apresentação ao MS realizada; DPO indicado.
- **Gate F0:** Tier 0 100% + CI verde + restore documentado + demo com 4 logins reais.
  *Nenhum dado real de paciente antes deste gate.*

### F1 — IA real e fila operacional (6–10 semanas)
- **Pré-requisito de entrada (novo, do parecer):** decisão da **camada servidor**
  (`docs/11` §1.11) tomada — chave de STT/LLM e áudio não passam pelo navegador; sem essa
  camada decidida, a substituição do mock não começa.
- IA/Dados: **bake-off de STT com áudio real** (critérios em `docs/11` §1.3: WER em 8 kHz
  E taxa de erro em entidade crítica — a decisão Deepgram-cloud está suspensa até esse
  resultado) → contrato+DPA do vencedor; `TranscriptProvider` e `LLMProvider`; extração +
  Manchester + explicabilidade persistida; modo degradado; **backtest ≥90% + sub-triagem
  de vermelho ≤ limite do RT** (gate — ver §4).
- Engenharia: modularização do `App.tsx` + Zustand + router como **habilitadores da
  fila multi-ocorrência simultânea**; papel RO; N viaturas por ocorrência; GPS real do
  tablet (AVL); offline-first v1; WCAG.
- **Gate F1:** backtest documentado ≥90% + fila multi-caso e RO em staging + DPAs
  STT/LLM assinados + zero claim sem lastro na UI (SEC-20 contínuo).

### F2 — Piloto em CRU (shadow mode) (8–12 semanas)
- Integrações: diagnóstico de telefonia → espelhamento SIPREC em paralelo (sem tocar o
  fluxo do 192); media gateway; gravação WORM.
- Operação: tablets MDM quiosque + dual-SIM (Starlink conforme território); shadow mode
  com medição com/sem painel; primeiro PDF Portaria 1.010 com dados reais; console
  ADMIN; suporte N1/N2 ativo.
- Treinamento: NEP por papel (§3) executado e registrado.
- Segurança: Tier 1 — cofre PII (SEC-10/11), TSA (SEC-12), WAF (SEC-13), pentest
  (SEC-15), DPIA (SEC-16), DPAs (SEC-17), MDM (SEC-18).
- Institucional: relatório de piloto **compartilhável com o MS** (metodologia declarada).
- **Gate F2:** ≥8 semanas de shadow com métricas + DPIA aprovada + aceite formal do RT
  + pentest sem críticos abertos.

### F3 — Operação assistida e escala (3–6 meses)
- IA ativa com kill switch (deixa de ser shadow); export e-SUS SAMU e credenciamento
  RNDS (agenda DATASUS); destino hospitalar/vaga zero conforme regulação local;
  instrumentação completa de metas contratuais ("como cada meta é medida" — item
  crítico do roteiro de implantação do OS); expansão a novas CRUs; ISO 27001/27799 se
  contrato pagar (SEC-30); horizonte APH-BR só após SEC-31.
- **Gate F3:** 1 CRU plena com relatório 1.010 real + SLA instrumentado + runbook de
  incidente exercitado.

## 6. CRU piloto — decisão em aberto (critérios)

**Não há definição de qual contrato implementa o piloto** (decisão da diretoria,
registrada em ago/2026). Quando a decisão for tomada, os critérios que qualificam uma
CRU para o primeiro piloto:

1. **Contrato assinado e vigente** — piloto não se ancora em negociação.
2. **Porte controlável** — volume que gera dado sem afogar a primeira operação
   (referência: dezenas de ocorrências/dia, não centenas).
3. **Telefonia acessível** — PABX com caminho SIPREC/Asterisk viável e mantenedor
   cooperativo (é o gargalo externo nº 1).
4. **Proximidade da equipe Samais** — implantação e suporte presenciais baratos.
5. **NEP estruturado** — canal de treinamento já constituído.
6. **Patrocínio local** — coordenador de CRU e RT dispostos a operar em shadow.

**Modelo de entrada em 2 tempos (vale para qualquer frente):** o CoPilot entra primeiro
em **"modo dados"** (T0–T4 pelo tablet + dashboard + PDF 1.010 — sem IA, valor imediato
e risco mínimo) e o **shadow de IA** liga quando o gate F1 fechar. Assim a partida de
operação não espera a IA, e a IA não estreia sem lastro.

## 7. Ações externas pendentes (fora do repo)

| Ação | Dono | Referência |
|---|---|---|
| Executar runbook Tier 0 no Supabase/Vercel | Ota (+dev seg.) | `docs/14` |
| Autorizar assinaturas F0/F1 | André | `docs/11` §2 |
| Nomear DPO | Diretoria | SEC-16 |
| Transferir repos à org `samais` + repo privado | Ota | decisão 30/07 no OS |
| Marcar agenda técnica DATASUS | Ota/diretoria | §1.3 |
| Decidir CRU piloto | Diretoria | §6 |
| Registrar estado do item `copilot` nas implantações do OS quando o piloto existir | Ota | roteiro-padrao do OS |
