import { createClient } from '@supabase/supabase-js';

/**
 * Backend Samais (Supabase) — projeto demo "CoPilot OS".
 * A publishable key é pública por design (a segurança vem do RLS);
 * sobrescrevível por env para outros ambientes/tenants.
 */
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://scnytznopheodlketzxn.supabase.co';
const SUPABASE_KEY =
  (import.meta.env.VITE_SUPABASE_KEY as string | undefined) ||
  'sb_publishable_R7LpWL_JjfSYlaN0Af8dIg_-RPzw2CF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const TENANT_SLUG = 'cru-sao-paulo';

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
