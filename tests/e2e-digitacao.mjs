// Modo 2 da doutrina (IA sobre digitação): sem escuta, o TARM digita e a
// classificação reage ao texto — determinística, rotulada, sem palpite.
import { abrirNavegador, coletor, loginTarmIdle, atenderCenario, overflowScan, ARTEFATOS } from './lib.mjs';

const browser = await abrirNavegador();
const { ok, fim } = coletor();

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await loginTarmIdle(page);
  await atenderCenario(page, 'IAM');
  await page.waitForTimeout(2500);

  // entra no modo digitação
  await page.click('button:has-text("Digitação")');
  await page.waitForTimeout(800);
  const corpo1 = await page.evaluate(() => document.body.innerText);
  // o chat renderiza marcadores em caixa alta (CSS) — comparação em minúsculas
  ok(corpo1.toLowerCase().includes('escuta desligada'), 'marcador de escuta desligada no chat');
  ok(corpo1.includes('Sem escuta · IA sobre o texto digitado'), 'subtítulo do modo no cabeçalho');
  const ta = page.locator('textarea[placeholder*="como no sistema da central"]');
  ok(await ta.count() === 1 && await ta.isVisible(), 'campo de digitação visível');
  ok(corpo1.includes('sem modelo real'), 'rótulo de simulação presente (SEC-20)');

  // transcript congelado: sem mensagens novas
  const n1 = await page.evaluate(() => document.querySelectorAll('[class*="rounded-2xl"] p, [class*="rounded"] p').length);
  await page.waitForTimeout(4000);
  const n2 = await page.evaluate(() => document.querySelectorAll('[class*="rounded-2xl"] p, [class*="rounded"] p').length);
  ok(n1 === n2, 'transcrição congelada no modo digitação', `${n1}→${n2}`);

  // IAM digitado → VERMELHO
  await ta.fill('minha esposa esta com dor no peito e suando frio, muita dor');
  await page.waitForTimeout(1100);
  let body = await page.evaluate(() => document.body.innerText);
  ok(body.includes('Suspeita de IAM'), 'texto de IAM → protocolo IAM');
  ok(body.includes('Dor torácica') && body.includes('Sudorese fria'), 'sintomas extraídos do texto');
  await page.screenshot({ path: `${ARTEFATOS}/digitacao-iam.png` });

  // obstétrico → LARANJA
  await ta.fill('ela esta em trabalho de parto, contracoes de 4 em 4 minutos, gravida de 39 semanas');
  await page.waitForTimeout(1100);
  body = await page.evaluate(() => document.body.innerText);
  ok(body.includes('parto iminente'), 'texto obstétrico → protocolo obstétrico');
  ok(body.includes('LARANJA'), 'LARANJA sugerido a partir do texto');
  ok(body.includes('Gestante'), 'sinal complementar (gestante) somado');

  // texto sem sinal → PENDENTE, nunca palpite
  await ta.fill('asdf qwerty teste aleatorio');
  await page.waitForTimeout(1100);
  body = await page.evaluate(() => document.body.innerText);
  ok(body.includes('Sem sinal identificado no texto'), 'sem sinal → sem classificação (PENDENTE)');
  ok(body.includes('PENDENTE'), 'rótulo PENDENTE de volta');

  // manual: campo some, banner com a garantia da gravação
  await page.click('button:has-text("Manual")');
  await page.waitForTimeout(600);
  ok(await ta.count() === 0, 'campo some no modo manual');
  body = await page.evaluate(() => document.body.innerText);
  ok(body.includes('Modo Manual Ativado') && body.includes('A gravação da chamada continua'), 'banner manual com a garantia da gravação');

  // volta à escuta: transcrição retoma
  const antes = await page.evaluate(() => document.body.innerText.length);
  await page.click('button:has-text("Escuta")');
  await page.waitForFunction(a => document.body.innerText.length > a + 40, antes, { timeout: 12000 });
  ok(true, 'escuta religada: transcrição retomou');
  ok(errs.length === 0, 'zero pageerror', errs[0] || '');
  await page.close();
}

// ── Mobile 390: modo digitação utilizável ──
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await loginTarmIdle(page);
  await atenderCenario(page, 'Trauma');
  await page.waitForTimeout(1500);
  await page.click('button:has-text("Digitação")');
  await page.waitForTimeout(700);
  const ta = page.locator('textarea[placeholder*="como no sistema da central"]');
  await ta.scrollIntoViewIfNeeded();
  ok(await ta.isVisible(), 'mob390: campo de digitação visível');
  await ta.fill('paciente engasgado, nao respira');
  await page.waitForTimeout(1100);
  ok((await page.evaluate(() => document.body.innerText)).includes('OVACE'), 'mob390: classificação reage ao texto');
  ok((await overflowScan(page)).length === 0, 'mob390: zero overflow no modo digitação');
  await page.screenshot({ path: `${ARTEFATOS}/digitacao-390.png` });
  await page.close();
}

await browser.close();
fim();
