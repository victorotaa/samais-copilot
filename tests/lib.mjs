// Utilitários compartilhados da suíte e2e.
// Browser: no CI o Playwright resolve o Chromium instalado por `npx playwright install`;
// em ambiente com browser do sistema, aponte PW_CHROMIUM para o executável.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const ARTEFATOS = new URL('./artifacts/', import.meta.url).pathname;
mkdirSync(ARTEFATOS, { recursive: true });

export async function abrirNavegador() {
  return chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
}

export function coletor() {
  const falhas = [];
  const ok = (cond, nome, extra = '') => {
    console.log((cond ? '✅' : '❌'), nome, extra);
    if (!cond) falhas.push(nome + (extra ? ` (${extra})` : ''));
  };
  const fim = () => {
    console.log(falhas.length ? `\nFALHAS: ${falhas.length}\n- ` + falhas.join('\n- ') : '\nTODAS AS VERIFICAÇÕES PASSARAM');
    process.exit(falhas.length ? 1 : 0);
  };
  return { ok, fim, falhas };
}

export async function login(page, papel) {
  await page.goto(BASE_URL + '/');
  await page.click(`button:has-text("${papel}")`);
  await page.fill('input[type="password"]', 'demo');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
}

export async function loginTarmIdle(page) {
  await login(page, 'TARM');
  await page.waitForSelector('text=Demonstração · próxima chamada', { timeout: 15000 });
}

// Escolhe um cenário no seletor do IDLE e simula o atendimento na central —
// fidelidade shadow: a triagem abre direto, sem gate de AML (decisão de 24/08).
export async function atenderCenario(page, chip) {
  await page.click(`button:has-text("${chip}")`);
  await page.waitForSelector('text=EMERGÊNCIA 192', { timeout: 14000 });
  await page.waitForTimeout(600);
  const overlay = await page.evaluate(() => document.body.innerText);
  await page.click('button:has-text("SIMULAR ATENDIMENTO")');
  await page.waitForSelector('text=Transcrição em Tempo Real', { timeout: 12000 });
  return overlay;
}

// Overflow horizontal real: ignora clipe deliberado (hidden/clip) e truncate.
// Espera as fontes declaradas resolverem antes de medir — no CI a métrica do
// fallback difere da webfont e uma medição precoce acusa estouro fantasma.
export async function overflowScan(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  return page.evaluate(() =>
    [...document.querySelectorAll('*')].filter(e =>
      e.scrollWidth > e.clientWidth + 1 && !['HTML', 'BODY'].includes(e.tagName) &&
      !['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(e).overflowX) &&
      getComputedStyle(e).textOverflow !== 'ellipsis'
    ).slice(0, 4).map(e => e.tagName + '.' + String(e.className).split(' ').slice(0, 2).join('.'))
  );
}
