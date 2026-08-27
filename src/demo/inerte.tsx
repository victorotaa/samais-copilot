// O plugue INERTE do build de operação: mesma interface, teatro nenhum.
// A paridade com src/demo/index.tsx é garantida pela anotação `: PacoteDemo`
// nos dois arquivos (ambos entram no typecheck). No `--mode operacao` o alias
// resolve '@demo' para cá e o pacote da demonstração fica fora do grafo de
// módulos — exclusão estrutural, não dead-code elimination (docs/24).
import type { FonteDeTranscricao, PacoteDemo } from '../core/teatro';

const fonteNula: FonteDeTranscricao = {
  iniciar() {}, pausar() {}, retomar() {}, encerrar() {},
};

export const demo: PacoteDemo = {
  ativo: false,
  transcricao: fonteNula,
  analisadorDeTexto: null,
  prepararCenario: () => null,
  personaLogin: () => null,
  snapshotRegulacao: () => null,
  casosRegulacao: [],
  frotaInicial: [],
  manutencaoInicial: {},
  equipeInicial: [],
  escalaInicial: () => ({}),
  filaInicial: [],
  indicadores: null,
  MensagemTranscrita: ({ text }) => <>{text}</>,
  Waveform: () => null,
  MapaLocal: null,
  SeletorDeCenarios: () => null,
  SeloSimulacao: null,
  OverlayChamada: null,
};
