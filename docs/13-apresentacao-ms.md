# Apresentação ao Ministério da Saúde — briefing da peça

> Registro do que foi produzido, com que regras, e o que ainda depende de decisão.
> A peça vive em `apresentacao-ms/index.html` (documento HTML único, abre por
> `file://`, sem servidor e sem build). Conteúdo técnico de origem: `docs/10`
> (estado real), `docs/11` (tecnologia e custos), `docs/12` (fases e critérios).

---

## 1. O fato

O Ministério da Saúde manifestou interesse na ideia do CoPilot OS (registrado em
agosto de 2026). **Campos a preencher pelo Ota antes da reunião** — o Princípio da
Realidade vale também para o registro do próprio contato:

- Quem manifestou o interesse (nome/área): _a preencher_
- Canal e data do contato: _a preencher_
- Formato e data da apresentação: _a preencher_

Não havia registro anterior de relação institucional com o Ministério no Samais-OS.
O registro paralelo vive em `samais-os/transversais/institucional/ministerio-saude.md`.

## 2. Audiência e objetivo

Órgão federal com corpo técnico próprio (DATASUS, coordenação de urgência). É a
audiência que **menos tolera número sem fonte** e que pode pedir a memória de cálculo
de qualquer afirmação.

Objetivo da peça: apresentar o produto, sua premissa e seus desdobramentos, e propor
colaboração técnica. **Não é peça comercial** — não vende contrato, não cita preço de
serviço, não pede recurso.

## 3. Decisões que moldaram a peça

| Decisão | Razão |
|---|---|
| **Documento longo HTML** (não slides) | Decisão do Ota (11/08). A versão em slides é feita **depois** da validação deste documento, no mesmo padrão canônico. |
| **Objetiva, não extensa** | Decisão do Ota (11/08): peça longa cansa. Nove seções compactas; leitura de ~10 minutos. |
| **Sem frente-piloto e sem contratos nomeados** | Decisão do Ota (11/08): não há definição de qual contrato recebe o piloto. A peça fala do produto, não da carteira. |
| **Números como metas com método de aferição** | Decisão do Ota (11/08). Nenhum resultado de performance próprio é afirmado — o produto não roda em operação (`docs/10`). |
| **Custos operacionais incluídos** | Pedido do Ota (11/08). Projeção de plataforma por central, com base de cálculo declarada e preços de tabela pública (§8 da peça, modelo em `docs/11` §3). |

## 4. Doutrina aplicada

- **Padrão FRIO** (`samais-os/doutrina/padrao-frio.md`): tom neutro e factual, sem
  advocacy; **zero menção a concorrente**, a risco do ente ou a análise política;
  dado ausente vira convite ("a detalhar em agenda técnica com o DATASUS").
- **Precificação** (`samais-os/doutrina/precificacao.md`): nenhuma palavra vetada
  (lucro, margem, ROI, markup, fee) e **nenhuma composição de valor contratual** — os
  custos apresentados são de plataforma tecnológica, não de contrato de serviço.
- **Identidade** (`samais-os/doutrina/samais.css`): tokens copiados verbatim; ouro
  escasso; dados em mono tabular; liquid glass com refração (`glass-filter.html`);
  **SVGs oficiais** da marca embutidos (wordmark no desktop, monograma SA+ no mobile);
  sem emoji, sem brasão, sem gradiente colorido. Impressão em versão light.
- **Princípio da Realidade**: cada número é (a) referencial público com fonte na lista
  de referências ou (b) meta de projeto declarada como tal.

## 5. Como a tensão foi resolvida

O padrão FRIO proíbe "nota metodológica visível" e "alerta de dado estimado"; o
Princípio da Realidade proíbe número sem lastro. A saída aplicada na peça:

1. **Referências bibliográficas discretas** (numeradas, em mono, ao fim) — referência é
   sinal de rigor, não alerta de fragilidade.
2. **Linguagem afirmativa de projeto**: "meta", "critério de liberação", "método de
   aferição" — em vez de "estimado" ou "aproximado".
3. **A honestidade vira argumento**: a seção 7 propõe explicitamente que os ganhos
   sejam *medidos*, inclusive quando não confirmarem as metas. Diante de órgão de
   controle, isso é mais forte do que qualquer percentual afirmado.

## 6. Estrutura — v2, em dobras (11 dobras)

Reescrita em **dobras** no padrão da LP e do ROTA (decisão do Ota, 11/08): uma ideia por
dobra, banda de imagem com parallax, revelação ao rolar, nav fixa com seção ativa.

| # | Dobra | Âncora visual |
|---|---|---|
| 00 | **Capa** — o que é, em uma frase | banda (voz→dado) + 3 números |
| 01 | **O problema** — quatro dores, com fonte normativa | banda (registro manual) + 4 cartões |
| — | **Virada** — "reconstruído × medido" | tipografia grande |
| 02 | **Copiloto, não piloto** — cinco regras | 5 blocos de vidro com ícone |
| 03 | **Como funciona** — o ciclo, do 192 ao hospital | **linha do tempo T0–T4 em SVG** |
| 04 | **Indicadores** — o que o sistema mede | tabela + 3 cartões |
| 05 | **Por que é inovador** | 3 cartões |
| 06 | **Fases F0–F3** — critério objetivo de liberação | trilha com "para liberar" |
| 07 | **Metas** — o que se propõe medir | tabela |
| 08 | **Custos** — em reais | **gráfico de faixas em SVG** + 3 números |
| 09 | **Proposta** — três frentes de colaboração | banda (rede) + 3 cartões |

### Decisões de v2

| Decisão | Razão |
|---|---|
| **Moeda em real** | Pedido do Ota (11/08). Câmbio declarado em referência própria (nº 6) — os fornecedores cobram em dólar e o valor varia com o câmbio; omitir a taxa tornaria o número não auditável. |
| **Linguagem simplificada** | Pedido do Ota (11/08): a audiência é de gestão, não de engenharia. "Modo degradado" virou "dá para desligar a IA"; "espelhamento" virou "recebe uma cópia do áudio"; "multi-inquilino" virou "cada central com seus dados separados". |
| **Imagens abstratas geradas, nunca cena operacional** | Foto de operação que a Samais não pode comprovar é o mesmo risco que a peça passa a sessão evitando. As três bandas são grafismo abstrato (onda→dado, registro disperso, rede) e **não afirmam fato nenhum**. As fotos existentes do repo foram descartadas: uma mostra viatura de Santa Catarina (não há frente lá) e outra tem pessoa identificável. |
| **Refração desligada nos gráficos** | O `url(#glassDistort)` entorta linha reta e texto. O vidro (blur, borda, brilho) permanece; a refração sai só nas superfícies de dado — mesma lógica pela qual ela já sai no mobile. |
| **Fontes embutidas (woff2, subset latin)** | A peça é aberta em sala de reunião. Sem rede, a identidade inteira cairia para Arial. Agora o arquivo **não faz nenhuma requisição externa**. |
| **Faixa desenhada como faixa** | O gráfico de custos mostra cada componente do mínimo ao máximo, não uma barra a partir de zero — encoding honesto para um intervalo. |

## 7. Verificação executada

- `grep` de termos proibidos (lucro, margem, ROI, markup, fee, BDI, CDO, concorrente,
  "comprovado") → zero.
- `grep` de hex fora da paleta canônica → só tokens de `samais.css` (e a paleta light
  documentada, no bloco de impressão).
- Emoji → zero. **Dependências externas → zero** (fontes e imagens embutidas em base64).
- Estrutura HTML balanceada; abre por `file://` sem servidor.
- Renderizada em navegador real (1440 e 390 px): sem transbordo horizontal, sem erro de
  console, 30/30 elementos de revelação disparando.
- Geometria dos gráficos conferida contra os números do texto (a v1 tinha barra de
  R$ 230–410 desenhada com largura de ~R$ 181).
- Impressão conferida em PDF: fundo branco, sem retângulo preto, texto legível — os
  tokens são sobrescritos na raiz, e não seletor a seletor.
- Citações ↔ referências: 6 usadas, 6 listadas, nenhuma órfã dos dois lados.

## 8. Pendências e condicionais

| Item | Decisão de quem |
|---|---|
| Preencher quem/canal/data do contato com o MS (§1) | Ota |
| Substituir as vinhetas de interface por capturas reais da demo, se desejado | Ota |
| Publicar ou não a peça (hoje **não** entra no deploy — o build só copia `lp/`) | Ota/André |
| Produzir a versão em slides após validação do documento | próxima rodada |
| Citar ou não a carteira de contratos como lastro operacional | Ota (hoje omitido por decisão) |
| ~~Converter os custos para reais~~ | **feito na v2** (câmbio declarado na referência nº 6) |
| Revalidar o câmbio se a apresentação for muito depois de 11/08/2026 | Ota |
