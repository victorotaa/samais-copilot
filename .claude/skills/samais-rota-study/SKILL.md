---
name: samais-rota-study
description: >
  Produz estudo de viabilidade, demanda, retorno e precificação per capita para contratos de
  TRANSPORTE SANITÁRIO da Samais (ROTA / TSE / TFD / remoção inter-hospitalar / hemodiálise /
  radioterapia). Use SEMPRE que a linha de serviço for transporte de pacientes — municípios,
  listas de municípios, consórcios ou regiões. Triggers: "ROTA", "transporte sanitário", "TSE",
  "TFD", "transporte eletivo", "hemodiálise", "radioterapia", "Caminhos da Saúde", "PAC Saúde",
  "3.300 veículos", "estudo de viabilidade [cidade/região]", ou uma lista de municípios
  apresentada em contexto de prospecção de transporte. Para SAMU, UPA ou Hospital use
  `samais-municipal-study`.
---

# Samais — Skill: Estudo ROTA / Transporte Sanitário

## Relação com as outras skills

Esta skill é **irmã** de `samais-municipal-study`, não substituta.

| Camada | Origem |
|---|---|
| **Doutrina comercial** — dois outputs, BDI decomposto, cenários, score, marcação de dado ausente, fechamento per capita | Herdada de `samais-municipal-study` |
| **Composição de preço · BDI 35%** | `samais-municipal-study/references/composicao-preco.md` — **mesma tabela, não duplicar** |
| **Identidade visual** | `samais-brand-guidelines` |
| **Benchmarks, varredura, cofinanciamento, dimensionamento** | `references/benchmarks-rota.md` — **específicos desta skill** |

> **Nunca use `benchmarks-samu.md` aqui.** USB/USA/motolância, PNAU,
> tempo-resposta e taxa de regulação médica não têm equivalência em
> transporte eletivo. O SAMU dimensiona contra um piso regulatório; o ROTA
> dimensiona contra **geometria de demanda**.

---

## O princípio que organiza tudo

**O que determina a receita não é a população — é a posição do município no
fluxo e a distância até o polo.**

Um município de 300 mil habitantes que já é polo de hemodiálise e
radioterapia gera menos receita de transporte intermunicipal que um de 30
mil situado a 160 km do polo mais próximo. Toda análise que ordenar a
carteira por porte populacional estará errada.

---

## FASE 1 — Qualificação

Confirmar ou extrair do contexto antes de pesquisar:

1. **Alvo** — município, lista, consórcio ou região (nome exato + UF)
2. **Linha de serviço** — TSE municipal / hemodiálise / radioterapia / TFD /
   remoção inter-hospitalar / combinação
3. **Gatilho** — edital publicado, frota recebida via PAC, crise de acesso,
   indicação política, renovação
4. **Frota** — o município recebeu veículo do Caminhos da Saúde? *(define
   payback; é a pergunta mais importante da fase)*
5. **Operador atual** — prefeitura direta, terceirizado, inexistente

Sem (1), (2) e (4), **perguntar antes de prosseguir**.

### Atestado de cadastro — obrigatório e bloqueante

Antes de qualquer modelagem, verificar **município a município**:

- **UF correta** — determina se o fluxo é intra ou interestadual, e a linha
  de hemodiálise **só cobre âmbito estadual**
- **População** — é o denominador de toda a precificação per capita
- **Grafia oficial** — nomes errados travam busca em CNES, PNCP e IBGE

Reportar divergências explicitamente. Nunca corrigir em silêncio.

---

## FASE 2 — Varredura

Registrar fonte e data para cada bloco.

### 2.1 Cadastro e demografia
- `[município] [UF] população IBGE 2025 estimativa`
- Confirmar UF, população e grafia oficial

### 2.2 Polo de referência — o dado decisivo
- `clínicas de hemodiálise [UF] municípios`
- `radioterapia [UF] centro de oncologia acelerador linear`
- `[município] hospital regional macrorregião de saúde`
- Extrair: **onde o paciente é atendido**, e se o município é origem ou destino

### 2.3 Distância — verificar em base rodoviária, não estimar
- `distância [município] a [polo] km rodovia`
- Classificar na faixa A/B/C/D de `benchmarks-rota.md`
- **Nunca publicar distância não confirmada** — marcar `a confirmar`

### 2.4 Frota e cofinanciamento
- `[município] [UF] Caminhos da Saúde veículo entrega PAC Saúde`
- `[UF] transporte sanitário cofinanciamento portaria`

### 2.5 Rede habilitada
- CNES: serviços de TRS e radioterapia **efetivamente habilitados**
- Serviço interditado ou em implantação muda o polo, logo a distância,
  logo a faixa, logo o preço

### 2.6 Consórcios e contexto licitatório
- `consórcio intermunicipal saúde [região] [UF]`
- `licitação transporte sanitário [município] PNCP edital`

### 2.7 Curadoria visual
Seguir `samais-municipal-study` FASE 2.8, com uma substituição: a
linguagem visual do ROTA é **van e micro-ônibus sanitário, paciente
eletivo, estrada** — não ambulância, não cena de trauma. Não misturar com
a linguagem SAMU na mesma peça.

---

## FASE 3 — Modelagem

### 3.1 Demanda
Aplicar as fórmulas de `benchmarks-rota.md` §1. Verificação rápida:
**≈ 0,15 viagem por habitante por ano** nas duas linhas cofinanciadas.

### 3.2 Geometria de fluxo
Classificar cada município: **origem** (gera receita de deslocamento) ou
**destino** (não captura o cofinanciamento). Aplicar os filtros de piso de
50 km, teto de 500 km e restrição estadual da hemodiálise.

### 3.3 Precificação
Faixas A–D de `benchmarks-rota.md` §3. Preço = custo × 1,35.

### 3.4 Viabilidade — a etapa que a maioria pula
Testar cada município contra os pisos de `benchmarks-rota.md` §4. Depois
reagrupar em **blocos contíguos** com central compartilhada. Município sem
vizinho na carteira é descarte, por melhor que seja o preço per capita.

### 3.5 Composição do valor contratual
**BDI de 35% sobre CDO, decomposto por rubrica.** Usar a tabela canônica de
`samais-municipal-study/references/composicao-preco.md`.

**Nunca escrever "lucro", "margem" ou "lucratividade"** em nenhuma
superfície da proposta.

### 3.6 Retorno
Modelar payback nos dois cenários de frota — cedida e própria. A diferença
é estrutural e deve aparecer como tabela comparativa, nunca como nota.

---

## FASE 4 — Dois outputs

Regra herdada e inegociável: **audiências opostas, documentos separados.**

### OUTPUT A — Proposta Externa (`samais-rota-proposta-[alvo]-[YYYY-MM].html`)

Para prefeito, secretário de saúde, presidente de consórcio.

Seções: Capa · Apresentação Samais · O Território e o Fluxo de Pacientes ·
A Solução ROTA · O Financiamento que Viabiliza · Composição do Valor
Contratual · Tecnologia e Roteirização · Por Que a Samais · Próximos Passos

**Proibido:** risco, alerta, concorrente, fraqueza do ente público, nota
metodológica, premissa declarada, análise política, recomendação de
descarte, qualquer menção a município que não fecha conta.

### OUTPUT B — Dossiê Interno (`samais-rota-dossie-[alvo]-[YYYY-MM].html`)

Uso exclusivo Samais. Tudo do OUTPUT A **mais**: atestado de cadastro com
divergências, premissas declaradas separadas das de fonte primária,
viabilidade município a município com vereditos, riscos da carteira,
análise competitiva, sequenciamento de abordagem, recomendações de
descarte.

> **Erro recorrente:** produzir um documento único e levá-lo ao cliente.
> Um dossiê interno entregue a prefeito expõe a própria análise de
> fraqueza da Samais. Se só houver tempo para um, produza o **B** e trate-o
> como confidencial até que o A exista.

---

## FASE 5 — Integridade de dados

- Todo dado de fonte primária: citar fonte e data
- Toda premissa arbitrada: tabela própria, separada, marcada
- Toda distância não confirmada: `a confirmar` visível no documento
- **No OUTPUT A:** omitir ou usar "a detalhar em diagnóstico de campo"
- Nunca inventar. Ausência marcada é melhor que número inventado.

---

## FASE 6 — Entrega

1. Salvar os dois HTML
2. Apresentar o OUTPUT A primeiro
3. Resumir em chat, no máximo 6 bullets: veredito · blocos contratáveis ·
   receita e per capita · payback nos dois cenários de frota · 2–3 riscos ·
   próximo passo
4. Deploy: os projetos ROTA vivem no **Vercel** (`vercel --prod`), não no
   Netlify. Se a API não estiver alcançável no ambiente, entregar o arquivo
   e as instruções em vez de prometer link.

---

## Checklist de encerramento

- [ ] UF, população e grafia conferidas município a município
- [ ] Divergências de cadastro reportadas explicitamente
- [ ] Polo de referência identificado — origem ou destino
- [ ] Distâncias confirmadas ou marcadas `a confirmar`
- [ ] Filtros de 50 km, 500 km e restrição estadual aplicados
- [ ] Demanda batendo com ≈ 0,15 viagem/hab/ano
- [ ] Viabilidade testada contra os três pisos
- [ ] Blocos formados por contiguidade, não por conveniência
- [ ] BDI 35% decomposto · zero ocorrência de "lucro"
- [ ] Payback nos dois cenários de frota
- [ ] Dois outputs separados
- [ ] Premissas declaradas isoladas das de fonte primária
