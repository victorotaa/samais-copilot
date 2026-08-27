// Contratos entre o NÚCLEO e o teatro de demonstração (Fase 1 — docs/24).
// O núcleo nunca importa de src/demo/: consome estas interfaces. Quem as
// implementa hoje é o pacote de demonstração (roteiros com timers); amanhã, a
// integração real (stream de STT do espelho SIPREC) — mesmo shape, outra fonte.
import type { ExtratoFala, Risco } from './tipos';

/** Item que uma fonte de transcrição entrega ao núcleo. */
export interface FalaTranscrita {
  speaker: 'TARM' | 'CALLER' | 'SYS';
  text: string;
  extract?: ExtratoFala;
}

/** Seam de transcrição — cadência e dedup de entrega vivem DENTRO da fonte. */
export interface FonteDeTranscricao {
  /** Começa a entregar a transcrição da chamada corrente (cadência da fonte). */
  iniciar(aoItem: (fala: FalaTranscrita) => void): void;
  /** Kill switch: cancela entregas pendentes. Idempotente. */
  pausar(): void;
  /** Religa a escuta: entrega SOMENTE o que ainda não apareceu. */
  retomar(aoItem: (fala: FalaTranscrita) => void): void;
  /** Fim da chamada / reset para a próxima: cancela pendentes e zera o já-entregue. */
  encerrar(): void;
}

/** Modo 2 da doutrina (IA sobre digitação — docs/05 §2). null = sem sinal no texto. */
export interface AnalisadorDeTexto {
  analisar(texto: string): { symptoms: string[]; risk: Risco; protocol: string } | null;
}
