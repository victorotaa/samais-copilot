# Handoff · Continuidade da linha ROTA

Cole este bloco inteiro como **primeira mensagem** de uma sessão nova do Claude Code
no repositório `victorotaa/samais-copilot`. Ele é autocontido: o destinatário não
precisa perguntar nada antes de executar.

---

Você é o assistente técnico de Victor Ota na Samais Gestão em Saúde. A linha de
trabalho é o **ROTA** — transporte sanitário eletivo. Esta sessão continua um
trabalho já em produção; leia o estado antes de mudar qualquer coisa.

## Estado atual — o que está no ar

| Página | URL | Papel |
|---|---|---|
| Estudos do ROTA | `samais-rota-proposta.vercel.app` | Carteira de 21 municípios · vídeo institucional na capa |
| Estudo de Osasco | `samais-rota-proposta.vercel.app/osasco` | Estudo municipal isolado |
| Pitch e apresentação | `samais-rota.vercel.app` | **Fonte fora deste repositório** |
| Master Plan | `samais-master-plan-rota.vercel.app` | `master-plan-rota/` |

Fonte das duas primeiras: `rota-proposta/index.html` e `rota-proposta/osasco.html`,
projeto Vercel com root directory `rota-proposta`.

## Regras do padrão visual — quebrar qualquer uma reprova a entrega

Canônico em `.claude/skills/samais-brand-guidelines/SKILL.md`. O essencial:

1. **Nunca rolagem horizontal.** Verificar em 14 larguras de 1440 a 320px, rolando
   até o fim da página antes de medir — tabela larga só aparece depois do reflow.
2. **Tabela no mobile vira cartão.** Toda `<td>` precisa de `data-label`; preço em
   `.tg` (dourado) fica legível.
3. **Refração vive na borda, nunca no miolo.** Camada `.refrata` distorcida por
   baixo, `.nucleo` repõe o centro limpo com máscara radial. Assunto ondulando lê
   como defeito de arquivo.
4. **Vídeo não sofre refração.** Deslocamento de pixel em imagem em movimento lê
   como falha de codec.
5. **Cada imagem aparece uma vez por página.** Só existem três fotos reais:
   `img/frota-frente.jpg`, `frota-lado.jpg`, `frota-traseira.jpg`.
6. **Ritmo de dobras** alternando `.fold`, `.fold-alt`, `.fold-deep`, `.fold-gold`,
   com `.part-divider` entre partes. Separação de superfície precisa de pelo menos
   ~8 unidades RGB para ser percebida no escuro.

## CSP — a armadilha que derruba a página inteira

`rota-proposta/vercel.json` trava o script inline por hash SHA-256. **Qualquer byte
alterado no bloco `<script>` invalida o hash** e o navegador bloqueia o script todo:
nav, tema e reveal caem juntos. Recalcular a cada alteração:

```bash
python3 - <<'PY'
import io,re,hashlib,base64
s=io.open('rota-proposta/index.html',encoding='utf-8').read()
c=re.findall(r'<script[^>]*>(.*?)</script>',s,re.S)[0]
print('sha256-'+base64.b64encode(hashlib.sha256(c.encode()).digest()).decode())
PY
```

Há **dois hashes** no `script-src` porque as duas páginas têm scripts diferentes.
Sem `onclick` inline — a CSP por hash rejeita atributo de evento.

## Modelo de precificação

Referência viva: `.claude/skills/samais-rota-study/references/benchmarks-rota.md`.

```
CDO   = bloco fixo do regime + (veículos × custo por veículo)
Preço = CDO × 1,35
```

O **per capita é resultado, nunca entrada**. Três correções já aplicadas que precisam
sobreviver a qualquer reedição:

- **Corridas por veículo ao dia.** 2,5 é o número de operação rodoviária. Em malha
  urbana o ciclo é de ~1h40 e o parâmetro vira 5,5. Usar 2,5 em cidade dobra a frota
  e o preço.
- **Depreciação.** O benchmark traz R$ 3.500/veículo/mês, o que implicaria veículo de
  R$ 210 mil em 60 meses. Os preços de referência do Ministério da Saúde são
  R$ 584,6 mil por micro-ônibus e R$ 304,6 mil por van — a depreciação real fica em
  torno de R$ 6.943. Manter os R$ 3.500 subprecifica o contrato.
- **Piso Operacional Mínimo.** Três testes cumulativos: bloco fixo até 55% do CDO;
  dois veículos mais reserva; cobertura no piso da banda de demanda.

**Nunca escrever "lucro", "margem" ou "lucratividade"** em nenhuma superfície de
proposta. O que aparece é "Composição do Valor Contratual", decomposta por rubrica.

### Divergência não resolvida — decidir antes da próxima proposta

A composição aberta soma **38%** sobre o custo direto; a fórmula de preço aplica
**35%** (`× 1,35`). São três pontos concedidos antes da primeira reunião — no estudo
de Osasco, R$ 7.344 por mês. Está documentado na dobra 07 do estudo, mas a decisão
de qual dos dois números é o oficial ainda é de Ota.

## Regra de conteúdo por audiência

O estudo de Osasco vai para a Secretaria Municipal de Saúde de Osasco. **Não pode
citar a carteira de prospecção da Samais** — nem "Nordeste", nem "carteira", nem
municípios de outros estados. A composição comercial não é assunto do cliente.
Comparações se apoiam na geometria ("operação rodoviária", "onde a rede é rarefeita"),
nunca no portfólio.

Vale para qualquer estudo municipal novo.

## Pendências abertas

1. **Vídeo na capa da página de pitch** (`samais-rota.vercel.app`). O fonte não está
   neste repositório — varredura completa do working tree e do histórico do git não
   encontrou nada, e nenhum arquivo foi deletado. Ela é servida de outro repositório
   ou por deploy de CLI. O patch pronto para colar está em
   `docs/patch-video-hero-pitch.md`; o vídeo comprimido está em `rota-proposta/video/`
   (`rota.mp4`, 11 MB, H.264 720p com `+faststart`, e `rota-poster.jpg`).
2. **Projeto Vercel próprio para o estudo de Osasco.** Hoje ele vive em `/osasco`
   dentro do projeto cuja raiz é a página de estudos da carteira. Quem apagar
   `/osasco` da URL chega lá. Criar o projeto no Vercel é ação de Ota.
3. **Skill sincronizada desatualizada.** A cópia carregada em
   `~/.claude/skills/synced/` está atrás da cópia do repositório. Atualizar no nível
   da conta, senão sessões futuras seguem doutrina velha.
4. **Lacunas do estudo de Osasco**, marcadas no documento e não preenchidas:
   prevalência estadual de diálise de São Paulo, habilitação dos serviços em CNES,
   alíquota municipal de ISS, e o volume da linha eletiva geral — que se levanta na
   central de regulação municipal, não se estima.

## Limitações do ambiente que você vai encontrar

O proxy de egress bloqueia `*.vercel.app`, `*.cloudfront.net`, `drive.google.com` e
`alertalicitacao.com.br` — `CONNECT` volta 403. **Você não consegue ver a página
publicada.** Verifique servindo local com `python3 -m http.server` e Playwright
(Chromium em `/opt/pw-browsers/chromium`), nunca pela URL de produção.

O acesso ao GitHub é restrito a `victorotaa/samais-copilot`.

## Execução

1. Trabalhe no branch `claude/create-master-plan-rota-bCnLs`, criando-o a partir de
   `origin/main` se a PR anterior já tiver sido mesclada.
2. Verifique toda alteração visual servindo local e medindo as 14 larguras antes de
   commitar.
3. Recalcule o hash da CSP sempre que tocar no script inline.
4. Faça commit, push e abra PR. Depois do merge, **mande o link atualizado no chat** —
   é instrução permanente de Ota.

Você está autorizado a executar sem perguntas adicionais. Onde faltar dado de fonte
primária, marque "a confirmar" no documento; nunca invente número.
