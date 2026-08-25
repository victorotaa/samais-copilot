// Seletor de cenários: pares coerentes, sem classificação automática no trote,
// triagem desbloqueada sem AML, paleta Manchester real (probe de cor computada).
import { abrirNavegador, coletor, loginTarmIdle, atenderCenario, overflowScan, ARTEFATOS } from './lib.mjs';

const browser = await abrirNavegador();
const { ok, fim } = coletor();

// ── TROTE ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await loginTarmIdle(page);
  const overlay = await atenderCenario(page, 'Trote');
  ok(overlay.includes('(11) 95555-4444'), 'trote: telefone do par (sem cadastro)');
  await page.waitForTimeout(6500);
  const body = await page.evaluate(() => document.body.innerText);
  ok(body.includes('pizzaria'), 'trote: roteiro certo tocando');
  ok(body.includes('PENDENTE') || body.includes('Analisando'), 'trote: risco segue PENDENTE (sem classificação automática)');
  const btnEnc = page.locator('button:has-text("Encerrar sem regulação")');
  ok(await btnEnc.count() >= 1 && await btnEnc.first().isEnabled(), 'trote: encerramento sem regulação habilitado');
  ok(errs.length === 0, 'trote: zero pageerror', errs[0] || '');
  await page.close();
}

// ── SEM LOCALIZAÇÃO ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await loginTarmIdle(page);
  const overlay = await atenderCenario(page, 'Sem localização', { confirmarAml: false });
  ok(overlay.includes('(11) 3222-0000'), 'sem-aml: telefone fixo do par');
  const cta = page.locator('button:has-text("Iniciar Triagem — endereço por voz")');
  await cta.waitFor({ timeout: 12000 });
  ok(await cta.isEnabled(), 'sem-aml: triagem NÃO bloqueada');
  await cta.click();
  await page.waitForSelector('text=Transcrição em Tempo Real', { timeout: 12000 });
  ok(true, 'sem-aml: entrou na triagem');
  ok(errs.length === 0, 'sem-aml: zero pageerror', errs[0] || '');
  await page.close();
}

// ── AVC LARANJA ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await loginTarmIdle(page);
  const overlay = await atenderCenario(page, 'AVC');
  ok(overlay.includes('(11) 97777-8888'), 'avc: telefone do par (filho, com histórico)');
  await page.waitForTimeout(21000);
  const body = await page.evaluate(() => document.body.innerText);
  ok(body.includes('LARANJA'), 'avc: rótulo LARANJA na superfície');
  ok(body.includes('janela terapêutica'), 'avc: protocolo certo');
  const cor = await page.evaluate(() => {
    const el = [...document.querySelectorAll('[class*="border-orange-500"]')][0];
    if (!el) return { real: null, probe: null };
    const probe = document.createElement('div');
    probe.className = 'border border-orange-500/40';
    document.body.appendChild(probe);
    const r = { real: getComputedStyle(el).borderColor, probe: getComputedStyle(probe).borderColor };
    probe.remove();
    return r;
  });
  ok(cor.real !== null && cor.real === cor.probe, 'avc: LARANJA renderiza laranja de verdade', String(cor.real));
  await page.screenshot({ path: `${ARTEFATOS}/cen-avc.png` });
  const handoff = page.locator('button:has-text("Handoff & Ir p/ Regulador"):visible').first();
  if (await handoff.count() && await handoff.isEnabled()) {
    await handoff.click();
    await page.waitForTimeout(2500);
    ok((await page.evaluate(() => document.body.innerText)).includes('LARANJA'), 'avc: chip LARANJA também no REGULADOR');
  }
  ok(errs.length === 0, 'avc: zero pageerror', errs[0] || '');
  await page.close();
}

// ── IDLE 390: seletor sem overflow ──
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await loginTarmIdle(page);
  const overflow = await overflowScan(page);
  ok(overflow.length === 0, 'idle390: zero overflow com o seletor', overflow.join(','));
  await page.screenshot({ path: `${ARTEFATOS}/idle-390.png`, fullPage: true });
  await page.close();
}

await browser.close();
fim();
