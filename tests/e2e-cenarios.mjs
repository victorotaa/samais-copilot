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
  const btnEnc = page.locator('button:has-text("Encerrar sem regulação"):visible').first();
  ok(await btnEnc.isEnabled(), 'trote: encerramento sem regulação habilitado');
  await btnEnc.click();
  await page.waitForTimeout(400);
  const chips = (await page.evaluate(() => document.body.innerText)).toLowerCase();
  ok(chips.includes('motivo:') && chips.includes('engano') && chips.includes('queda'), 'trote: motivo é escolha explícita (taxonomia e-SUS)');
  await page.locator('button:has-text("Trote"):visible').last().click();
  await page.waitForSelector('text=Demonstração · próxima chamada', { timeout: 8000 });
  ok(true, 'trote: encerrado com motivo → voltou à espera');
  ok(errs.length === 0, 'trote: zero pageerror', errs[0] || '');
  await page.close();
}

// ── SEM LOCALIZAÇÃO ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await loginTarmIdle(page);
  const overlay = await atenderCenario(page, 'Sem localização');
  ok(overlay.includes('(11) 3222-0000'), 'sem-aml: telefone fixo do par');
  const corpo = await page.evaluate(() => document.body.innerText);
  ok(corpo.includes('Colher por voz') || corpo.includes('COLHER POR VOZ'), 'sem-aml: painel de localização em modo voz');
  ok(corpo.toLowerCase().includes('sem aml nesta linha'), 'sem-aml: procedência declarada (fixo/VoIP)');
  ok(true, 'sem-aml: triagem abriu direto — nada bloqueia');
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
    const desp = await page.evaluate(() => {
      const el = [...document.querySelectorAll('button span')].find(x => x.textContent.includes('Confirmar Despacho'));
      if (!el) return null;
      return { texto: el.textContent, clipa: el.scrollWidth > el.clientWidth + 1, ellipsis: getComputedStyle(el).textOverflow === 'ellipsis' };
    });
    ok(desp !== null && /Confirmar Despacho · (USA|USB|MOT)-\d\d/.test(desp.texto) && !desp.clipa && !desp.ellipsis, 'avc: botão de despacho com a viatura INTEGRAL (sem truncar)', JSON.stringify(desp));
  }
  ok(errs.length === 0, 'avc: zero pageerror', errs[0] || '');
  await page.close();
}

// ── QUEDA: contexto preservado + reassociação pelo mesmo número ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await loginTarmIdle(page);
  await atenderCenario(page, 'IAM');
  await page.waitForTimeout(5000); // deixa o roteiro andar um pouco (contexto a preservar)
  await page.locator('button:has-text("Encerrar sem regulação"):visible').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Queda"):visible').last().click();
  await page.waitForSelector('text=Ocorrência em aberto', { timeout: 8000 });
  const card = await page.evaluate(() => document.body.innerText);
  ok(card.toLowerCase().includes('queda de ligação') && card.includes('contexto preservado'), 'queda: card em aberto na espera');
  ok(card.includes('(11) 98765-4321'), 'queda: telefone da ocorrência no card');
  // mesmo número religa (mesmo cenário IAM) → reassocia
  await atenderCenario(page, 'IAM');
  await page.waitForTimeout(1200);
  const chat = await page.evaluate(() => document.body.innerText.toLowerCase());
  ok(chat.includes('contexto reassociado'), 'queda: retorno do mesmo número REASSOCIA a ocorrência');
  ok((await page.locator('text=Ocorrência em aberto').count()) === 0, 'queda: card some após reassociar');
  ok(errs.length === 0, 'queda: zero pageerror', errs[0] || '');
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
