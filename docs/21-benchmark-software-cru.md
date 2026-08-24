# 21 — Benchmark: softwares que operam Centrais de Regulação de Urgências (CRU/SAMU 192)

> **Propósito** (nota do Ota, 24/08/2026): o CoPilot OS opera **em shadow** sobre a regulação — e o
> TARM digita em paralelo ao atendimento telefônico **num sistema próprio da central**, que não é
> nosso. Este documento mapeia o terreno onde o CoPilot vai conviver: quais sistemas operam as CRUs
> brasileiras hoje, o que o TARM digita neles e em que ordem, sob quais metas normativas — para que
> o modo "IA sobre digitação" **não atrapalhe esse fluxo**.
>
> **Método:** pesquisa ampla na internet (busca + leitura de fonte primária) em 24/08/2026:
> manuais de usuário dos sistemas (PDF oficiais), portarias e resoluções, editais/atas no PNCP,
> notícias de prefeituras e secretarias estaduais, resumo científico de congresso. **Regra
> (doutrina Samais):** só fato **com fonte** (URL + data de acesso); fonte inacessível → falha
> registrada, nunca presumida; sem fonte → **a levantar**; número plausível **não se inventa**;
> padrão FRIO — descrição, sem juízo sobre fornecedor. Fato publicado × **inferência** sempre
> separados (inferências rotuladas como tal, concentradas no §4).
>
> **Data de todas as consultas: 24/08/2026.** Complementa o doc
> `09-fluxo-cru-metricas-implantacao.md` (fluxo CRU e métricas do produto) com o levantamento de
> mercado e a base normativa citável.

---

## §0 — Falhas de acesso registradas (fonte fora do ar ≠ fonte inexistente)

Tentativas em 24/08/2026 que **não** retornaram conteúdo — o que estas fontes afirmam só entra
neste documento marcado com ⚠️ (recuperado de índice de busca ou de espelho), nunca como fato
verificado:

| Fonte | URL | Falha |
|---|---|---|
| BVS-MS (Portarias 2048/2002, 1010/2012, 2657/2004, matrizes de consolidação) | `bvsms.saude.gov.br/bvs/saudelegis/...` | HTTP 503 em todas as tentativas |
| CONSAMU (notícia "Sistema MV de Regulação Médica") | `www.consamu.com.br/noticia/10/...` | DNS timeout |
| Celepar (notícia sobre o sistema do SAMU) | `www.celepar.pr.gov.br/Noticia/...` | 403 no proxy de saída |
| AEN-PR (notícias do sistema CARE) | `www.parana.pr.gov.br/aen/Noticia/...` | HTTP 404 (URLs do índice de busca não existem mais) |
| SESA-PR (notícia de consolidação da rede, original) | `www.saude.pr.gov.br/Noticia/Com-100-de-cobertura...` | HTTP 403 (espelho de imprensa acessado — ver §1) |
| SciELO (artigo com duração das ligações do TARM) | `www.scielo.br/j/ean/a/jqr8vfFBg7S6CgcvxjGW6tv/` | 403 no proxy de saída |
| Prefeitura de Campinas (notícia Sys 4 Web, id 12283) | `campinas.sp.gov.br/noticias-integra.php?id=12283` | página serve só o portal, sem a notícia |
| Prefeitura de Barretos (notícia do software de 2024) | `barretos.sp.gov.br/noticia/14485/...` | página serve só o cabeçalho do portal |
| Rádio Sertaneja (espelho da notícia de Barretos) | `radiosertaneja.com.br/noticia/1419/...` | HTTP 503 |
| CIB-RJ (projeto SAMU Baixada, com dimensionamento) | `cib.rj.gov.br/arquivos-para-baixar/...` | HTTP 503 |
| CREMESP (espelho de legislação) | `cremesp.org.br/.../versao_impressao.php?id=3258` | HTTP 503 |
| UFSJ (espelho PDF da Portaria 1010/2012) | `ufsj.edu.br/.../PORTARIA 1010...pdf` | HTTP 503 |

---

## §1 — Sistemas identificados

A lista abaixo **emergiu da pesquisa** (não é exaustiva — ver "a levantar" no §4). Nenhuma fonte
pública consolidada enumera qual sistema roda em cada CRU do país; o quadro é fragmentado por
central.

| Sistema | Natureza | Onde roda (com fonte) | O que se sabe do fluxo do TARM | Fonte principal |
|---|---|---|---|---|
| **e-SUS SAMU** (DATASUS/MS) | Público — "sistema oficial do Ministério da Saúde" | Distribuição nacional por download (código-fonte + manuais); uso confirmado na CRU de Fortaleza (SAMUFor, 2023). Lista de centrais usuárias: **não publicada — a levantar** | Documentado em guia oficial do usuário TARM (v1.4, mar/2016) — detalhado no §2.2 | [Catálogo de Sistemas DATASUS 2025, p. 10](https://datasus.saude.gov.br/wp-content/uploads/2025/12/Catalogo-de-Sistemas-Datasus-2025.pdf) (acesso 24/08/2026); [página e-SUS SAMU](https://datasus.saude.gov.br/e-sus-samu/) (acesso 24/08/2026) |
| **Sistema Estadual de Regulação — módulo SAMU (MV)** | Privado (MV), contratado pela SESA-PR | Paraná (centrais regionais da SESA), documentado em manual de 2018; ⚠️ notícia do CONSAMU atribui a licitação à SESA e o desenvolvimento à "MV SISTEMAS" (fonte fora do ar — DNS; conteúdo via índice de busca) | Manual oficial do perfil TARM, tela a tela (v04.47.00, jan/2018) — detalhado no §2.2 | [Manual "SAMU — Perfil: TARM", SESA-PR, logomarca MV](https://www.saude.pr.gov.br/sites/default/arquivos_restritos/files/documento/2020-04/tarm_44700.pdf) (acesso 24/08/2026); ⚠️ [notícia CONSAMU](https://www.consamu.com.br/noticia/10/sistema-mv-de-regulacao-medica) (inacessível em 24/08/2026) |
| **CARE Paraná** (Central de Acesso à Regulação) | Público estadual — ⚠️ desenvolvimento atribuído à **Celepar** (estatal de TI do PR) em fontes não abertas (403/404); a própria Celepar intitula notícia "Sistema da Celepar garante agilidade e controle no atendimento ao SAMU" | Todo o Paraná: implantado a partir de **2020**, "unificou o atendimento telefônico e a regulação médica em todo o Estado"; rede em 399 municípios; módulo SAMU listado pela SESA | Fluxo interno do TARM no CARE: **não documentado publicamente — a levantar** | [SESA-PR, página "Sistema Estadual de Regulação"](https://www.saude.pr.gov.br/Pagina/Sistema-Estadual-de-Regulacao) (acesso 24/08/2026); [espelho da notícia SESA de 30/06/2026](https://ilustrado.com.br/com-100-de-cobertura-integracao-de-sistemas-e-frota-renovada-parana-consolida-rede-do-samu/) (acesso 24/08/2026) |
| **Iris Emergência** (Sys4web) | Privado | SAMU do Médio Paraíba-RJ (resumo CONASUS 2023 usa "o banco de dados do sistema Sys4web"); municípios com o app "192 Online" da mesma empresa: Poços de Caldas-MG, Mogi das Cruzes-SP (notícias municipais, 2018+); clientes privados citados no site: Transul, Emercor, Unimed Vitória. ⚠️ Campinas-SP: notícia municipal atribui o software do SAMU à "Sys 4 Web" com ganho de "cerca de cinco minutos" no atendimento — conteúdo original não mais servido; recuperado de índice de busca, **a confirmar** | Site declara: módulo de telefonia com "Identificador de chamadas", "Central Telefônica" e "Gravação de Telefonia"; "Integração telefônica nativa com PABX"; regulação médica; despacho/frota com rastreamento; tablets embarcados; conformidade declarada com "Portarias 2048/02, 2970/08, 2026/10 e 1010/12" | [Sys4web — página SAMU](https://br.sys4web.com/samu) e [página Iris](https://br.sys4web.com/irisemergencia) (acesso 24/08/2026); [resumo CONASUS 2023, DOI 10.51161/conasus2023/22459](https://ime.events/conasus2023/pdf/22459) (acesso 24/08/2026); [notícia Poços de Caldas](https://pocosdecaldas.mg.gov.br/noticias/samu-de-pocos-pode-ser-acionado-atraves-do-app-192-online/), [notícia Mogi das Cruzes](https://www.mogidascruzes.sp.gov.br/noticia/samu-de-mogi-das-cruzes-pode-ser-acionado-pelo-aplicativo-192-online) (acesso 24/08/2026) |
| **vSkySAMU** (Velp Tecnologia) | Privado | Sete consórcios intermunicipais de SAMU em MG — CISRU, CISNORJE, CISDESTE, CISRUN, CISSUL, CISURG, CISTRI — "over 600 counties" (página da empresa); Porto Velho-RO (implantação noticiada em 06/05/2021, sistema "Vsky Samu"); contratação recente no PNCP: CISTRI homologou em 30/03/2026 locação de "MODULO DE ATENDIMENTO MOVEL" (88 × R$ 979,39) e "MODULO VEICULAR" (88 × R$ 1.176,47) da **VELP TECNOLOGIA LTDA** (CNPJ 05.127.711/0001-45), integrados à "Solução de Regulação Médica" da central | Página da empresa: o sistema controla "all the steps involved in the rescue, from receiving the call, medical regulation, actioning ambulances and patient care, to concluding the report"; comunicação com a frota por "3G/GPRS technologies and state-of-the-art geostationary satellites". Fluxo de digitação do TARM: **não documentado publicamente — a levantar** | [Velp — portfólio consórcios MG](http://www.velp.com.br/en/portfolio/skysamu-transformed-samu/) e [página do produto](http://www.velp.com.br/sistema-de-regulacao-e-comunicacao-do-samu/) (acesso 24/08/2026); [SEMUSA Porto Velho, 06/05/2021](https://semusa.portovelho.ro.gov.br/artigo/31002/economia-prefeitura-de-porto-velho-implanta-novo-sistema-de-monitoramento-e-regulacao-medica-no-samu) (acesso 24/08/2026); [PNCP — itens e resultado da contratação 19455924000100-1-000016/2026, via API](https://pncp.gov.br/app/editais/19455924000100/2026/16) (acesso 24/08/2026) |
| Sistemas municipais **não nomeados** nas fontes | Indeterminada | **Barretos-SP**: sistema em operação desde mai/2024, ~R$ 274 mil/ano, 4 tablets em ambulâncias, mapa em tempo real — ⚠️ fornecedor não identificado (notícia original inacessível; dados de índice de busca). **Fernandópolis-SP**: implantação iniciada em 10/08/2026 — tablets nas ambulâncias, fim das fichas manuais, checklists e controle de abastecimento informatizados; fornecedor não nomeado na notícia | — | ⚠️ [Barretos](https://barretos.sp.gov.br/noticia/14485/prefeitura-investe-mais-de-r-270-mil-em-tecnologia-que-proporciona-mais-agilidade-e-qualidade-ao-atendimento-do-samu-192-barretos) (inacessível em 24/08/2026); [Região Noroeste — Fernandópolis](https://regiaonoroeste.com/samu-tera-novo-sistema-na-central-de-regulacao-de-urgencia-em-fernandopolis/) (acesso 24/08/2026) |
| **Santa Catarina** — sistema não nomeado no manual | Indeterminada | O manual estadual (2021) manda o TARM "preencher todos os campos **no sistema específico do SAMU**" sem nomear o sistema; ⚠️ notícia estadual (2024, não aberta — via índice de busca) descreve plano de central única de regulação integrada ao Corpo de Bombeiros Militar, consolidando as 8 centrais atuais | Atribuições do TARM detalhadas no manual (ver §2.3) | [Manual de Condutas e Procedimentos Operacionais SAMU-SC, anexo da Deliberação CIB 176/2021](https://www.cosemssc.org.br/wp-content/uploads/2022/07/ANEXO-DELIBERACAO-176-2021-MANUAL-SAMU.pdf) (acesso 24/08/2026); ⚠️ [notícia SECOM-SC](https://estado.sc.gov.br/noticias/samu-completa-19-anos-de-servicos-e-inovacao-no-atendimento-de-emergencias-em-santa-catarina/) (não aberta em 24/08/2026) |

**Notas de leitura (fatos):**

- O Catálogo DATASUS 2025 descreve o e-SUS SAMU como: *"Sistema oficial do Ministério da Saúde
  utilizado para registrar, acompanhar e gerenciar todas as ocorrências atendidas pelo Serviço de
  Atendimento Móvel de Urgência (SAMU 192) em todo o Brasil"* (p. 10; acesso 24/08/2026). A página
  do DATASUS distribui a versão **1.4.6** com manual de instalação, **código-fonte**
  (`Deploy_1.4.6_rc4.zip`) e scripts de migração de banco; o guia do usuário disponível
  (RÁDIO/TARM/MÉDICO) é da versão **1.4, março/2016**. Não há, na página, dado de adoção.
- No Paraná, a sequência documentada é: sistema contratado (manual MV de 2018) → substituição pelo
  CARE a partir de 2020 — *"A transformação da rede ganhou força em 2020 com a implantação do
  Sistema Care, que unificou o atendimento telefônico e a regulação médica em todo o Estado"*
  (notícia SESA de 30/06/2026, espelho acessado 24/08/2026). É o único caso encontrado de
  **sistema estadual próprio** substituindo fornecedor privado em escala.
- A cartilha do SAMUFor (Fortaleza, 2023) nomeia o **e-SUS SAMU** como o sistema onde o médico
  registra a ficha de atendimento (*"deverá registrar o fato na ficha de atendimento do paciente
  no e-SUS SAMU"*, seção "Respostas ao Solicitante") — evidência de uso real do sistema oficial numa capital
  ([cartilha](https://docs.bvsalud.org/biblioref/2023/08/1366393/cartilha-dos-tarms-2023v2.pdf),
  acesso 24/08/2026).

---

## §2 — O fluxo de digitação do TARM: o que os documentos mostram

### 2.1 O que é padronizado por norma (o "o quê", não a tela)

- **Portaria GM/MS 2.048/2002** (Regulamento Técnico das Urgências), perfil do TARM
  (cap. IV, item 1.2.1): *"Profissional de nível básico, habilitado a prestar atendimento
  telefônico às solicitações de auxílio provenientes da população, nas centrais de regulação
  médica, devendo anotar dados básicos sobre o chamado (localização, identificação do solicitante,
  natureza da ocorrência)"*; competências: *"atender solicitações telefônicas da população; anotar
  informações colhidas do solicitante, **segundo questionário próprio**; prestar informações
  gerais ao solicitante"*. Fonte: [espelho CBMERJ do texto integral](http://www.cbmerj.rj.gov.br/wp-content/uploads/2022/04/portaria_2048_2002_ms.pdf)
  (acesso 24/08/2026; original no BVS-MS fora do ar).
- **Manual "A Regulação Médica das Urgências" (MS, 2006)** — conjunto mínimo de dados da 1ª etapa
  (recepção do chamado), *"de responsabilidade do auxiliar de regulação"*: **Município;
  Data/horário; Número da chamada; Informações sobre o solicitante (nome e telefone); Motivo da
  chamada (informação, pedido de ajuda, pedido de transporte, outros); Trote, engano, desligou,
  outros; Orientação transmitida ao informante; Endereço e referenciais de localização** — mais a
  **origem** da solicitação (domicílio, via pública, serviço de saúde, outras) e a **natureza do
  solicitante** (leigo, profissional de área afim, profissional de saúde não médico, médico).
  Orientações gerais: *"Atender o chamado ao primeiro toque do telefone; identificar-se para o
  solicitante; perguntar e registrar o nome do solicitante; [...] registrar as informações
  relativas ao chamado de acordo com roteiro próprio"*. O acolhimento inicial deve *"identificar
  sinais de alerta"*; paciente inconsciente e/ou sem respirar = *"situação de extrema urgência e o
  caso deve ser comunicado e repassado imediatamente ao médico regulador, após registrar nome,
  telefone e endereço completo"*. Todas as solicitações vão ao médico regulador — exceto pedido
  puro de informação, que o TARM pode encerrar. Fonte:
  [PDF oficial no gov.br](https://www.gov.br/saude/pt-br/composicao/saes/samu-192/publicacoes/regulacao_medica_urgencias.pdf)
  (126 p.; acesso 24/08/2026).

**Síntese factual:** a norma fixa **o conjunto de dados** (quem chama, de onde, o quê) e **o
destino** (tudo passa pelo médico regulador, salvo informação/trote/engano) — mas **não fixa a
tela nem a ordem de digitação**. Ordem, campos obrigatórios, tabelas de classificação e botões
variam por fornecedor (§2.2).

### 2.2 O fluxo tela a tela nos dois sistemas com manual público

**a) e-SUS SAMU v1.4 — Guia do usuário TARM (DATASUS, mar/2016)**
([zip oficial com os guias RÁDIO/TARM/MÉDICO](https://datasus.saude.gov.br/wp-content/uploads/2021/10/Guia_RadioTarmMedico.zip),
acesso 24/08/2026):

1. **Telefone**: *"Onde existir central telefônica, o número do telefone do solicitante aparecerá
   no BINA do aparelho telefônico e o sistema já vai apresentar esta informação no campo Número do
   Telefone; caso não haja a central telefônica, o TARM deve digitar o número"*.
2. **Reincidência**: caixa *"ligações anteriores"* — quantas vezes o número já ligou, tipo de
   ligação (ocorrência, trote, engano etc.) e data/hora da última.
3. **Dados do solicitante**: nome completo ou apelido; **Motivo/Queixa** — *"objetivo e procure
   sintetizar o caso, sempre que possível repetir as palavras do solicitante"*; **Apelido da
   Ocorrência** dado pelo TARM.
4. **Tipo de ligação** (o TARM escolhe): ATENDIMENTO, DESISTÊNCIA, ORIENTAÇÃO, QUEDA DE LIGAÇÃO,
   SERVIÇO SOCIAL, TRANSFERÊNCIA, TRANSPORTE; TROTE e ENGANO **encerram a ocorrência
   automaticamente** (em caso de dúvida sobre trote: registra ATENDIMENTO e envia ao médico);
   REGULAÇÃO = equipe em cena pedindo o médico regulador; INFORMAÇÃO abre pesquisa por número da
   ocorrência, endereço, apelido ou nome do solicitante e encerra ao final.
5. **Origem**: local de onde parte a solicitação (pergunta ao solicitante, escolhe opção).
6. **Aba PACIENTE** (não obrigatória): endereço do paciente; botão "INCLUIR PACIENTE" para
   múltiplas vítimas.
7. **Encaminhamento**: botões Encerramento / Encerramento com Orientação / **EM FILA** (cai na
   caixa "todas as ocorrências" dos médicos) / **EM ESPERA** (volta à caixa do TARM) / **ENVIAR
   PARA** (escolhe o médico logado) + CONFIRMAR.
8. **Rastreabilidade**: tela "Posições das Ocorrências" com ícones por etapa (telefone = TARM,
   estrela da vida = médico regulador, veículo = operador de frota, relógio = espera); o sistema
   *"gera LOG de acessos de todos os usuários"*. Abas seguintes (AVALIAÇÃO, CONDUTA, CONCLUSÃO)
   são do médico regulador.

**b) Sistema Estadual de Regulação PR, módulo SAMU — Manual do perfil TARM v04.47.00 (jan/2018,
logomarca MV)**
([PDF na SESA-PR](https://www.saude.pr.gov.br/sites/default/arquivos_restritos/files/documento/2020-04/tarm_44700.pdf),
acesso 24/08/2026). Tela inicial com **sete áreas**:

1. **Número** — protocolo automático (Regional de Saúde + aammdd + sequência do dia; ex.
   `10 180103 0001`), visível só no despacho ao médico.
2. **Solicitante** — *"quando houver a funcionalidade e integração com o PABX, este exibe a
   identificação do telefone automaticamente nos campos DDD e telefone; sem esta funcionalidade
   estes campos deverão ser preenchidos pelo TARM"*, que também preenche o nome do cidadão.
3. **Atendente** — usuário logado, data/hora, ramal.
4. **Fato** — texto livre "Identificação do Fato" (*"sucintas e de fácil entendimento para
   agilizar o despacho ao médico regulador"*) + endereço (UF, cidade, bairro, endereço, nº,
   complemento, tipo local, ponto de referência) — *"todos os campos são obrigatórios, exceto
   'Número', 'Complemento' e 'Ponto de referência'"*, com **auto-complete**; telefone já conhecido
   preenche o endereço automaticamente (botão "Alterar Endereço"); **Tipo Local** (Via Pública,
   Trabalho, Rodovia Estadual/Federal, UBS, Praça Pública etc.), **Natureza/Incidente** (tabela
   com lupa) e **Prioridade**: *"alta, média, baixa ou AMUV (acidente com múltiplas vítimas)"*.
5. **Localização** — mapa (quando vinculado ao geoposicionamento das ambulâncias).
6. **Últimas Solicitações** — registros das últimas 24h com mesmo telefone, bairro ou endereço,
   *"com o objetivo de evitar duplicidade de chamados"*; duplo clique gera **complemento** na
   ocorrência existente (com trilha de quem complementou).
7. **Barra de ações** — Envolvidos (gera VÍTIMA 1..N com nome/idade/sexo; transferência:
   Origem/Destino/Leito/Observações), Selecionar Médico, **Despachar** (mostra protocolo, central
   e médico; sem médico logado fica "Aguardando"), Abandonar, Informação, **Trote** (número de
   telefone obrigatório), Limpar, Pesquisar, Exibir Contatos, Sair — e o **"Contador de tempo de
   Atendimento"**: *"acionado após informar o número completo do telefone. Ao atingir o tempo
   médio do atendimento (**parametrizado no sistema**), o sistema informa ao usuário com a
   mensagem: 'O tempo médio de atendimento foi excedido'"*, alternando o contador entre vermelho e
   preto.
   Requisitos mínimos declarados (2018): banda larga 40mb dedicada com redundância, Windows XP+,
   **Flash Player 10+**, Java 6+, monitor 21" (1440×900), navegador atualizado.

### 2.3 A camada de processo por cima do sistema (protocolos locais públicos)

**Fortaleza — Cartilha dos TARMs, NEP SAMUFor (mai/2023, 1ª revisão; ISBN 978-85-66187-10-6)**
([PDF na BVS](https://docs.bvsalud.org/biblioref/2023/08/1366393/cartilha-dos-tarms-2023v2.pdf),
acesso 24/08/2026) — a etapa do TARM tem **4 passos** (os passos 5–7 são do médico regulador):

1. **Acolhimento do chamado** — atender ao primeiro toque; frases protocolares: *"SAMU Fortaleza,
   com quem eu falo?"* e *"Fulano(a), qual a sua urgência?"*; colher a história *"da mesma forma
   que dita pelo solicitante"*.
2. **Identificação do solicitante e do paciente** — natureza do solicitante, faixa etária e nome
   do paciente; se detectada gravidade, só confirma se o solicitante está no local.
3. **Identificação e localização da urgência** — *"a principal atividade do TARM"*; **quatro
   perguntas protocolares de endereço** (endereço → avenida conhecida próxima → referência para
   entrar na rua → referência próxima do número); transferência interunidades pede leito, andar,
   enfermaria e tempo de internação.
4. **Identificação preliminar dos "3S" da Regulação** — Síndromes de Forte Valência Social,
   Etiologia Potencialmente Grave e Semiologia Potencialmente Grave; para a última, o **Protocolo
   Master (RM2)** com **sete perguntas** (consciência ×3, respiração ×1, circulação ×3).

   Registro eletrônico exigido: **queixa principal** (localizada no tempo), **apelido da
   ocorrência** — escolhido entre **43 apelidos-padrão**, cada um ligado a um protocolo de
   regulação (AVC, Dor torácica, Queda, PCR, Remoção...) —, **3S positivo/negativo** e **queixas
   adicionais**. A cartilha registra *"Dos 16 tipos de ligação cadastrados no sistema de
   regulação..."* (a lista impressa enumera 17: AMV/IMV, Atendimento, Cobrança, Desistência, Queda
   de ligação, Trote, Regulação, ..., Administrativo, Particular, Reclamação, Serviço Social,
   Solicitação via CIOPS, Transporte); só engano, informação, ligação de equipe e trote dispensam
   passar ao médico regulador.

**Santa Catarina — Manual de Condutas e Procedimentos Operacionais SAMU (Deliberação CIB
176/2021)** ([PDF no COSEMS-SC](https://www.cosemssc.org.br/wp-content/uploads/2022/07/ANEXO-DELIBERACAO-176-2021-MANUAL-SAMU.pdf),
acesso 24/08/2026) — atribuições do TARM (item 2.2.2): *"a. Atender o chamado ao primeiro toque do
telefone. b. Perguntar e registrar o nome do solicitante e o tipo de chamado. [...] g. Preencher
todos os campos no sistema específico do SAMU, coletando os dados necessários como **nome, idade,
endereço, pontos de referência, queixa principal**. h. Transferir o chamado o telefone para o
Médico Regulador junto com o envio das informações pertinentes. i. Se acontecer qualquer tipo de
problema na ligação deverá retornar a ligação para o solicitante."* Contingência de comunicação
com a frota: *"Nos locais onde ainda existem áreas de sombra e sem sinal [...] a comunicação
poderá ser feita via WhatsApp, devendo ser imediatamente retomada via rádio ou telefone"*.

### 2.4 Convergências e variações (síntese do que está nos documentos acima)

**Converge em todas as fontes** (norma + 2 manuais de sistema + 2 protocolos locais):

1. **Ordem canônica**: telefone (automático quando há integração de telefonia) → nome do
   solicitante → queixa/motivo **em texto livre curto, com as palavras do solicitante** → endereço
   com referências → classificação (natureza/apelido/prioridade) → **transferência ao médico
   regulador** (a ligação vai junto — handoff de voz + registro).
2. **Texto livre + classificação estruturada convivem**: os dois manuais de sistema pedem queixa
   sucinta em campo aberto E uma rotulação (apelido / natureza-incidente / prioridade) por tabela.
3. **Desvios padronizados**: trote, engano, informação e ligação de equipe têm botão/tipo próprio
   e encerram sem médico (trote exige registrar o telefone; tudo gera protocolo).
4. **Anti-duplicidade**: os dois sistemas mostram histórico por telefone/bairro/endereço
   (24h no MV-PR; "ligações anteriores" no e-SUS SAMU) e têm mecanismo de **complemento** em vez
   de nova ocorrência.
5. **O TARM digita sob relógio**: contador com alerta de tempo excedido (MV-PR, limiar
   parametrizado) e metas de protocolo local (Fortaleza, §3.3).

**Varia por fornecedor**: layout e ordem exata dos campos; obrigatoriedade campo a campo; tabela
de classificação (prioridade alta/média/baixa/AMUV no MV-PR × 43 apelidos-padrão + 3S em
Fortaleza × "tipo de chamado" em SC); mecanismo de envio ao médico (fila automática × escolha de
médico logado); presença de mapa; e a integração de telefonia (§4 do doc — de BINA simples a
módulo de PABX com gravação).

---

## §3 — Metas e números normativos vigentes

### 3.1 Normas localizadas (com o que cada uma fixa)

| Norma | O que fixa (relevante ao fluxo do TARM/CRU) | Situação da fonte |
|---|---|---|
| **Portaria GM/MS 2.048/2002** | Perfil e competências do TARM ("anotar dados básicos: localização, identificação do solicitante, natureza da ocorrência; questionário próprio") e do Rádio-Operador; para o médico regulador, *"impõe-se a gravação contínua das comunicações, o correto preenchimento das fichas médicas de regulação"*; grade de capacitação de "Telefonistas Auxiliares de Regulação e Rádio-Operadores" com **carga total de 56h** (cap. VII, quadro A-3) | ✅ texto integral lido no [espelho CBMERJ](http://www.cbmerj.rj.gov.br/wp-content/uploads/2022/04/portaria_2048_2002_ms.pdf) (acesso 24/08/2026); original BVS-MS fora do ar (503) |
| **Portaria GM/MS 2.657/2004** | *"Atribuições das centrais de regulação médica de urgências e o dimensionamento técnico para a estruturação e operacionalização das Centrais SAMU-192"* — texto hoje consolidado como **Anexo 4 do Anexo III da Portaria de Consolidação nº 6/2017 (art. 55)** | ⚠️ texto integral **não acessado** (BVS-MS 503; espelhos 404/503) — referência e citação do art. 55 obtidas no documento oficial do MS abaixo; **a levantar** o inteiro teor |
| **Portaria GM/MS 1.010/2012** | Redefine as diretrizes de implantação do SAMU 192 e da CRU (consolidada no Anexo III da Portaria de Consolidação nº 3/2017); base dos **portes de CRU** usados no dimensionamento | ⚠️ texto integral **não acessado** (503 em todos os espelhos tentados) — **a levantar**; efeitos vigentes citados via PRC 3/2017 e documento do MS abaixo |
| **Portaria de Consolidação GM/MS nº 3/2017** (Anexo III — RUE) | Conceito vigente de CRU: *"Estrutura física constituída por profissionais (médicos, telefonistas, auxiliares de regulação médica e rádio-operadores) capacitados em regulação dos chamados telefônicos que demandam orientação e/ou atendimento de urgência, por meio de uma classificação e priorização das necessidades de assistência em urgência..."* | ✅ citação literal via documento oficial CGURG/DAHU/SAES/MS (linha abaixo); inteiro teor da PRC não acessado diretamente (BVS-MS 503) |
| **Programa Arquitetônico Mínimo — CRU SAMU 192 (CGURG/DAHU/SAES/MS)** | Sala de Regulação deve ter: *"e) Sistema de telefonia com número suficiente de linhas disponíveis à população, número de aparelhos telefônicos adequado aos postos de trabalho de médicos e auxiliares de regulação e equipamento de fax; f) Sistema de comunicação direta entre os rádios-operadores, as ambulâncias [...]; g) **Sistema de gravação digital contínua** para registro de toda a comunicação efetuada por telefone e rádio, com acesso protegido, permitido apenas às pessoas autorizadas pela Coordenação do Serviço; h) **Sistema de gestão informatizado** para arquivamento dos registros gerados pela regulação"*; cada posto de trabalho = 2 m²; dimensionamento da equipe pelo **Anexo I** (tabela em 3.2) | ✅ [PDF oficial no gov.br](https://www.gov.br/saude/pt-br/composicao/saes/samu-192/publicacoes/programa-arquitetonico-minimo-central-de-regulacao-das-urgencias) (acesso 24/08/2026) |
| **Resolução CFM 2.110/2014** (modificada pelas Res. 2.132/2015 e 2.139/2016) | Art. 8º, §2º: *"Para fins de boa assistência e segurança aos pacientes, **é obrigatória a gravação de todas as ocorrências médicas pela central de regulação** do serviço de atendimento pré-hospitalar móvel de urgência e emergência."* Art. 9º: recomenda 1h de descanso remunerado a cada 5h para o médico regulador em plantão de 12h | ✅ [PDF no CFM](https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2014/2110_2014.pdf) (acesso 24/08/2026) |
| **Portaria GM/MS 1.997/2023** (altera as PRC 3 e 6/2017) | Processo vigente de habilitação/custeio: SES habilita a CRU e as unidades móveis no CNES; o MS (CGURG/DAHU/SAES) homologa e autoriza o custeio mensal via FNS; **qualificação válida por 3 anos** (art. 928); manutenção do incentivo de unidade qualificada exige **relatório descritivo analítico anual** (art. 929) | ✅ [PDF do texto DOU no repositório CONASEMS](https://conasems-ava-prod.s3.sa-east-1.amazonaws.com/institucional/orientacoes/portaria-1-997-de-2023-altera-as-portarias-de-consolidacao-no-3-e-no-6-de-2017-para-tratar-da-habilitacao-da-homologacao-e-do-financiamento-dos-servicos-da-rede-de-atencao-as-urgencias-e-emergencias-1701201334.pdf) (acesso 24/08/2026). ⚠️ Nota: o doc 09 deste repo cita relatório **semestral** com base na 1.010/2012; o texto vigente de 2023 fixa **anual** para unidades qualificadas — conciliar quando o inteiro teor da 1.010 estiver acessível |
| **Manual "A Regulação Médica das Urgências" (MS, 2006)** | Funcionamento da CRU: acesso pelo **192 gratuito**; *"funcionamento ininterrupto, contando com pelo menos um médico regulador e correspondentes TARM/RO de plantão presencial na sala de regulação, nas 24 horas"*; *"todo chamado deve ser atendido pelo telefonista auxiliar de regulação médica e, após a devida identificação e localização do solicitante, ser repassado ao médico regulador"*; trotes/enganos são registrados *"mas não contabilizados como 'caso'"* | ✅ [PDF oficial no gov.br](https://www.gov.br/saude/pt-br/composicao/saes/samu-192/publicacoes/regulacao_medica_urgencias.pdf) (acesso 24/08/2026) |

### 3.2 Dimensionamento de equipe da CRU por população (Anexo I do Programa Arquitetônico do MS)

Tabela reproduzida do documento oficial (que a ancora nos portes da PRC nº 3/2017, Anexo 3 do
Anexo III) — acesso 24/08/2026:

| População coberta | Médicos Reguladores (dia/noite) | TARMs (dia/noite) | Rádio-Operadores (dia/noite) | Total (dia/noite) |
|---|---|---|---|---|
| até 1.500.000 | 03 / 02 | **05 / 03** | 01 / 01 | 09 / 06 |
| 1.500.001 a 3.750.000 | 07 / 05 | **10 / 07** | 03 / 02 | 20 / 14 |
| acima de 3.750.001 | 15 / 12 | **31 / 25** | 11 / 08 | 57 / 45 |

(Leitura factual — aritmética sobre a tabela: a proporção TARM:médico regulador fica entre ~1,4:1
nos portes menores e ~2,1:1 no porte maior.)

### 3.3 Metas de tempo — o que é norma nacional × o que é protocolo local

- **Norma nacional (MS, 2006):** para o **médico regulador** — *"ao receber o caso, deverá, num
  curto espaço de tempo (**de 30 segundos a 1 minuto**), [...] julgar a gravidade de cada caso"*
  (Manual A Regulação Médica das Urgências, gov.br, acesso 24/08/2026). **Não foi localizada meta
  nacional de tempo em minutos para a etapa do TARM** nos textos acessados (2048/2002 e manual
  2006) — o limite numérico aparece em protocolo local e como parâmetro configurável de sistema.
- **Protocolo local (Fortaleza, RM4, 2023):** etapa do TARM (Protocolo RM1 — acolhimento +
  identificação + localização) — **"1 Minuto"** ideal, e *"esse tempo não pode se estender por
  mais de 3 minutos"* (extrapolou → informar médico regulador/gestor de qualidade); Protocolo RM2
  — 1 minuto em prioridade máxima, 3 minutos nos demais (*"Não fazer perguntas aleatórias"*).
- **Parâmetro de sistema (PR/MV, 2018):** o contador do TARM dispara alerta ao atingir *"o tempo
  médio do atendimento (parametrizado no sistema)"* — ou seja, o limiar é configuração da central,
  não constante nacional.

### 3.4 Números de operação real publicados (com fonte)

| Número | Contexto | Fonte |
|---|---|---|
| Tempo dentro da central de regulação: **26:40 (jan/2022) → 10:08 (jun/2023)** | SAMU Médio Paraíba-RJ; análise de ~74 mil ocorrências no banco do sistema Sys4web | [Resumo CONASUS 2023, DOI 10.51161/conasus2023/22459](https://ime.events/conasus2023/pdf/22459) (acesso 24/08/2026) |
| Tempo-resposta total (início da ligação → chegada): **45:30 → 22:45**; classificação vermelha: **32:57 → 17:44**; tempo de VTR: 17:50 → 12:37 | idem | idem |
| Resolutividade dentro da central (casos resolvidos sem envio de viatura): **18% → 26%** | idem | idem |
| **772.931 ligações (2019) → 1.245.276 ligações reguladas (2025)** | Rede estadual SAMU-PR após unificação do atendimento telefônico e da regulação no Sistema Care (2020); 399 municípios | [Espelho da notícia SESA-PR de 30/06/2026](https://ilustrado.com.br/com-100-de-cobertura-integracao-de-sistemas-e-frota-renovada-parana-consolida-rede-do-samu/) (acesso 24/08/2026) |
| Duração das ligações atendidas: ~59% entre 1–2 min; ~25% abaixo de 1 min | Estudo em periódico (Escola Anna Nery) sobre atendimentos do SAMU 192 | ⚠️ **não verificado** — [URL](https://www.scielo.br/j/ean/a/jqr8vfFBg7S6CgcvxjGW6tv/) bloqueada pelo proxy em 24/08/2026; números vistos apenas em resumo de busca — **a levantar** antes de citar em peça |
| Ganho de "cerca de cinco minutos" no procedimento de atendimento do chamado com o software da Sys 4 Web | Campinas-SP, notícia da prefeitura | ⚠️ **não verificado** — conteúdo original fora do ar (§0); **a levantar** |

---

## §4 — Implicações para o CoPilot (curto)

As implicações abaixo são **inferências nossas** a partir dos fatos dos §§1–3 — rotuladas como
tal, para não se misturarem com o que é fato publicado.

**O que o modo "IA sobre digitação" precisa respeitar para conviver com esses sistemas:**

1. **O TARM já trabalha sob relógio e sob protocolo.** Meta local de 1 min (teto 3) na etapa do
   TARM em Fortaleza; contador com alerta de excesso no sistema do PR; manuais mandando atender ao
   primeiro toque. *Inferência:* qualquer exigência de clique, campo novo ou segunda tela **dentro
   da chamada** compete com a meta do operador; a camada de IA só convive se for de **leitura**
   (zero input adicional durante o atendimento) — coerente com a postura 100% passiva já
   registrada no doc 09.
2. **O telefone já chega preenchido onde há integração de telefonia.** BINA no e-SUS SAMU,
   DDD+fone automático via PABX no sistema do PR, "identificador de chamadas" no Iris.
   *Inferência:* o CoPilot não deve pedir/duplicar captura de número; o ponto de acoplamento
   natural é a **sinalização de telefonia** (SIPREC, conforme doc 09), que existe de forma
   independente do CAD em uso.
3. **A matéria-prima textual é curta e ditada pelo solicitante.** Os dois manuais de sistema
   mandam registrar a queixa "com as palavras do solicitante", sucinta; a classificação
   estruturada (apelido/natureza/prioridade) vem logo depois. *Inferência:* a IA sobre digitação
   verá **texto livre curto + um rótulo** — o valor está em cruzar isso com o áudio, não em exigir
   texto mais rico do TARM.
4. **Rechamada e complemento são fluxo normal, não exceção.** Ambos os sistemas têm painel
   anti-duplicidade (telefone/bairro/endereço) e mecanismo de complemento; Fortaleza tipifica
   "cobrança" como ligação própria. *Inferência:* o CoPilot precisa tratar ligações repetidas como
   **a mesma ocorrência** (associação por telefone/endereço), senão infla ocorrência e erra
   métrica.
5. **Não há monopólio de sistema — e não se pode presumir API.** Público oficial (e-SUS SAMU, com
   código-fonte aberto para download), estadual próprio (CARE/PR), e ao menos três fornecedores
   privados nomeados em fontes públicas (MV, Sys4web, Velp), além de sistemas municipais não
   nomeados. *Inferência:* integração por API teria de ser negociada caso a caso; o shadow por
   telefonia é o único caminho **uniforme** entre centrais — e o e-SUS SAMU, por ter código-fonte
   público, é o único integrável por inspeção direta.
6. **Gravação contínua é obrigação normativa — o áudio existe em toda CRU regular.** Programa
   arquitetônico do MS ("sistema de gravação digital contínua... com acesso protegido") e CFM
   2.110/2014 (art. 8º, §2º). *Inferência:* a matéria-prima do CoPilot (áudio da chamada) já é
   requisito da central; o que o CoPilot precisa resolver é **governança de acesso** (a norma
   restringe o acesso à gravação a pessoas autorizadas pela coordenação do serviço) — cláusula de
   autorização no contrato, não hack técnico.
7. **O handoff TARM→médico é por voz + registro, com fila.** Nos dois sistemas o registro "viaja"
   para o médico (EM FILA/ENVIAR PARA; Despachar), e a ligação é transferida junto; sem médico
   logado, a solicitação espera. *Inferência:* o resumo automático do CoPilot tem alvo natural
   nesse handoff (o que o doc 09 chama de handoff digital) — e a fila "Aguardando" é um dos pontos
   onde atraso vira dado visível.

**A levantar em visita técnica** (lacunas declaradas desta pesquisa — nenhuma delas se presume):

- **Qual sistema roda na(s) central(is)-alvo da Samais** (nada público lista sistema por CRU) e
  qual versão/tecnologia (o manual MV-PR de 2018 descrevia stack com Flash — obsoleto; estado
  atual de cada instalação é desconhecido).
- **Estado de adoção do e-SUS SAMU**: quantas e quais centrais o usam hoje (a página do DATASUS
  não publica lista; confirmado apenas Fortaleza, 2023).
- **Fluxo do TARM no CARE Paraná e no vSkySAMU** (sem manual público localizado).
- **Como a telefonia se liga ao sistema em cada central real**: PABX com CTI/BINA integrado ao
  CAD × aparelho separado; existência de SIPREC ou porta de espelhamento; quem opera a gravação
  obrigatória e onde ela fica armazenada.
- **Tempo médio real da etapa do TARM** na central-alvo (o limiar do contador é parametrizado por
  central; os números do Médio Paraíba são de outra operação) — e o valor configurado do alerta.
- **Texto integral das Portarias 1.010/2012 e 2.657/2004** (e PRC 3 e 6/2017) quando o BVS-MS
  voltar — para fechar a régua normativa citável em peça externa (hoje ancorada no espelho da
  2048, no documento arquitetônico do MS, na CFM 2.110/2014 e na 1.997/2023).
- **Duração típica das ligações** com fonte verificável (o estudo SciELO ficou bloqueado; o dado
  de Campinas ficou sem página de origem).
- **Fornecedores dos sistemas de Barretos e Fernandópolis** (notícias não nomeiam) — úteis como
  proxy do mercado municipal paulista.

---

## §Registro

- **Pedido:** Ota, 24/08/2026 — benchmark dos softwares que operam CRU/SAMU 192 para calibrar o
  modo "IA sobre digitação" do CoPilot OS (convivência com o fluxo do TARM, sem atrapalhar).
- **Escopo executado:** varredura ampla (sistema oficial DATASUS, fornecedores privados que
  emergiram das fontes — MV, Sys4web, Velp —, sistema estadual próprio CARE/PR, sistemas
  municipais não nomeados), fluxo de digitação do TARM em dois manuais oficiais de sistema + dois
  protocolos operacionais públicos, camada normativa (2048/2002 · 2.657/2004 · 1.010/2012 ·
  PRC 3 e 6/2017 · CFM 2.110/2014 · 1.997/2023 · manuais MS 2006 e programa arquitetônico CGURG)
  e números de operação real com fonte.
- **Toda lacuna está declarada** no corpo (marcas ⚠️/a levantar) e consolidada na lista "a
  levantar" do §4; as fontes que falharam na rede estão no §0 — fonte fora do ar não foi tratada
  como inexistente, nem citada como se lida.
- Nenhum outro arquivo do repo foi alterado por este trabalho.
