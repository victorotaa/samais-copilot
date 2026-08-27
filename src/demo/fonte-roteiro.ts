// A fonte de transcrição da DEMONSTRAÇÃO: roteiros determinísticos com timers.
// Implementa o contrato que o STT real implementará (docs/24). O núcleo não
// conhece cadência nem dedup — os dois vivem aqui.
import type { FalaTranscrita, FonteDeTranscricao } from '../core/teatro';
import type { FalaRoteiro } from '../core/tipos';
import { MOCK_SCRIPTS } from './dados/roteiros';

export class RoteiroComoFonte implements FonteDeTranscricao {
  private atual: FalaRoteiro[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  // Dedup por TEXTO em agendamento E em disparo: o StrictMode dispara o effect
  // de início duas vezes e roteiros compartilham a abertura ('SAMU 192...') —
  // este conjunto é o que segura a duplicata (o antigo scriptShownRef). Ele só
  // zera em encerrar()/selecionar(), espelhando o reset do IDLE.
  private entregues = new Set<string>();

  constructor(private roteiros: FalaRoteiro[][]) {}

  /** Demo-only (fora do contrato): escolhe o roteiro da próxima chamada. */
  selecionar(indice: number) {
    this.encerrar();
    this.atual = this.roteiros[indice] ?? [];
  }

  iniciar(aoItem: (fala: FalaTranscrita) => void) {
    this.agendar(aoItem, (_i, item) => item.delay);
  }

  /** Retomada pós-pausa: cadência própria, indexada pela posição ORIGINAL da fala. */
  retomar(aoItem: (fala: FalaTranscrita) => void) {
    this.agendar(aoItem, i => 1800 + i * 2600);
  }

  pausar() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  encerrar() {
    this.pausar();
    this.entregues = new Set();
  }

  private agendar(aoItem: (fala: FalaTranscrita) => void, atraso: (i: number, item: FalaRoteiro) => number) {
    this.atual.forEach((item, i) => {
      if (this.entregues.has(item.text)) return;
      const id = setTimeout(() => {
        this.entregues.add(item.text);
        aoItem(item);
      }, atraso(i, item));
      this.timers.push(id);
    });
  }
}

/** Instância única da demo — o App consome só o contrato FonteDeTranscricao. */
export const fonteRoteiro = new RoteiroComoFonte(MOCK_SCRIPTS);
