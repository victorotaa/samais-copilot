// ── Calendário de escalas (planner do Gestor + Minha Escala) ──
export function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // segunda-feira
  return x;
}
export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const MAX_WEEKS_AHEAD = 4; // consulta/criação até 1 mês à frente

export const TURNO_CYCLE = ['DIURNO', 'NOTURNO', 'FOLGA'];
export const TURNO_BADGE: Record<string, { label: string; full: string; hours: string; cls: string }> = {
  DIURNO: { label: 'D', full: 'Diurno', hours: '07:00–19:00', cls: 'bg-gold-500/15 border-gold-500/50 text-gold-500' },
  NOTURNO: { label: 'N', full: 'Noturno', hours: '19:00–07:00', cls: 'bg-info/10 border-info/40 text-info' },
  ADMINISTRATIVO: { label: 'A', full: 'Administrativo', hours: '08:00–18:00', cls: 'bg-ai/10 border-ai/40 text-ai' },
  SOBREAVISO: { label: 'S', full: 'Sobreaviso', hours: '—', cls: 'bg-elevated border-border-default text-ink-secondary' },
  FOLGA: { label: 'F', full: 'Folga', hours: '—', cls: 'bg-elevated border-border-subtle text-ink-tertiary' },
};
