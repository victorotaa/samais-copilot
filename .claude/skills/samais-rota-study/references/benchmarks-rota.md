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
| Prevalência de diálise | **812 pmp** | Censo Brasileiro de Diálise 2024 · SBN |
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
Pacientes em diálise de centro = População × 812/1e6 × 0,944
Viagens HD (ida e volta)/ano   = Pacientes × 156

Casos oncológicos novos/ano    = População × 2.427/1e6
Pacientes em radioterapia/ano  = Casos × 0,50
Viagens RT (ida e volta)/ano   = Pacientes RT × 25
```

**Benchmark consolidado:** as duas linhas cofinanciadas somam
**≈ 0,15 viagem por habitante por ano**. Use como verificação rápida —
se a modelagem de um município divergir muito disso, há erro de conta.

> Transporte eletivo geral (consultas, exames, cirurgias, TFD) **não tem
> parâmetro confiável** e não está neste benchmark. Historicamente supera
> o volume de TRS + oncologia somados. Levantar caso a caso na central de
> regulação municipal — nunca estimar.

---

## 2 · Custo operacional de referência

### Por veículo (van / micro-ônibus sanitário, ~5.000 km/mês)

| Componente | Frota própria | Frota cedida (PAC) |
|---|---|---|
| Motorista com encargos | R$ 4.200/mês | R$ 4.200/mês |
| Depreciação ou locação do veículo | R$ 3.500/mês | **R$ 0** |
| Seguro e rastreamento | R$ 600/mês | R$ 600/mês |
| Combustível | R$ 0,95/km | R$ 0,95/km |
| Manutenção e pneus | R$ 0,45/km | R$ 0,45/km |
| **Custo por km a 5.000 km/mês** | **R$ 3,06** | **R$ 2,36** |

A cessão de frota via **Caminhos da Saúde / Novo PAC** derruba o custo por
quilômetro em **23%**. É a única variável do modelo com efeito duplo:
permite ofertar preço mais competitivo em edital **e** preservar margem.
Sempre condicionar a proposta à cessão quando o município for beneficiário.

### Central de regulação e coordenação

| Configuração | Custo/mês |
|---|---|
| Central própria dedicada | R$ 45.000 – 60.000 |
| Central compartilhada entre municípios contíguos | R$ 12.000 – 20.000 por bloco |
| Coordenação operacional dedicada | R$ 18.000 – 25.000 |

---

## 3 · Precificação per capita por faixa de distância

Bandas de **custo direto operacional**. Preço = custo × 1,35 (BDI Samais).
Valor adotado = ponto médio da banda de custo × 1,35.

| Faixa | Distância ao polo | Custo/hab/mês | Preço/hab/mês | Adotado |
|---|---|---|---|---|
| **A** | Polo ou < 50 km | R$ 0,45 – 0,55 | R$ 0,61 – 0,74 | **R$ 0,68** |
| **B** | 50 a 150 km | R$ 0,55 – 0,70 | R$ 0,74 – 0,94 | **R$ 0,84** |
| **C** | 150 a 350 km | R$ 0,75 – 1,05 | R$ 1,01 – 1,42 | **R$ 1,22** |
| **D** | 350 a 500 km | R$ 1,20 – 1,80 | R$ 1,62 – 2,43 | **R$ 2,03** |

Âncora de calibração: contrato de referência de 300 mil habitantes com CDO
de R$ 154.000/mês = **R$ 0,513/hab/mês** em custo.

---

## 4 · Pisos de viabilidade

**A variável que decide viabilidade não é o preço per capita — é o custo
fixo.** Central, roteirização e coordenação custam o mesmo para 6 mil ou
300 mil habitantes.

| Piso | Valor | Significa |
|---|---|---|
| **Contrato isolado** | R$ 77.000/mês | Sustenta central própria e coordenação dedicada |
| **Bloco consorciado** | R$ 45.000/mês | Exige central compartilhada entre municípios contíguos |
| **Alerta de porte estrutural** | R$ 300.000/mês | Abaixo disso, verificar se a operação justifica a estrutura administrativa (parâmetro Samais comum a todas as linhas) |

### Regra de triagem rápida

```
Receita = População × Preço da faixa

Receita ≥ R$ 77k  → contrato isolado viável
Receita ≥ R$ 45k  → só consorciado, precisa de vizinho na carteira
Receita <  R$ 45k → só entra somado a bloco adjacente
Sem vizinho contíguo → descartar, independentemente do preço
```

---

## 5 · Marco regulatório e cofinanciamento

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

## 6 · Alertas comerciais

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
