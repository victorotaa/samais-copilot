// Cronômetro de etapa: nasce no ATENDER, tica, muda de cor na meta (60s reais),
// reinicia no handoff para a regulação.
import { abrirNavegador, coletor, loginTarmIdle, atenderCenario, ARTEFATOS } from './lib.mjs';

const CHIP = 'span[title*="Meta da etapa"]';
const browser = await abrirNavegador();
const { ok, fim } = coletor();

// ── TARM: presença, tique e virada de cor aos 60s ──
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await loginTarmIdle(page);
  ok(await page.locator(CHIP).count() === 0, 'timer: NÃO existe antes do ATENDER (shadow)');
  const inicio = Date.now();
  await atenderCenario(page, 'Verde');
  const chip = page.locator(CHIP).first();
  ok(await chip.count() >= 1, 'timer: chip presente no cabeçalho do TARM');
  const t1 = await chip.innerText();
  await page.waitForTimeout(2500);
  const t2 = await chip.innerText();
  ok(t1 !== t2 && /\d{2}:\d{2}/.test(t2), 'timer: cronômetro anda', `${t1.trim()} → ${t2.trim()}`);
  ok(!(await chip.getAttribute('class')).includes('text-warn'), 'timer: neutro dentro da meta');
  // Espera o PRÓPRIO estado virar (o relógio nasce no ATENDER, não no início do teste).
  await page.waitForFunction(sel => {
    const el = document.querySelector(sel);
    return !!el && el.className.includes('text-warn');
  }, CHIP, { timeout: 80000 });
  ok(true, 'timer: vira ÂMBAR acima da meta (60s)', (await chip.innerText()).trim());
  await page.screenshot({ path: `${ARTEFATOS}/timer-390-meta.png` });
  ok(errs.length === 0, 'timer: zero pageerror', errs[0] || '');
  await page.close();
}

// ── REGULADOR: cronômetro próprio desde o handoff ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await loginTarmIdle(page);
  await atenderCenario(page, 'IAM');
  await page.waitForTimeout(9000);
  await page.locator('button:has-text("Handoff & Ir p/ Regulador"):visible').first().click();
  await page.waitForTimeout(2500);
  const tr = await page.locator(CHIP).first().innerText();
  ok(tr.includes('EM REGULAÇÃO') && /00:0\d/.test(tr), 'regulador: cronômetro reinicia no handoff', tr.trim());
  await page.close();
}

await browser.close();
fim();
