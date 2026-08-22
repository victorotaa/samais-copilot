import { createClient } from '@supabase/supabase-js';

/**
 * Backend Samais (Supabase) — configurado EXCLUSIVAMENTE por env.
 * Sem VITE_SUPABASE_URL/KEY o app roda em modo demo puro: nenhuma conexão é
 * tentada. Fallback hardcoded para o projeto real foi removido (parecer docs/17
 * F-05): fork/clone/CI sem .env não deve apontar para o backend da Samais, e a
 * promessa do onboarding ("sem chave, cai em modo demo") passa a ser verdadeira.
 * A publishable key continua sendo pública por design quando configurada — a
 * segurança vem do RLS.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

/** true quando há backend configurado; false = modo demo puro (roteiro local). */
export const hasBackend = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase = createClient(
  SUPABASE_URL ?? 'https://demo.invalid',
  SUPABASE_KEY ?? 'sb_publishable_demo',
);

export const TENANT_SLUG = 'cru-sao-paulo';
export const TENANT_ID = '11111111-1111-1111-1111-111111111111'; // seed do tenant demo

/** Login por matrícula: e-mail sintético `<matricula>@<tenant>.samais.app`. */
export function matriculaToEmail(matricula: string): string {
  return `${matricula.trim().toLowerCase()}@${TENANT_SLUG}.samais.app`;
}

/** Mapeamentos status DB ↔ rótulos da UI. */
export const VEHICLE_STATUS_DB_TO_UI: Record<string, string> = {
  DISPONIVEL: 'DISPONÍVEL',
  EM_ATENDIMENTO: 'EM ATENDIMENTO',
  RETORNO: 'RETORNO',
  MANUTENCAO: 'MANUTENÇÃO',
};
export const VEHICLE_STATUS_UI_TO_DB: Record<string, string> = {
  'DISPONÍVEL': 'DISPONIVEL',
  'EM ATENDIMENTO': 'EM_ATENDIMENTO',
  'RETORNO': 'RETORNO',
  'MANUTENÇÃO': 'MANUTENCAO',
};
const VEHICLE_TIPO_LABEL: Record<string, string> = {
  USA: 'USA (Avançada)',
  USB: 'USB (Básica)',
  MOTOLANCIA: 'MOTOLÂNCIA',
};

export function mapDbVehicle(row: { codigo: string; tipo: string; status: string }, statusColor: Record<string, string>) {
  const status = VEHICLE_STATUS_DB_TO_UI[row.status] || row.status;
  return {
    id: row.codigo,
    type: VEHICLE_TIPO_LABEL[row.tipo] || row.tipo,
    status,
    base: 'Base Central',
    color: statusColor[status] || 'nude',
    eta: row.codigo.startsWith('MOT') ? 5 : 8,
  };
}

/** Tenta o login real com timeout curto; null = backend indisponível (modo demo). */
export async function tryRealLogin(matricula: string, password: string) {
  if (!hasBackend) return null; // modo demo puro: nem tenta a rede
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
  const attempt = (async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: matriculaToEmail(matricula),
      password,
    });
    if (error || !data.user) return null;
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('matricula, name, role')
      .eq('id', data.user.id)
      .single();
    return perfil ?? null;
  })().catch(() => null);
  return Promise.race([attempt, timeout]);
}
