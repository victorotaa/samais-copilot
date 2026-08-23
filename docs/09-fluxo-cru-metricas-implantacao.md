# Fluxo de CRU, Métricas e Roteiro de Implantação — Samais CoPilot OS

> Documento de maturidade do produto (jun/2026). Consolida: o fluxo real de uma Central de Regulação de Urgências (CRU) e como o CoPilot o espelha; o dicionário de métricas que importam; o cruzamento com os sistemas usados hoje nas centrais e as dores conhecidas; os upgrades executados nesta rodada; e o **passo a passo de implantação** para o futuro próximo.

---

## 1. O fluxo real de uma CRU 192 (e onde o CoPilot entra)

Fluxo normativo (Portaria 2048/2002 e manuais operacionais SAMU — Sergipe, SC, consórcios CISSUL/CIRUSPAR/CONSAVAP):

```
Cidadão liga 192
   │
   ▼
[PABX/fila]───────────────► sinalização de fila (chamadas aguardando, abandono)
   │ atende
   ▼
TARM — identifica local, queixa, solicitante ──► caso não-urgência: orientação/encerramento
   │ transfere (handoff verbal)
   ▼
MÉDICO REGULADOR — julga gravidade, decide recurso (USA/USB/orientação),
   │ pode manter o solicitante em linha com instruções pré-chegada
   ▼
RÁDIO-OPERADOR (RO)/FROTA — aciona a viatura, acompanha J3/J9/J12 (códigos de rádio)
   │
   ▼
EQUIPE EMBARCADA — desloca, atende, transporta, entrega no hospital (contra-referência)
   │
   ▼
Encerramento + registro (desfecho) ──► estatística/faturamento/relatório ao MS
```

**Como o CoPilot espelha:** perfis TARM → Médico → Viatura, com handoff digital substituindo o resumo verbal. **Nota de fidelidade:** o papel de **Rádio-Operador** existe na CRU real e hoje está absorvido pela tela do Médico na demo (a designação automática de viatura + confirmação cumpre a função). Para operação real, avaliar um 4º perfil operacional `RO` — o schema (`usuarios.role`) comporta a extensão.

**Postura do produto (decisão registrada):** o CoPilot é **100% passivo** — escuta a telefonia via SIPREC, não atende nem interfere. Gera dados, lastro, notificações e recomendações. Números de telefone só são exibidos após o atendimento (fila mascarada).

## 2. Dicionário de métricas (o que o produto mede e por quê)

| Métrica | Definição | Onde vive no produto | Benchmark/observação |
|---|---|---|---|
| **T0 — Despacho** | Momento em que a regulação aciona a viatura | `despachos.t0_despacho` (auto no insert) | — |
| **T1 — A caminho** | Viatura inicia deslocamento | `despachos.t1_a_caminho` (1 toque no tablet) | equivale ao J9 do rádio |
| **T2 — No local** | Chegada à cena | `despachos.t2_no_local` | **T2−T0 = tempo-resposta**, o indicador nº1 de qualidade APH; estudos nacionais mostram ~36% dos atendimentos em faixa "ruim" e 26% acima de 20 min |
| **T3 — Transportando** | Saída da cena com paciente | `despachos.t3_transportando` | tempo em cena = T3−T2 |
| **T4 — No hospital** | Entrega no destino | `despachos.t4_no_hospital` | tempo total do ciclo = T4−T0 |
| **T. de atendimento da ligação** | Toque → atendida pelo TARM | sinalização do PABX (fase SIPREC) | meta usual ≤ 10s |
| **T. de regulação** | Atendida → decisão do médico | `ocorrencias.created_at` → `despachos.t0` | KPI "T. médio regulação" |
| **Taxa de trote** | Trotes / total de ligações | KPI (demo: 8,2%) | **faixa real nacional 5,8–9,7%** — o valor da demo foi corrigido para essa faixa nesta rodada |
| **Taxa de abandono** | Desligou antes do atendimento | KPI (sinalização do PABX) | mede subdimensionamento de TARMs |
| **Ocupação da frota** | Viaturas em missão / total (aprox. UHU) | KPI **ao vivo** (estado da frota) | equilíbrio: alta demais = sem reserva; baixa = frota ociosa |
| **Desfecho** | Transportado / Orientação / Recusa / Óbito no local | 1 toque no encerramento (viatura) → `auditoria` | fecha o ciclo e alimenta o APH-BR |
| **Divergência IA×Regulador** | Regulador discorda da sugestão | `ocorrencias.divergencia_justificativa` | base de retreino + acurácia auditável |

**Relatório obrigatório:** a **Portaria GM/MS nº 1.010/2012** condiciona o incentivo financeiro qualificado ao envio **semestral** de relatório analítico de indicadores. O botão *Exportar PDF* do Dashboard já emite com cabeçalho de subsídio a esse relatório — é argumento direto de venda ao gestor.

## 3. Cruzamento com os sistemas atuais e dores de usuários

**O que as centrais usam hoje:** o [e-SUS SAMU (DATASUS)](https://datasus.saude.gov.br/e-sus-samu/) é o sistema público de referência para a regulação; consórcios e municípios complementam com soluções próprias/locais e, em muitos casos, **fichas em papel + planilhas** para estatística.

**Dores recorrentes (manuais operacionais, relatos públicos e estudos de tempo-resposta):**
1. **Registro manual rouba tempo da chamada** — o TARM digita enquanto escuta; retrabalho e erro de digitação. → *Resposta do CoPilot:* transcrição/extração automática (IA), tela AML de segundos, preenchimento manual só como fallback.
2. **Estatística é retrospectiva e artesanal** — indicadores fechados semanas depois, em planilha. → Dashboard em tempo real + PDF Portaria 1.010.
3. **Tempos T dependem de rádio + anotação** — J9/J12 falados e transcritos à mão. → Botões de missão de 1 toque no tablet gravam T1–T4 automaticamente.
4. **Handoff verbal perde contexto** — principal fonte de erro entre TARM e médico. → Handoff digital com queixa, sinais e explicabilidade da IA.
5. **Trote consome regulação** — 5,8–9,7% das ligações. → Score anti-trote por histórico do número (CAD).
6. **Sistemas caem e não há modo degradado claro** → princípio do CoPilot: a chamada nunca depende da IA; fallback documentado.

**Fontes:** [e-SUS SAMU — DATASUS](https://datasus.saude.gov.br/e-sus-samu/) · [Manual Técnico Operacional SAMU 192 (BVS/MS)](https://bvsms.saude.gov.br/bvs/publicacoes/samu_aprendiz.pdf) · [Portaria 1.010/2012](https://bvsms.saude.gov.br/bvs/saudelegis/gm/2012/prt1010_21_05_2012.html) · [Tempo-resposta como indicador de qualidade (UFRGS)](https://lume.ufrgs.br/bitstream/handle/10183/129481/000976890.pdf) · [Fatores que interferem no tempo-resposta do SAMU (ReBRAME)](https://www.rebrame.com.br/details/24/pt-BR/analise-dos-fatores-que-interferem-no-tempo-resposta-nas-diferentes-etapas-do-atendimento-do-samu) · [Trotes ao SAMU — A União/PB](https://auniao.pb.gov.br/noticias/caderno_paraiba/samu-recebe-mais-de-33-mil-trotes)

## 4. Upgrades executados nesta rodada

1. **Ciclo da ocorrência persistido ponta a ponta** (quando conectado ao backend): atender abre `ocorrencias`; o handoff grava transcrição, extração, risco sugerido e fatores da IA; a confirmação do médico grava risco final e cria `despachos` (T0); os botões de missão gravam **T1–T4**; o encerramento registra `encerrada_at` + **desfecho de 1 toque** (Transportado/Orientação/Recusa/Óbito) na trilha de auditoria. Cada passo também alimenta a tabela `auditoria` (instrumentação do SEC-05).
2. **Dashboard maduro (skill dataviz aplicada):** eliminado o gráfico de dois eixos (anti-padrão nº1) → três gráficos de eixo único (volume/bar, tempo-resposta/linha, classificação Manchester/barras horizontais com rótulo direto); paleta de séries **validada por script** nos dois temas (decisão: nenhuma paleta categórica multi-hue — série única ou cores de protocolo com rótulo); KPIs novos: **T. resposta (T0→T2)** real quando há dados, **ocupação da frota ao vivo**, taxa de abandono; **taxa de trote corrigida para a faixa real nacional** (8,2% na demo; antes 29%, irreal); "Chamadas recebidas" usa contagem real do backend quando existe.
3. **Cabeçalho de impressão Portaria 1.010** no Exportar PDF.
4. **Fila do médico priorizada**: casos VERMELHO primeiro, com tempo de espera vivo por caso.

## 5. Pendências de fidelidade (registradas, não bloqueiam demo)

- LP ainda cita "trotes filtrados: 29%" no stat-strip — alinhar à faixa real na próxima edição da LP.
- Skill `samais-brand-guidelines` (PR #7) cita **Inter**; o canônico do produto é **Plus Jakarta Sans** (docs/04). Alinhar a skill institucional ou registrar exceção.
- Papel RÁDIO-OPERADOR como 4º perfil operacional (avaliar com o primeiro cliente).
- `desfecho` como coluna própria em `ocorrencias` (migration 0003 sugerida — a 0002 é a correção RLS do parecer, 16/08) — hoje registrado via `auditoria`.

## 6. Passo a passo de implantação (futuro próximo)

**Fase 0 — Fundação (1–2 semanas · pré-requisito: Tier 0 de `docs/07`)**
1. Rotacionar segredos (SEC-01) e aplicar `supabase/migrations/0001_audit_hash_chain.sql`.
2. Ativar MFA/TOTP para Regulador/Gestor (SEC-03); testes de RLS por tenant (SEC-04).
3. CI seguro mínimo (SEC-14) + backups com restore testado (SEC-06).

**Fase 1 — IA real (3–6 semanas)**
4. Contratar Deepgram (streaming PT-BR) e criar o media-gateway SIPREC (arquitetura em `docs/05` §2–3); DPA assinado (SEC-17).
5. LLM para extração clínica + sugestão Manchester com explicabilidade (o formato `fatores_ia` já persiste); modo degradado obrigatório.
6. Backtest com chamadas gravadas anonimizadas; meta ≥90% de acurácia Manchester antes de ligar em produção.

**Fase 2 — Piloto assistido em 1 CRU (4–8 semanas)**
7. Diagnóstico de telefonia (qual PABX, quem mantém) → tap SIPREC em paralelo, **sem tocar no fluxo da chamada**.
8. Shadow mode: CoPilot escuta e sugere, equipe opera como sempre; medir T. de regulação com/sem painel.
9. Tablets nas viaturas (MDM quiosque, dual-SIM; Starlink Mini apenas rota rural) — botões T1–T4 substituem anotação de rádio.
10. Encerramento com desfecho de 1 toque → primeiras métricas reais no dashboard do gestor; emitir o primeiro PDF Portaria 1.010 com dados reais.

**Fase 3 — Operação plena e escala**
11. Perfil RO se a central pedir; console ADMIN Samais (cadastrar operações/bases/gestores — hierarquia já descrita em `docs/05` §7).
12. Pseudonimização + cofre PII (SEC-10/11) → habilita pipeline APH-BR (SEC-31) sob o corredor de dados UE-Brasil.
13. Pentest (SEC-15) e, com contrato âncora, ISO 27001/27799 (SEC-30).

**Critério de pronto de cada fase:** os checkboxes correspondentes de `docs/07-seguranca-backlog.md` fechados + demonstração ao vivo com dados reais da fase.
