// Tipos do NÚCLEO do produto. O estado do App nunca se tipa por `typeof` de
// dado de demonstração: são os roteiros/mocks que implementam ESTES tipos —
// nunca o contrário. (Fase 1 da separação núcleo × demo — docs/24.)

/** Classificação de risco Manchester — decisão explícita, nunca default. */
export type Risco = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE';
export type RiscoOuPendente = Risco | 'PENDING';

/** Localização automática do aparelho (AML) — implementação futura (docs/23 T8f). */
export interface DadosAml {
  lat: number;
  lng: number;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  cep: string;
}

/** Origem da chamada como a sinalização entrega: telefone + histórico na base. */
export interface Chamador {
  phone: string;
  hasHistory: boolean;
  name: string;
  historyCount: number;
  aml: DadosAml | null;
}

/** Quadro clínico extraído da triagem — o shape que o STT/LLM real entregará. */
export interface ExtracaoClinica {
  patientName: string;
  age: string;
  gender: string;
  symptoms: string[];
  comorbidities: string[];
  risk: RiscoOuPendente;
  protocol: string;
  observations: string;
  confidence: { patientName: number; symptoms: number; protocol: number };
}

export interface Veiculo {
  id: string;
  type: string;
  status: string;
  base: string;
  color: string;
  eta: number;
}

export interface MembroEquipe {
  id: string;
  name: string;
  role: string;
  shift: string;
  status: string;
}

/** Item da fila de espera do PABX (leitura passiva — docs/05 §3). */
export interface ItemFilaPabx {
  id: string;
  phone: string;
  waitTime: string;
  priority: string;
}

export interface MensagemChat {
  speaker: 'TARM' | 'CALLER' | 'SYS';
  text: string;
  time: string;
}

/** Extração incremental que uma fala pode carregar. */
export interface ExtratoFala {
  patientName?: string;
  age?: string;
  gender?: string;
  symptoms?: string[];
  comorbidities?: string[];
  risk?: Risco;
  protocol?: string;
  /** Marco operacional carimbado pela fala — ex.: a instrução de compressão
   *  numa RCP guiada por telefone (T-CPR): vira o tempo-até-1ª-compressão. */
  marco?: 'rcp_iniciada';
  /** Início dos sintomas relatado, em MINUTOS antes desta fala. O motor real
   *  converte o relato ("faz vinte minutos", "começou 7h40") para este campo;
   *  alimenta o relógio de JANELA CLÍNICA (AVC 4h30 — docs/26). */
  inicioSintomasMinutos?: number;
}

/** Uma fala de roteiro de demonstração: o que o STT entregaria, com cadência. */
export interface FalaRoteiro {
  speaker: 'TARM' | 'CALLER' | 'SYS';
  text: string;
  delay: number;
  extract?: ExtratoFala;
}

/** Handoff aguardando regulação (fila do médico). */
export interface CasoRegulacao {
  num: string;
  label: string;
  chamador: Chamador;
  data: ExtracaoClinica;
}

export interface ChamadaRecente {
  id: string;
  phone: string;
  time: string;
  type: string;
  status: string;
  statusColor: string;
}

export type Papel = 'TARM' | 'MEDICO' | 'VIATURA' | 'GESTOR';

/** Escala: matrícula → dia ISO → turno. */
export type Escala = Record<string, Record<string, string>>;
