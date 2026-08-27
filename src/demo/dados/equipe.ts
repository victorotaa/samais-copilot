import type { Escala, MembroEquipe } from '../../core/tipos';
import { addDays, isoDate, startOfWeek } from '../../core/calendario';

// Declarado ANTES de buildInitialRoster: entre módulos não existe o hoisting
// que permitia a ordem antiga dentro do App.
export const MOCK_TEAM: MembroEquipe[] = [
  { id: 'TARM-04', name: 'Mariana S.', role: 'TARM', shift: 'Diurno', status: 'EM PLANTÃO' },
  { id: 'TARM-07', name: 'Rafael O.', role: 'TARM', shift: 'Noturno', status: 'FOLGA' },
  { id: 'REG-02', name: 'Dr. Almeida', role: 'Médico Regulador', shift: 'Diurno', status: 'EM PLANTÃO' },
  { id: 'REG-05', name: 'Dra. Costa', role: 'Médico Regulador', shift: 'Noturno', status: 'FOLGA' },
  { id: 'COND-11', name: 'José P.', role: 'Condutor', shift: 'Diurno', status: 'EM PLANTÃO' },
  { id: 'ENF-09', name: 'Paula R.', role: 'Enfermeira', shift: 'Diurno', status: 'EM PLANTÃO' },
  { id: 'COND-14', name: 'Marcos T.', role: 'Condutor', shift: 'Noturno', status: 'ATESTADO' },
  { id: 'ENF-12', name: 'Bruno L.', role: 'Enfermeiro', shift: 'Noturno', status: 'FÉRIAS' },
];

// Semana corrente pré-povoada pelo padrão de turno de cada colaborador (demo).
export function buildInitialRoster() {
  const r: Escala = {};
  const start = startOfWeek(new Date());
  MOCK_TEAM.forEach(m => {
    r[m.id] = {};
    for (let i = 0; i < 7; i++) {
      const dia = isoDate(addDays(start, i));
      if (m.status === 'FÉRIAS' || m.status === 'ATESTADO') { r[m.id][dia] = 'FOLGA'; continue; }
      if (m.id === 'GESTOR-01') { r[m.id][dia] = i < 5 ? 'ADMINISTRATIVO' : i === 5 ? 'SOBREAVISO' : 'FOLGA'; continue; }
      // Escala 12×36: metade da equipe operacional em plantão a cada dia, fim de
      // semana incluído — SAMU é 24/7; a versão anterior dava FOLGA geral no sábado
      // e domingo e o painel do gestor mostrava "Equipe em Plantão 0/8".
      const idx = MOCK_TEAM.indexOf(m);
      r[m.id][dia] = (i + idx) % 2 === 0 ? (m.shift === 'Noturno' ? 'NOTURNO' : 'DIURNO') : 'FOLGA';
    }
  });
  return r;
}
