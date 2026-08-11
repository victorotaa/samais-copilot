# Handoff de análise técnica — Hugo

> **Como usar:** o bloco abaixo é autocontido. Hugo cola inteiro na primeira mensagem do
> ambiente de IA dele (Claude Code, ou equivalente com acesso a repositório e navegador).
> Não precisa de nenhum acesso concedido — o repositório é público.
>
> O que queremos de volta é **uma análise independente, incluindo onde discordamos de nós
> mesmos**. Não é revisão de código linha a linha; é leitura de engenheiro sobre viabilidade,
> esforço e risco. Pareia com `docs/15-onboarding-hugo.md`, que é a orientação humana.

---

## Bloco para colar

````
Você vai analisar um sistema de saúde pública em desenvolvimento e produzir um parecer
técnico independente. Trabalhe como engenheiro sênior avaliando se entra num projeto:
cético, específico, sem cortesia com números que não se sustentam.

## O sistema

Samais CoPilot OS — camada de apoio à operação de uma Central de Regulação de Urgências,
o serviço que atende o 192 no Brasil. A proposta: transcrever a chamada ao vivo, extrair o
dado clínico já estruturado, sugerir classificação de risco com os fatores à vista, e
marcar cada tempo da missão na origem (na cena, por toque em tablet) em vez de reconstruir
depois a partir de anotação manual e rádio.

Duas premissas que definem a arquitetura e não estão em discussão:
1. Copiloto, não piloto — quem decide é o médico regulador; a divergência dele é registrada
   com justificativa e vira dado de supervisão.
2. O sistema nunca pode derrubar o 192 — ele recebe cópia do áudio, não entra no caminho da
   chamada, e existe controle para desligar a IA com todos os campos voltando ao manual.

## Onde está tudo

Repositório público: https://github.com/victorotaa/samais-copilot (branch `main`)
Demo navegável:      https://samais-copilot-demo.vercel.app/
Landing page:        https://samais-copilot-demo.vercel.app/lp/
Peça institucional:  https://samais-copilot-demo.vercel.app/apresentacao-ms/

Clone e rode antes de ler qualquer coisa:
    git clone https://github.com/victorotaa/samais-copilot.git
    cd samais-copilot && npm ci && npm run dev

Stack: React 19 + Vite 6 + TypeScript + Tailwind v4 no front; Supabase (Postgres, Auth,
RLS, Realtime) no backend; Vercel no deploy. Schema em `supabase/schema.sql`.

## Leia nesta ordem

1. `docs/08-handoff-dev.md` — onboarding técnico
2. `docs/10-analise-maturidade.md` — o que é real, o que é simulação, o que falta
3. `docs/07-seguranca-backlog.md` + `docs/14-runbook-tier0.md` — o que trava dado real
4. `docs/05-review-operacional.md` — decisões de produto e a arquitetura pretendida da IA
5. `docs/11-decisoes-tecnologia-infra.md` — stack por camada e modelo de custo
6. `docs/12-operacao-implantacao-treinamento-testes.md` — fases F0–F3 e critérios de gate
7. `src/App.tsx` — o app inteiro (monolito de ~2 mil linhas)
8. `supabase/schema.sql` e `supabase/migrations/0001_audit_hash_chain.sql`

## O que a equipe afirma hoje — trate como hipótese, não como dado

- O produto está a **15–20% do caminho** até virar produto de verdade.
- **A triagem por IA não existe.** É `MOCK_SCRIPTS`, roteiro determinístico: sem
  reconhecimento de fala, sem modelo de linguagem. É o item que tira o produto do teatro.
- Login, perfis, frota, escalas, ocorrências ponta a ponta (T0–T4) e trilha de auditoria
  append-only **são reais** e persistem no banco.
- O hash encadeado da auditoria está **escrito e não aplicado** (migration `0001`).
- Não há ESLint, não há teste automatizado, não há CI. Só `npx tsc --noEmit`.
- Custo de plataforma projetado: R$ 600 a 4.400 por central/mês, com processamento por
  atendimento na ordem de R$ 0,20. Premissas em `docs/11`.
- Critério de liberação da IA clínica: **≥ 90% de concordância com a decisão do médico
  regulador**, em teste retrospectivo sobre **no mínimo 1.000 chamadas anonimizadas**,
  revisado por responsável técnico médico.

## Produza este parecer

Um documento em markdown, direto, sem introdução cerimonial. Sete partes:

1. **Veredito sobre o "15–20%"** — sua estimativa própria, com o raciocínio. Se discorda,
   diga para quanto e por quê.

2. **Substituir o `MOCK_SCRIPTS` por IA real** — a parte que mais interessa. Como você
   atacaria: qual serviço de reconhecimento de fala para português falado sob estresse em
   linha telefônica (banda estreita, ruído, sobreposição de vozes), como estruturar a
   extração clínica, onde o modelo de linguagem entra e onde não deve entrar. Latência
   aceitável para não atrapalhar o atendimento, e como o modo degradado se comporta quando
   o serviço cai no meio de uma chamada. Ordem de grandeza de esforço.

3. **Viabilidade do gate de 90%** — é alcançável? Com que volume e que qualidade de dado
   rotulado? Onde a régua está mal desenhada, se estiver. Concordância com decisão médica
   é a métrica certa, ou há armadilha nela?

4. **Tier 0 de segurança** — esforço para fechar `docs/07` §SEC-01 a SEC-07. O que você
   faria em ordem diferente, e o que falta na lista.

5. **Arquitetura** — o monolito `App.tsx`, o modelo do banco, o isolamento entre centrais
   por RLS. O que quebra primeiro quando isso for para uma central real com dezenas de
   operadores simultâneos.

6. **Riscos que ninguém listou** — o mais valioso do parecer. O que você viu e não está em
   nenhum documento do repositório.

7. **Como você entraria** — por onde começaria, o que precisaria de terceiros, e o que
   você recusaria fazer nas condições atuais.

## Regras

- **Não invente número.** Se não dá para estimar com o que está no repositório, diga o que
  falta para estimar. "A levantar" é resposta válida; número plausível inventado não é.
- **Cite arquivo e linha** quando afirmar algo sobre o código.
- **Discordar é o objetivo.** Os documentos do repositório são a melhor leitura que a
  equipe tinha, não sentença. Se estiverem errados, o parecer é o lugar de dizer.
- Não altere código nem abra pull request nesta rodada. É análise, não implementação.
- Português, tom direto.

Está autorizado a executar tudo acima sem pedir esclarecimento. Comece clonando e rodando.
````

---

## Registro

Gerado em 11/08/2026, na sessão de maturação do CoPilot, a pedido do Ota. Complementa:

- `docs/15-onboarding-hugo.md` — orientação humana e escada de acesso.
- `docs/08-handoff-dev.md` — onboarding técnico de quem assume a engenharia.
- `docs/10-analise-maturidade.md` — a autoavaliação que este handoff pede para contestar.

A resposta do Hugo, quando vier, entra como `docs/17-parecer-hugo.md` — inclusive se
contrariar o que está escrito aqui. Parecer que só confirma o que já pensávamos não
justificou o convite.
