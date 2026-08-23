# Verificação do parecer independente — achado a achado

> O parecer (`docs/17-parecer-hugo.md`, 13/08/2026) foi verificado citação a citação
> contra o código em 16/08/2026 — a mesma régua que o handoff exigiu dele. Este documento
> registra o veredito de cada achado, o que foi **aceito e mudado por causa dele**, e os
> pontos em que **o parecer erra** — porque a regra vale nos dois sentidos: discordar é o
> objetivo, inclusive de volta.
>
> Resumo executivo: **o convite se pagou.** Quatro achados de segurança confirmados que
> nenhum documento nosso tinha (dois críticos), uma migration que teria ido ao banco com
> defeito, uma inversão de ordem de trabalho que adotamos, e uma decisão de arquitetura
> que estava implícita e agora está formalizada como pendente. Do outro lado: os erros do
> parecer vêm todos de uma mesma causa — **ele não leu `docs/05` nem `docs/11`**, itens
> 4 e 5 da ordem de leitura do próprio handoff (o §Registro dele confirma: as fontes
> verificadas foram `docs/07`, `10` e `14`).

---

## 1. Segurança (F-01..F-08) — vereditos

| # | Achado | Veredito | Evidência verificada | Ação (16/08) |
|---|---|---|---|---|
| F-01 | View `metricas_gestor` vaza agregados entre tenants | **CONFIRMADO — CRÍTICO** | `supabase/schema.sql`: `security_invoker = false` sem predicado de tenant; views não têm RLS própria | Corrigido no `schema.sql` + migration `0002`; ticket **SEC-08**. ⚠️ Com uma ressalva à correção proposta — ver §2 |
| F-02 | Auditoria forjável em nome de terceiro | **CONFIRMADO — ALTO** | Policy de insert sem `usuario_id = auth.uid()`; único call site do app (`src/App.tsx:787`) sempre envia o próprio id, então a correção estrita nada quebra | Corrigido no `schema.sql` + migration `0002`; ticket **SEC-09** |
| F-03 | Migration `0001` não estava pronta para aplicar | **CONFIRMADO — ALTO, nos três pontos** | (a) leitura do último hash sem lock → bifurcação sob concorrência e falso positivo de adulteração; (b) `created_at::text` varia com `DateStyle`/`TimeZone` — em função marcada `immutable`; (c) TRUNCATE fora dos triggers de linha **e** fora do revoke da linha 106 | `0001` reescrita (v2): lock consultivo por tenant, `to_char` UTC de formato fixo, trigger de comando + revoke de TRUNCATE. Runbook atualizado: **só a v2 se aplica** |
| F-04 | `GEMINI_API_KEY` injetável no bundle | **CONFIRMADO — CRÍTICO condicional** | `vite.config.ts:11` (`define` faz substituição textual; contorna a proteção do prefixo `VITE_`); zero uso em `src/` — sobra de scaffold, armadilha armada para o dia em que a IA entrar | Bloco `define` removido; item explícito em SEC-01; runbook confere a variável no build da Vercel |
| F-05 | Fallback hardcoded aponta fork para o backend real | **CONFIRMADO — MÉDIO** | `src/lib/supabase.ts:8-13`; a promessa "sem chave, cai em modo demo" (`docs/15` §B.4) era falsa | Fallback removido — sem env, modo demo puro sem tocar a rede. **Gate de merge:** envs na Vercel antes (runbook `docs/14` §1) |
| F-06 | MFA é card sem handler; matrícula previsível = fator único fraco | **CONFIRMADO — já conhecido** (SEC-03 aberto, `docs/10` §2 admite) | `src/App.tsx:972` | Sem ação nova; o sharpening da matrícula previsível foi incorporado à leitura do SEC-03 |
| F-07 | Repo público expõe schema/policies antes do Tier 0 fechar | **ACEITO — preço registrado agora** | Decisão consciente (`docs/15` §A.1); a mitigação é a regra §B.7.2 (nada de dado real) + transferência para org com repo privado (runbook §9) | Registro feito aqui; nenhuma mudança de postura |
| F-08 | Sem gestão de identidade no produto (offboarding manual via `service_role`) | **CONFIRMADO — MÉDIO** | Só `usuarios_select` no `schema.sql`; criar/desativar operador é processo fora da aplicação | Ticket novo **SEC-19** (Tier 1): painel `ADMIN_TENANT` com auditoria + revogação de sessão |

## 2. A correção da correção — F-01

O parecer propõe `security_invoker = true` **e** predicado. A primeira metade
**quebraria o painel do gestor**: `GESTOR` não tem policy de select em `ocorrencias`
por design ("gestor sem PII por construção" — é doutrina, não descuido), então uma view
invoker devolveria zero linhas para exatamente quem ela serve.

A correção aplicada mantém a view **definer de propósito** e põe o isolamento no
predicado interno (`where o.tenant_id = meu_tenant()`), com revoke de `anon` como cinto.
`meu_tenant()` resolve pelo `auth.uid()` do JWT da requisição, independente do contexto
definer — o predicado escopa pelo usuário que consulta, que é o comportamento correto.

## 3. Desenvolvimento (D-01..D-08) — vereditos

D-01 (monolito, agora **2.738 linhas** — os docs diziam "~2 mil", corrigido), D-02 (zero
CI/teste/lint), D-03 (mutações sem `.catch` — a UI confirma escrita que falhou), D-04
(sem ErrorBoundary), D-05 (TS sem `strict`), D-07 (acessibilidade — vira item de edital,
não de backlog) e D-08 (schema sem versionamento por CLI): **todos confirmados**, e todos
já constavam de `docs/10` — o parecer agrega os **critérios de conclusão**, que ficam
adotados como estão escritos lá.

D-06 (`@google/genai` instalado e nunca importado): confirmado; **dependência removida**
em 16/08 (reinstala na F1, na camada servidor, nunca no cliente — `docs/11` §1.4).

**A inversão de ordem foi aceita.** `docs/15` §B.3 colocava CI dentro da modularização;
o parecer argumenta que CI e testes vêm antes de tudo — e a prova é dele: os três erros
de registro que encontrou (2.000 vs 2.738 linhas, "cai em modo demo", encanamento de LLM
no bundle) são todos do tipo que um CI pega. `docs/15` §B.3 e `docs/12` F0 foram
reordenados.

## 4. O achado estrutural — backend que ele não viu, porque não existe

O parecer está certo no fato e na consequência: **não existe backend próprio** — nenhuma
Edge Function, nenhuma API; a SPA fala direto com o Postgres e toda a segurança são as
policies de RLS (duas das quais estavam furadas, o que dá peso ao ponto). E a arquitetura
atual **não comporta** o produto pretendido: chave de STT/LLM não pode ir ao browser
(F-04 errou exatamente aí), áudio SIPREC não chega em navegador, decisão clínica não se
computa em contexto que o usuário controla.

Onde o parecer erra é no "nenhum documento registra": `docs/05` §2 desenha o Media
Gateway e o "Backend CoPilot" como componentes da arquitetura pretendida, e `docs/11`
§1.5 agenda o gateway como desenvolvimento de F2. O que de fato **nunca foi decidido** é
a **plataforma de execução** dessa camada — onde roda, quem opera. E a regra de sequência
que ele deduz está certa e não estava escrita: **essa decisão precede a primeira linha de
STT/LLM, e Tier 0 × IA não são frentes 100% paralelas.**

Formalizado em `docs/11` **§1.11** como decisão PENDENTE, com as três candidatas e o
trade-off (Edge Functions · contêiner gerenciado · appliance na CRU — a terceira empurrada
pelo próprio Adendo B), dono nomeado (Ota) e prazo (antes da F1).

## 5. Onde o parecer erra — e por quê

Os erros têm uma única causa raiz: **`docs/05` e `docs/11` não foram lidos** (itens 4 e 5
da ordem de leitura do handoff; o §Registro do próprio parecer lista as fontes).

| Afirmação do parecer | O que os documentos não lidos já diziam |
|---|---|
| E-28: "Deepgram nomeado só no runbook, como se já fosse decisão" — confiança baixa | **Era decisão**, tomada e registrada em `docs/11` §1.3 com preço público datado, DPA, mapeamento de região e plano B homologado (Whisper on-prem); recomendação técnica em `docs/05` §2; citado ainda em docs/02, 07, 08, 09 e 12 |
| E-23: custos "sem memória de cálculo", "premissas não visíveis"; pergunta 7: "R$ 600–4.400 incluem STT e LLM?" | `docs/11` §3 tem as premissas declaradas (município ~300 mil hab · 0,12–0,18 chamadas/hab/ano · 3 min · ~5k tokens) e a tabela por componente — **sim, STT (US$ 43–78/mês) e LLM (US$ 25–90/mês) estão na conta** |
| "Plano servidor inexistente em documento nenhum" | Parcial — ver §4: componentes desenhados em `docs/05` §2; a plataforma é que está pendente |
| E-31/E-32 e ETAPA 6: "backup/monitoramento não informados em nenhum documento" | Exagero na forma: SEC-06 (backup imutável + restore cronometrado) existe desde `docs/07`, e `docs/11` §1.7 nomeia Sentry + uptime. O núcleo do ponto fica de pé: **nada implementado, alerta sem destinatário nomeado** — registrado como pendência em `docs/11` §1.7 |

Nada disso invalida o resto — os achados de código foram verificados independentemente e
confirmados. Mas a lição é simétrica à que ele nos deu: **parecer também precisa ler a
lista inteira antes de afirmar ausência.** Ausência de leitura não é evidência de
ausência.

## 6. O que mudou por causa do parecer (além das correções de código)

1. **Régua dupla do progresso** — "15–20% da superfície, 0% do núcleo, com uma decisão
   de arquitetura bloqueando o núcleo" substitui o "15–20%" seco (`docs/15` §B.2).
2. **CI-first** (`docs/15` §B.3, `docs/12` F0).
3. **Gate de 90% ganhou o segundo critério, assimétrico**: taxa de vermelhos rebaixados
   ≤ limite definido pelo RT médico — o limite não é inventado aqui, é do RT (`docs/12`
   §4). Um sistema com 95% global e 12% de vermelhos rebaixados é pior que um com 85% e
   zero.
4. **Captação passiva antes da IA** (`docs/12` §4): SIPREC gravando só em arquivo prova
   o fork inócuo e **forma o acervo** do backtest e do fine-tuning — um levantamento
   serve aos dois; resolve inclusive o furo de sequência (o backtest de F1 pressupunha
   acervo que talvez só a F2 crie).
5. **Decisão de STT suspensa até o bake-off** (`docs/11` §1.3): a escolha Deepgram-cloud
   não tinha pesado residência do áudio nem link precário; critérios novos — WER em
   8 kHz **e taxa de erro em entidade crítica** (léxico fechado com o RT; serviço com WER
   pior e erro de negação menor **ganha**). STT na borda entrou como candidata forte.
6. **Camada servidor formalizada como decisão pendente** (`docs/11` §1.11) — ver §4.
7. **Levantamento de campo de 10 perguntas** no diagnóstico de implantação (`docs/12`
   §1.2): PABX/codec/LAN/link/rack/NTP/base legal da gravação.
8. **Primeira tarefa do Hugo virou o Docker** (`docs/15` §B.8, proposta dele mesmo no
   Adendo B): ambiente conteinerizado com Postgres local + SRS de mentira — sem exigir
   nenhum acesso concedido.
9. **SEC-08, SEC-09 e SEC-19 criados; SEC-01, 04 e 05 emendados** (`docs/07`); runbook
   `docs/14` ganhou a aplicação da `0002`, as conferências SQL e os dois gates de env.
10. **Migration do `desfecho` renumerada para `0003`** (a `0002` foi tomada pela correção
    RLS) — docs/08/09/10/12 ajustados.

## 7. As sete perguntas do parecer — respostas

1. **Camada servidor?** Decisão formalizada como pendente em `docs/11` §1.11, com
   candidatas, dono (Ota) e prazo (antes da F1). O parecer está certo: sem ela,
   STT/LLM/SIPREC não começam.
2. **Deepgram: decisão ou hipótese?** Era decisão (`docs/11` §1.3, 11/08) — o parecer
   não a viu. Ficou **suspensa em 16/08** pelos argumentos dele: resolve-se por bake-off
   com áudio real, critérios registrados.
3. **Quem assina o gate de 90%?** Pessoa ainda não nomeada — o papel (RT médico com
   aceite formal por fase) existe em `docs/12` §1.1–1.2; a nomeação é pendência do Ota
   com a diretoria, e passa a constar do registro de pendências abaixo.
4. **Homologação?** Não existe e o parecer está certo em cobrá-la — onde se valida Tier 0
   e gate sem ambiente de homologação? Vira decisão de orçamento (terceiro projeto
   Supabase, ordem de US$ 25/mês) — dono: Ota/André.
5. **As 1.000 chamadas existem?** Premissa, não fato — acervo da própria CRU contratante,
   sob base legal validada pelo DPO antes de qualquer uso (`docs/12` §4). Se o acervo não
   existir, a captação passiva o forma (mudança nº 4 acima).
6. **On-call às 3h?** Estrutura N1/N2 descrita para F2 (`docs/12` §2); destinatário
   nomeado **não existe hoje** — registrado como pendência em `docs/11` §1.7, gate de F2.
7. **R$ 600–4.400 incluem STT/LLM?** Sim — memória em `docs/11` §3, componente a
   componente. O que falta na conta está marcado "a cotar" lá mesmo (storage WORM,
   observabilidade, tablets/MDM, Starlink).

## 8. Sobre as ETAPAS 8+ que o protocolo dele não trouxe

O `hugo1.md` (protocolo do próprio Hugo) trunca na ETAPA 7, e o parecer lista o que
ficou sem método: plano de execução, decisões que precedem o desenvolvimento, perguntas
às equipes, ordem de atividades, critérios de validação. **Esse escopo já existe deste
lado**: `docs/12` (fases F0–F3 com gates e critérios), `docs/11` (decisões com
alternativa recusada e fase), `docs/07`+`docs/14` (segurança com aceite por item) e as
perguntas de campo agora em `docs/12` §1.2. Se a continuação do protocolo dele vier,
roda-se por ela; até lá, a resposta às etapas faltantes é o corpus acima — que o parecer,
desta vez, precisa ler inteiro.

## 9. Pendências abertas por este ciclo (com dono)

| Pendência | Dono | Onde está |
|---|---|---|
| Aplicar `0001` v2 + `0002` no projeto vivo + conferências SQL | Ota (runbook) | `docs/14` §4–5 |
| Setar `VITE_SUPABASE_URL/KEY` na Vercel **antes do merge** (gate F-05) | Ota | `docs/14` §1 |
| Conferir ausência de `GEMINI_API_KEY` no build Vercel | Ota | `docs/14` §1 |
| Decidir a camada servidor (§1.11) | Ota | `docs/11` §1.11 |
| Bake-off de STT (borda × cloud) com áudio real | Ota + Hugo (se entrar) | `docs/11` §1.3 |
| Nomear o RT médico do gate | Ota/diretoria | `docs/12` §1 |
| Ambiente de homologação (orçamento) | Ota/André | pergunta 4, §7 |
| Definir e assinar RPO/RTO por escrito | Ota + dev segurança | SEC-06 |
| Limite de sub-triagem de vermelho | RT médico (quando nomeado) | `docs/12` §4 |

---

## Adendo (22/08) — quarto defeito na `0001`, ausente do parecer

Ao preparar a aplicação no banco vivo, um defeito que o parecer **não** listou em F-03:
as linhas de auditoria **já existentes** não têm hash, e `verificar_cadeia_auditoria`
começa do genesis — a primeira linha histórica seria acusada como adulterada no primeiro
`select`. A v2 ganhou **backfill**: encadeia o histórico em ordem de id, por tenant, sob
o mesmo lock consultivo do trigger (insert ao vivo durante o backfill espera, em vez de
encadear no meio de cadeia pela metade), e roda **antes** dos gatilhos de imutabilidade —
que bloqueariam o próprio backfill. A régua vale para os dois lados do parecer, e também
para nós mesmos: a v2 de 16/08 tampouco estava pronta.

A resposta formal enviada ao Hugo está em `docs/19-retorno-parecer-hugo.md`.

## Registro

Produzido em 16/08/2026, na sessão de análise do parecer, a pedido do Ota. Toda citação
de arquivo e linha do parecer foi reverificada contra o código antes de qualquer
veredito; as correções de código desta data (`schema.sql`, migrations `0001` v2 e
`0002`, `vite.config.ts`, `src/lib/supabase.ts`, remoção de `@google/genai`) passaram
por `tsc --noEmit` e `npm run build` verdes. Nada foi aplicado ao projeto Supabase vivo
— isso é o runbook `docs/14`, com o Ota.

Pareia com `docs/17-parecer-hugo.md` (o parecer, verbatim) e responde ao compromisso de
`docs/16` §Registro: *"inclusive se contrariar o que está escrito aqui"* — contrariou,
nos dois sentidos, e os dois lados saíram corrigidos.
