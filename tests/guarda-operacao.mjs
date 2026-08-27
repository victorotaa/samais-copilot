// Guarda de bundle do modo OPERAÇÃO (docs/24): o build sem teatro não pode
// conter marcador de demonstração — e a lista se auto-testa contra o build
// demo (marcador que não aparece nem lá apodreceu e derruba a guarda, para
// que ela nunca passe por obsolescência).
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

// Regra de ouro: só STRING LITERAL de conteúdo sobrevive à minificação.
const MARCADORES = [
  'pizzaria',
  'ambulância de pepperoni',
  'Demonstração · próxima chamada',
  'SIMULAR ATENDIMENTO NA CENTRAL',
  'Rua Direita',
  'João da Silva',
  'Terezinha',
  'Luana Ferreira',
  'Mariana S.',
  'Mapa esquemático · demonstração',
  'roteiro de demonstração',
  'Modo demonstração — backend offline',
];
// Identificadores: redundância que só pega build NÃO minificado — ficam fora
// do assert de controle (a minificação os apaga do próprio build demo).
const IDENTIFICADORES = ['CENARIOS_DEMO', 'MOCK_SCRIPTS', 'PERSONAS_LOGIN'];

const EXTENSOES = new Set(['.js', '.html', '.css']);
function arquivos(dir) {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return arquivos(p);
    return EXTENSOES.has(extname(n)) ? [p] : [];
  });
}
// O minificador pode emitir não-ASCII como \uXXXX — desfaz antes de comparar.
const desescapar = s => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const ler = arq => desescapar(readFileSync(arq, 'utf8'));

// 1 · Operação: NENHUM marcador (conteúdo ou identificador) no bundle.
if (!existsSync('dist-operacao')) {
  console.error('❌ dist-operacao/ não existe — rode `npm run build:operacao` antes.');
  process.exit(1);
}
const vazamentos = [];
for (const arq of arquivos('dist-operacao')) {
  const conteudo = ler(arq);
  for (const t of [...MARCADORES, ...IDENTIFICADORES]) {
    if (conteudo.includes(t)) vazamentos.push(`${arq} → "${t}"`);
  }
}
if (vazamentos.length) {
  console.error(`❌ TEATRO NO BUNDLE DE OPERAÇÃO (${vazamentos.length}):`);
  vazamentos.slice(0, 20).forEach(v => console.error('  -', v));
  process.exit(1);
}
console.log('✅ operação: nenhum marcador de demo em dist-operacao/');

// 2 · Controle anti-apodrecimento: TODO marcador de conteúdo aparece no build
// demo (dist/assets + index.html — lp/ e apresentacao-ms/ ficam fora: são
// peças de marketing, não o app). Marcador ausente = lista desatualizada.
if (!existsSync('dist/assets')) {
  console.error('❌ dist/assets não existe — rode `npm run build` (demo) antes: o controle compara os dois bundles.');
  process.exit(1);
}
const bundleDemo = [...arquivos('dist/assets'), 'dist/index.html'].map(ler).join('\n');
const mortos = MARCADORES.filter(m => !bundleDemo.includes(m));
if (mortos.length) {
  console.error('❌ Marcadores MORTOS (não aparecem nem no build demo — atualize a lista):');
  mortos.forEach(m => console.error(`  - "${m}"`));
  process.exit(1);
}
console.log(`✅ controle: os ${MARCADORES.length} marcadores seguem vivos no build demo`);
