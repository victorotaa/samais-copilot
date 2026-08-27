import type { ChamadaRecente } from '../../core/tipos';

// Série horária de demonstração (volume de chamadas e tempo de resposta em min).
export const HOURLY_STATS = [
  { time: '06h', volume: 45, resposta: 6 },
  { time: '08h', volume: 80, resposta: 8 },
  { time: '10h', volume: 110, resposta: 12 },
  { time: '12h', volume: 95, resposta: 10 },
  { time: '14h', volume: 105, resposta: 9 },
  { time: '16h', volume: 130, resposta: 14 },
  { time: '18h', volume: 150, resposta: 15 },
  { time: '20h', volume: 120, resposta: 11 },
];

// Distribuição por classificação — cores de protocolo Manchester (status, com rótulo direto).
export const MANCHESTER_DIST = [
  { name: 'Vermelho', value: 94, color: '#E53935' },
  { name: 'Amarelo', value: 150, color: '#FDD835' },
  { name: 'Verde', value: 250, color: '#43A047' },
  { name: 'Azul', value: 120, color: '#1E88E5' },
];

export const MOCK_RECENT_CALLS: ChamadaRecente[] = [
  { id: '1042', phone: '(11) 98765-4321', time: '08:12', type: 'Parada Cardiorrespiratória', status: 'Despachada (USA)', statusColor: 'danger' },
  { id: '1041', phone: '(11) 91234-5678', time: '08:05', type: 'Crise Convulsiva', status: 'Despachada (USB)', statusColor: 'warn' },
  { id: '1040', phone: '(11) 99876-5432', time: '07:58', type: 'Dúvida Médica', status: 'Resolvida (Telemedicina)', statusColor: 'ok' },
  { id: '1039', phone: '(11) 95555-4444', time: '07:45', type: 'Acidente de Trânsito', status: 'Despachada (USA + Moto)', statusColor: 'danger' },
  { id: '1038', phone: '(11) 93333-2222', time: '07:30', type: 'Queda de Própria Altura', status: 'Despachada (USB)', statusColor: 'warn' },
];
