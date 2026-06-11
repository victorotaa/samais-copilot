# Visão de Produto — Samais CoPilot OS

> Documento de tese: para onde o produto vai, em que ele compete, como amadurece de demonstração para sistema operacional de missão crítica e, em horizonte mais longo, para uma plataforma de dados de saúde.

## 1. O que é hoje × o que vai ser

**Hoje.** Um protótipo navegável de alta fidelidade que simula a operação de uma central 192 com co-pilotagem de IA. Roda 100% no front-end, com dados mockados. Cumpre o papel de **demo de venda e prova visual** do que a Samais sabe operar.

**Alvo.** Um **sistema operacional de despacho APH** real, com:
- Triagem e regulação assistidas por IA (Gemini ou equivalente) sobre transcrição STT real
- Persistência completa do ciclo da ocorrência (de 192 até alta hospitalar)
- Integração com viaturas (telemetria GPS, MQTT/WebSocket)
- Auditabilidade ponta-a-ponta com cadeia de custódia (compliance LGPD real, não decorativa)
- Métricas de performance entregues a contratantes (gestor público, plano de saúde, hospital)

## 2. Posicionamento

A Samais não compete com prontuário eletrônico (PEP) nem com despachador genérico. O **CoPilot OS é a única peça do mercado nacional desenhada para o ciclo APH completo com IA assistencial no TARM e no Regulador.**

Três frentes de receita que se reforçam:

1. **Operação SAMU/APH terceirizada** — a Samais opera a central completa em municípios/consórcios (PR #1 = Proposta Taboão da Serra é exemplo prático).
2. **Licenciamento do CoPilot OS** — para hospitais, planos de saúde e operadoras de transporte sanitário que tocam suas próprias centrais.
3. **APH-BR (longo prazo)** — camada de dados anonimizada construída sobre o tráfego operacional, vendida via API.

> Nota: a frente APH-BR está **fora do escopo desta rodada** por decisão do produto. Documentada apenas como horizonte estratégico (§5).

## 3. Diferenciais defensáveis

| Diferencial | Por que importa | Status atual |
|-------------|-----------------|--------------|
| Co-piloto IA dedicado ao APH brasileiro (português, protocolos Manchester/SAMU, AVPU, etc) | Concorrentes globais (RapidSOS, Carbyne) são genéricos; nacionais (locais) são CRUD sem IA | Conceitualmente desenhado, **execução pendente** |
| AML + anti-trote por score | Reduz custo operacional (29% de trotes filtrados na demo) | Visual, **sem modelo real ainda** |
| Justificativa divergente auditável | Cria trilha de aprendizado supervisionado sem precisar de rotulação externa | Visual, **sem persistência ainda** |
| Handoff visual TARM → Regulador → Viatura | Reduz perda de contexto, principal causa de erro em centrais | Funcional na demo |
| Dashboard com SLA contratuais (T. resposta, acurácia, etc.) | Vira moeda em contrato com gestor público/plano de saúde | Visual, **sem ground truth real** |

## 4. Personas e usuários

Três usuários internos da operação (já endereçados pelo flow atual):

- **TARM** (Técnico Auxiliar de Regulação Médica) — recebe chamada, conduz triagem, alimenta IA.
- **Médico Regulador** — valida classificação, decide recurso, autoriza despacho, registra divergência.
- **Equipe de viatura** (Condutor + Socorrista + Enfermeiro/Médico, conforme USA/USB/Moto) — recebe ocorrência, executa, dá feedback.

Dois usuários externos (gestão e venda):

- **Coordenação operacional** — Dashboard, BI, escala de plantão (precisa amadurecer; hoje é estático).
- **Contratante** (Secretário de Saúde, gestor de plano, diretor de hospital) — vê relatórios consolidados e SLA. **Não tem visão própria ainda**; consome o Dashboard interno.

> Sugestão futura: criar um workspace `EXECUTIVE` enxuto, para o contratante, sem expor PII.

## 5. Horizonte APH-BR (out of scope nesta rodada — registrado para o futuro)

A operação rotineira gera, por design, o ativo de dados mais valioso do mercado brasileiro de saúde pública:

- Ocorrências georreferenciadas com classificação clínica, sintomas, comorbidades e desfecho
- Tempos de resposta por região e tipo de evento
- Padrões epidemiológicos sazonais e por bairro
- Eficácia de protocolos por perfil de paciente

Anonimizado e agregado, isto é a **base APH-BR**. Possíveis monetizações:
- API de risco para seguradoras de saúde e vida
- Inteligência geográfica para planejamento de rede hospitalar
- Treinamento de modelos para outros operadores APH (LATAM)
- Ground truth para pesquisa clínica (parcerias acadêmicas, com retorno financeiro ou publicações)

**Implicações técnicas (a serem desenhadas quando o tópico voltar):** schema multi-tenant com isolamento estrito, pipeline de anonimização irreversível (k-anonimato + l-diversidade), DPIA/RIPD por finalidade, contratos de uso por terceiro.

## 6. Princípios de produto

1. **Tudo que aparece no produto precisa existir de verdade.** Claims de compliance, métrica de acurácia e SLA sem lastro são risco de venda B2B.
2. **A IA é copiloto, não piloto.** O Regulador é a autoridade final. Toda divergência é registrada e usada para retreinar.
3. **Latência é feature.** Em APH, < 200ms de transcrição importa mais do que +2% de acurácia.
4. **Cada interação é dado.** Toda tela é uma oportunidade de capturar sinal estruturado para a base APH-BR.
5. **O dark mode é assinatura.** Light mode existe para uso administrativo/contratante; produção em sala de central é dark por padrão.

## 7. Sinais de sucesso (próximos 12 meses)

- **Operacional:** uma central real (Taboão ou equivalente) rodando com o CoPilot em produção, mesmo que em escopo reduzido (só TARM + Regulador na fase 1).
- **Comercial:** três propostas formais para municípios + uma para hospital/plano = pipeline de R$ 30M+/ano de ARR potencial.
- **Tecnológico:** triagem IA real (Gemini ou equivalente) substituindo `MOCK_SCRIPTS`, com ≥ 90% de acurácia de classificação Manchester em backtest de 1.000 chamadas reais anonimizadas.
- **Identidade:** paridade visual e de marca entre CoPilot OS, PEP OS e LP. Stakeholder externo reconhece "isto é Samais" em qualquer artefato.
