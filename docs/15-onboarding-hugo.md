# Onboarding — Hugo (desenvolvimento, treinamento e implantação)

> **Este documento é público.** O repositório `samais-copilot` é público, então tudo
> aqui pode ser lido por qualquer pessoa. Nada de dado pessoal, contato, valor de
> contrato, estratégia comercial ou bastidor entra neste arquivo — isso vive fora do
> repositório e se trata em conversa.
>
> Duas partes: a **A** é para o Ota executar antes de mandar; a **B** é o que o Hugo lê.

---

# Parte A — Para o Ota, antes de mandar

## A.1 O que o Hugo já pode fazer sem nenhum acesso

Os repositórios são **públicos**. Ele pode clonar, ler tudo e rodar o front localmente
hoje, sem esperar convite. Só precisa de acesso concedido para **escrever**.

Isso muda a ordem natural: mande o documento primeiro, deixe ele ler, e só conceda
acesso depois que houver conversa. Convite não é o primeiro passo — é o terceiro.

## A.2 Checklist de acesso

Cada acesso quando ele for de fato precisar — não por precaução, mas porque acesso que
ninguém usa é acesso que ninguém lembra de revisar.

| # | Acesso | Onde se concede | Quando |
|---|---|---|---|
| 1 | — nenhum — | ele já lê o repo público | ao mandar este documento |
| 2 | **Colaborador `write`** no `samais-copilot` | GitHub → Settings → Collaborators | quando houver combinação de escopo |
| 3 | **Projeto Supabase de desenvolvimento** (nunca o de demonstração) | Supabase → Organization → Members | quando for mexer em banco |
| 4 | Chave do **Google Maps** restrita por referrer, própria dele | console Google Cloud | quando for rodar o mapa localmente |
| 5 | **Vercel** (`samais-copilot-demo`) | Vercel → Team → Members | quando for cuidar de deploy |

## A.3 O que precisa ser combinado fora do repositório

Nada disto entra em arquivo — é conversa, e alguns viram contrato:

- Escopo, forma de trabalho e remuneração.
- **Confidencialidade e propriedade intelectual**: o código é público, mas o dado de
  operação, o material comercial e o que se aprende da operação não são. Se ele vai
  encostar em dado de paciente em algum momento, isso é contrato, não combinado verbal.
- Se ele entra como colaborador, prestador ou sócio — muda tudo, inclusive o que se
  concede na tabela acima.

---

# Parte B — Para o Hugo

## B.1 O que é o CoPilot OS, sem verniz

O Samais CoPilot OS é uma camada de apoio à operação de uma **Central de Regulação de
Urgências** — o serviço que atende o 192. A ideia: a chamada é transcrita ao vivo, o dado
clínico sai da conversa já estruturado, o sistema sugere uma classificação de risco (com
os motivos à vista) e cada tempo do atendimento é marcado na origem, por quem está na
cena, em vez de ser anotado depois.

Duas premissas que não se negociam, porque definem a arquitetura:

1. **Copiloto, não piloto.** Quem decide é o médico regulador. A sugestão é proposta;
   a divergência do médico é registrada com justificativa e vira dado de treino.
2. **O sistema nunca pode derrubar o 192.** Ele recebe uma cópia do áudio, não entra no
   caminho da chamada, e existe um controle para desligar a IA — com todos os campos
   voltando a ser preenchidos à mão. Modo degradado é requisito, não contingência.

## B.2 O estado real — leia isto antes de olhar a demo

A demo é convincente. **Ela é, em boa parte, teatro determinístico.** Isso está escrito
com todas as letras em `docs/08-handoff-dev.md` e `docs/10-analise-maturidade.md`, e
resumo aqui para você não perder tempo:

| Área | Estado |
|---|---|
| Login por matrícula, **5 perfis** (TARM / médico / viatura / gestor / admin do tenant) | **real**, Supabase Auth + RLS — o 5º (`ADMIN_TENANT`) é o mais privilegiado e o menos construído: não há gestão de usuário pela aplicação (SEC-19) |
| Frota, escalas, ocorrências ponta a ponta (T0–T4) | **real**, persistem no banco com realtime |
| Trilha de auditoria append-only | **real** |
| **Triagem por IA — transcrição, extração clínica, classificação** | **não existe.** É `MOCK_SCRIPTS`, roteiro fixo. Sem STT, sem LLM. |
| Integração com a telefonia da central (SIPREC) | não existe; arquitetura desenhada em `docs/05` §3 |
| Hash encadeado da auditoria | migration **escrita e não aplicada** (`0001`, revisada em v2 após o parecer — a v1 tinha corrida de concorrência e não devia ser aplicada como estava) |
| Exportação FHIR / APH-BR | `JSON.stringify` de mock, não pipeline |

Estimativa de quanto do caminho está andado, na régua dupla que o parecer independente
(`docs/17`) propôs e adotamos: **15–20% da superfície, 0% do núcleo** — e uma decisão de
arquitetura (a camada servidor, `docs/11` §1.11) precede a primeira linha do núcleo.

A parte difícil — IA de verdade sobre áudio de emergência em português, sob estresse,
com fallback — é exatamente a que **ainda não foi feita**. Se você entrar, é provável
que seja por aí.

O sistema já passou por uma auditoria externa de leitura: parecer em `docs/17`, nossa
verificação achado a achado em `docs/18`. Quatro achados de segurança confirmados foram
corrigidos no repositório em 16/08 (aplicação no projeto vivo pelo runbook `docs/14`).

## B.3 O que precisamos de você

Três frentes. Não precisam vir todas, e não precisam vir juntas.

**1. Desenvolvimento.** Na ordem em que faz diferença (reordenada em 16/08 pelo
   argumento do parecer `docs/17` ETAPA 5, que aceitamos):
   - **CI, testes e ESLint primeiro** — é o instrumento que torna todo o resto seguro.
     Foi a ausência dele que deixou passar os três erros de documentação que o parecer
     achou (contagem de linhas, "cai em modo demo", encanamento de LLM no bundle).
   - **Tier 0 de segurança** (`docs/07`, roteiro em `docs/14`) — é o que separa "demo"
     de "pode tocar em dado real de paciente". Corre em paralelo ao CI no que não
     depende dele. Inclui aplicar as migrations `0001` (na revisão v2) e `0002`.
   - **Substituir o mock por IA real**: STT em streaming + extração clínica + sugestão
     de classificação, com modo degradado obrigatório. Arquitetura em `docs/05` §2.
     ⚠️ Pré-requisito: a decisão da **camada servidor** (`docs/11` §1.11) — chave de
     STT/LLM e áudio não podem passar pelo navegador.
   - **Modularizar `src/App.tsx`** (monolito de ~2,7 mil linhas). Dívida conhecida e
     priorizada — habilita a fila multi-ocorrência, o rádio-operador e o offline do
     tablet, que são o que aparece no primeiro dia de operação real.

**2. Treinamento do modelo.** A tese do produto depende de acertar a classificação de
risco em português falado sob estresse. O critério de liberação já está declarado e é
público: **≥ 90% de concordância com a decisão do médico regulador, em teste sobre no
mínimo 1.000 chamadas já gravadas e anonimizadas**, revisado por responsável técnico
médico. Não é um número que a gente afrouxa depois.

**3. Implantação.** Ligar o sistema à telefonia de uma central real, tablets embarcados,
e acompanhar a operação em paralelo à equipe. É trabalho de campo, não só de código —
`docs/12` descreve as fases.

## B.4 Rodando em 5 minutos

```bash
git clone https://github.com/victorotaa/samais-copilot.git
cd samais-copilot
npm ci
cp .env.example .env      # preencha o que tiver
npm run dev               # app em :3000, LP em /lp
npx tsc --noEmit          # typecheck (não há ESLint nem teste ainda — é dívida)
```

Sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_KEY` o app roda em **modo demo puro**: roteiro
local, nenhuma conexão tentada. (Até 16/08 havia um fallback hardcoded que apontava
fork sem `.env` para o backend real — removido; parecer `docs/17` F-05.)

**Stack:** React 19 + Vite 6 + TypeScript + Tailwind v4 no front; Supabase (Postgres,
Auth, RLS, Realtime) no backend; Vercel no deploy. Banco em `supabase/schema.sql`.

Sobre variáveis: a chave `publishable`/anon do Supabase **vai ao cliente por design** — a
segurança vem do RLS. A `service_role` **nunca** entra no front, em nenhuma hipótese.

## B.5 Ordem de leitura

Uma hora de leitura economiza uma semana. Nesta ordem:

1. `docs/08-handoff-dev.md` — onboarding técnico. **Comece aqui.**
2. `docs/10-analise-maturidade.md` — o que é real, o que é mock, o que falta.
3. `docs/07-seguranca-backlog.md` + `docs/14-runbook-tier0.md` — o que trava dado real.
4. `docs/05-review-operacional.md` — decisões de produto, arquitetura da IA e do SIPREC.
5. `docs/01-visao-produto.md` e `docs/02-roadmap-backlog.md` — para onde vai.
6. `docs/12` (implantação e treinamento) e `docs/09` (fluxo da CRU e métricas).
7. `apresentacao-ms/index.html` — a apresentação institucional ao Ministério da Saúde.
   Abra no navegador; é como o produto é contado para fora.

## B.6 Como se trabalha aqui

- **Branch por trabalho**, PR contra `main`. Nada direto na `main`.
- **PR em draft** enquanto não estiver pronto. O Vercel publica um preview por PR.
- Commits e PRs em português, explicando **o porquê**, não só o quê.
- `npx tsc --noEmit` verde antes de abrir PR.
- Achou algo errado na documentação? Corrija no mesmo PR. Documento desatualizado aqui
  conta como bug — três dos documentos já foram corrigidos por mentirem por
  desatualização (`docs/10` §6).

## B.7 As regras que não se quebram

Não são preferências de estilo; vêm da natureza do que o sistema faz.

1. **Princípio da Realidade.** Não se inventa dado, e não se afirma o que não se pode
   demonstrar. Sem dado, escreve-se "a levantar". Um claim de conformidade que o sistema
   não cumpre é bug de segurança, não texto de marketing — houve uma limpeza inteira por
   causa disso (`SEC-20`).
2. **Nada de dado real de paciente antes do Tier 0.** Sem exceção, nem "só para testar".
3. **A operação nunca depende da IA.** Toda funcionalidade nova nasce com o caminho
   manual funcionando.
4. **Explicabilidade.** Se a sugestão não mostra por que sugeriu, ela não entra. Apoio à
   decisão que não se explica não é auditável, e o que não é auditável não deveria
   operar em serviço público de urgência.
5. **Identidade visual** em qualquer superfície visível: os tokens vêm de
   `docs/04-design-system.md`. Se você está digitando um código hexadecimal de cor,
   provavelmente está errado.

## B.8 Primeira tarefa sugerida

Atualizada em 16/08, adotando a proposta do próprio Hugo (`docs/17` Adendo B.1):
**o ambiente Docker é a primeira entrega, não o pré-requisito.** Hoje não existe
`Dockerfile` nem `docker-compose.yml` — só `npm run dev`. Criar o ambiente
conteinerizado (app + Postgres local + serviço de STT + um SRS de mentira que toca um
`.wav` como se fosse RTP) não exige nenhum acesso concedido, é verificável, e resolve o
problema de todo mundo depois. Desenvolver contra Postgres local, não contra o projeto
Supabase compartilhado; o Supabase entra depois, para validar RLS e Realtime.

Discordar do que está escrito segue bem-vindo — os documentos são a melhor leitura que
tínhamos, não sentença. O parecer em `docs/17` é a prova de que funciona.

---

## Registro

Criado em 11/08/2026, na sessão de maturação do CoPilot. Pareia com `docs/08` (técnico)
e `docs/13` (apresentação ao Ministério). Campos a preencher pelo Ota antes de mandar —
o Princípio da Realidade vale para o registro do próprio contato:

- Nome completo e como chegou até nós: _a preencher_
- Escopo combinado (desenvolvimento · treinamento · implantação): _a preencher_
- Forma de entrada (colaborador · prestador · sócio): _a preencher_
- Data em que o acesso de escrita foi concedido: _a preencher_
