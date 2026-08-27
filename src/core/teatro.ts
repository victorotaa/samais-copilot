// Contratos entre o NÚCLEO e o teatro de demonstração (Fase 1 — docs/24).
// O núcleo nunca importa de src/demo/: consome estas interfaces. Quem as
// implementa hoje é o pacote de demonstração (roteiros com timers); amanhã, a
// integração real (stream de STT do espelho SIPREC) — mesmo shape, outra fonte.
import type { ComponentType } from 'react';
import type {
  CasoRegulacao, Chamador, ChamadaRecente, Escala, ExtracaoClinica, ExtratoFala,
  ItemFilaPabx, MembroEquipe, MensagemChat, Papel, Risco, Veiculo,
} from './tipos';

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

/**
 * O pacote inteiro do teatro. `src/demo/index.tsx` (demonstração) e
 * `src/demo/inerte.tsx` (operação) exportam `demo: PacoteDemo` — a anotação
 * explícita nos DOIS arquivos é a garantia de paridade que o alias exige.
 * `ativo` fica anotado `boolean` (nunca inferido literal: viraria `never`
 * nos ramos `!demo.ativo` do núcleo).
 */
export interface PacoteDemo {
  /** true = teatro presente (build demo); false = plugue inerte (operação). */
  ativo: boolean;
  /** Fonte de transcrição da chamada corrente (demo: roteiros; futuro: STT). */
  transcricao: FonteDeTranscricao;
  /** Analisador do modo digitação. null = operação sem modelo instalado. */
  analisadorDeTexto: AnalisadorDeTexto | null;
  /** Sorteia/seleciona o par cenário↔chamador e prepara a fonte. null em operação. */
  prepararCenario(selecionado: string): { id: string; chamador: Chamador } | null;
  /** Persona de login por papel quando não há backend. null = recusa honesta. */
  personaLogin(papel: Papel): { nome: string; matricula: string; aviso: string } | null;
  /** Estado pronto de regulação (navegação da demo). null em operação. */
  snapshotRegulacao(): { chamador: Chamador; extracao: ExtracaoClinica; transcricaoParcial: MensagemChat[] } | null;
  /** Handoffs sintéticos aguardando regulação (fila do médico). */
  casosRegulacao: CasoRegulacao[];
  // ── estado inicial semeado (operação: vazio — o backend povoa) ──
  frotaInicial: Veiculo[];
  manutencaoInicial: Record<string, string>;
  equipeInicial: MembroEquipe[];
  escalaInicial(): Escala;
  filaInicial: ItemFilaPabx[];
  /** Indicadores do dashboard de demonstração. null = sem dados. */
  indicadores: {
    porHora: { time: string; volume: number; resposta: number }[];
    manchester: { name: string; value: number; color: string }[];
    recentes: ChamadaRecente[];
    kpis: { chamadas: number; trotes: number; tMedioRegulacao: string; despachosUsa: number; tResposta: string; abandono: string };
  } | null;
  // ── componentes de teatro usados dentro das telas ──
  MensagemTranscrita: ComponentType<{ text: string }>;
  Waveform: ComponentType<{ active: boolean }>;
  MapaLocal: ComponentType<{ pino?: boolean; rota?: boolean }> | null;
}
