# Retorno ao parecer — Samais CoPilot OS

**Para:** Hugo
**Data:** 22/08/2026
**Sobre:** o parecer de 13/08 (`docs/17-parecer-hugo.md`, registrado verbatim) e os
Adendos A e B.
**Método:** cada citação de arquivo e linha do parecer foi reverificada contra o código
antes de qualquer veredito — a mesma régua que o handoff exigiu de você. A adjudicação
interna completa está em `docs/18`; este documento é a resposta.

O resumo em uma frase: **o parecer se pagou** — quatro achados de segurança confirmados
que nenhum documento nosso tinha, uma migration que teria ido ao banco defeituosa, e uma
inversão de ordem de trabalho que adotamos. E errou em três pontos, todos pela mesma
causa, que está corrigida na sua frente de leitura, não na nossa. Os dois lados abaixo.

---

## 1. O que foi confirmado e o que já mudou por causa do parecer

| Achado | Veredito | Estado |
|---|---|---|
| **F-01** · view `metricas_gestor` vazava agregados de todas as centrais | Confirmado — crítico | Corrigido no repositório (16/08): predicado de tenant dentro da view + revoke de `anon`. Retrofit para o projeto vivo: migration `0002` |
| **F-02** · auditoria forjável em nome de outro operador | Confirmado — alto | Corrigido: `usuario_id = auth.uid()` na policy de insert (`schema.sql` + `0002`) |
| **F-03** · migration `0001` com corrida, payload não determinístico e TRUNCATE aberto | Confirmado — nos três pontos | `0001` reescrita (v2): lock consultivo por tenant, `to_char` UTC de formato fixo, gatilho de comando + revoke. **E um quarto defeito que o parecer não pegou — ver §3** |
| **F-04** · `GEMINI_API_KEY` injetável no bundle via `define` | Confirmado — crítico condicional | Bloco removido do `vite.config.ts`; a dependência morta `@google/genai` saiu junto (seu D-06) |
| **F-05** · fallback hardcoded apontava fork sem `.env` para o backend real | Confirmado — médio | Removido. Sem env, modo demo puro, sem rede — a promessa do onboarding agora é verdadeira |
| **F-06** · MFA sem handler; matrícula previsível | Confirmado — já constava (SEC-03) | Sua leitura da matrícula previsível foi incorporada ao ticket |
| **F-07** · repo público expõe schema antes do Tier 0 | Aceito | Preço registrado em `docs/18`; mitigação segue sendo a regra "nada de dado real" + repo privado na org (runbook §9) |
| **F-08** · sem gestão de identidade no produto (offboarding manual) | Confirmado — médio | Ticket novo **SEC-19** (Tier 1): painel `ADMIN_TENANT` com auditoria e revogação de sessão |
| **D-01..D-08** | Confirmados | Seus critérios de conclusão foram adotados como estão. `App.tsx` tem 2.738 linhas — os documentos que diziam "~2 mil" foram corrigidos |

**Adoções além das correções**, com o lugar onde ficaram escritas:

- **CI antes de tudo** (`docs/15` §B.3, `docs/12` F0). Seu argumento fecha: os três
  erros de registro que você achou são todos do tipo que um CI pega.
- **Régua dupla do progresso** — "15–20% da superfície, 0% do núcleo, com uma decisão de
  arquitetura bloqueando o núcleo" substituiu o número seco (`docs/15` §B.2).
- **Gate de 90% ganhou o segundo critério, assimétrico** (`docs/12` §4): taxa de
  vermelhos rebaixados ≤ limite definido pelo responsável técnico médico. O limite não
  foi inventado — é dele, quando nomeado.
- **Captação passiva antes da IA** (`docs/12` §4): SIPREC gravando só em arquivo prova o
  fork inócuo e forma o acervo do backtest e do fine-tuning — sua observação de que um
  levantamento serve aos dois resolveu também um furo de sequência que nós tínhamos (o
  backtest de F1 pressupunha acervo que talvez só a F2 criasse).
- **Camada servidor formalizada como decisão pendente** (`docs/11` §1.11), com a sua
  regra de sequência por escrito: precede a primeira linha de STT/LLM; Tier 0 e IA não
  são frentes 100% paralelas.
- **A decisão de STT ficou suspensa até bake-off** (`docs/11` §1.3) — ver §4.
- **Seu Docker virou a primeira tarefa oficial** (`docs/15` §B.8) e as **perguntas de
  campo** dos seus §A.3.4/§B.3 entraram no diagnóstico de implantação (`docs/12` §1.2).

## 2. A correção da sua correção — F-01

A sua proposta para F-01 era `security_invoker = true` **e** predicado de tenant. A
primeira metade quebraria exatamente quem a view serve: `GESTOR` **não tem** policy de
select em `ocorrencias` — por doutrina ("gestor sem PII por construção"), não por
descuido — e uma view invoker devolveria zero linhas para ele. A correção aplicada
mantém a view definer **de propósito** e põe o isolamento no predicado interno
(`where o.tenant_id = meu_tenant()`), com revoke de `anon` de cinto. `meu_tenant()`
resolve pelo `auth.uid()` do JWT da requisição, que independe do contexto definer — o
escopo é o do usuário que consulta.

## 3. O defeito que faltou no seu F-03

Ao preparar a aplicação no banco, um quarto defeito na `0001` que o parecer não listou:
**as linhas de auditoria já existentes não têm hash**, e `verificar_cadeia_auditoria`
recomputa do genesis — o primeiro `select` acusaria a primeira linha histórica como
adulterada. Falso positivo de fábrica, no mesmo espírito do seu achado da corrida.

A v2 ganhou **backfill**: encadeia o histórico em ordem de id, por tenant, sob o mesmo
lock consultivo do trigger (insert ao vivo durante o backfill espera na fila, em vez de
encadear no meio de uma cadeia pela metade), e roda **antes** dos gatilhos de
imutabilidade — que bloqueariam o próprio backfill. Registrado aqui porque a régua vale
nos dois sentidos: a sua v1 não estava pronta, e a nossa v2 de 16/08 tampouco.

## 4. Onde o parecer erra — e o pedido que decorre disso

Os erros têm uma única causa: **`docs/05` e `docs/11` não foram lidos** — itens 4 e 5 da
ordem de leitura do handoff. O §Registro do próprio parecer lista as fontes verificadas:
`docs/07`, `10` e `14`.

| Afirmação do parecer | O que os documentos não lidos já diziam |
|---|---|
| E-28: "Deepgram nomeado só no runbook, como se já fosse decisão" | **Era decisão**, registrada em `docs/11` §1.3 (11/08) com preço público datado, DPA, mapeamento de região e plano B homologado (Whisper on-prem); a recomendação técnica com diagrama está em `docs/05` §2 |
| E-23 e pergunta 7: "custo sem memória de cálculo"; "R$ 600–4.400 incluem STT/LLM?" | A memória existe em `docs/11` §3, com premissas declaradas (município ~300 mil hab · 0,12–0,18 chamadas/hab/ano · 3 min · ~5k tokens) — e **sim, STT (US$ 43–78/mês) e LLM (US$ 25–90/mês) estão na conta** |
| "Plano servidor inexistente em documento nenhum" | Parcial: `docs/05` §2 desenha Media Gateway + Backend CoPilot; `docs/11` §1.5 agenda o gateway (F2). O que faltava de verdade — a **plataforma** de execução — está formalizado agora em §1.11, e a sua tese de sequência foi adotada |
| E-31/E-32: "backup/monitoramento não informados em nenhum documento" | SEC-06 (backup imutável + restore cronometrado) existe desde `docs/07`; `docs/11` §1.7 nomeia Sentry + uptime. O núcleo do seu ponto fica de pé — nada implementado, alerta sem destinatário — e está registrado como pendência com gate de F2 |

Nada disso derruba o resto — os achados de código foram verificados independentemente e
confirmados. Mas o pedido é direto: **a próxima rodada roda sobre o corpus inteiro.**
Ausência de leitura não é evidência de ausência — a régua que você aplicou a nós vale
para o parecer também.

Sobre as suas premissas de STT: os argumentos do Adendo A/B (residência do áudio; link
precário carrega texto, não áudio; erro em entidade crítica como métrica que decide)
eram novos e **suspenderam a decisão Deepgram**. Ela não foi revertida para Azure — foi
suspensa para o **bake-off com áudio real da central alvo**, com os critérios que você
propôs registrados em `docs/11` §1.3. A decisão final é do Ota, com o número medido.

## 5. Respostas às suas sete perguntas

1. **Camada servidor?** Formalizada como decisão pendente (`docs/11` §1.11): candidatas
   com trade-off (Edge Functions · contêiner gerenciado · appliance na CRU — a terceira
   empurrada pelo seu Adendo B), dono (Ota), prazo (antes da F1). Você estava certo: sem
   ela, STT/LLM/SIPREC não começam.
2. **Deepgram: decisão ou hipótese?** Era decisão (`docs/11` §1.3) — suspensa em 16/08
   pelos seus argumentos. Resolve-se por bake-off.
3. **Quem assina o gate?** O papel existe (`docs/12` §1); a pessoa ainda não. Pendência
   nomeada, dono: Ota com a diretoria.
4. **Homologação?** Não existe, e você está certo em cobrá-la. Virou decisão de
   orçamento (terceiro projeto Supabase); dono: Ota/André.
5. **As 1.000 chamadas existem?** Premissa, não fato: acervo da CRU contratante, sob
   base legal validada pelo DPO antes de qualquer uso. Se não existir, a sua captação
   passiva o forma — já está no plano (`docs/12` §4).
6. **On-call às 3h?** Estrutura N1/N2 descrita para F2; destinatário nomeado não existe
   hoje. Pendência registrada em `docs/11` §1.7, gate de F2.
7. **Os R$ 600–4.400 incluem STT/LLM?** Sim — memória em `docs/11` §3. O que falta está
   marcado "a cotar" lá mesmo, componente a componente.

## 6. Estado de aplicação — sem verniz

- **No repositório: aplicado.** Commits de 16/08 e 22/08 no PR de correções
  (`schema.sql`, migrations `0001` v2 + `0002`, `vite.config.ts`,
  `src/lib/supabase.ts`, remoção de `@google/genai`), com `tsc` e build verdes e greps
  de guarda zerados.
- **No banco vivo: são duas colagens no SQL Editor** — `0001` v2 e depois `0002`, cada
  uma com as conferências no fim do próprio arquivo (roteiro: `docs/14` §4–5). O
  ambiente de desenvolvimento remoto não alcança o banco (nem pooler nem HTTPS do
  projeto), então a aplicação é feita por quem tem o SQL Editor.
  - [ ] Aplicado no projeto vivo em ____/____/2026 — `verificar_cadeia_auditoria` = NULL ·
    `sem_hash` = 0 · view com predicado · policy estrita · TRUNCATE revogado.

## 7. O que pedimos de você agora

1. **O Docker que você propôs** (`docs/15` §B.8): app + Postgres local + STT + um SRS de
   mentira tocando `.wav` como se fosse RTP. Não exige nenhum acesso concedido, e é a
   primeira entrega que destrava as demais.
2. **O desenho do protocolo do bake-off de STT** — a métrica de entidade crítica é sua;
   venha especificar o léxico fechado, o corpus mínimo e o formulário de resultado, para
   fechar com o RT médico quando nomeado.
3. Se entrar no desenvolvimento: **D-02 → D-03 → D-04 → D-05, na sua ordem** — CI e
   testes primeiro, wrapper de mutação com erro visível, ErrorBoundary com degradação
   para manual, `strict` incremental.
4. **As ETAPAS 8+ do seu protocolo** (plano de execução, decisões prévias, ordem de
   atividades, critérios de validação): o escopo já existe deste lado em `docs/12`
   (fases F0–F3 com gates), `docs/11` (decisões com alternativa recusada),
   `docs/07`+`docs/14` (segurança com aceite por item). Se a continuação do `hugo1.md`
   vier, rode-a **sobre esse corpus** — inteiro.

---

## Registro

Produzido em 22/08/2026. Pareia com `docs/17` (o parecer, verbatim) e `docs/18` (a
adjudicação interna, achado a achado, com evidência de arquivo e linha). Fecha o ciclo
aberto por `docs/16`: *"Parecer que só confirma o que já pensávamos não justificou o
convite."* Contrariou, foi contrariado de volta, e os dois lados saíram corrigidos — é
exatamente o que o convite pedia.
