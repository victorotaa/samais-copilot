# Patch · vídeo institucional na hero da página de pitch

`samais-rota.vercel.app` · aplicar sobre o HTML da página de pitch

O código abaixo é o mesmo que está em produção na capa da página de estudos
(`rota-proposta/index.html`, commit `1f6cf59`). É o padrão canônico: banda de
capa com moldura de 14px, legenda em mono e botão de play em vidro.

## Por que este documento existe

A página de pitch **não está neste repositório** e o egress desta sessão
bloqueia `*.vercel.app`, então não dá para editá-la daqui nem inspecionar o que
está no ar. O patch está escrito para ser colado por quem tiver o fonte.

## Arquivos

O vídeo comprimido já está versionado em `rota-proposta/video/`:

| Arquivo | Tamanho | Formato |
|---|---|---|
| `rota.mp4` | 11 MB | H.264 · 1280×720 · 90s · `+faststart` |
| `rota-poster.jpg` | 68 KB | frame de 5,2s |

Copiar os dois para `video/` na raiz do projeto da página de pitch. **Servir do
Vercel, nunca de origem externa** — a CSP é `default-src 'self'`.

## 1 · CSS

Vai junto das regras de `.band`. Se a página de pitch não tiver `.band`, colar
também o bloco base marcado abaixo.

```css
/* Base — só se a página ainda não tiver .band */
.band{position:relative;overflow:hidden;border-radius:14px;margin:0 0 48px;background:#050505}
.band::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,7,8,.06) 40%,rgba(7,7,8,.58))}
.band-cap{position:absolute;left:24px;bottom:18px;z-index:2;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--gold-300)}

/* Overlay é decoração: nunca pode interceptar clique nem controle nativo */
.band::after{pointer-events:none}

/* ── Player na capa ──
   O vídeo é banda de imagem que se move. Herda a moldura da .band — mesmo raio,
   mesma legenda, mesmo overlay — e dispensa refração: imagem em movimento com
   deslocamento de pixel lê como falha de codec, não como vidro. */
.band.vband{height:auto;aspect-ratio:16/9;max-height:min(56vh,470px)}
.band.vband video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;background:#050505}
.band-cap{transition:opacity 320ms var(--ease)}
.vplay{
  position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;
  border:0;padding:0;cursor:pointer;-webkit-appearance:none;appearance:none;
  background:linear-gradient(180deg,rgba(7,7,8,.08),rgba(7,7,8,.44));
  transition:background 320ms var(--ease);
}
.vplay:hover{background:linear-gradient(180deg,rgba(7,7,8,.02),rgba(7,7,8,.34))}
.vplay span{
  width:78px;height:78px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:var(--glass-bg);border:var(--glass-border);box-shadow:var(--glass-shadow);
  backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);
  transition:transform 380ms var(--ease);
}
.vplay:hover span{transform:scale(1.06)}
.vplay:focus-visible{outline:2px solid var(--gold-500);outline-offset:-4px}
.vplay svg{width:26px;height:26px;fill:var(--gold-300);margin-left:5px}
.vband.on .vplay{display:none}
.vband.on::after,.vband.on .band-cap{opacity:0}
@media(max-width:640px){.vplay span{width:62px;height:62px}.vplay svg{width:21px;height:21px}}
```

## 2 · HTML

Primeiro elemento dentro do `.wrap` da hero, antes do eyebrow.

```html
<div class="band vband" id="vp">
  <video id="vid" preload="none" playsinline poster="video/rota-poster.jpg" width="1280" height="720">
    <source src="video/rota.mp4" type="video/mp4">
  </video>
  <button class="vplay" id="vplay" aria-label="Reproduzir o vídeo institucional da operação ROTA">
    <span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z"></path></svg></span>
  </button>
  <div class="band-cap">Operação ROTA · institucional · 1min30</div>
</div>
```

## 3 · JS

Dentro do IIFE que já existe no rodapé da página. **Sem `onclick` inline** — a
CSP por hash rejeita atributo de evento.

```js
var vp=document.getElementById('vp'),vid=document.getElementById('vid'),vb=document.getElementById('vplay');
if(vp&&vid&&vb){
  vb.addEventListener('click',function(){
    vp.classList.add('on');
    vid.setAttribute('controls','');
    vid.focus();
    var pr=vid.play();
    if(pr&&pr.catch){pr.catch(function(){});}
  });
}
```

## 4 · CSP

Duas alterações em `vercel.json`, e a segunda **não é opcional**.

1. Acrescentar `media-src 'self';` à diretiva. Sem isso o `default-src 'self'`
   até serviria, mas declarar explícito evita quebra quando a política mudar.
2. **Recalcular o hash do script.** Qualquer byte alterado no bloco inline
   invalida o hash antigo e o navegador bloqueia o script inteiro — a página
   perde nav, tema e reveal de uma vez.

```bash
python3 - <<'PY'
import io,re,hashlib,base64
s=io.open('index.html',encoding='utf-8').read()
c=re.findall(r'<script[^>]*>(.*?)</script>',s,re.S)[0]
print('sha256-'+base64.b64encode(hashlib.sha256(c.encode()).digest()).decode())
PY
```

## Armadilhas conferidas no render

| Sintoma | Causa |
|---|---|
| Controle nativo não responde ao clique | `.band::after` cobre o vídeo. Precisa de `pointer-events:none` |
| Página em branco depois do deploy | Hash do script desatualizado na CSP |
| Vídeo baixa sozinho no carregamento | Faltou `preload="none"`; o pôster é que carrega |
| Barra de controle parada na capa | `controls` no HTML em vez de aplicado no clique |
| Assunto do vídeo ondulando | Refração aplicada ao vídeo. Vidro é para foto parada |

## Verificação antes de publicar

Larguras de 1440 a 320px, com rolagem até o fim da página antes de medir:
`document.documentElement.scrollWidth` não pode exceder `clientWidth` em
nenhuma. Na capa: pôster visível, `controls` ausente antes do clique e presente
depois, botão some, legenda e overlay somem.
