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

## 6. Estrutura (9 seções)

1. **Capa** — o que é, em uma frase.
2. **O problema** — quatro dores do registro da urgência, com fonte normativa.
3. **O produto e a premissa** — copiloto e não piloto; escuta passiva; modo degradado;
   gestor sem dado pessoal; trilha de auditoria.
4. **Como funciona** — ciclo da ocorrência com T0–T4 e desfecho.
5. **Relevância** — tabela de indicadores instrumentados contra os referenciais do MS.
6. **Por que é inovador** — explicabilidade, divergência como ativo, dado estruturado
   na origem (sem citar concorrente).
7. **Desdobramentos** — fases F0–F3 com critério objetivo de liberação.
8. **Ganhos esperados** — metas com método de aferição.
9. **Custos operacionais esperados** e **proposta de caminho** — acompanhamento de uma
   implantação, agenda técnica com o DATASUS, contribuição à agenda de inovação.

## 7. Verificação executada

- `grep` de termos proibidos (lucro, margem, ROI, markup, fee, BDI, CDO, concorrente,
  "comprovado") → zero.
- `grep` de hex fora da paleta canônica → só tokens de `samais.css` (e a paleta light
  documentada, no bloco de impressão).
- Emoji → zero. Dependências externas → apenas Google Fonts.
- Estrutura HTML balanceada; abre por `file://` sem servidor.

## 8. Pendências e condicionais

| Item | Decisão de quem |
|---|---|
| Preencher quem/canal/data do contato com o MS (§1) | Ota |
| Substituir as vinhetas de interface por capturas reais da demo, se desejado | Ota |
| Publicar ou não a peça (hoje **não** entra no deploy — o build só copia `lp/`) | Ota/André |
| Produzir a versão em slides após validação do documento | próxima rodada |
| Citar ou não a carteira de contratos como lastro operacional | Ota (hoje omitido por decisão) |
| Converter os custos para reais com câmbio da data | Ota, na apresentação |
