// Mobile 390 e tablet 768: o que o operador VÊ (não só o que existe no DOM) —
// pílula sticky com tempo, chips sem clipe, ETA×navegação, highlight íntegro.
import { abrirNavegador, coletor, login, loginTarmIdle, atenderCenario, overflowScan, ARTEFATOS } from './lib.mjs';

const CHIP = 'span[title*="Meta da etapa"]';
const browser = await abrirNavegador();
const { ok, fim } = coletor();

// ── TARM 390: toast, pílula com tempo, header sticky, highlight, overflow ──
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await loginTarmIdle(page);
  await page.click('button:has-text("AVC")');
  await page.waitForSelector('text=EMERGÊNCIA 192', { timeout: 14000 });
  await page.click('button:has-text("SIMULAR ATENDIMENTO")');
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => document.body.innerText.includes('cronômetro da etapa iniciado')), 'toast anuncia o cronômetro no ATENDER');
  await page.waitForSelector('text=Transcrição em Tempo Real', { timeout: 12000 });
  const header = page.locator('header');
  const pill = await header.innerText();
  ok(/\d{2}:\d{2}/.test(pill), 'pílula do header mostra o tempo da etapa');
  ok(!pill.includes('EM CHAMADA'), 'a 390px o tempo substitui o rótulo');
  const chip = page.locator(CHIP).first();
  await chip.scrollIntoViewIfNeeded();
  const box = await chip.boundingBox();
  ok(await chip.isVisible() && box && box.x >= 0 && box.x + box.width <= 391, 'chip do chat visível e sem clipe');
  // o layout é h-screen: quem rola são os blocos de tela — o header se
  // esconde ao rolar para baixo e volta ao rolar para cima (auto-hide)
  await page.mouse.move(195, 420);
  await page.mouse.wheel(0, 900);
  // espera o ESTADO (runner rola o wheel em passos lentos — relógio não serve).
  // O waitForFunction É o assert (timeout falharia); re-medir um frame depois
  // flakeia: um passo tardio do wheel pode disparar a volta no meio da
  // transição (perto do topo → mostrar é comportamento desenhado) — visto no
  // runner do CI (y=-34,7 logo após o gate de -40 passar). O assert da volta
  // logo abaixo já segue este padrão.
  await page.waitForFunction(() => {
    const h = document.querySelector('header');
    return !!h && h.getBoundingClientRect().y < -40;
  }, undefined, { timeout: 6000 });
  ok(true, 'header se esconde ao rolar para baixo (auto-hide)');
  const flutuante = page.locator('div.fixed span[title*="Meta da etapa"]').first();
  await flutuante.waitFor({ state: 'visible', timeout: 3000 });
  ok(true, 'mini-chip do cronômetro flutua com o header escondido');
  const fbox = await flutuante.boundingBox();
  ok(fbox && fbox.y < 60 && fbox.x + fbox.width <= 391, 'mini-chip no canto superior, dentro da tela', JSON.stringify(fbox));
  await page.mouse.wheel(0, -900);
  await page.waitForFunction(() => {
    const h = document.querySelector('header');
    return !!h && Math.abs(h.getBoundingClientRect().y) < 2;
  }, undefined, { timeout: 6000 });
  ok(true, 'header volta ao rolar para cima');
  ok((await overflowScan(page)).length === 0, 'zero overflow a 390', (await overflowScan(page)).join(','));
  // o chat rola POR DENTRO no mobile: transcrição autoscrollada dentro da
  // caixa — o rodapé sticky de CTAs nunca cobre a última fala. Rolando a
  // coluna até o FIM o rodapé assume a posição natural (desgruda): a caixa
  // da transcrição tem que ficar inteira acima dele.
  await page.evaluate(() => {
    const col = [...document.querySelectorAll('main > div')].find(d => getComputedStyle(d).overflowY === 'auto');
    if (col) col.scrollTop = col.scrollHeight;
  });
  await page.waitForTimeout(600);
  const chatEstado = await page.evaluate(() => {
    const el = document.querySelector('[data-chat-mensagens]');
    const cta = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Handoff & Ir p/ Regulador') && b.getBoundingClientRect().height > 0);
    if (!el || !cta) return null;
    const a = el.getBoundingClientRect(); const b = cta.getBoundingClientRect();
    return {
      rolavel: getComputedStyle(el).overflowY === 'auto',
      folga: el.scrollHeight - el.scrollTop - el.clientHeight,
      interno: el.scrollHeight > el.clientHeight,
      livre: b.top >= a.bottom - 2,
    };
  });
  ok(chatEstado !== null && chatEstado.rolavel, 'mob390: chat rola por dentro (caixa própria)');
  ok(chatEstado.interno ? chatEstado.folga < 60 : true, 'mob390: transcrição autoscrollada — última fala visível na caixa', `folga=${chatEstado?.folga}`);
  ok(chatEstado.livre === true, 'mob390: rodapé de CTAs não cobre a caixa da transcrição');
  await page.waitForFunction(() => document.body.innerText.includes('fique na linha'), undefined, { timeout: 60000 });
  await page.waitForTimeout(800);
  const html = await page.evaluate(() => document.body.innerHTML);
  ok(html.includes('regulador') && !/regula<span/.test(html), 'highlight: "regulador" íntegro (sem substring)');
  await page.screenshot({ path: `${ARTEFATOS}/mob-tarm-390.png` });
  ok(errs.length === 0, 'tarm390: zero pageerror', errs[0] || '');
  await page.close();
}

// ── REGULADOR 390: chip EM REGULAÇÃO visível ──
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await loginTarmIdle(page);
  await atenderCenario(page, 'IAM');
  await page.waitForTimeout(9000);
  await page.locator('button:has-text("Handoff & Ir p/ Regulador"):visible').first().click();
  await page.waitForTimeout(2500);
  const chip = page.locator(CHIP).first();
  await chip.scrollIntoViewIfNeeded();
  const box = await chip.boundingBox();
  ok(await chip.isVisible() && box && box.x >= 0 && box.x + box.width <= 391, 'reg390: chip EM REGULAÇÃO visível e sem clipe');
  ok((await overflowScan(page)).length === 0, 'reg390: zero overflow');
  await page.close();
}

// ── VIATURA 390: ETA e navegação sem sobreposição; botão livre do selo ──
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await login(page, 'Viatura');
  await page.waitForTimeout(11500);
  const nav = await page.locator('a:has-text("Iniciar navegação")').first().boundingBox();
  const painel = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find(d => d.className.includes('absolute') && d.textContent.includes('ETA · 4.2 km'));
    if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  const livres = nav && painel && (nav.y >= painel.y + painel.h - 1 || painel.y >= nav.y + nav.height - 1);
  ok(livres === true, 'viatura390: ETA e NAVEGAÇÃO não se sobrepõem');
  const selo = await page.locator('text=MAPA ESQUEMÁTICO').first().boundingBox();
  const foraDoSelo = !nav || !selo || nav.y + nav.height <= selo.y || selo.y + selo.height <= nav.y || nav.x >= selo.x + selo.width;
  ok(foraDoSelo, 'viatura390: botão livre do selo de demonstração');
  await page.screenshot({ path: `${ARTEFATOS}/mob-viatura-390.png` });
  ok(errs.length === 0, 'viatura390: zero pageerror', errs[0] || '');
  await page.close();
}

// ── Tablet 768: TARM e REGULADOR sem overflow, chips visíveis ──
{
  const page = await browser.newPage({ viewport: { width: 768, height: 1024 }, hasTouch: true });
  await loginTarmIdle(page);
  await atenderCenario(page, 'Obstétrico');
  await page.waitForTimeout(2000);
  ok(await page.locator(CHIP).first().isVisible(), 'tarm768: chip visível');
  ok((await overflowScan(page)).length === 0, 'tarm768: zero overflow');
  await page.waitForTimeout(12500);
  await page.locator('button:has-text("Handoff & Ir p/ Regulador"):visible').first().click();
  await page.waitForTimeout(2500);
  ok(await page.locator(CHIP).first().isVisible(), 'reg768: chip EM REGULAÇÃO visível');
  ok((await overflowScan(page)).length === 0, 'reg768: zero overflow');
  await page.close();
}

await browser.close();
fim();
