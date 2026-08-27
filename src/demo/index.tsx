// O PACOTE da demonstração: todo o teatro atrás de um único export.
// O App importa `demo` daqui; no build de operação o alias por mode troca este
// módulo pelo plugue inerte e NADA daqui entra no grafo de módulos (docs/24).
import type { PacoteDemo } from '../core/teatro';
import type { Papel } from '../core/tipos';
import { MOCK_CALLERS } from './dados/chamadores';
import { CENARIOS_DEMO } from './dados/cenarios';
import { MOCK_VEHICLES, MANUTENCAO_INICIAL } from './dados/frota';
import { MOCK_TEAM, buildInitialRoster } from './dados/equipe';
import { MEDICO_CASES } from './dados/regulacao';
import { MOCK_QUEUE } from './dados/fila';
import { HOURLY_STATS, MANCHESTER_DIST, MOCK_RECENT_CALLS } from './dados/estatisticas';
import { MOCK_SCRIPTS } from './dados/roteiros';
import { fonteRoteiro } from './fonte-roteiro';
import { analisadorDeTexto } from './analise-texto';
import { TypingMessage, AudioWaveform, MapaEsquematico, SeletorDeCenarios, SeloSimulacaoTriagem, OverlayChamada } from './componentes';

// Personas de login por papel (fallback sem backend — a demo nunca trava).
const PERSONAS_LOGIN: Record<Papel, { nome: string; matricula: string }> = {
  TARM: { nome: 'Mariana S.', matricula: 'TARM-04' },
  MEDICO: { nome: 'Dr. Almeida', matricula: 'REG-02' },
  VIATURA: { nome: 'Equipe USA-01', matricula: 'USA-01' },
  GESTOR: { nome: 'Carlos M.', matricula: 'GESTOR-01' },
};

// Bolsa do aleatório: percorre todos os cenários antes de repetir qualquer um.
let bolsa: string[] = [];

export const demo: PacoteDemo = {
  ativo: true,
  transcricao: fonteRoteiro,
  analisadorDeTexto,
  prepararCenario(selecionado) {
    let escolhido = CENARIOS_DEMO.find(c => c.id === selecionado);
    if (!escolhido) {
      if (bolsa.length === 0) {
        bolsa = CENARIOS_DEMO.map(c => c.id).sort(() => Math.random() - 0.5);
      }
      const proximo = bolsa.pop()!;
      escolhido = CENARIOS_DEMO.find(c => c.id === proximo)!;
    }
    fonteRoteiro.selecionar(escolhido.script);
    return { id: escolhido.id, chamador: MOCK_CALLERS[escolhido.caller] };
  },
  personaLogin: papel => ({ ...PERSONAS_LOGIN[papel], aviso: 'Modo demonstração — backend offline' }),
  // Snapshot de regulação: o MESMO caso IAM da fila do médico, com a
  // transcrição parcial correspondente (navegação da demo, não do produto).
  snapshotRegulacao: () => ({
    chamador: MOCK_CALLERS[0],
    extracao: { ...MEDICO_CASES[0].data },
    transcricaoParcial: MOCK_SCRIPTS[0].slice(0, 7).map(i => ({
      speaker: i.speaker, text: i.text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    })),
  }),
  casosRegulacao: MEDICO_CASES.map(c => ({ num: c.num, label: c.label, chamador: MOCK_CALLERS[c.caller], data: c.data })),
  frotaInicial: MOCK_VEHICLES,
  manutencaoInicial: MANUTENCAO_INICIAL,
  equipeInicial: MOCK_TEAM,
  escalaInicial: buildInitialRoster,
  filaInicial: MOCK_QUEUE,
  indicadores: {
    porHora: HOURLY_STATS,
    manchester: MANCHESTER_DIST,
    recentes: MOCK_RECENT_CALLS,
    kpis: { chamadas: 1432, trotes: 118, tMedioRegulacao: '1m 12s', despachosUsa: 94, tResposta: '14m 06s', abandono: '4,1%' },
  },
  MensagemTranscrita: TypingMessage,
  Waveform: AudioWaveform,
  MapaLocal: MapaEsquematico,
  SeletorDeCenarios,
  SeloSimulacao: SeloSimulacaoTriagem,
  OverlayChamada,
};
