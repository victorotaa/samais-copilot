import type { ExtracaoClinica } from '../../core/tipos';

// Handoffs aguardando regulação — o médico alterna entre casos antes de decidir.
// `caller` é índice em MOCK_CALLERS (resolvido ao expor como CasoRegulacao).
export const MEDICO_CASES: { num: string; caller: number; label: string; data: ExtracaoClinica }[] = [
  { num: '#4017', caller: 0, label: 'João da Silva · 65', data: {
    patientName: 'João da Silva', age: '65 anos', gender: 'Masculino',
    symptoms: ['Dor no peito irradiante', 'Sudorese fria', 'Dispneia (Falta de ar)'],
    comorbidities: ['Hipertensão (HAS)', 'Diabetes (DM)'], risk: 'RED',
    protocol: 'Suspeita de IAM (Infarto)', observations: '',
    confidence: { patientName: 0.96, symptoms: 0.89, protocol: 0.92 } } },
  { num: '#4015', caller: 1, label: 'Acidente moto × carro', data: {
    patientName: 'Carlos Pereira', age: '31 anos', gender: 'Masculino',
    symptoms: ['Trauma em MMII', 'Sangramento moderado', 'Consciente e orientado'],
    comorbidities: [], risk: 'YELLOW',
    protocol: 'Trauma — acidente de trânsito', observations: '',
    confidence: { patientName: 0.91, symptoms: 0.87, protocol: 0.9 } } },
  { num: '#4012', caller: 2, label: 'OVACE · lactente', data: {
    patientName: 'Bebê de Ana Souza', age: '8 meses', gender: 'Feminino',
    symptoms: ['Engasgo com corpo estranho', 'Cianose revertida', 'Choro presente'],
    comorbidities: [], risk: 'RED',
    protocol: 'OVACE em lactente', observations: '',
    confidence: { patientName: 0.88, symptoms: 0.93, protocol: 0.95 } } },
];
