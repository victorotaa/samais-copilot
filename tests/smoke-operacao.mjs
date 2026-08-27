// Smoke do build de OPERAÇÃO (docs/24): serve dist-operacao/ num static
// server próprio (porta 3100 — sem conflito com o dev server da demo) e prova
// o comportamento honesto sem backend: login recusa e permanece; nenhuma
// chamada automática; nenhum texto de demonstração. Hermético: com env vazio
// hasBackend é false e tryRealLogin devolve null sem tocar a rede.
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname, normalize } from 'path';
import { abrirNavegador, coletor, ARTEFATOS } from './lib.mjs';

const RAIZ = new URL('../dist-operacao/', import.meta.url).pathname;
if (!existsSync(RAIZ)) {
  console.error('❌ dist-operacao/ não existe — rode `npm run build:operacao` antes.');
  process.exit(1);
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const pedido = normalize(join(RAIZ, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  // fallback SPA: rota sem arquivo (ou fora da raiz) cai no index.html
  const alvo = pedido.startsWith(RAIZ) && extname(pedido) && existsSync(pedido) ? pedido : join(RAIZ, 'index.html');
  try {
    const corpo = readFileSync(alvo);
    res.writeHead(200, { 'content-type': MIME[extname(alvo)] || 'application/octet-stream' });
    res.end(corpo);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise(r => server.listen(3100, r));

const browser = await abrirNavegador();
const { ok, fim } = coletor();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));

await page.goto('http://localhost:3100/');
await page.waitForSelector('text=Acessar Central', { timeout: 10000 });
ok(true, 'operação: tela de login renderiza');
const texto = await page.evaluate(() => document.body.innerText);
ok(!/demonstra/i.test(texto), 'operação: login sem menção a demonstração', texto.match(/.{0,30}demonstra.{0,30}/i)?.[0] || '');

// login recusa com aviso honesto e PERMANECE na tela (nada de sessão anônima)
await page.fill('input[placeholder="Ex: TARM-04"]', 'TARM-04');
await page.fill('input[type="password"]', 'x');
await page.click('button[type="submit"]');
await page.waitForFunction(() => document.body.innerText.includes('Backend indisponível'), undefined, { timeout: 8000 });
ok(true, 'operação: login recusa com aviso honesto (Backend indisponível)');
ok(await page.locator('text=Acessar Central').first().isVisible(), 'operação: permanece na tela de login');

// 15s (mais que os 10s do timer de chamada da demo): nada acontece sozinho
await page.waitForTimeout(15000);
ok(!(await page.evaluate(() => document.body.innerText.includes('EMERGÊNCIA 192'))), 'operação: 15s sem chamada automática');
ok(await page.locator('text=Acessar Central').first().isVisible(), 'operação: sem navegação automática');
ok(errs.length === 0, 'operação: zero pageerror', errs[0] || '');

await page.screenshot({ path: `${ARTEFATOS}/smoke-operacao.png` });
await page.close();
await browser.close();
server.close();
fim();
