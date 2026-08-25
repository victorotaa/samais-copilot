# 22 — Roteiro de demonstração (o mapa capacidade → cenário → fala)

> **Para quem vai apresentar a demo** (André, Ota, comercial): cada capacidade do
> CoPilot OS, onde ela aparece, o que apontar com o dedo — e a **resposta honesta**
> quando perguntarem "isso é real?". A demo é padrão-ouro justamente porque não
> encena o que o produto não faz (docs/10 §5); este roteiro mantém a apresentação
> dentro dessa linha. Padrão FRIO: mostrar, não prometer.

## 0. Preparo (2 minutos antes)

1. Abrir `samais-copilot-demo.vercel.app` — **tema escuro** é o padrão operacional;
   claro existe para sala muito iluminada (toggle no header).
2. Entrar como **TARM** (senha `demo`). Na tela de espera, o painel
   **"Demonstração · próxima chamada"** é o seu controle: escolha o cenário da
   próxima chamada ou deixe em Aleatório (bolsa: todos saem antes de repetir).
3. Sem rede confiável? A demo pura funciona **offline de backend** por design —
   mapa esquemático local, zero requisição externa.

## 1. O arco de 10 minutos (ordem sugerida)

| # | Cenário (chip) | Capacidade demonstrada | O que apontar |
|---|---|---|---|
| 1 | **IAM · vermelho** | O ciclo inteiro: atendimento na central → triagem shadow já aberta → extração → classificação → handoff → despacho → T0–T4 → desfecho | O botão da demo diz **"Simular atendimento na central"** — no produto a triagem abre sozinha; o **cronômetro nasce no atendimento**; o painel de **localização dentro da triagem** (sem gate); a caixa com **"por que esta classificação"** |
| 2 | **AVC · laranja** | Paleta Manchester completa e tempo-crítico | O rótulo **LARANJA por extenso** (a cor nunca é o único sinal); a hora de início do déficit registrada — janela terapêutica; o chip "EM REGULAÇÃO" contando desde o handoff |
| 3 | (na chamada) **Escuta · Digitação · Manual** | Os **três modos da doutrina** — convivência com o software que a central já usa | Trocar para **Digitação**: a escuta congela com marca auditada e você digita "dor no peito, suando frio" → a classificação reage ao texto. Trocar para **Manual**: o banner afirma **"a gravação da chamada continua"** (obrigação normativa — CFM 2.110/2014) |
| 4 | **Trote** | O que o sistema NÃO faz: detecção automática de trote | Risco permanece **pendente**; o encerramento exige **motivo explícito** (trote · engano · queda) — decisão do operador, auditada |
| 4b | **Queda** (encerrar → Queda) | Contexto nunca se perde | O card "ocorrência em aberto" na espera; escolher o **mesmo cenário** de novo → o número religa e o contexto **reassocia sozinho** (anti-duplicidade por telefone, como nos sistemas reais) |
| 5 | **Sem localização (AML)** | Caminho manual digno | Linha fixa: o painel de localização abre em **"colher por voz"** com a triagem **já rodando** — nada bloqueia |
| 6 | **Verde · orientação** | O sistema também protege a frota | Encaminhamento à UBS **sem despacho** — chamador recorrente com histórico na tela; ambulância fica livre para risco de vida |
| 7 | Perfil **Viatura** (tablet) | Execução na rua | Barra T de um toque, ≥60px, com **horário carimbado no próprio botão**; passo fora de ordem exige confirmação; marca não se sobrescreve |
| 8 | Perfil **Gestor** | Gestão **sem dado pessoal** por construção | A view agregada (não é filtro de tela); export do relatório que mira o descritivo **anual** da Portaria 1.997/2023 |

**Versão de 3 minutos:** cenários 1 → 3 → 8.

## 2. "Isso é real?" — as respostas honestas

| Pergunta | Resposta (a mesma dos docs — nunca outra) |
|---|---|
| A transcrição é IA de verdade? | **Não nesta demo** — são roteiros determinísticos que simulam o comportamento-alvo. A arquitetura real (STT streaming + extração) está especificada em `docs/05`; a demo é a especificação viva da UX. O rodapé da triagem diz isso na tela |
| E o modo Digitação? | A **classificação por texto é simulada** (palavras-chave, rotulada na tela). O que ela demonstra é o fluxo-doutrina: o TARM digita como no sistema da central e a IA rankeia — sem exigir clique novo durante a chamada |
| O sistema atende a ligação? | **Nunca.** O CoPilot é 100% passivo (shadow via SIPREC): recebe cópia do áudio da chamada **atendida**. Não toca na telefonia do 192 — por isso o botão da demo diz "simular atendimento na central" |
| E a fila que aparece? | **Leitura passiva** da sinalização do PABX (a distribuição é do ACD da central). Onde a central não expõe eventos, o painel declara indisponibilidade — nunca inventa (docs/05 §3) |
| Vocês gravam a chamada? | A gravação é **obrigação normativa da central** (CFM 2.110/2014, art. 8º §2º) — o áudio já existe em toda CRU regular. O CoPilot pode ser o instrumento dela (duas posturas por contrato, `docs/05` §2). E o kill switch **nunca** desliga gravação — só IA |
| Esse tempo/meta é norma nacional? | O limiar é **parâmetro da central** (o tooltip do cronômetro declara). 1 min/3 min é protocolo local de Fortaleza; a meta nacional de 30s–1min é da etapa do médico (`docs/21` §3.3) |
| Os dados persistem? | Com backend conectado, sim — login por perfil, ocorrência ponta a ponta, trilha de auditoria, RLS multi-tenant (Supabase). A demo pública roda **sem** backend por design; a versão conectada se apresenta em ambiente controlado |
| Quanto disso é produto pronto? | **15–20% do caminho** — protótipo navegável de alta fidelidade com backend inicial. O retrato completo e sem verniz é o `docs/10`, e mostramos ele com orgulho: material comercial acompanha o estágio real |
| Funciona com o sistema que já usamos? | A convivência é a premissa: benchmark dos softwares em uso nas CRUs em `docs/21` (e-SUS SAMU, MV, CARE, Iris, vSkySAMU). O shadow por telefonia — ou por digitação — não exige API do sistema existente |

## 3. Regras da apresentação (doutrina)

- **Nunca prometer o que o docs/10 lista como simulação.** Se a pergunta encostar
  em lacuna, a resposta é a linha da tabela acima — com o doc citado.
- **Vocabulário vetado** vale falado também: nada de "lucro", "margem", "ROI",
  "economia gerada". O CI agora linta as superfícies; o apresentador linta a boca.
- **Não publicar tela cheia** de estudo de outro município dentro da demo, e o
  seletor de cenários fica **visível** — ele é ferramenta declarada de
  demonstração, não truque (procedência é identidade nossa).
- Caiu tudo (projetor, rede): o perfil Viatura no celular do apresentador conta a
  história sozinho — barra T + mapa esquemático rodam locais.

## Registro

- **Pedido:** Ota, 24/08/2026 — "a demo atende a uma demonstração adequada de todas
  as capacidades?" → resposta em três frentes: CI re-provando as afirmações,
  modo Digitação demonstrável, e este roteiro.
- **Fontes:** docs/05 §2 (três modos e gravação) · docs/09 §1 (fluxo e postura
  passiva) · docs/10 (real × simulação) · docs/20 (cenários e defeitos corrigidos)
  · docs/21 (benchmark e metas de tempo).
