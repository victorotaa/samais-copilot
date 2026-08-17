# Benchmarks Operacionais — ROTA / Transporte Sanitário Eletivo
## Referência interna Samais para dimensionamento e estimativa comercial

Última atualização: Agosto/2026
Origem: derivado do Estudo de Viabilidade ROTA · 21 Municípios (ago/2026)

> **Este arquivo substitui `benchmarks-samu.md` para linhas de transporte
> sanitário.** Não misturar: USB/USA/motolância, PNAU, tempo-resposta e
> taxa de regulação médica são parâmetros de urgência e **não têm
> equivalência** em transporte eletivo.

---

## 1 · Parâmetros epidemiológicos de demanda

Fonte primária. Atualizar quando sair novo censo.

| Parâmetro | Valor | Fonte |
|---|---|---|
| Prevalência de diálise · média nacional | **812 pmp** | Censo Brasileiro de Diálise 2024 · SBN |
| Prevalência · dispersão estadual conhecida | **431 – 806 pmp** | Censo SBN 2024 · Maranhão e Pernambuco |
| Incidência de diálise | 249 pmp | Censo Brasileiro de Diálise 2024 · SBN |
| Fração em modalidade de centro (HD + HDF) | **94,4%** | SBN 2024 · 87,3% HD + 7,1% HDF |
| Fração em diálise peritoneal (domiciliar, sem transporte) | 5,6% | SBN 2024 |
| Incidência de câncer no Brasil | 781 mil/ano | INCA · Estimativa 2026–2028 |
| Idem, exceto pele não melanoma | 518 mil/ano | INCA · Estimativa 2026–2028 |
| Taxa oncológica aplicável | **2.427 por milhão** | 518 mil ÷ 213,4 mi (IBGE 2025) |

### Premissas declaradas (recalibrar no 1º contrato)

| Premissa | Valor | Base do arbítrio |
|---|---|---|
| Fração de pacientes oncológicos que recebem radioterapia | 50% | Faixa de literatura 50–60%; adotado o piso |
| Sessões por tratamento radioterápico | 25 | Fracionamento convencional |
| Sessões de hemodiálise por paciente | 156/ano | 3 semanais × 52 |
| Dias úteis operacionais por ano | 300 | — |

### Fórmulas de dimensionamento

```
# Diálise — usar a taxa ESTADUAL quando disponível.
# Na ausência dela, calcular os dois extremos e apresentar banda.
prev_centro    = prev_estadual_pmp × 0,944        # se conhecida
prev_teto      = 812 × 0,944 = 766 pmp            # média nacional
prev_piso      = 431 × 0,944 = 407 pmp            # menor estado conhecido

Pacientes em diálise de centro = População × prev_centro/1e6
Viagens HD (ida e volta)/ano   = Pacientes × 156

# Oncologia — taxa nacional, ainda sem ajuste regional apurado.
Casos oncológicos novos/ano    = População × 2.427/1e6
Pacientes em radioterapia/ano  = Casos × 0,50
Viagens RT (ida e volta)/ano   = Pacientes RT × 25
```

**Benchmark consolidado:** as duas linhas cofinanciadas somam
**0,09 a 0,15 viagem por habitante por ano**. Use como verificação rápida —
se a modelagem divergir muito dessa faixa, há erro de conta.

> ⚠ **Nunca aplique os 812 pmp nacionais a carteira do Norte ou Nordeste
> sem ajuste.** O censo registra prevalência menor nessas regiões, com
> dispersão grande entre estados — Pernambuco em 806 pmp contra Maranhão
> em 431. Aplicar a média nacional **superestima** a demanda transportável
> em até 88%. Na ausência da taxa estadual, apresentar **banda**: teto pela
> média nacional, piso pela proporção do estado de menor prevalência
> conhecido na carteira. Nunca um número pontual.
>
> A prevalência menor reflete **menos acesso**, não menos doença — e para
> transporte isso é a métrica certa, porque só se transporta paciente já
> inscrito em programa.

> Transporte eletivo geral (consultas, exames, cirurgias, TFD) **não tem
> parâmetro confiável** e não está neste benchmark. Historicamente supera
> o volume de TRS + oncologia somados. Levantar caso a caso na central de
> regulação municipal — nunca estimar.

---

## 2 · Modelo de precificação em duas partes

**Custo direto operacional não é proporcional à população.** Ele tem um
bloco fixo que não escala e um bloco variável que acompanha frota e
quilometragem. **O per capita é resultado, nunca entrada.**

```
CDO      = custo fixo do regime + (veículos × custo por veículo)
veículos = viagens/dia útil ÷ 8 pacientes consolidados ÷ 2,5 viagens/veículo
Preço    = CDO × 1,35
```

### Bloco fixo mensal

| Componente | Contrato isolado | Bloco consorciado |
|---|---|---|
| Coordenação operacional | R$ 11.050 | R$ 10.200 |
| Supervisão de frota | R$ 6.800 | compartilhada |
| Central de regulação | R$ 11.220 · 3 op. | R$ 7.480 · 2 op. |
| Administrativo e faturamento | R$ 4.250 | R$ 4.250 |
| Triagem e acolhimento | R$ 7.650 | compartilhada |
| Sede, sistemas, utilidades, EPI | R$ 11.000 | R$ 7.000 |
| **Custo fixo** | **R$ 51.970** | **R$ 28.930** |

Salários com **encargos de 70%** — INSS, FGTS, férias, 13º e provisões.

### Bloco variável · por veículo/mês, a 5.000 km

| Item | Frota própria | Frota cedida |
|---|---|---|
| Motorista com cobertura · 1,2 FTE | R$ 4.896 | R$ 4.896 |
| Combustível e manutenção · R$ 1,40/km | R$ 7.000 | R$ 7.000 |
| Depreciação ou locação | R$ 3.500 | **R$ 0** |
| Seguro e rastreamento | R$ 600 | R$ 600 |
| **Total** | **R$ 15.996** | **R$ 12.496** |

> A cessão de frota **não muda o payback** — muda o preço. A depreciação
> está no custo e é repassada, então a cessão reduz o valor do contrato em
> ~13% com resultado proporcional preservado. O ganho é **competitivo**:
> entrar em edital com preço menor sem comprimir a composição.

---

## 3 · Piso Operacional Mínimo

Sem histórico próprio, o piso não sai de expectativa de resultado — sai
**do que quebra a operação**. Três testes cumulativos; o contrato só entra
se passar nos três.

| Teste | Critério | Por quê |
|---|---|---|
| **1 · Participação do fixo** | ≤ 55% do CDO | Acima disso não sobra variável para cortar quando o volume frustra, e toda queda de demanda vira prejuízo direto |
| **2 · Frota mínima** | 2 veículos + reserva | Com um único veículo, uma quebra para a operação inteira e o SLA cai no primeiro mês |
| **3 · Cobertura no piso da banda** | demanda mínima | A banda de pacientes é de quase 2×; dimensionar e precificar pelo teto é apostar que a demanda alta se confirma |

| Regime | Piso de preço | População equivalente | Per capita no piso |
|---|---|---|---|
| **Contrato isolado** | **R$ 127.563/mês** | ~131 mil hab | R$ 0,98 |
| **Bloco consorciado** | **R$ 89.805/mês** | ~98 mil hab | R$ 0,91 |

**Município sem bloco adjacente teria de sustentar sozinho o piso
consorciado.** Para 6 mil habitantes isso são R$ 14,53 por habitante ao
mês — inviável em qualquer cenário. É o teste que descarta, não o preço.

### Rateio dentro do bloco

O valor de cada município é o **rateio populacional do bloco**. É assim que
consórcio cobra, e explica por que municípios do mesmo bloco pagam per
capita diferente: todos carregam o mesmo fixo, diluído em populações
distintas.

### Contrato de preço fixo é perigoso em operação nova

Com banda de demanda de quase 2×, valor global mensal joga todo o risco de
volume para a Samais. No primeiro contrato, propor **base fixa mais faixa
variável por viagem**, ou preço fixo com cláusula de revisão atrelada a
volume apurado.

---

## 4 · Marco regulatório e cofinanciamento

Três portarias publicadas em **11 de maio de 2026**:

- **GM/MS 11.164** — altera a Portaria 8.516/2025; regulamenta o transporte
  sanitário na forma dos arts. 2º-A e 2º-B da Lei nº 12.732/2012
- **GM/MS 11.165** — deslocamento de pacientes
- **GM/MS 11.179** — transporte em radioterapia e em Terapia Renal
  Substitutiva na modalidade hemodiálise

### Parâmetros que filtram qualquer carteira

| Regra | Valor | Consequência |
|---|---|---|
| Piso de distância | **> 50 km** | Elimina conurbações |
| Teto de raio | **≤ 500 km** | Elimina origens extremas |
| Radioterapia | interestadual **e** intermunicipal | Aceita cruzar divisa |
| Hemodiálise | **apenas âmbito estadual** | **Não** cobre fluxo interestadual |
| Impacto fiscal federal · radioterapia | R$ 26.047.440/ano (2026) | — |

> **Diferença estrutural em relação ao SAMU:** o cofinanciamento do SAMU é
> plano, 50% federal, por habilitação. O do ROTA é **reembolso por
> procedimento na tabela SUS**, condicionado a distância e limitado por
> raio. O template "50% federal + 50% local" **não se aplica**.

### Origem vs destino — o erro mais caro da análise

O cofinanciamento remunera o deslocamento **a partir do município de
origem**. Um município que é polo de diálise ou radioterapia **não captura
essa receita** — quem captura são os vizinhos que enviam pacientes.

Para polos, ancorar a proposta em **transporte eletivo intramunicipal** e
**TFD de saída para a capital**, nunca no gatilho da portaria.

---

## 5 · Alertas comerciais

1. **Confirmar distância em base rodoviária oficial antes de qualquer
   manifestação formal.** Um erro de faixa muda a qualificação nos 50 km e
   derruba a premissa de receita inteira.

2. **Verificar a rede habilitada em CNES**, não a rede anunciada. Serviço
   de diálise interditado ou em implantação muda o polo de referência — e
   o polo define a distância, que define a faixa, que define o preço.

3. **Consórcio de transporte sanitário raramente existe.** Formar um leva
   de 12 a 18 meses e depende de lei em cada câmara municipal. Priorizar
   adesão a consórcios de saúde já constituídos na região.

4. **Cruzar com a base de contratos SAMU vigentes antes de sustentar
   cross-sell.** Sem sobreposição geográfica real, o argumento de "mesmo
   decisor, mesmo orçamento" não se aplica e o custo de aquisição
   comercial é o de expansão nova.

5. **Frota cedida é condição de proposta, não detalhe operacional.**
   Define payback de 6–14 meses contra 25–36 meses.
