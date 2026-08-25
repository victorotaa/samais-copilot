// Lint de vocabulário vetado nas superfícies (doutrina de precificação — docs/20 §3.5).
// Fronteira Unicode obrigatória: "invólucro" contém "lucro" e não pode acusar.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const TERMOS = [/lucros?/, /lucrativ\p{L}*/, /margem/, /ROI/, /economia gerada/];
const EXTENSOES = new Set(['.ts', '.tsx', '.css', '.html']);
const RAIZES = ['src', 'lp', 'apresentacao-ms'];
const AVULSOS = ['index.html'];

function arquivos(dir) {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return arquivos(p);
    return EXTENSOES.has(extname(n)) ? [p] : [];
  });
}

const alvos = [...RAIZES.flatMap(r => { try { return arquivos(r); } catch { return []; } }), ...AVULSOS];
const achados = [];
for (const arq of alvos) {
  const linhas = readFileSync(arq, 'utf8').split('\n');
  linhas.forEach((linha, i) => {
    for (const termo of TERMOS) {
      const re = new RegExp(`(?<![\\p{L}])(${termo.source})(?![\\p{L}])`, 'giu');
      const m = linha.match(re);
      if (m) achados.push(`${arq}:${i + 1} → "${m[0]}"`);
    }
  });
}

if (achados.length) {
  console.error(`❌ Vocabulário vetado em superfície (${achados.length}):`);
  achados.slice(0, 20).forEach(a => console.error('  -', a));
  process.exit(1);
}
console.log(`✅ lint de vocabulário vetado: ${alvos.length} arquivos limpos`);
