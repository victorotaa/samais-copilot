# Handoff — Acertar o template da proposta ROTA

Você é Claude Code trabalhando para Victor Ota, da **Samais Gestão em
Saúde**. A tarefa é fechar o padrão visual de uma proposta comercial que
já existe, está publicada, e ainda não bate com o template institucional
da casa — depois de três tentativas falhas na sessão anterior.

---

## Tarefa

Reconstruir `rota-proposta/index.html` no repositório
`victorotaa/samais-copilot` para que fique **visualmente idêntico em
linguagem** à referência `https://samais-estudos.vercel.app/#estudos`, e
publicar em `https://samais-rota-proposta.vercel.app`.

**Pronto quando:** a página abrir com o mesmo cromo, mesma paleta, mesma
estrutura de dobras e mesmo tratamento de imagem da referência — e Ota
confirmar. O conteúdo textual e os números **não mudam**; o que muda é a
camada visual.

---

## Por que a sessão anterior errou — leia antes de agir

O erro não foi de execução, foi de referência. A sessão anterior não
conseguia abrir `vercel.app` (bloqueio de egress) e usou `lp/index.html`
como padrão canônico. **A LP é landing page de produto.** Uma proposta
comercial é peça **institucional**, e as duas famílias têm tokens
diferentes:

| | LP · produto | `apresentacao-ms` · institucional |
|---|---|---|
| Fundo | `#070708` | **`#0A0A0A`** |
| Ouro | `#BF9A3D` | **`#B8954E`** / soft `#D4B373` / deep `#8E7238` |
| Corpo | Plus Jakarta Sans | **Inter** |
| Container | 1180px | **1120px** |
| Glass | `blur(14px)` | **tokens próprios**, `blur(22px) saturate(150%)` |
| Dobras | troca de fundo sólido | **gradiente sutil** |
| Refração | não existe | **`feTurbulence` + `feDisplacementMap`** |

**A referência correta está no próprio repositório:
`apresentacao-ms/index.html`.** Ele é da mesma família de
`samais-estudos`. Comece por ele, não pela LP.

O `[Samais]ROTA-Apresentacao-Diretoria-v1.html` no Drive de Ota usa esses
mesmos tokens — confirma a família.

---

## Contexto necessário

### Repositório e branch
- Repo: `victorotaa/samais-copilot`
- Branch de trabalho: `claude/create-master-plan-rota-bCnLs`
- Arquivo-alvo: `rota-proposta/index.html`
- Config de deploy: `rota-proposta/vercel.json` (Root Directory =
  `rota-proposta`, sem build)
- Projeto Vercel: `samais-rota-proposta`, deploy automático de `main`

### O template institucional — `apresentacao-ms/index.html`

Tokens exatos:
```css
:root{
  --bg:#0A0A0A; --s1:#131313; --s2:#1A1A1A; --divider:#262626;
  --gold:#B8954E; --gold-soft:#D4B373; --gold-deep:#8E7238;
  --green:#1E7A4B; --amber:#B8804E; --red:#A33044;
  --text:#F4F1EA; --text-2:#D9D2C5; --muted:#9C9489; --dim:#615C53;
  --display:'Syne'; --body:'Inter'; --mono:'JetBrains Mono';
  --glass-bg:linear-gradient(135deg,rgba(255,255,255,.085),rgba(255,255,255,.025));
  --glass-border:1px solid rgba(255,255,255,.12);
  --glass-blur:blur(22px) saturate(150%);
  --glass-shadow:inset 0 1px 0 rgba(255,255,255,.16), inset 0 -1px 0 rgba(0,0,0,.22), 0 18px 50px rgba(0,0,0,.5);
  --glass-radius:18px;
  --ease:cubic-bezier(.16,1,.3,1);
  --maxw:1120px;
}
```

Componentes a reproduzir:
- **`.nav`** — sticky, `rgba(10,10,10,.72)` + `backdrop-filter:blur(18px)
  saturate(140%)`, `.nav-in` com altura **68px**. Wordmark SVG 24px e
  monograma 22px que trocam por breakpoint. Links em mono 10.5px
  uppercase, `letter-spacing:.1em`, ativo em `--gold-soft` com
  `border-bottom` dourado. Hambúrguer `.navham` que anima para X.
  **Sem botão de CTA no nav.**
- **`.fold`** — `padding:104px 0`, `border-top:1px solid
  rgba(255,255,255,.05)`, `scroll-margin-top:80px`
- **`.fold-alt`** — `linear-gradient(180deg,rgba(255,255,255,.014),transparent 70%)`.
  É esse o "ritmo de cor nas dobras": **gradiente**, não fundo sólido.
- **`.band`** — imagem com `height:min(38vh,300px)`, raio 14px, `img`
  em `inset:-12% 0; height:124%; opacity:.82`, overlay `::after` em
  gradiente escuro, legenda `.band-cap` em mono 10px
- **`.glass`** — usa os tokens acima
- **`.refrata{filter:url(#glassDistort)}`** — o filtro SVG está inline
  no arquivo. **Só se aplica a imagem.** O próprio código traz o
  comentário: vidro que carrega texto não distorce, porque
  `url(#glassDistort)` ondula letra e linha reta.
- Grids `.g2` / `.g3` / `.g4`, cards `padding:28px 26px`
- `h2` em `clamp(29px,4.1vw,45px)` com `max-width:19ch`; `.lead` em
  17px, `max-width:62ch`, weight 300

### Imagens

Três fotos documentais já otimizadas em `rota-proposta/img/`:
`frota-frente.jpg` (1200×799), `frota-lado.jpg` (1280×769),
`frota-traseira.jpg` (900×1200). São o micro-ônibus **Caminhos da Saúde**
com identidade "Pacientes Eletivos" — o veículo exato que a proposta
discute, o que faz a foto *provar* o argumento da frota cedida.

**Cada imagem pode aparecer no máximo uma vez.** A sessão anterior
duplicou frente e traseira entre capa e Parte 02; Ota reclamou. Com três
imagens únicas, não force cinco posições.

Se precisar de mais imagens, o banco documental está no Drive de Ota,
pasta ID `1LJfWhToTh6Zvi4KnO6527hpC3zczd5V1` — há também ambulâncias,
motolâncias e USBs. **Zero stock.**

### Doutrina visual aplicável
- Fonte única de tokens declarada:
  `samais-pep/design/samais-pep-os-design-tokens.json` (v1.0), sob o hub
  `samais-os`. **Confira o CSS contra esse JSON** — a sessão anterior fez
  engenharia reversa a partir de HTML publicado e nunca viu a fonte.
- Ouro é sinal, não decoração: no máximo ~10% da superfície.
- Dados sempre em JetBrains Mono. Nunca dados em Syne.
- Logotipo nunca em cor fixa — `currentColor` herdando token semântico,
  contraste ≥3:1. Em `<img>` `currentColor` não funciona: inline o SVG.
- **Nunca as palavras "lucro", "margem" ou "lucratividade"** em nenhuma
  superfície. O preço aparece como "Composição do Valor Contratual",
  decomposta por rubrica, BDI de 35% sobre CDO.
- Skill completa em `.claude/skills/samais-brand-guidelines/SKILL.md`.

### Conteúdo que não muda

Dez seções, já revisadas e aprovadas: A Samais · O Momento · O Território ·
A Demanda Real · A Solução ROTA · O Financiamento · Composição do Valor ·
O Custo por Habitante · Por Que a Samais · Próximos Passos.

Números que devem permanecer exatos: 21 municípios, 1.274.963 habitantes
(IBGE 2025), 520–977 pacientes em diálise (banda regional declarada),
119.795–191.087 viagens/ano, R$ 0,72 por habitante/mês, composição de 38%
decomposta por rubrica.

---

## Execução

1. **Abra `https://samais-estudos.vercel.app/#estudos` e olhe.** Este é o
   passo que a sessão anterior não conseguiu executar, e é a causa raiz
   das três tentativas falhas. Tire screenshot. Compare com
   `apresentacao-ms/index.html` renderizado e anote onde divergem.

2. **Leia `apresentacao-ms/index.html` inteiro** — tokens, componentes,
   o filtro `glassDistort`, a estrutura de dobras, o JS de parallax e
   de scrollspy.

3. **Confira os tokens contra
   `samais-pep/design/samais-pep-os-design-tokens.json`.** Se divergirem,
   o JSON vence e você deve sinalizar a divergência a Ota.

4. **Reconstrua `rota-proposta/index.html`** sobre esse template,
   preservando as dez seções e todos os números. Distribua as três
   imagens sem repetir nenhuma.

5. **Verifique antes de publicar**, servindo o arquivo com a CSP real de
   `rota-proposta/vercel.json` no header: zero violação de CSP, zero erro
   de página, `scrollWidth === clientWidth` em 1440, 768 e 390px, e
   nenhuma imagem repetida.

6. **Recalcule o hash SHA-256 do script inline** e atualize a CSP em
   `rota-proposta/vercel.json`. Sem isso o script é bloqueado em produção
   e o nav para de funcionar.

7. **Commit, PR e merge para `main`.** Atenção: a `main` faz squash, então
   a branch acumula commits que a `main` absorveu com outro SHA. Se o
   merge conflitar, **rebaseie a branch em `origin/main` preservando só os
   arquivos que você tocou** — a sessão anterior, ao rebasear, sobrescreveu
   versões mais novas de `docs/03-landing-page-spec.md` e
   `docs/13-apresentacao-ms.md` com cópias antigas.

8. **Abra a página publicada e confirme visualmente** antes de dizer a
   Ota que está pronto.

9. **Reporte no chat** o merge, o commit e o link — Ota pediu explicitamente
   que todo merge e toda atualização de link sejam avisados.

---

## Acesso que esta sessão precisa ter

A sessão anterior falhou por bloqueio de rede. Configure o ambiente com:

**Repositórios GitHub:** `victorotaa/samais-copilot` (obrigatório),
`victorotaa/samais-os` (hub, onde vive o JSON de tokens),
`victorotaa/samais-pep`.

**Domínios de egress:**

| Domínio | Para quê |
|---|---|
| `*.vercel.app` | ver a referência e a página publicada — **crítico** |
| `vercel.com`, `api.vercel.com` | deploy e gestão de projeto |
| `fonts.googleapis.com`, `fonts.gstatic.com` | tipografia |
| `*.cloudfront.net` | CDN do Higgsfield, para baixar imagem gerada |
| `*.claudeusercontent.com` | artifacts |
| `www.scielo.br`, `bjnephrology.org` | Censo Brasileiro de Diálise |
| `*.ibge.gov.br`, `cidades.ibge.gov.br`, `ftp.ibge.gov.br` | população |
| `*.gov.br` | INCA, Ministério da Saúde, DATASUS, portarias |
| `cnes.datasus.gov.br` | rede habilitada de diálise e radioterapia |
| `pncp.gov.br` | editais e contratos públicos |
| `conass.org.br`, `conasems.org.br` | normativos e notas técnicas |
| `drive.google.com`, `*.googleapis.com` | banco documental de imagens |

Sem `*.vercel.app` liberado, esta tarefa não é executável — o passo 1 é o
que destrava tudo.

---

## Estado atual

Último merge: `03cb48a` na `main`, mais o commit de deduplicação de
imagens. A página publicada está no cromo da LP (topbar 64px, wrap 1180,
Plus Jakarta Sans, `#070708`) — **errado**, precisa migrar para o cromo
institucional.

Pendências herdadas, ambas de Ota:
- A skill `samais-brand-guidelines` sincronizada na conta ainda tem a
  paleta antiga (`#04060C`, `#D4A857`, Inter como corpo). Enquanto não
  for atualizada, qualquer sessão nova reproduz o erro. O arquivo
  corrigido está em `.claude/skills/samais-brand-guidelines/SKILL.md`.
- A divergência entre a decomposição de referência (38,0%) e o
  multiplicador de aplicação (×1,35) vale R$ 234.447/ano nesta carteira e
  precisa de decisão de diretoria antes de planilha aberta em edital.

---

Ota já validou este contexto. **Execute sem pedir confirmação adicional** —
exceto se o passo 3 revelar divergência entre o JSON de tokens e o CSS
publicado, ou se `samais-estudos.vercel.app` mostrar um template
substancialmente diferente de `apresentacao-ms/index.html`. Nesses dois
casos, mostre a divergência a Ota antes de reconstruir.
