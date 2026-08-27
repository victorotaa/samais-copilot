import type { Veiculo } from '../../core/tipos';

export const MOCK_VEHICLES: Veiculo[] = [
  { id: 'USA-01', type: 'USA (Avançada)', status: 'DISPONÍVEL', base: 'Base Central', color: 'ok', eta: 8 },
  { id: 'USB-04', type: 'USB (Básica)', status: 'DISPONÍVEL', base: 'Base Leste', color: 'ok', eta: 12 },
  { id: 'MOT-01', type: 'MOTOLÂNCIA', status: 'DISPONÍVEL', base: 'Base Central', color: 'ok', eta: 5 },
  { id: 'USA-02', type: 'USA (Avançada)', status: 'EM ATENDIMENTO', base: 'Base Sul', color: 'danger', eta: 25 },
  { id: 'USB-05', type: 'USB (Básica)', status: 'RETORNO', base: 'Base Norte', color: 'warn', eta: 18 },
  { id: 'MOT-02', type: 'MOTOLÂNCIA', status: 'MANUTENÇÃO', base: 'Base Oeste', color: 'nude', eta: 0 },
];

// Manutenção programada semeada (demo): MOT-02 com data prevista.
export const MANUTENCAO_INICIAL: Record<string, string> = { 'MOT-02': '2026-06-14' };
