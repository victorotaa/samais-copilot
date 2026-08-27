# Análise de Maturidade — Samais CoPilot OS

> Snapshot completo de agosto/2026: o que é real, o que é simulação, o que falta para uma
> operação de CRU de verdade, e o estado de cada claim. Substitui `docs/00-analise-atual.md`
> como retrato vigente (o 00 permanece como registro histórico pré-backend). Pareie com
> `docs/11` (decisões de tecnologia), `docs/12` (operação/implantação/treinamento/testes)
> e `docs/13` (apresentação ao Ministério da Saúde).

---

## 1. Sumário executivo

O CoPilot OS é um **protótipo navegável de alta fidelidade com backend inicial** —
**~15–20% do caminho para produto** (autoavaliação de `docs/08`, confirmada por esta
análise). A tese é sólida e o desenho é bom: fluxo fiel à Portaria 2048/2002, IA como
copiloto com autoridade final do médico regulador, gestor sem PII por construção,
divergência que retroalimenta o modelo. A parte difícil — **IA real sobre áudio de
emergência e integração com a telefonia da CRU — ainda não existe**.

O produto está registrado no Samais-OS como `estagio: prototipo` e o item `copilot` do
roteiro de implantação não tem estado registrado em nenhuma das quatro frentes
contratadas — ou seja, **não roda em nenhuma operação hoje**. Toda afirmação de
performance em material comercial deve tratar isso como premissa, não como resultado
(ver §5 e `docs/13`).

**Resposta curta a "está maduro? cabem mais funções?":** não está maduro, e o caminho
não é adicionar funções novas — é **tornar reais as que já aparecem na tela** (IA,
telefonia, compliance) e fechar as lacunas que uma CRU real impõe no primeiro dia de
operação (§4): fila de múltiplas ocorrências simultâneas, papel de rádio-operador,
mais de uma viatura por ocorrência, offline no tablet. Função nova antes disso é
ampliar o teatro.

## 2. Matriz Real × Mock × Ausente

Legenda: ✅ real e funcionando · 🎭 simulado na UI (teatro de demo) · ❌ ausente.

| Área | Estado | Detalhe |
|---|---|---|
| Front React 19 + Vite 6 + Tailwind v4, dual-theme | ✅ | build e deploy Vercel funcionais |
| Login por matrícula + perfis (TARM/Médico/Viatura/Gestor) | ✅ | Supabase Auth com fallback demo (timeout 5s); seed cobre os 4 logins (REG-02 e USA-01 adicionados em ago/2026 — aplicar no projeto) |
| MFA | 🎭 | card "Biométrica MFA" sem handler; TOTP é SEC-03 |
| Frota (status, manutenção) | ✅ | persistida + **realtime** |
| Escalas (planner do gestor + "Minha Escala") | ✅ | leitura/escrita reais |
| Ciclo da ocorrência (atender → handoff → despacho T0–T4 → desfecho) | ✅ | persistido ponta a ponta **quando conectado**; desfecho ainda só na auditoria (migration 0003 sugerida — a 0002 é a correção RLS do parecer, 16/08) |
| Trilha de auditoria | ✅/🎭 | inserts reais append-only; **hash-chain escrito e não aplicado** (`supabase/migrations/0001_audit_hash_chain.sql` — SEC-05) |
| Métricas do Dashboard | ✅/🎭 | chamadas recebidas e T0→T2 reais quando há dados; T. regulação, abandono, acurácia e tabela recente **fixos** |
| STT (transcrição) | ❌ | zero integração; a transcrição é `MOCK_SCRIPTS` com `setTimeout` |
| LLM (extração clínica, Manchester, explicabilidade) | ❌ | dados prontos dentro do roteiro; pesos = fórmula sobre índice do array |
| Score anti-trote | 🎭 | booleano `hasHistory ? 98% : N/A` |
| Telefonia / PABX / fila real | ❌ | a "chamada" é um `setTimeout` de 10s; arquitetura SIPREC especificada em `docs/05` §3 |
| AML (localização do chamador) | 🎭 | visual; **AML real não existe no Brasil sem acordo com operadoras/plataformas — a validar, nunca prometer** |
| GPS das viaturas | 🎭 | marcadores `<div>` movidos por `sin/cos`; telemetria (68 km/h · 5G) é string fixa |
| Navegação da viatura | ✅ | deep link real Google Maps `dir_action=navigate` |
| FHIR R4 | 🎭 | `JSON.stringify` de literal no cliente; sem pipeline/validação |
| Compliance (AES-256, SHA-256, TCU/MP/ANPD) | 🎭→✅ | claims eram declarativos; higienizados em ago/2026 (SEC-20) — a UI agora afirma só o que existe |
| Export PDF (Portaria 1.010/2012) | ✅ | `window.print()` com cabeçalho de subsídio ao relatório semestral |
| Multi-tenancy + RLS | ✅ | isolamento por `tenant_id`; `GESTOR` sem policy em `ocorrencias`/`despachos`, lê só `metricas_gestor` (sem PII) |

## 3. Dívidas técnicas (impedem evoluir com segurança)

1. **`src/App.tsx` monolítico (~2.7k linhas)** — sem router (state machine manual, sem
   URL/deep link), sem estado global (~35 `useState` no mesmo componente), qualquer
   `setState` re-renderiza tudo. Modularização = Sprint 5 e **pré-requisito da fila
   multi-ocorrência** (§4.1).
2. **Zero testes, zero CI** — sem Vitest/Playwright/ESLint/Prettier; `lint` = `tsc
   --noEmit`; sem `.github/workflows` (SEC-14). Refactor hoje é feito no escuro.
3. **TypeScript sem `strict`** — sem `strictNullChecks`/`noImplicitAny`; `as any`
   espalhados.
4. **Mutações sem `.catch`** — a maioria dos writes Supabase usa `.then()` sem
   tratamento; falha de rede é silenciosa e a UI mostra sucesso. Sem retry, sem fila
   offline (crítico para o tablet).
5. **Sem ErrorBoundary** — erro de render = tela branca.
6. **Performance** — sem code splitting; 4+ `setInterval` concorrentes; `FleetMarkers`
   reconstruído a cada segundo; fontes por CDN sem subset.
7. **Acessibilidade** — `user-scalable=no` (viola WCAG 1.4.4); modais sem focus trap/
   `role="dialog"`/Esc; `<div onClick>` sem teclado; 8 `aria-label` no app inteiro.
8. **Hardcodes de demo** — inventário completo no histórico da análise: operadora "Vivo",
   precisão "±5m", ETA "08min · 4.2 km", date picker travado em "Abril 2026", tempos da
   fila do médico `[512, 341, 129]`, chips de disponibilidade fixos.

## 4. Lacunas funcionais para uma CRU real

Ordenadas por severidade operacional. "Fase" = onde entram no programa de `docs/12`.

| # | Lacuna | Por que trava a operação real | Fase |
|---|---|---|---|
| 4.1 | **Fila de múltiplas ocorrências simultâneas** | O app conduz **um caso por vez** de ponta a ponta. Uma CRU média regula dezenas de casos abertos em paralelo — TARM atende enquanto o médico regula outros três e cinco viaturas estão em missão. É a lacuna nº 1 e depende da modularização (estado global por ocorrência, não por tela). | F1 |
| 4.2 | **Papel RÁDIO-OPERADOR (RO)** | Existe na CRU real (Portaria 2048/2002); hoje absorvido pela tela do médico. O schema (`usuarios.role`) comporta a extensão — falta tela de despacho/acompanhamento de frota dedicada. | F1 |
| 4.3 | **N viaturas por ocorrência + apoio** | Acidente com múltiplas vítimas despacha USA + USB + moto; hoje o modelo `despachos` é 1:1 na prática da UI. | F1 |
| 4.4 | **Offline-first no tablet** | Túnel, garagem e sombra de sinal existem mesmo com Starlink (`docs/05` §6). Requisito declarado, zero implementação (nem fila local, nem retry). | F1 |
| 4.5 | **GPS real das viaturas (AVL)** | O tablet é a fonte natural de posição; hoje os marcadores são animação. Sem AVL não há ETA real nem recomendação de viatura defensável. | F1–F2 |
| 4.6 | **Telefonia real (SIPREC + sinalização de fila)** | Sem áudio não há IA; sem sinalização não há T. de atendimento nem taxa de abandono reais. Gargalo mais externo (depende do PABX de cada CRU). | F2 |
| 4.7 | **Desfecho como coluna própria** | Hoje só na auditoria; migration 0003 sugerida — a 0002 é a correção RLS do parecer (16/08). Sem coluna, o dado que fecha o ciclo não entra em métrica nem no futuro APH-BR. | F0 |
| 4.8 | **Destino hospitalar / vaga zero / grade de leitos** | A regulação real negocia destino (CROSS em SP, regulação estadual alhures). Registro do hospital de destino é o mínimo; integração é evolução. | F3 |
| 4.9 | **Export e-SUS SAMU / interoperabilidade oficial** | O MS referencia o e-SUS SAMU (DATASUS). Exportar no formato oficial evita duplo registro — argumento decisivo para o gestor público. Detalhar em agenda técnica com o DATASUS. | F3 |
| 4.10 | **Instrumentação de metas contratuais** | O roteiro de implantação do Samais-OS exige "como cada meta é MEDIDA" (item crítico). O produto deve emitir os indicadores do contrato com procedência — é a "prova de entrega". | F2 |
| 4.11 | **Obstetrícia/psiquiátrica nos roteiros de triagem** | O mix real de demanda é ~55–60% clínico, 25–30% trauma, 8–12% psiquiátrico, 2–4% obstétrico; os 3 roteiros da demo cobrem só clínico/trauma/OVACE. Vale para o backtest da IA também. | F1 |
| 4.12 | **Console ADMIN Samais** | Cadastrar tenant/bases/usuários/viaturas sem tocar no banco à mão (hierarquia em `docs/05` §7). | F2 |

**O que NÃO entra** (decisões registradas que permanecem): live view de cena
(descartado, `docs/05` §5); substituir a telefonia da CRU (o CoPilot escuta — postura
100% passiva); APH-BR (horizonte, `docs/01` §5, só após SEC-31).

## 5. Segurança e claims — estado

- **Tier 0 (`docs/07`) — ABERTO.** Nada de dado real de paciente antes de fechar:
  SEC-01 (senha do banco exposta em chat — **rotacionar**), SEC-02 (HSTS adicionado em
  ago/2026; AES em repouso a documentar), SEC-03 (MFA TOTP), SEC-04 (testes de RLS),
  SEC-05 (**aplicar** a migration 0001), SEC-06 (backups + restore drill), SEC-07
  (região São Paulo — confirmar e documentar). Runbook passo a passo: `docs/14`.
- **SEC-20 (registro de claims) — EXECUTADO em ago/2026** nesta higienização: banner do
  Dashboard reescrito para afirmar só o que existe (view sem PII, trilha append-only,
  encadeamento "em homologação"), rodapé de IA da triagem rotulado como simulação,
  MFA rotulado "habilitação em produção", FHIR rotulado "pré-visualização de formato",
  LP com meta (≥90%, critério de go-live) no lugar de acurácia inventada (96.8%).
  **Regra permanente:** claim novo só entra na UI mapeado a controle implementado ou
  rotulado roadmap.
- **Fidelidade de postura na demo (regra nova, 23/08, decisão do Ota):** a demo não pode
  encenar comportamento que o produto **não terá por doutrina**. O sistema opera em
  shadow sobre a chamada **atendida** — recebe cópia do áudio, nunca antecipa fala nem
  transcreve antes de o TARM atender. O overlay mobile de chamada entrante exibia uma
  "Transcrição Prévia (IA)" com fala do solicitante **antes do ATENDER** — removida;
  no lugar, a sinalização honesta do PABX ("transcrição inicia ao atender"). Antes do
  atendimento só existe o que a telefonia sinaliza de fato: número, fila, toque.
- **Três modos de IA (nota do Ota, 24/08):** plena (escuta shadow + digitação) ·
  **IA sobre digitação** (sem escuta: o TARM digita em paralelo ao telefone, como já
  faz no sistema próprio da CRU, e a IA rankeia/chaveia quadros e prioridades a partir
  do texto — fallback natural do STT e modo de convivência com o software existente) ·
  manual total (kill switch, janela auditada). Doutrina: desligar a IA nunca degrada o
  fluxo abaixo do que a central já opera sem nós. Registro completo em `docs/05` §2.
  ✅ Os três modos são **demonstráveis** na demo desde 24/08 (seletor no cabeçalho da
  transcrição; no modo digitação a extração é por palavras-chave, rotulada simulação).
- **Fidelidade shadow do fluxo (24/08, decisão do Ota):** a demo encenava DOIS
  controles que o produto não tem — a tela-gate "Confirmar AML & Iniciar Triagem"
  (em shadow a triagem abre quando o TARM atende na central; a localização virou
  painel dentro da triagem) e o botão "ATENDER" (nós nunca atendemos — o rótulo
  virou "Simular atendimento na central", com a sinalização honesta ao lado). A fila
  do PABX ganhou o rótulo "sinalização colhida · leitura passiva". Mesma família da
  regra da pré-chamada de 23/08: a demo não encena comportamento que o produto não
  terá por doutrina.
- **Tier 1 — antes do 1º contrato com dado real:** cofre PII (SEC-10/11), TSA (SEC-12),
  WAF (SEC-13), CI seguro (SEC-14), pentest (SEC-15), DPO+DPIA+runbook ANPD (SEC-16),
  DPA com sub-processadores (SEC-17), MDM (SEC-18).
- **No Samais-OS:** a seção CoPilot dos estudos municipais afirmava "impacto comprovado
  ↓23%/↑91%", "maior dataset do país" e "nenhum concorrente" **sem procedência** —
  corrigida em ago/2026 para compromissos instrumentados com referencial (mesma branch,
  repo samais-os). Princípio da Realidade: o material comercial acompanha o estágio
  real do produto.

## 6. Correções de registro (docs que mentiam por desatualização)

| Onde | Estava | Fica |
|---|---|---|
| `README.md:7` | "Dados 100% mockados — sem backend" | backend Supabase híbrido existe; IA continua mock |
| `docs/00` | retrato pré-backend (1.861 linhas, "zero backend", Font Awesome) | nota de topo: snapshot histórico; vigente = este doc |
| `docs/08` (Real×Mock) | "Ocorrências ponta a ponta ❌ não persistem" | persistem desde o commit `c8ae646`; linha corrigida |
| `docs/08` (seed) | "logins TARM-04/REG-02/USA-01/GESTOR-01" | seed só tinha 2; REG-02 e USA-01 adicionados em ago/2026 — **aplicar no projeto Supabase** |
| `docs/09` §5 | "LP ainda cita 29%" | LP já está em 8,2% (faixa nacional); pendência restante era o 96.8% — higienizado |

## 7. O que está bom e se preserva

1. **Fluxo fiel à norma** — Portaria 2048/2002 espelhada (TARM → regulação médica →
   despacho → T0–T4 → desfecho), com handoff digital no lugar do resumo verbal.
2. **Divergência auditável** — o médico que discorda da IA registra justificativa que
   vira base de retreino supervisionado. É o ativo mais inteligente do desenho e não
   custa nada operar.
3. **Gestor sem PII por construção** — view agregada, não filtro de UI. Argumento de
   venda e de LGPD simultaneamente.
4. **Kill switch da IA** — modo degradado prototipado na UX ("a chamada nunca depende
   da IA").
5. **T0–T4 de um toque** — alvos ≥60px, sem digitação; alimenta o tempo-resposta
   (indicador nº 1 de qualidade APH) sem fricção.
6. **Documentação estratégica** — docs/01–09 formam um corpo raro em protótipo:
   roadmap, review operacional com arquitetura de STT/PABX, backlog de segurança
   acionável, fluxo normativo com fontes. Esta análise se apoia neles.
7. **Honestidade institucional** — `SECURITY.md` declara o que não existe. É ativo de
   credibilidade diante de órgão de controle; a higienização de ago/2026 estendeu essa
   postura à UI.
