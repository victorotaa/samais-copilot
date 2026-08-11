import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from './lib/theme';
import { Icon } from './ui/Icon';
import { SamaisMonogram, SamaisWordmark } from './ui/Brand';
import { supabase, tryRealLogin, mapDbVehicle, VEHICLE_STATUS_UI_TO_DB, TENANT_ID } from './lib/supabase';

const KEYWORDS = ['dor no peito', 'falta de ar', 'infarto', 'parada', 'sangramento', 'desmaio', 'pressão', 'suando', 'formigamento', 'braço', 'cabeça', 'tontura', 'consciente', 'inconsciente', 'respirando', 'coração', 'dor', 'sangue'];

const TypingMessage = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i += 2;
      if (i > text.length) {
        setDisplayedText(text);
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  const highlightKeywords = (text: string) => {
    if (!text) return null;
    const regex = new RegExp(`(${KEYWORDS.join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (KEYWORDS.some(k => k.toLowerCase() === part.toLowerCase())) {
        return <span key={i} className="text-danger font-bold bg-danger/10 px-1 rounded">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return <>{highlightKeywords(displayedText)}</>;
};

const AudioWaveform = ({ active }: { active: boolean }) => (
  <div className="flex items-end gap-[2px] h-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className={`w-1 bg-ai rounded-full transition-all duration-75 ${active ? 'animate-pulse' : 'h-1 opacity-30'}`}
        style={{ 
          height: active ? `${Math.max(20, Math.random() * 100)}%` : '20%',
          animationDelay: `${i * 0.15}s`,
          animationDuration: '0.5s'
        }}
      ></div>
    ))}
  </div>
);

// Base de dados simulada para randomização (5 endereços reais em São Paulo)
const MOCK_CALLERS = [
  {
    phone: "(11) 98765-4321",
    hasHistory: true,
    name: "Ana Paula (Esposa)",
    historyCount: 0,
    aml: { lat: -23.5472, lng: -46.6388, address: "Rua Direita", number: "120", neighborhood: "Sé", city: "São Paulo — SP", cep: "01002-020" }
  },
  {
    phone: "(11) 91234-5678",
    hasHistory: false,
    name: "",
    historyCount: 0,
    aml: { lat: -23.5615, lng: -46.6559, address: "Avenida Paulista", number: "1578", neighborhood: "Bela Vista", city: "São Paulo — SP", cep: "01310-200" }
  },
  {
    phone: "(11) 97777-8888",
    hasHistory: true,
    name: "Carlos Eduardo (Filho)",
    historyCount: 2,
    aml: { lat: -23.5874, lng: -46.6332, address: "Rua Domingos de Morais", number: "2500", neighborhood: "Vila Mariana", city: "São Paulo — SP", cep: "04036-100" }
  },
  {
    phone: "(11) 95555-4444",
    hasHistory: false,
    name: "",
    historyCount: 0,
    aml: { lat: -23.5365, lng: -46.6461, address: "Avenida Ipiranga", number: "344", neighborhood: "República", city: "São Paulo — SP", cep: "01046-010" }
  },
  {
    phone: "(11) 93333-2222",
    hasHistory: true,
    name: "Maria Silva (Paciente)",
    historyCount: 5,
    aml: { lat: -23.5505, lng: -46.6333, address: "Praça da Sé", number: "S/N", neighborhood: "Sé", city: "São Paulo — SP", cep: "01001-000" }
  }
];

const MOCK_VEHICLES = [
  { id: 'USA-01', type: 'USA (Avançada)', status: 'DISPONÍVEL', base: 'Base Central', color: 'ok', eta: 8 },
  { id: 'USB-04', type: 'USB (Básica)', status: 'DISPONÍVEL', base: 'Base Leste', color: 'ok', eta: 12 },
  { id: 'MOT-01', type: 'MOTOLÂNCIA', status: 'DISPONÍVEL', base: 'Base Central', color: 'ok', eta: 5 },
  { id: 'USA-02', type: 'USA (Avançada)', status: 'EM ATENDIMENTO', base: 'Base Sul', color: 'danger', eta: 25 },
  { id: 'USB-05', type: 'USB (Básica)', status: 'RETORNO', base: 'Base Norte', color: 'warn', eta: 18 },
  { id: 'MOT-02', type: 'MOTOLÂNCIA', status: 'MANUTENÇÃO', base: 'Base Oeste', color: 'nude', eta: 0 },
];

// Handoffs aguardando regulação — o médico alterna entre casos antes de decidir.
const MEDICO_CASES = [
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

const MISSION_STEPS = ['A CAMINHO', 'NO LOCAL', 'TRANSPORTANDO', 'NO HOSPITAL'];

// ── Calendário de escalas (planner do Gestor + Minha Escala) ──
function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // segunda-feira
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MAX_WEEKS_AHEAD = 4; // consulta/criação até 1 mês à frente

const TURNO_CYCLE = ['DIURNO', 'NOTURNO', 'FOLGA'];
const TURNO_BADGE: Record<string, { label: string; full: string; hours: string; cls: string }> = {
  DIURNO: { label: 'D', full: 'Diurno', hours: '07:00–19:00', cls: 'bg-gold-500/15 border-gold-500/50 text-gold-500' },
  NOTURNO: { label: 'N', full: 'Noturno', hours: '19:00–07:00', cls: 'bg-info/10 border-info/40 text-info' },
  ADMINISTRATIVO: { label: 'A', full: 'Administrativo', hours: '08:00–18:00', cls: 'bg-ai/10 border-ai/40 text-ai' },
  SOBREAVISO: { label: 'S', full: 'Sobreaviso', hours: '—', cls: 'bg-elevated border-border-default text-ink-secondary' },
  FOLGA: { label: 'F', full: 'Folga', hours: '—', cls: 'bg-elevated border-border-subtle text-ink-tertiary' },
};

// Semana corrente pré-povoada pelo padrão de turno de cada colaborador (demo).
function buildInitialRoster() {
  const r: Record<string, Record<string, string>> = {};
  const start = startOfWeek(new Date());
  MOCK_TEAM.forEach(m => {
    r[m.id] = {};
    for (let i = 0; i < 7; i++) {
      const dia = isoDate(addDays(start, i));
      if (m.status === 'FÉRIAS' || m.status === 'ATESTADO') { r[m.id][dia] = 'FOLGA'; continue; }
      if (m.id === 'GESTOR-01') { r[m.id][dia] = i < 5 ? 'ADMINISTRATIVO' : i === 5 ? 'SOBREAVISO' : 'FOLGA'; continue; }
      r[m.id][dia] = i < 5 ? (m.shift === 'Noturno' ? 'NOTURNO' : 'DIURNO') : 'FOLGA';
    }
  });
  return r;
}

const MOCK_TEAM = [
  { id: 'TARM-04', name: 'Mariana S.', role: 'TARM', shift: 'Diurno', status: 'EM PLANTÃO' },
  { id: 'TARM-07', name: 'Rafael O.', role: 'TARM', shift: 'Noturno', status: 'FOLGA' },
  { id: 'REG-02', name: 'Dr. Almeida', role: 'Médico Regulador', shift: 'Diurno', status: 'EM PLANTÃO' },
  { id: 'REG-05', name: 'Dra. Costa', role: 'Médico Regulador', shift: 'Noturno', status: 'FOLGA' },
  { id: 'COND-11', name: 'José P.', role: 'Condutor', shift: 'Diurno', status: 'EM PLANTÃO' },
  { id: 'ENF-09', name: 'Paula R.', role: 'Enfermeira', shift: 'Diurno', status: 'EM PLANTÃO' },
  { id: 'COND-14', name: 'Marcos T.', role: 'Condutor', shift: 'Noturno', status: 'ATESTADO' },
  { id: 'ENF-12', name: 'Bruno L.', role: 'Enfermeiro', shift: 'Noturno', status: 'FÉRIAS' },
];

const VEHICLE_STATUS_COLOR: Record<string, string> = {
  'DISPONÍVEL': 'ok',
  'EM ATENDIMENTO': 'danger',
  'RETORNO': 'warn',
  'MANUTENÇÃO': 'nude',
};

const TEAM_STATUS_COLOR: Record<string, string> = {
  'EM PLANTÃO': 'ok',
  'FOLGA': 'nude',
  'FÉRIAS': 'ai',
  'ATESTADO': 'warn',
};

// Série horária de demonstração (volume de chamadas e tempo de resposta em min).
const HOURLY_STATS = [
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
const MANCHESTER_DIST = [
  { name: 'Vermelho', value: 94, color: '#E53935' },
  { name: 'Amarelo', value: 150, color: '#FDD835' },
  { name: 'Verde', value: 250, color: '#43A047' },
  { name: 'Azul', value: 120, color: '#1E88E5' },
];

const MOCK_RECENT_CALLS = [
  { id: '1042', phone: '(11) 98765-4321', time: '08:12', type: 'Parada Cardiorrespiratória', status: 'Despachada (USA)', statusColor: 'danger' },
  { id: '1041', phone: '(11) 91234-5678', time: '08:05', type: 'Crise Convulsiva', status: 'Despachada (USB)', statusColor: 'warn' },
  { id: '1040', phone: '(11) 99876-5432', time: '07:58', type: 'Dúvida Médica', status: 'Resolvida (Telemedicina)', statusColor: 'ok' },
  { id: '1039', phone: '(11) 95555-4444', time: '07:45', type: 'Acidente de Trânsito', status: 'Despachada (USA + Moto)', statusColor: 'danger' },
  { id: '1038', phone: '(11) 93333-2222', time: '07:30', type: 'Queda de Própria Altura', status: 'Despachada (USB)', statusColor: 'warn' },
];

const MOCK_QUEUE = [
  { id: 'Q1', phone: '(11) 98765-4321', waitTime: '01:42', priority: 'high' },
  { id: 'Q2', phone: '(11) 91234-5678', waitTime: '00:55', priority: 'normal' },
  { id: 'Q3', phone: '(11) 99999-8888', waitTime: '00:12', priority: 'normal' },
];

const MOCK_SCRIPTS = [
  // Scenario 1: IAM (Infarto)
  [
    { speaker: 'SYS', text: 'Gravação e transcrição iniciadas.', delay: 500 },
    { speaker: 'TARM', text: 'SAMU 192, qual a sua emergência?', delay: 1500 },
    { speaker: 'CALLER', text: 'Moça, pelo amor de Deus, meu pai tá passando mal! Ele tá com muita dor no peito e suando frio!', delay: 4000, 
      extract: { symptoms: ['Dor no peito irradiante', 'Sudorese fria'], risk: 'RED', protocol: 'Suspeita de IAM (Infarto)' } },
    { speaker: 'TARM', text: 'Calma, o socorro já está sendo providenciado. Qual o nome e a idade dele? Ele tem algum problema de saúde?', delay: 7000 },
    { speaker: 'CALLER', text: 'O nome dele é João da Silva. Ele tem 65 anos. Ele tem pressão alta e diabetes.', delay: 10000,
      extract: { patientName: 'João da Silva', age: '65 anos', gender: 'Masculino', comorbidities: ['Hipertensão (HAS)', 'Diabetes (DM)'] } },
    { speaker: 'TARM', text: 'Ele está consciente? Ele consegue falar com você?', delay: 13000 },
    { speaker: 'CALLER', text: 'Tá consciente, mas tá com muita falta de ar, não consegue falar direito. A dor tá indo pro braço esquerdo.', delay: 16000,
      extract: { symptoms: ['Dor no peito irradiante', 'Sudorese fria', 'Dispneia (Falta de ar)', 'Dor irradiando para MSE'] } },
    { speaker: 'TARM', text: 'Certo. O endereço é Rua Direita, 120, correto?', delay: 19000 },
    { speaker: 'CALLER', text: 'Isso, apartamento 42. O porteiro já tá avisado pra liberar a ambulância.', delay: 22000 },
    { speaker: 'TARM', text: 'Ótimo. Mantenha ele sentado e calmo. Não dê água nem comida. O médico vai falar com você agora para mais orientações enquanto a UTI móvel chega.', delay: 26000 },
    { speaker: 'CALLER', text: 'Tá bom, tô aguardando na linha. Por favor, pede pra eles virem rápido!', delay: 30000 },
    { speaker: 'TARM', text: 'Eles já estão a caminho. Transferindo para o médico regulador.', delay: 33000 }
  ],
  // Scenario 2: Trauma (Acidente de Moto)
  [
    { speaker: 'SYS', text: 'Gravação e transcrição iniciadas.', delay: 500 },
    { speaker: 'TARM', text: 'SAMU 192, qual a sua emergência?', delay: 1500 },
    { speaker: 'CALLER', text: 'Teve um acidente aqui na avenida! Um motoqueiro bateu num carro.', delay: 4000, 
      extract: { symptoms: ['Vítima de trauma', 'Acidente de trânsito'], risk: 'YELLOW', protocol: 'Trauma - Colisão Auto x Moto' } },
    { speaker: 'TARM', text: 'Entendi. O endereço é Avenida Paulista, na altura do número 1578?', delay: 7000 },
    { speaker: 'CALLER', text: 'Isso, sentido Consolação.', delay: 10000 },
    { speaker: 'TARM', text: 'O socorro está a caminho. Você sabe o nome da vítima? Qual a idade aparente?', delay: 13000 },
    { speaker: 'CALLER', text: 'Não sei o nome, acho que uns 30 anos. Ele tá de capacete no chão.', delay: 16000,
      extract: { age: '~30 anos', gender: 'Masculino', patientName: 'Desconhecido' } },
    { speaker: 'TARM', text: 'Ele está acordado? Tem algum sangramento visível?', delay: 19000 },
    { speaker: 'CALLER', text: 'Tá acordado, gemendo de dor na perna. A perna parece quebrada, mas não vejo muito sangue.', delay: 22000,
      extract: { symptoms: ['Vítima de trauma', 'Acidente de trânsito', 'Dor intensa em MMII', 'Suspeita de fratura fechada'] } },
    { speaker: 'TARM', text: 'Por favor, não tente tirar o capacete dele e peça para ele não se mover. Tem vazamento de combustível na pista?', delay: 26000 },
    { speaker: 'CALLER', text: 'Não, não tô sentindo cheiro de gasolina. Tem gente sinalizando a via.', delay: 30000 },
    { speaker: 'TARM', text: 'Perfeito. A ambulância já foi despachada. Vou passar para o médico regulador para orientações adicionais.', delay: 34000 }
  ],
  // Scenario 3: OVACE (Engasgo Bebê) - Longo
  [
    { speaker: 'SYS', text: 'Gravação e transcrição iniciadas.', delay: 500 },
    { speaker: 'TARM', text: 'SAMU 192, qual a sua emergência?', delay: 1500 },
    { speaker: 'CALLER', text: 'Meu bebê! Meu bebê não tá respirando! Ele engasgou com o leite!', delay: 4000, 
      extract: { symptoms: ['Asfixia', 'Engasgo com líquido'], risk: 'RED', protocol: 'OVACE - Lactente' } },
    { speaker: 'TARM', text: 'Senhora, mantenha a calma, a ambulância já está saindo. Qual o nome do bebê e quantos meses ele tem?', delay: 7000 },
    { speaker: 'CALLER', text: 'É o Lucas! Ele tem 8 meses! Pelo amor de Deus, me ajuda!', delay: 10000,
      extract: { patientName: 'Lucas', age: '8 meses', gender: 'Masculino' } },
    { speaker: 'TARM', text: 'Vou te ajudar agora. O bebê está chorando ou tossindo? Qual a cor da pele dele?', delay: 13000 },
    { speaker: 'CALLER', text: 'Não tá chorando! Ele tá ficando roxinho! Ele não faz barulho!', delay: 16000,
      extract: { symptoms: ['Asfixia', 'Engasgo com líquido', 'Cianose', 'Ausência de choro/tosse'] } },
    { speaker: 'TARM', text: 'Ok, coloque o Lucas de bruços no seu antebraço, com a cabeça mais baixa que o corpo. Segure a cabecinha dele.', delay: 19000 },
    { speaker: 'CALLER', text: 'Tá, coloquei! E agora?', delay: 22000 },
    { speaker: 'TARM', text: 'Dê 5 tapinhas nas costas dele, entre as escápulas. Com o calcanhar da mão.', delay: 25000 },
    { speaker: 'CALLER', text: 'Um, dois, três, quatro, cinco! Ele chorou! Ele chorou! Saiu um monte de leite!', delay: 28000,
      extract: { symptoms: ['Asfixia revertida', 'Choro presente', 'Desobstrução de vias aéreas'], risk: 'YELLOW', protocol: 'OVACE Revertido - Avaliação' } },
    { speaker: 'TARM', text: 'Graças a Deus. A cor dele está voltando ao normal?', delay: 31000 },
    { speaker: 'CALLER', text: 'Tá sim, ele tá chorando forte agora. Muito obrigada!', delay: 34000 },
    { speaker: 'TARM', text: 'A ambulância continua a caminho para avaliar ele. Vou transferir para o médico para acompanhamento.', delay: 38000 }
  ]
];

const playSound = (type: 'call' | 'vehicle' | 'alert', enabled: boolean) => {
  if (!enabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'call') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(0, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(0, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'vehicle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'alert') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const chartTheme = theme === 'dark'
    ? { grid: '#2A2B33', axis: '#6E6E78', tooltipBg: '#161618', tooltipBorder: '#3A3B45', tooltipText: '#F4F4F5', serieGold: '#BF9A3D', serieInfo: '#6E8AAA' }
    : { grid: '#D1D1C9', axis: '#828279', tooltipBg: '#FFFFFF', tooltipBorder: '#D1D1C9', tooltipText: '#1A1A17', serieGold: '#A88230', serieInfo: '#1565C0' };
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const [currentModule, setCurrentModule] = useState<'IDLE' | 'AML' | 'TARM' | 'REGULADOR' | 'VIATURA' | 'DASHBOARD' | 'GESTOR' | 'FROTA' | 'ESCALAS'>('IDLE');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [time, setTime] = useState(new Date());
  
  // Estado para armazenar os dados do chamador atual
  const [currentCaller, setCurrentCaller] = useState<typeof MOCK_CALLERS[0] | null>(null);
  
  const [amlData, setAmlData] = useState<typeof MOCK_CALLERS[0]['aml'] | null>(null);

  // TARM States
  const [aiActive, setAiActive] = useState(true);
  const [activeScriptIndex, setActiveScriptIndex] = useState(0);
  const [tarmChat, setTarmChat] = useState<{speaker: 'TARM' | 'CALLER' | 'SYS', text: string, time: string}[]>([]);
  const [extractedData, setExtractedData] = useState<{
    patientName: string;
    age: string;
    gender: string;
    symptoms: string[];
    comorbidities: string[];
    risk: 'PENDING' | 'RED' | 'YELLOW' | 'GREEN';
    protocol: string;
    observations: string;
    confidence: {
      patientName: number;
      symptoms: number;
      protocol: number;
    }
  }>({
    patientName: '', age: '', gender: '', symptoms: [], comorbidities: [], risk: 'PENDING', protocol: 'Analisando...', observations: '',
    confidence: { patientName: 0, symptoms: 0, protocol: 0 }
  });
  const [justification, setJustification] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Hoje');

  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'info' | 'warn'} | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
  const [role, setRole] = useState<'TARM' | 'MEDICO' | 'VIATURA' | 'GESTOR'>('TARM');
  const [team] = useState(MOCK_TEAM);
  const [maintSchedule, setMaintSchedule] = useState<Record<string, string>>({ 'MOT-02': '2026-06-14' });
  const [missionStatus, setMissionStatus] = useState('A CAMINHO');
  const [connected, setConnected] = useState(false);
  const [operatorName, setOperatorName] = useState('Mariana S.');
  const [operatorId, setOperatorId] = useState('TARM-04');
  const [loginMatricula, setLoginMatricula] = useState('TARM-04');
  const [loginPassword, setLoginPassword] = useState('');
  const [roster, setRoster] = useState<Record<string, Record<string, string>>>(buildInitialRoster);
  const [userIds, setUserIds] = useState<Record<string, string>>({});
  const [myWeek, setMyWeek] = useState(0);
  const [showEscala, setShowEscala] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [vehicleIds, setVehicleIds] = useState<Record<string, string>>({});
  const [occId, setOccId] = useState<string | null>(null);
  const [dispatchId, setDispatchId] = useState<string | null>(null);
  const [realStats, setRealStats] = useState<{ chamadas: number; tRespostaSeg: number | null } | null>(null);
  const [mountTs] = useState(() => Date.now());
  const [selectedBase, setSelectedBase] = useState('Consórcio (geral)');
  const BASE_FACTOR: Record<string, number> = { 'Consórcio (geral)': 1, 'Base Central': 0.52, 'Base Leste': 0.29, 'Base Norte': 0.19 };
  const bf = BASE_FACTOR[selectedBase] ?? 1;
  const [fhirRecord, setFhirRecord] = useState<typeof MOCK_RECENT_CALLS[number] | null>(null);
  const [gWeek, setGWeek] = useState(0);
  const [queue, setQueue] = useState(() => MOCK_QUEUE.map(q => {
    const [m, sec] = q.waitTime.split(':').map(Number);
    return { ...q, seconds: m * 60 + sec };
  }));
  const [protocolSteps, setProtocolSteps] = useState<{id: string, label: string, checked: boolean}[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'info') => {
    setToast({ show: true, message, type });
    if (type === 'warn' || type === 'success') {
      playSound('alert', soundEnabledRef.current);
    }
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (extractedData.risk === 'RED') {
      setProtocolSteps([
        { id: 'p1', label: 'Comprometimento de Vias Aéreas?', checked: true },
        { id: 'p2', label: 'Respiração Inadequada?', checked: true },
        { id: 'p3', label: 'Hemorragia Exsanguinante?', checked: false },
        { id: 'p4', label: 'Choque?', checked: false },
      ]);
    } else if (extractedData.risk === 'YELLOW') {
      setProtocolSteps([
        { id: 'p1', label: 'Dor Severa?', checked: true },
        { id: 'p2', label: 'Hemorragia Maior Incontrolável?', checked: false },
        { id: 'p3', label: 'Alteração do Estado de Consciência?', checked: false },
        { id: 'p4', label: 'História Incoerente?', checked: false },
      ]);
    } else {
      setProtocolSteps([
        { id: 'p1', label: 'Dor Moderada?', checked: true },
        { id: 'p2', label: 'Vômitos Persistentes?', checked: false },
        { id: 'p3', label: 'Febre?', checked: false },
      ]);
    }
  }, [extractedData.risk]);

  const toggleProtocolStep = (id: string) => {
    setProtocolSteps(prev => prev.map(step => step.id === id ? { ...step, checked: !step.checked } : step));
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      let updated = false;
      setVehicles(prev => prev.map(v => {
        // Simulate real-time ETA updates for moving vehicles
        if (v.status !== 'MANUTENÇÃO' && Math.random() > 0.6) {
          const etaChange = Math.random() > 0.5 ? 1 : -1;
          const newEta = Math.max(1, v.eta + etaChange);
          if (newEta !== v.eta) updated = true;
          return { ...v, eta: newEta };
        }
        return v;
      }));
      if (updated) {
        playSound('vehicle', soundEnabledRef.current);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Memoize the recommended vehicles list to optimize rendering
  const recommendedVehicles = useMemo(() => {
    return vehicles.filter(v => v.type.includes('USA') || v.type.includes('USB')).sort((a, b) => a.eta - b.eta);
  }, [vehicles]);

  // Chave do Maps só por env (SEC-01). Sem a variável, os mapas caem no embed
  // público keyless — nenhuma credencial vive no código-fonte.
  const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapFilter = theme === 'dark' ? 'invert(90%) hue-rotate(180deg) contrast(110%)' : 'none';

  const MapIframe = useMemo(() => {
    if (!amlData) return <div className="w-full h-full flex items-center justify-center text-ink-secondary">Sem dados de localização</div>;
    const src = GMAPS_KEY
      ? `https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${amlData.lat},${amlData.lng}&zoom=16`
      : `https://maps.google.com/maps?q=${amlData.lat},${amlData.lng}&z=16&output=embed`;
    return (
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0, filter: mapFilter }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={src}>
      </iframe>
    );
  }, [amlData, GMAPS_KEY, mapFilter]);

  // Rota da viatura: base operacional → local da ocorrência.
  const RouteMapIframe = useMemo(() => {
    if (!amlData) return null;
    const origin = '-23.5505,-46.6333'; // Base Central (config do tenant no futuro)
    const dest = `${amlData.lat},${amlData.lng}`;
    const src = GMAPS_KEY
      ? `https://www.google.com/maps/embed/v1/directions?key=${GMAPS_KEY}&origin=${origin}&destination=${dest}&mode=driving`
      : `https://maps.google.com/maps?saddr=${origin}&daddr=${dest}&output=embed`;
    return (
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0, filter: mapFilter }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={src}>
      </iframe>
    );
  }, [amlData, GMAPS_KEY, mapFilter]);

  // Mapa da tela de espera — base operacional (centro de São Paulo por ora;
  // vira configuração do tenant quando houver backend).
  const IdleMapIframe = useMemo(() => {
    const src = GMAPS_KEY
      ? `https://www.google.com/maps/embed/v1/view?key=${GMAPS_KEY}&center=-23.5505,-46.6333&zoom=13&maptype=roadmap`
      : `https://maps.google.com/maps?q=-23.5505,-46.6333&z=13&output=embed`;
    return (
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0, filter: mapFilter }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={src}>
      </iframe>
    );
  }, [GMAPS_KEY, mapFilter]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tarmChat]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAuthenticated && currentModule === 'IDLE' && !incomingCall) {
      // Reset TARM states when going back to IDLE
      setTarmChat([]);
      setExtractedData({ patientName: '', age: '', gender: '', symptoms: [], comorbidities: [], risk: 'PENDING', protocol: 'Analisando...', observations: '', confidence: { patientName: 0, symptoms: 0, protocol: 0 } });
      setAiActive(true);
      setActiveScriptIndex(Math.floor(Math.random() * MOCK_SCRIPTS.length));
      setMissionStatus('A CAMINHO');
      setOccId(null);
      setDispatchId(null);

      timer = setTimeout(() => {
        const randomCaller = MOCK_CALLERS[Math.floor(Math.random() * MOCK_CALLERS.length)];
        setCurrentCaller(randomCaller);
        setAmlData(null);
        setIncomingCall(true);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [isAuthenticated, currentModule, incomingCall]);

  // Fila de espera viva: tempos sobem em tempo real; chamadas entram e são atendidas.
  useEffect(() => {
    if (!isAuthenticated) return;
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      setQueue(prev => {
        let next = prev.map(q => ({ ...q, seconds: q.seconds + 1, priority: q.seconds + 1 > 90 ? 'high' : q.priority }));
        if (tick % 17 === 0 && next.length < 6) {
          const ddd = ['11', '12', '13'][Math.floor(Math.random() * 3)];
          next = [...next, {
            id: `Q${Date.now()}`,
            phone: `(${ddd}) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
            waitTime: '00:00',
            priority: 'normal',
            seconds: 0,
          }];
        }
        if (tick % 26 === 0 && next.length > 1) {
          next = next.slice(1); // a mais antiga foi atendida por outro TARM
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Espera da viatura: tablet em prontidão até receber um despacho (demo).
  useEffect(() => {
    if (!(isAuthenticated && role === 'VIATURA' && currentModule === 'VIATURA' && !currentCaller)) return;
    const t = setTimeout(() => {
      applyDemoSnapshot();
      playSound('vehicle', soundEnabledRef.current);
      showToast('Nova ocorrência designada à USA-01', 'warn');
      setMissionStatus('A CAMINHO');
    }, 10000);
    return () => clearTimeout(t);
  }, [isAuthenticated, role, currentModule, currentCaller]);

  useEffect(() => {
    let ringInterval: NodeJS.Timeout;
    if (incomingCall) {
      playSound('call', soundEnabledRef.current);
      ringInterval = setInterval(() => playSound('call', soundEnabledRef.current), 2000);
    }
    return () => {
      if (ringInterval) clearInterval(ringInterval);
    };
  }, [incomingCall]);

  // Simulação do TARM (Chat e Extração)
  useEffect(() => {
    if (currentModule === 'TARM' && aiActive && tarmChat.length === 0) {
      const script = MOCK_SCRIPTS[activeScriptIndex];

      script.forEach(item => {
        setTimeout(() => {
          setTarmChat(prev => {
            // Evita duplicatas caso o componente re-renderize
            if (prev.some(msg => msg.text === item.text)) return prev;
            return [...prev, { speaker: item.speaker as any, text: item.text, time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}) }];
          });
          
          if (item.extract) {
            const extract = item.extract as any;
            if (extract.patientName) {
              setExtractedData(prev => ({ ...prev, patientName: extract.patientName, age: extract.age || prev.age, gender: extract.gender || prev.gender, confidence: { ...prev.confidence, patientName: 0.96 } }));
            }
            if (extract.symptoms) {
              setExtractedData(prev => ({ ...prev, symptoms: [...new Set([...prev.symptoms, ...extract.symptoms])], confidence: { ...prev.confidence, symptoms: 0.89 } }));
            }
            if (extract.risk) {
              setExtractedData(prev => ({ ...prev, risk: extract.risk as any, protocol: extract.protocol || prev.protocol, confidence: { ...prev.confidence, protocol: 0.92 } }));
            }
          }
        }, item.delay);
      });
    }
  }, [currentModule, aiActive]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    const perfil = await tryRealLogin(loginMatricula, loginPassword);
    if (perfil) {
      setConnected(true);
      setOperatorName(perfil.name);
      setOperatorId(perfil.matricula);
      const nextRole = perfil.role === 'GESTOR' || perfil.role === 'ADMIN_TENANT' ? 'GESTOR'
        : perfil.role === 'REGULADOR' ? 'MEDICO'
        : perfil.role === 'VIATURA' ? 'VIATURA' : 'TARM';
      setRole(nextRole);
      setIsAuthenticated(true);
      setIsAuthenticating(false);
      setCurrentModule(nextRole === 'GESTOR' ? 'GESTOR' : nextRole === 'VIATURA' ? 'VIATURA' : 'IDLE');
      showToast(`Conectado ao backend Samais · ${perfil.matricula}`, 'success');
      return;
    }
    // Backend indisponível ou credencial não semeada: a demo nunca trava.
    setTimeout(() => {
      setConnected(false);
      const demo = { TARM: ['Mariana S.', 'TARM-04'], MEDICO: ['Dr. Almeida', 'REG-02'], VIATURA: ['Equipe USA-01', 'USA-01'], GESTOR: ['Carlos M.', 'GESTOR-01'] }[role];
      setOperatorName(demo[0]);
      setOperatorId(demo[1]);
      setIsAuthenticated(true);
      setIsAuthenticating(false);
      setCurrentModule(role === 'GESTOR' ? 'GESTOR' : role === 'VIATURA' ? 'VIATURA' : 'IDLE');
      showToast('Modo demonstração — backend offline', 'info');
    }, 1200);
  };

  // Frota do banco + realtime quando conectado
  useEffect(() => {
    if (!connected) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('viaturas').select('id, codigo, tipo, status, manutencao_prevista');
      if (data) setVehicleIds(Object.fromEntries(data.map(r => [r.codigo, r.id])));
      if (!active || !data || data.length === 0) return;
      setVehicles(data.map(r => mapDbVehicle(r, VEHICLE_STATUS_COLOR)) as typeof MOCK_VEHICLES);
      const maint: Record<string, string> = {};
      data.forEach(r => { if (r.manutencao_prevista) maint[r.codigo] = r.manutencao_prevista; });
      setMaintSchedule(maint);
    };
    load();
    supabase.auth.getUser().then(({ data: u }) => { if (u.user) setAuthUserId(u.user.id); });
    const channel = supabase
      .channel('viaturas-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viaturas' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [connected]);

  // Escalas do banco (intervalo: semana atual até +1 mês) — gestor vê todas (RLS),
  // operação só as próprias.
  useEffect(() => {
    if (!connected) return;
    (async () => {
      const { data: us } = await supabase.from('usuarios').select('id, matricula');
      if (us) setUserIds(Object.fromEntries(us.map(u => [u.matricula, u.id])));
      const from = isoDate(startOfWeek(new Date()));
      const to = isoDate(addDays(startOfWeek(new Date()), 7 * (MAX_WEEKS_AHEAD + 1)));
      const { data: es } = await supabase.from('escalas').select('usuario_id, dia, turno').gte('dia', from).lt('dia', to);
      if (es && us) {
        const byId = Object.fromEntries(us.map(u => [u.id, u.matricula]));
        setRoster(prev => {
          const r = { ...prev };
          es.forEach(e => {
            const m = byId[e.usuario_id];
            if (!m) return;
            r[m] = { ...(r[m] || {}), [e.dia]: e.turno };
          });
          return r;
        });
      }
    })();
  }, [connected]);

  // Snapshot de demonstração: permite "pular" para qualquer estágio do fluxo
  // sem precisar atender uma chamada (navegação da demo, não do produto real).
  const applyDemoSnapshot = () => {
    const caller = MOCK_CALLERS[0];
    setCurrentCaller(caller);
    setAmlData(caller.aml);
    setExtractedData({
      patientName: 'João da Silva', age: '65 anos', gender: 'Masculino',
      symptoms: ['Dor no peito irradiante', 'Sudorese fria', 'Dispneia (Falta de ar)'],
      comorbidities: ['Hipertensão (HAS)', 'Diabetes (DM)'],
      risk: 'RED', protocol: 'Suspeita de IAM (Infarto)', observations: '',
      confidence: { patientName: 0.96, symptoms: 0.89, protocol: 0.92 },
    });
    setAiActive(false);
    setTarmChat(prev => prev.length > 0 ? prev : MOCK_SCRIPTS[0].slice(0, 7).map(i => ({
      speaker: i.speaker as any, text: i.text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    })));
  };

  // O sistema designa a viatura recomendada ao entrar na regulação (médico pode trocar).
  useEffect(() => {
    if (currentModule === 'REGULADOR' && !selectedVehicleId) {
      setSelectedVehicleId(recommendedVehicles[0]?.id || 'USA-01');
    }
  }, [currentModule, selectedVehicleId, recommendedVehicles]);

  // Simuladores de viatura sobre o mapa: ativas se deslocam, base fica fixa,
  // em ocorrência pulsa em vermelho — mesmo padrão em todas as telas de espera.
  const FleetMarkers = (
    <>
      {vehicles.slice(0, 4).map((v, i) => {
        const moving = v.status === 'DISPONÍVEL' || v.status === 'RETORNO' || v.status === 'EM ATENDIMENTO';
        const speed = v.status === 'EM ATENDIMENTO' ? 1200 : 2200 + i * 400;
        const amp = moving ? 22 + i * 6 : 0;
        const pos = [
          { top: '30%', left: '24%' }, { top: '62%', left: '64%' },
          { top: '44%', left: '44%' }, { top: '72%', left: '30%' },
        ][i];
        const color = v.status === 'EM ATENDIMENTO' ? 'bg-danger' : v.status === 'MANUTENÇÃO' ? 'bg-ink-tertiary' : v.status === 'RETORNO' ? 'bg-warn' : 'bg-ok';
        return (
          <div key={v.id} className="absolute z-10 flex flex-col items-center pointer-events-none transition-transform duration-[2000ms] ease-linear" style={{ ...pos, transform: `translate(${Math.sin(time.getTime() / speed + i) * amp}px, ${Math.cos(time.getTime() / speed + i) * amp}px)` }}>
            <div className={`w-6 h-6 ${color} border-2 border-white rounded-[50%_50%_50%_0] -rotate-45 shadow-lg flex items-center justify-center ${v.status === 'EM ATENDIMENTO' ? 'animate-pulse' : ''}`}>
              <Icon name={v.type.includes('MOTOLÂNCIA') ? 'motorcycle' : 'truck-medical'} className="text-white text-[0.5rem] rotate-45" />
            </div>
            <div className="text-[0.5rem] font-bold text-white bg-canvas/80 px-1 rounded mt-1">{v.id}</div>
          </div>
        );
      })}
    </>
  );

  // Ciclo da ocorrência persistido (quando conectado) + trilha de auditoria (SEC-05).
  const audit = (acao: string, alvo: Record<string, unknown> = {}) => {
    if (!connected) return;
    supabase.from('auditoria').insert({ tenant_id: TENANT_ID, usuario_id: authUserId, acao, alvo }).then();
  };

  const abrirOcorrencia = (caller: (typeof MOCK_CALLERS)[number]) => {
    if (!connected) return;
    supabase.from('ocorrencias')
      .insert({ tenant_id: TENANT_ID, telefone: caller.phone, aml: caller.aml, tarm_id: role === 'TARM' ? authUserId : null })
      .select('id').single()
      .then(({ data }) => { if (data) setOccId(data.id); });
    audit('CHAMADA_ATENDIDA', { telefone: caller.phone });
  };

  const encerrarAtendimento = (desfecho: string) => {
    if (connected && occId) {
      supabase.from('ocorrencias').update({ encerrada_at: new Date().toISOString() }).eq('id', occId).then();
      audit('OCORRENCIA_ENCERRADA', { desfecho, viatura: selectedVehicleId });
    }
    showToast(`Atendimento encerrado · ${desfecho}`, 'success');
    setCurrentCaller(null);
    setAmlData(null);
    setMissionStatus('A CAMINHO');
    setOccId(null);
    setDispatchId(null);
    if (role !== 'VIATURA') setCurrentModule('IDLE');
  };

  const jumpToStage = (stage: 'IDLE' | 'AML' | 'TARM' | 'REGULADOR' | 'VIATURA') => {
    if (stage !== 'IDLE' && !currentCaller) applyDemoSnapshot();
    if (stage === 'REGULADOR' && !selectedVehicleId) setSelectedVehicleId(recommendedVehicles[0]?.id || 'USA-01');
    setCurrentModule(stage);
    setIsNavOpen(false);
  };

  // Métricas reais do backend no Dashboard (ocorrências + tempos T0→T2).
  useEffect(() => {
    if (!connected || currentModule !== 'DASHBOARD') return;
    (async () => {
      const { count } = await supabase.from('ocorrencias').select('id', { count: 'exact', head: true });
      const { data: ds } = await supabase.from('despachos').select('t0_despacho, t2_no_local').not('t2_no_local', 'is', null).limit(200);
      let t: number | null = null;
      if (ds && ds.length) {
        t = Math.round(ds.reduce((acc, d) => acc + (new Date(d.t2_no_local as string).getTime() - new Date(d.t0_despacho as string).getTime()) / 1000, 0) / ds.length);
      }
      if (count && count > 0) setRealStats({ chamadas: count, tRespostaSeg: t });
    })();
  }, [connected, currentModule]);

  // Edição de 1 clique no planner do Gestor; persiste quando conectado.
  const setShift = (matricula: string, dia: string, turno: string | null) => {
    setRoster(prev => {
      const r = { ...prev, [matricula]: { ...(prev[matricula] || {}) } };
      if (turno) r[matricula][dia] = turno; else delete r[matricula][dia];
      return r;
    });
    if (connected && userIds[matricula]) {
      if (turno) {
        supabase.from('escalas')
          .upsert({ tenant_id: TENANT_ID, usuario_id: userIds[matricula], dia, turno, status: 'PROGRAMADO' }, { onConflict: 'usuario_id,dia' })
          .then();
      } else {
        supabase.from('escalas').delete().eq('usuario_id', userIds[matricula]).eq('dia', dia).then();
      }
    }
  };

  const acceptCall = () => {
    setIncomingCall(false);
    if (currentCaller) abrirOcorrencia(currentCaller);
    if (role === 'MEDICO') {
      applyDemoSnapshot();
      setSelectedVehicleId(recommendedVehicles[0]?.id || 'USA-01');
      setCurrentModule('REGULADOR');
      showToast('Handoff recebido do TARM-04', 'success');
      return;
    }
    showToast('Chamada conectada com sucesso', 'success');
    setCurrentModule('AML');
    
    setTimeout(() => {
      if (currentCaller) {
        setAmlData(currentCaller.aml);
        showToast('Localização AML triangulada', 'info');
      }
    }, 1500);
  };

  const ignoreCall = () => {
    setIncomingCall(false);
    setCurrentModule('IDLE');
  };

  const handoffCTAs = (
    <>
      <button 
        disabled={extractedData.risk === 'PENDING' && aiActive}
        onClick={() => {
          setIncomingCall(false);
          setCurrentModule('IDLE');
        }}
        className="w-full py-3 bg-elevated border border-border-subtle text-ink-primary font-bold font-sans uppercase tracking-widest text-xs rounded-xl hover:bg-surface transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Icon name="forward-step" /> Handoff & Próxima Chamada
      </button>
      <button 
        disabled={extractedData.risk === 'PENDING' && aiActive}
        onClick={() => {
          if (!selectedVehicleId) {
            setSelectedVehicleId(recommendedVehicles[0]?.id || 'USA-01');
          }
          if (connected && occId) {
            supabase.from('ocorrencias').update({
              transcricao: tarmChat,
              extracao: extractedData,
              risco_sugerido: extractedData.risk === 'PENDING' ? null : extractedData.risk,
              fatores_ia: { sintomas: extractedData.symptoms, comorbidades: extractedData.comorbidities, confianca: extractedData.confidence },
            }).eq('id', occId).then();
            audit('HANDOFF_REGULACAO', { risco: extractedData.risk });
          }
          setCurrentModule('REGULADOR');
        }}
        className="w-full py-4 px-3 bg-gradient-to-r from-gold-500 to-gold-700 text-ink-inverse font-extrabold font-sans uppercase tracking-wider text-xs md:text-sm rounded-xl shadow-[0_0_30px_rgba(191,154,61,0.2)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
      >
        <Icon name="user-doctor" className="text-base shrink-0" /> <span className="truncate">Handoff & Ir p/ Regulador</span>
      </button>
    </>
  );

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-canvas relative overflow-hidden transition-colors">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-gold-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-ai/5 rounded-full blur-3xl"></div>
        
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center fu">
          <div className="text-2xl font-mono font-bold text-ink-primary tracking-widest">{time.toLocaleTimeString('pt-BR')}</div>
          <div className="text-[0.65rem] text-ink-secondary uppercase tracking-widest">{time.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="gp p-10 rounded-2xl w-full max-w-md relative z-10 fu">
          <div className="flex flex-col items-center mb-8">
            <SamaisMonogram className="h-16 mb-2 text-gold-500" />
            <SamaisWordmark className="h-7 text-ink-primary" />
            <p className="text-xs text-gold-500 uppercase tracking-widest font-mono mt-1">SAMU CoPilot OS</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="lbl">Perfil de Acesso</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { r: 'TARM', label: 'TARM', icon: 'headset', mat: 'TARM-04' },
                  { r: 'MEDICO', label: 'Médico', icon: 'user-doctor', mat: 'REG-02' },
                  { r: 'VIATURA', label: 'Viatura', icon: 'truck-medical', mat: 'USA-01' },
                  { r: 'GESTOR', label: 'Gestor', icon: 'chart-simple', mat: 'GESTOR-01' },
                ] as const).map(o => (
                  <button
                    key={o.r}
                    type="button"
                    onClick={() => { setRole(o.r); setLoginMatricula(o.mat); }}
                    className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors flex items-center justify-center gap-2 ${role === o.r ? 'bg-gold-500/15 border-gold-500 text-gold-500' : 'bg-elevated border-border-subtle text-ink-secondary hover:text-ink-primary'}`}
                  >
                    <Icon name={o.icon} /> {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="lbl">Matrícula Operacional</label>
              <div className="relative">
                <Icon name="id-badge" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary/50" />
                <input type="text" className="inp pl-10" placeholder="Ex: TARM-04" required value={loginMatricula} onChange={(e) => setLoginMatricula(e.target.value)} />
              </div>
            </div>
            
            <div>
              <label className="lbl">Senha de Acesso</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary/50" />
                <input type="password" className="inp pl-10" placeholder="••••••••" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
            </div>

            <div className="p-4 bg-elevated border border-border-subtle rounded-xl mt-2 flex items-start gap-3">
              <Icon name="fingerprint" className="text-ai text-xl mt-0.5" />
              <div>
                <p className="text-xs font-bold text-ink-primary">MFA (TOTP) — habilitação em produção</p>
                <p className="text-[0.65rem] text-ink-secondary font-mono mt-1">Segundo fator obrigatório para perfis com acesso a dados pessoais.</p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isAuthenticating}
              className="mt-4 w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-700 text-ink-inverse font-extrabold text-[0.8rem] uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(191,154,61,0.2)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isAuthenticating ? (
                <><Icon name="circle-notch" className="animate-spin" /> Autenticando...</>
              ) : (
                <>Acessar Central <Icon name="arrow-right" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-canvas transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
            toast.type === 'success' ? 'bg-ok/20 border-ok/40 text-ok' :
            toast.type === 'warn' ? 'bg-warn/20 border-warn/40 text-warn' :
            'bg-ai/20 border-ai/40 text-ai'
          }`}>
            <Icon name={toast.type === 'success' ? 'circle-check' : toast.type === 'warn' ? 'triangle-exclamation' : 'circle-info'} />
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* INCOMING CALL OVERLAY */}
      {incomingCall && currentCaller && (
        <div className="fixed inset-0 bg-canvas/95 z-[500] flex flex-col items-center justify-center fu backdrop-blur-md px-6">
          <div className="relative w-32 h-32 md:w-44 md:h-44 flex items-center justify-center mb-6 md:mb-8">
            <div className="absolute inset-0 rounded-full bg-danger/15 animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-3 rounded-full bg-danger/25 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
            <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-danger to-red-900 flex items-center justify-center shadow-[0_0_60px_rgba(229,57,53,0.8)] text-3xl md:text-4xl text-white">
              <Icon name="phone-volume" className="animate-pulse" />
            </div>
          </div>
          <div className="text-center w-full max-w-sm">
            <div className="text-[0.6rem] md:text-[0.65rem] font-mono font-bold tracking-widest text-danger/70 mb-2 uppercase">Chamada Entrante — 192</div>
            <h2 className="text-3xl md:text-4xl font-disp font-bold text-danger tracking-widest mb-4" style={{ textShadow: '0 0 30px rgba(229,57,53,0.5)' }}>EMERGÊNCIA 192</h2>
            
            <div className="inline-flex items-center gap-3 px-6 md:px-8 py-3 bg-surface border border-border-subtle rounded-full mb-6 md:mb-8 shadow-lg w-full justify-center">
              <Icon name="mobile-screen" className="text-lg md:text-xl text-ink-secondary" />
              <span className="text-ink-primary font-mono text-xl md:text-2xl font-bold truncate">{currentCaller.phone}</span>
            </div>

            {/* Mobile Transcription Box (Preview) */}
            <div className="md:hidden w-full p-4 bg-elevated/50 border border-border-subtle rounded-2xl mb-8 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[0.6rem] font-bold text-ai uppercase tracking-widest">
                <Icon name="microphone-lines" className="animate-pulse" /> Transcrição Prévia (IA)
              </div>
              <div className="text-xs text-ink-primary italic text-left line-clamp-2">
                "Socorro! Meu pai está com muita dor no peito e não consegue respirar direito, estamos na rua..."
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <button onClick={ignoreCall} className="flex-1 px-4 py-3 rounded-xl border border-border-subtle text-ink-secondary font-bold tracking-widest hover:bg-elevated transition-all text-xs md:text-sm">
                IGNORAR
              </button>
              <button onClick={acceptCall} className="flex-[1.5] px-4 py-3 bg-ok text-ink-inverse font-extrabold font-disp text-sm md:text-lg rounded-xl shadow-[0_0_30px_rgba(67,160,71,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-2 md:gap-3">
                <Icon name="headset" /> ATENDER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL HEADER */}
      <header className="h-[3.75rem] border-b border-border-subtle bg-surface flex items-center justify-between px-5 shrink-0 z-50 shadow-md relative">
        <div className="flex items-center gap-4">
          <SamaisMonogram className="h-9 shrink-0 text-gold-500" />
          <div className="hidden sm:block">
            <SamaisWordmark className="h-5 text-ink-primary" />
            <div className="text-[0.6rem] text-gold-500 uppercase tracking-widest font-mono">
              {role === 'GESTOR' ? 'Central 192 — Gestão da Operação' : role === 'MEDICO' ? 'Central 192 — Regulação Médica' : role === 'VIATURA' ? 'Central 192 — Unidade Embarcada' : currentModule === 'IDLE' ? 'Central 192 — Recepção' : 'Central 192 — Atendimento'}
            </div>
          </div>

        </div>

        <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-1.5 rounded-full border transition-all duration-300 ${role !== 'GESTOR' && currentModule !== 'IDLE' ? 'bg-danger/10 border-danger/50' : 'bg-elevated border-border-subtle'} shadow-inner`}>
          <Icon name="circle" className={`text-[7px] ${role !== 'GESTOR' && currentModule !== 'IDLE' ? 'text-danger animate-pulse' : 'text-ink-secondary'}`} />
          <span className={`text-[0.65rem] font-mono font-bold uppercase tracking-widest ${role !== 'GESTOR' && currentModule !== 'IDLE' ? 'text-danger' : 'text-ink-secondary'}`}>
            {role === 'GESTOR' ? 'GESTÃO' : currentModule !== 'IDLE' ? 'EM CHAMADA' : 'EM ESPERA'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[0.6rem] text-ink-secondary uppercase tracking-widest font-bold">Hora Local</div>
            <div className="text-sm font-bold font-mono text-ink-primary">
              {new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
          <div className="h-7 w-px bg-hover hidden sm:block"></div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${soundEnabled ? 'bg-elevated border border-border-subtle text-gold-500 hover:border-gold-500' : 'bg-elevated border border-border-subtle text-ink-secondary hover:text-ink-primary'}`}
            title={soundEnabled ? "Desativar Sons" : "Ativar Sons"}
          >
            <Icon name={soundEnabled ? 'volume-high' : 'volume-xmark'} />
          </button>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors bg-elevated border border-border-subtle text-ink-secondary hover:text-gold-500 hover:border-gold-500"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            aria-label="Alternar tema"
          >
            <Icon name="moon" />
          </button>
          <div className="h-7 w-px bg-hover"></div>
          {(role === 'TARM' || role === 'MEDICO') && (
          <button
            onClick={() => setShowEscala(true)}
            className="px-3 h-9 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors bg-elevated border border-border-subtle text-ink-secondary hover:text-gold-500 hover:border-gold-500"
            title="Minha escala"
          >
            <Icon name="calendar" /> <span className="hidden md:inline">Escala</span>
          </button>
          )}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[0.65rem] text-ink-secondary uppercase tracking-widest">{operatorName}</div>
              <div className="text-xs font-bold text-gold-500">{operatorId}{connected ? '' : ' · demo'}</div>
            </div>
            <button 
              onClick={() => { supabase.auth.signOut().catch(() => {}); setConnected(false); setIsAuthenticated(false); }}
              className="w-9 h-9 rounded-lg bg-elevated border border-border-subtle hover:border-danger hover:text-danger text-ink-secondary transition-all flex items-center justify-center text-sm" 
              title="Sair"
            >
              <Icon name="arrow-right-from-bracket" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 flex flex-col relative overflow-hidden p-4 md:p-5`}>
        {/* Guardrails for empty states */}
        {currentModule === 'VIATURA' && !currentCaller && (
          <div className="flex-1 relative fu min-h-0 -m-4 md:-m-5 overflow-hidden bg-elevated">
            {IdleMapIframe}
            {FleetMarkers}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]"></div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-canvas/90 backdrop-blur-md border border-border-subtle px-5 py-2.5 rounded-xl shadow-2xl z-10 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-ok animate-pulse"></span>
              <span className="font-mono text-xs uppercase tracking-widest text-ink-secondary">{selectedVehicleId || 'USA-01'} · em prontidão · aguardando despacho</span>
            </div>
          </div>
        )}
        {(currentModule === 'AML' || currentModule === 'TARM' || currentModule === 'REGULADOR') && !currentCaller && (
          <div className="flex-1 flex flex-col items-center justify-center text-ink-secondary/50">
            <Icon name="headset" className="text-4xl mb-4 animate-pulse" />
            <p className="font-mono text-sm uppercase tracking-widest">Aguardando chamada entrante...</p>
          </div>
        )}

        {currentModule === 'IDLE' && (
          <div className="flex-1 flex flex-col items-center pt-10 pb-20 fu overflow-y-auto min-h-0">
            {/* Large Clock */}
            <div className="text-center mb-12">
              <div className="text-6xl md:text-8xl font-disp font-bold text-ink-primary tracking-widest" style={{ textShadow: '0 0 40px rgba(244,244,245,0.1)' }}>
                {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                <span className="text-3xl md:text-5xl text-gold-500 ml-2 animate-pulse">{time.getSeconds().toString().padStart(2, '0')}</span>
              </div>
              <div className="text-sm md:text-base text-ink-secondary uppercase tracking-widest font-mono mt-4">
                {time.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Vehicles Grid & Map */}
            <div className="w-full max-w-7xl px-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col">
                <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-3">
                  <Icon name="truck-medical" className="text-gold-500 text-xl" />
                  <h3 className="text-lg font-disp font-bold text-ink-primary uppercase tracking-widest">Status da Frota</h3>
                  <div className="ml-auto flex gap-2">
                     <span className="chip chip-ok text-[0.6rem]">3 DISPONÍVEIS</span>
                     <span className="chip chip-danger text-[0.6rem]">1 EM ATENDIMENTO</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <div key={v.id} className={`gp p-4 rounded-xl border-l-4 flex items-center gap-4 ${
                      v.color === 'ok' ? 'border-l-ok' : 
                      v.color === 'danger' ? 'border-l-danger' : 
                      v.color === 'warn' ? 'border-l-warn' : 'border-l-ink-secondary'
                    }`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
                        v.color === 'ok' ? 'bg-ok/10 text-ok' : 
                        v.color === 'danger' ? 'bg-danger/10 text-danger' : 
                        v.color === 'warn' ? 'bg-warn/10 text-warn' : 'bg-ink-secondary/10 text-ink-secondary'
                      }`}>
                        <Icon name={v.type.includes('MOTOLÂNCIA') ? 'motorcycle' : 'truck-medical'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-ink-primary font-mono">{v.id}</span>
                          <span className={`text-[0.6rem] font-bold uppercase tracking-widest ${
                            v.color === 'ok' ? 'text-ok' : 
                            v.color === 'danger' ? 'text-danger' : 
                            v.color === 'warn' ? 'text-warn' : 'text-ink-secondary'
                          }`}>{v.status}</span>
                        </div>
                        <div className="text-[0.65rem] text-ink-secondary uppercase tracking-widest">{v.type}</div>
                        <div className="text-[0.65rem] text-ink-secondary/70 font-mono mt-1"><Icon name="location-dot" className="mr-1" /> {v.base}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Panel */}
              <div className="gp rounded-2xl flex flex-col overflow-hidden min-h-[400px] lg:min-h-0 border border-border-subtle">
                <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Icon name="map-location-dot" className="text-gold-500 text-xs" />
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Posicionamento Global</span>
                  </div>
                  <span className="chip chip-ok text-[0.6rem] animate-pulse"><Icon name="satellite-dish" /> GPS ATIVO</span>
                </div>
                <div className="flex-1 relative bg-elevated">
                  {IdleMapIframe}
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]"></div>
                  
                  {FleetMarkers}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentModule === 'AML' && currentCaller && (
          <div className="flex-1 flex flex-col gap-4 fu min-h-0 overflow-y-auto lg:overflow-hidden pb-6 lg:pb-0 pr-2 -mr-2 lg:pr-0 lg:mr-0">
            {/* Top row: caller + anti-trote */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0 order-2 lg:order-1">
              <div className="lg:col-span-2 gp rounded-2xl p-4 flex items-center gap-5 border-l-4 border-l-gold-500">
                <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center border border-border-subtle text-lg text-gold-500 shrink-0">
                  <Icon name="user" />
                </div>
                <div className="flex-1">
                  <div className="lbl">Origem da Chamada</div>
                  <div className="text-xl font-mono font-bold text-ink-primary">{currentCaller.phone}</div>
                  <div className="text-[0.65rem] text-ink-secondary font-mono mt-0.5">
                    Histórico 30d: <span className={currentCaller.hasHistory ? (currentCaller.historyCount > 0 ? "text-warn font-bold" : "text-ok font-bold") : "text-ink-secondary font-bold"}>
                      {currentCaller.hasHistory ? `${currentCaller.historyCount} ocorrência(s)` : "Número Desconhecido"}
                    </span>
                  </div>
                </div>
                <div className="h-10 w-px bg-hover"></div>
                <div className="text-right">
                  <div className="lbl">Tipo de Linha</div>
                  <div className="text-sm font-bold text-ink-primary">Celular 4G</div>
                  <div className="text-[0.65rem] text-ink-secondary font-mono">Operadora: Vivo</div>
                </div>
              </div>
              
              {/* Anti-trote */}
              <div className={`gp rounded-2xl p-4 flex items-center gap-4 ${currentCaller.hasHistory ? 'bg-ok/8 border-ok/30 shadow-[0_0_20px_rgba(67,160,71,0.1)]' : 'bg-elevated border-border-subtle'}`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center border text-lg shrink-0 ${currentCaller.hasHistory ? 'bg-ok/15 border-ok/40 text-ok' : 'bg-surface border-border-subtle text-ink-secondary'}`}>
                  <Icon name="shield-halved" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`lbl ${currentCaller.hasHistory ? 'text-ok' : 'text-ink-secondary'}`}>Score Anti-Trote</div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-ink-primary">{currentCaller.hasHistory ? '98%' : 'N/A'}</span>
                    <span className={`chip ${currentCaller.hasHistory ? 'chip-ok' : 'chip-nude'} text-[0.6rem]`}>
                      {currentCaller.hasHistory ? 'Autêntica' : 'Análise Pendente'}
                    </span>
                  </div>
                  <div className="bg-canvas rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${currentCaller.hasHistory ? 'bg-ok' : 'bg-ink-secondary/30'}`} style={{ width: currentCaller.hasHistory ? '98%' : '10%', transition: 'width 1s ease-in-out' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map + Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[600px] lg:min-h-0">
              {/* Form */}
              <div className="gp rounded-2xl flex flex-col overflow-hidden order-2 lg:order-1">
                <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Icon name="file-lines" className="text-gold-500 text-xs" />
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Dados do Solicitante</span>
                  </div>
                  {currentCaller.hasHistory ? (
                    <span className="chip chip-ai text-[0.6rem]"><Icon name="bolt" /> CAD AUTO-FILL</span>
                  ) : (
                    <span className="chip chip-warn text-[0.6rem]"><Icon name="bolt" /> SEM HISTÓRICO · TELA RÁPIDA</span>
                  )}
                </div>
                <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[40vh] lg:max-h-none">
                  
                  {/* Renderização Condicional do Nome */}
                  {currentCaller.hasHistory ? (
                    <div className="fu">
                      <span className="lbl">Nome do Solicitante (CAD)</span>
                      <input 
                        type="text" 
                        className="inp bg-ai/5 border-ai/40 text-ai font-bold cursor-not-allowed opacity-90" 
                        value={currentCaller.name} 
                        readOnly 
                      />
                    </div>
                  ) : (
                    <div className="fu p-4 rounded-xl bg-elevated border border-border-subtle flex items-start gap-3">
                      <Icon name="circle-info" className="text-warn mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-ink-primary">Número sem histórico na CRU</p>
                        <p className="text-[0.7rem] text-ink-secondary font-mono leading-relaxed mt-1">
                          Identificação e dados do paciente serão extraídos pela triagem por voz (IA) no próximo passo. Esta tela dura segundos — siga para a triagem.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="lbl">Município</span>
                      <input className="inp bg-ok/5 border-ok/40 text-ok font-bold cursor-not-allowed opacity-80" value={amlData ? amlData.city : "..."} readOnly />
                    </div>
                    <div>
                      <span className="lbl">CEP (AML)</span>
                      <input className="inp bg-ok/5 border-ok/40 text-ok font-bold cursor-not-allowed opacity-80" value={amlData ? amlData.cep : "..."} readOnly />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <span className="lbl">Endereço (GPS Capturado)</span>
                      <input className="inp bg-ok/5 border-ok/40 text-ok font-bold cursor-not-allowed" value={amlData ? amlData.address : "Buscando..."} readOnly />
                    </div>
                    <div>
                      <span className="lbl">Nº</span>
                      <input className="inp bg-ok/5 border-ok/40 text-ok font-bold cursor-not-allowed text-center" value={amlData ? amlData.number : "..."} readOnly />
                    </div>
                  </div>
                  <div>
                    <span className="lbl">Bairro / Referência</span>
                    <input className="inp cursor-not-allowed opacity-70" value={amlData ? amlData.neighborhood : ""} readOnly />
                  </div>
                  <div className="mt-auto pt-3 border-t border-border-subtle">
                    <div className="flex items-center gap-2 text-[0.65rem] font-mono text-ok">
                      {amlData ? (
                        <>
                          <Icon name="circle-check" />
                          <span>Coordenadas AML fixadas: <span className="font-bold">{amlData.lat}°, {amlData.lng}°</span> · Precisão: ±5m</span>
                        </>
                      ) : (
                        <>
                          <Icon name="circle-notch" className="animate-spin" />
                          <span>Interceptando sinal GPS via operadora...</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Maps iframe simulation */}
              <div className="gp rounded-2xl flex flex-col lg:overflow-hidden relative flex-1 min-h-[300px] lg:min-h-0">
                <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between z-10 relative shrink-0">
                  <div className="flex items-center gap-2">
                    <Icon name="map-location-dot" className="text-gold-500 text-xs" />
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Google Maps API</span>
                  </div>
                  {amlData && <span className="chip chip-ok text-[0.6rem] animate-pulse"><Icon name="satellite-dish" /> FIXADO ±5M</span>}
                </div>
                
                <div className="flex-1 relative bg-elevated overflow-hidden">
                  {MapIframe || (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-secondary/50">
                      <Icon name="satellite-dish" className="text-4xl mb-3 animate-pulse" />
                      <p className="font-mono text-xs uppercase tracking-widest">Aguardando triangulação...</p>
                    </div>
                  )}
                  {amlData && (
                    <>
                      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 flex flex-col items-center pointer-events-none">
                        <div className="w-8 h-8 bg-danger border-2 border-white rounded-[50%_50%_50%_0] -rotate-45 shadow-[0_0_20px_rgba(229,57,53,0.7)] flex items-center justify-center">
                          <Icon name="truck-medical" className="text-white text-[0.6rem] rotate-45" />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-danger/60 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex justify-center shrink-0 mt-2 order-3">
              <button 
                onClick={() => {
                  showToast('Dados de localização salvos e AML confirmado', 'success');
                  setCurrentModule('TARM');
                }}
                disabled={!amlData}
                className="px-10 py-4 bg-gradient-to-r from-gold-500 to-gold-700 text-ink-inverse font-extrabold font-sans uppercase tracking-widest text-sm rounded-xl shadow-[0_0_40px_rgba(191,154,61,0.35)] hover:scale-[1.02] transition-transform flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
              >
                <Icon name="check-double" className="text-lg" /> Confirmar AML & Iniciar Triagem
                <Icon name="arrow-right" className="text-lg" />
              </button>
            </div>
          </div>
        )}

        {currentModule === 'TARM' && currentCaller && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 fu min-h-0 overflow-y-auto lg:overflow-hidden pb-6 lg:pb-0 pr-2 -mr-2 lg:pr-0 lg:mr-0">
            {/* Left Panel: Call Queue (Hidden on Mobile) */}
            <div className="w-full lg:w-[250px] h-48 lg:h-auto gp rounded-2xl flex flex-col lg:overflow-hidden shrink-0 hidden md:flex">
              <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Icon name="list-ol" className="text-gold-500 text-xs" />
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Fila no PABX</span>
                </div>
                <span className="chip chip-warn text-[0.6rem]">{queue.length} aguardando</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {queue.map(q => (
                  <div key={q.id} className="p-3 rounded-xl bg-surface border border-border-subtle flex flex-col gap-2 relative overflow-hidden">
                    {q.priority === 'high' && <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-ink-primary">{`${q.phone.slice(0, 5)}•••••-${q.phone.slice(-4)}`}</span>
                      <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded font-mono ${q.priority === 'high' ? 'bg-danger/20 text-danger animate-pulse' : 'bg-elevated text-ink-secondary'}`}>
                        {`${String(Math.floor(q.seconds / 60)).padStart(2, '0')}:${String(q.seconds % 60).padStart(2, '0')}`}
                      </span>
                    </div>
                    <div className="text-[0.6rem] text-ink-secondary uppercase tracking-widest">Sinalização do PABX · nº revelado ao atender</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Cognitive Extraction (Prominent on Mobile) */}
            <div className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0 order-1 lg:order-3">
              <div className="gp rounded-2xl flex flex-col lg:overflow-hidden flex-1">
                <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Icon name="brain" className="text-ai text-xs" />
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Extração Cognitiva (NLP)</span>
                  </div>
                  <span className={`chip ${aiActive ? 'chip-ai' : 'chip-warn'} text-[0.6rem]`}>
                    {aiActive ? 'AUTO' : 'MANUAL'}
                  </span>
                </div>
                
                <div className="p-5 flex flex-col gap-5 lg:overflow-y-auto">
                  <div className="text-[0.6rem] font-mono text-ink-tertiary flex items-center gap-2 flex-wrap">
                    <Icon name="server" className="text-ink-tertiary" /> Triagem assistida em simulação · roteiro de demonstração (sem transcrição real)
                  </div>

                  {/* Risk Classification */}
                  <div className={`p-4 rounded-xl border ${
                    extractedData.risk === 'RED' ? 'bg-danger/10 border-danger/40' :
                    extractedData.risk === 'YELLOW' ? 'bg-warn/10 border-warn/40' :
                    'bg-surface border-border-subtle'
                  } transition-colors duration-500`}>
                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-2">Classificação de Risco Sugerida</div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        extractedData.risk === 'RED' ? 'bg-danger shadow-[0_0_10px_rgba(229,57,53,0.8)]' :
                        extractedData.risk === 'YELLOW' ? 'bg-warn shadow-[0_0_10px_rgba(253,216,53,0.8)]' :
                        'bg-hover'
                      }`}></div>
                      <span className={`text-lg font-bold font-disp ${
                        extractedData.risk === 'RED' ? 'text-danger' :
                        extractedData.risk === 'YELLOW' ? 'text-warn' :
                        'text-ink-primary'
                      }`}>
                        {extractedData.protocol}
                      </span>
                    </div>
                    {(extractedData.symptoms.length > 0 || extractedData.comorbidities.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-border-subtle">
                        <div className="text-[0.6rem] font-mono font-bold uppercase tracking-widest text-ai mb-2 flex items-center gap-1.5">
                          <Icon name="brain" /> Por que esta classificação
                        </div>
                        <ul className="flex flex-col gap-1">
                          {extractedData.symptoms.slice(0, 4).map((sym, i) => (
                            <li key={`s-${i}`} className="text-[0.7rem] text-ink-secondary flex items-center justify-between gap-2">
                              <span className="truncate">• {sym}</span>
                              <span className="font-mono text-ai shrink-0">peso {(0.94 - i * 0.09).toFixed(2)}</span>
                            </li>
                          ))}
                          {extractedData.comorbidities.slice(0, 2).map((c, i) => (
                            <li key={`c-${i}`} className="text-[0.7rem] text-ink-secondary flex items-center justify-between gap-2">
                              <span className="truncate">• {c} <span className="text-ink-tertiary">(agravante)</span></span>
                              <span className="font-mono text-ai shrink-0">peso {(0.58 - i * 0.08).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="text-[0.6rem] text-ink-tertiary mt-2">A decisão final é do Médico Regulador. Divergências são registradas e retroalimentam o modelo.</div>
                      </div>
                    )}
                  </div>

                  {/* Patient Info */}
                  <div>
                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-3 border-b border-border-subtle pb-2">Dados do Paciente</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <span className="lbl">Nome do Paciente</span>
                        <input type="text" className="inp bg-surface" placeholder="Aguardando..." value={extractedData.patientName} readOnly={aiActive} onChange={(e) => setExtractedData({...extractedData, patientName: e.target.value})} />
                      </div>
                      <div>
                        <span className="lbl">Idade</span>
                        <input type="text" className="inp bg-surface" placeholder="..." value={extractedData.age} readOnly={aiActive} onChange={(e) => setExtractedData({...extractedData, age: e.target.value})} />
                      </div>
                      <div>
                        <span className="lbl">Sexo Biológico</span>
                        <input type="text" className="inp bg-surface" placeholder="..." value={extractedData.gender} readOnly={aiActive} onChange={(e) => setExtractedData({...extractedData, gender: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Clinical Extraction */}
                  <div>
                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-3 border-b border-border-subtle pb-2">Quadro Clínico</div>
                    
                    <div className="mb-4">
                      <span className="lbl">Sintomas Extraídos</span>
                      <div className="flex flex-wrap gap-2 mt-1 min-h-[40px] p-2 bg-surface border border-border-subtle rounded-lg">
                        {extractedData.symptoms.length > 0 ? (
                          extractedData.symptoms.map((sym, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md bg-danger/15 border border-danger/30 text-danger text-xs font-bold fu">
                              {sym}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-ink-secondary/50 italic p-1">Aguardando fala...</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="lbl">Comorbidades / Histórico</span>
                      <div className="flex flex-wrap gap-2 mt-1 min-h-[40px] p-2 bg-surface border border-border-subtle rounded-lg">
                        {extractedData.comorbidities.length > 0 ? (
                          extractedData.comorbidities.map((com, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md bg-warn/15 border border-warn/30 text-warn text-xs font-bold fu">
                              {com}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-ink-secondary/50 italic p-1">Aguardando fala...</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="lbl">Observações do TARM</span>
                      <textarea 
                        className="inp bg-surface min-h-[80px] resize-none mt-1" 
                        placeholder="Adicione notas contextuais para o Médico Regulador..."
                        value={extractedData.observations}
                        onChange={(e) => setExtractedData({...extractedData, observations: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Handoff CTAs (Desktop) */}
              <div className="hidden lg:flex flex-col gap-2 shrink-0">
                {handoffCTAs}
              </div>
            </div>

            {/* Center Panel: Transcription Chat */}
            <div className="flex-1 gp rounded-2xl flex flex-col lg:overflow-hidden border-l-4 border-l-ai order-2 lg:order-2 shrink-0 min-h-[400px] lg:min-h-0">
              <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ai/15 flex items-center justify-center text-ai border border-ai/30 relative overflow-hidden">
                    <Icon name="microphone-lines" className="relative z-10" />
                    {aiActive && <div className="absolute inset-0 bg-ai/20 animate-ping" style={{ animationDuration: '2s' }}></div>}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-ink-primary flex items-center gap-3">
                      Transcrição em Tempo Real
                      <AudioWaveform active={aiActive} />
                    </div>
                    <div className="text-[0.6rem] text-ai font-mono flex items-center gap-1.5 mt-0.5">
                      <Icon name="circle" className="text-[5px] animate-pulse" /> STT Engine Ativo
                    </div>
                  </div>
                </div>
                
                {/* Kill Switch */}
                <button 
                  onClick={() => setAiActive(!aiActive)}
                  className={`px-4 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border ${
                    aiActive 
                      ? 'bg-danger/10 border-danger/30 text-danger hover:bg-danger hover:text-white' 
                      : 'bg-surface border-border-subtle text-ink-secondary hover:bg-elevated'
                  }`}
                >
                  <Icon name="power-off" />
                  {aiActive ? 'Pausar IA' : 'IA Pausada'}
                </button>
              </div>

              <div className="flex-1 p-5 lg:overflow-y-auto flex flex-col gap-4 bg-surface">
                {tarmChat.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.speaker === 'TARM' ? 'items-end' : msg.speaker === 'SYS' ? 'items-center' : 'items-start'} fu`}>
                    {msg.speaker === 'SYS' ? (
                      <div className="px-4 py-1.5 rounded-full bg-surface border border-border-subtle text-[0.65rem] font-mono text-ink-secondary uppercase tracking-widest">
                        {msg.text}
                      </div>
                    ) : (
                      <div className={`max-w-[80%] flex flex-col ${msg.speaker === 'TARM' ? 'items-end' : 'items-start'}`}>
                        <div className="text-[0.6rem] font-mono text-ink-secondary mb-1 flex items-center gap-2">
                          {msg.speaker === 'TARM' ? (
                            <><span className="text-gold-500">TARM-04</span> • {msg.time}</>
                          ) : (
                            <>{msg.time} • <span className="text-ink-primary">Solicitante</span></>
                          )}
                        </div>
                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          msg.speaker === 'TARM' 
                            ? 'bg-elevated border border-border-subtle text-ink-primary rounded-tr-sm' 
                            : 'bg-ai/10 border border-ai/20 text-ink-primary rounded-tl-sm'
                        }`}>
                          <TypingMessage text={msg.text} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {!aiActive && (
                  <div className="mt-4 p-4 bg-warn/10 border border-warn/30 rounded-xl flex items-start gap-3 fu">
                    <Icon name="triangle-exclamation" className="text-warn mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-warn mb-1">Modo Manual Ativado</p>
                      <p className="text-xs text-ink-secondary leading-relaxed">
                        A transcrição e extração por IA foram pausadas. Utilize o painel acima para preencher os dados clínicos manualmente.
                      </p>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Handoff CTAs (Mobile) */}
            <div className="flex lg:hidden flex-col gap-2 shrink-0 order-3 w-full mt-2 sticky bottom-0 bg-canvas pt-2 pb-4 z-10">
              {handoffCTAs}
            </div>
          </div>
        )}
        {currentModule === 'REGULADOR' && currentCaller && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 fu min-h-0 overflow-y-auto lg:overflow-hidden pb-6 lg:pb-0">
            {/* Left Panel: Handoff Summary & Chat */}
            <div className="w-full lg:w-[300px] gp rounded-2xl flex flex-col overflow-hidden shrink-0">
              {role === 'MEDICO' && (
                <div className="border-b border-border-subtle bg-elevated/60 p-3 shrink-0">
                  <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mb-2 flex items-center gap-1.5">
                    <Icon name="list-ol" className="text-gold-500" /> Atendimentos em espera
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[...MEDICO_CASES].sort((a, b) => (a.data.risk === 'RED' ? 0 : 1) - (b.data.risk === 'RED' ? 0 : 1)).map((c, qi) => {
                      const espera = [512, 341, 129][qi] + Math.floor((time.getTime() - mountTs) / 1000);
                      const active = extractedData.protocol === c.data.protocol;
                      return (
                        <button
                          key={c.num}
                          onClick={() => {
                            const caller = MOCK_CALLERS[c.caller];
                            setCurrentCaller(caller);
                            setAmlData(caller.aml);
                            setExtractedData(c.data as any);
                            setSelectedVehicleId(null);
                            showToast(`Atendimento ${c.num} em foco`, 'info');
                          }}
                          className={`w-full p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${active ? 'bg-gold-500/10 border-gold-500' : 'bg-surface border-border-subtle hover:border-gold-500'}`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${c.data.risk === 'RED' ? 'bg-danger' : 'bg-warn'}`}></span>
                          <span className="min-w-0">
                            <span className="block text-[0.7rem] font-bold text-ink-primary truncate">{c.num} · {c.label}</span>
                            <span className="block text-[0.6rem] text-ink-tertiary truncate">{c.data.protocol}</span>
                          </span>
                          <span className={`ml-auto font-mono text-[0.6rem] shrink-0 ${c.data.risk === 'RED' ? 'text-danger font-bold' : 'text-ink-tertiary'}`}>{String(Math.floor(espera / 60)).padStart(2, '0')}:{String(espera % 60).padStart(2, '0')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Icon name="file-medical" className="text-gold-500 text-xs" />
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Handoff do TARM</span>
                </div>
                <span className={`chip ${
                  extractedData.risk === 'RED' ? 'chip-danger' :
                  extractedData.risk === 'YELLOW' ? 'chip-warn' :
                  'chip-ok'
                } text-[0.6rem]`}>{extractedData.risk}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* Patient Info */}
                <div>
                  <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-2 flex items-center justify-between">
                    Paciente
                    {extractedData.confidence.patientName > 0 && <span className="text-[0.55rem] text-ai font-mono">CONF: {(extractedData.confidence.patientName * 100).toFixed(0)}%</span>}
                  </div>
                  <div className="text-sm font-bold text-ink-primary">{extractedData.patientName || 'Desconhecido'}</div>
                  <div className="text-xs text-ink-secondary">{extractedData.age || '--'} • {extractedData.gender || '--'}</div>
                </div>
                
                {/* Clinical Picture */}
                <div>
                  <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-2 flex items-center justify-between">
                    Quadro Clínico
                    {extractedData.confidence.symptoms > 0 && <span className="text-[0.55rem] text-ai font-mono">CONF: {(extractedData.confidence.symptoms * 100).toFixed(0)}%</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {extractedData.symptoms.map((sym, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-danger/15 border border-danger/30 text-danger text-[0.65rem] font-bold">
                        {sym}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.comorbidities.map((com, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-warn/15 border border-warn/30 text-warn text-[0.65rem] font-bold">
                        {com}
                      </span>
                    ))}
                  </div>
                </div>

                {/* TARM Observations */}
                {extractedData.observations && (
                  <div>
                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-2">Notas do TARM</div>
                    <div className="p-3 bg-surface border border-border-subtle rounded-xl text-xs text-ink-primary italic">
                      "{extractedData.observations}"
                    </div>
                  </div>
                )}

                {/* Mini Chat History */}
                <div className="mt-2 pt-4 border-t border-border-subtle">
                  <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-3 flex items-center justify-between">
                    <span>Histórico da Ligação</span>
                    <button className="text-gold-500 hover:text-ink-primary transition-colors"><Icon name="expand" /></button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {tarmChat.slice(-4).map((msg, idx) => (
                      <div key={idx} className={`text-[0.65rem] ${msg.speaker === 'TARM' ? 'text-ink-secondary' : 'text-ink-primary'}`}>
                        <span className="font-bold">{msg.speaker === 'TARM' ? 'TARM:' : 'SOLICITANTE:'}</span> {msg.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Panel: Clinical Decision Support (CDS) */}
            <div className="flex-1 gp rounded-2xl flex flex-col overflow-hidden border-l-4 border-l-ai min-w-[300px]">
              <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-ai/20 flex items-center justify-center">
                    <Icon name="stethoscope" className="text-ai text-xs" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-ink-primary leading-none">Apoio à Decisão Clínica (CDS)</h2>
                    <span className="text-[0.6rem] text-ai font-mono uppercase tracking-widest">IA Analisando Protocolos</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                {/* AI Recommendation */}
                <div className="p-4 bg-ai/5 border border-ai/20 rounded-xl flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-ai/20 flex items-center justify-center shrink-0">
                    <Icon name="robot" className="text-ai" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ai mb-1 flex items-center justify-between">
                      Recomendação do Sistema
                      {extractedData.confidence.protocol > 0 && <span className="text-[0.55rem] text-ai font-mono bg-ai/10 px-1.5 py-0.5 rounded">CONF: {(extractedData.confidence.protocol * 100).toFixed(0)}%</span>}
                    </h3>
                    <p className="text-xs text-ink-primary leading-relaxed mb-3">
                      Com base nos sintomas extraídos, o protocolo sugerido é <strong>{extractedData.protocol}</strong>. Recomenda-se envio imediato de Suporte Avançado de Vida.
                    </p>
                    <div className="flex gap-3">
                      <div className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle flex items-center gap-2">
                        <span className="text-[0.65rem] text-ink-secondary uppercase tracking-widest">Prioridade</span>
                        <span className={`text-xs font-bold ${extractedData.risk === 'RED' ? 'text-danger' : extractedData.risk === 'YELLOW' ? 'text-warn' : 'text-ok'}`}>{extractedData.risk}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle flex items-center gap-2">
                        <span className="text-[0.65rem] text-ink-secondary uppercase tracking-widest">Recurso</span>
                        <span className="text-xs font-bold text-ink-primary">USA (UTI Móvel)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Protocolo de Manchester (Checklist) */}
                <div className="p-4 bg-surface border border-border-subtle rounded-xl">
                  <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-3 flex items-center gap-2">
                    <Icon name="list-check" className="text-gold-500" /> Validação do Protocolo (Manchester)
                  </h3>
                  <div className="flex flex-col gap-2">
                    {protocolSteps.map(step => (
                      <label key={step.id} className="flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border-subtle cursor-pointer hover:border-gold-500 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={step.checked} 
                          onChange={() => toggleProtocolStep(step.id)}
                          className="w-4 h-4 rounded border-border-subtle text-gold-500 focus:ring-gold-500 bg-canvas"
                        />
                        <span className={`text-sm ${step.checked ? 'text-ink-primary' : 'text-ink-secondary'}`}>{step.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Divergent Decision Justification */}
                {selectedVehicleId && selectedVehicleId !== MOCK_VEHICLES.filter(v => v.type.includes('USA'))[0]?.id && (
                  <div className="p-4 bg-surface border border-border-subtle rounded-xl shrink-0">
                    <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-3 flex items-center gap-2">
                      <Icon name="code-branch" /> Decisão Divergente
                    </h3>
                    <p className="text-xs text-ink-primary mb-3">Se a sua decisão médica for diferente da recomendação da IA, selecione a justificativa abaixo para fins de auditoria e aprendizado do sistema:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setJustification('ansiedade')}
                        className={`p-2 border rounded-lg text-xs transition-colors text-left flex items-center gap-2 ${justification === 'ansiedade' ? 'bg-gold-500/20 border-gold-500 text-ink-primary' : 'bg-elevated border-border-subtle text-ink-secondary hover:text-ink-primary hover:border-gold-500'}`}
                      >
                        <Icon name="brain" className="text-gold-500" /> Crise de Ansiedade / Pânico
                      </button>
                      <button 
                        onClick={() => setJustification('trote')}
                        className={`p-2 border rounded-lg text-xs transition-colors text-left flex items-center gap-2 ${justification === 'trote' ? 'bg-gold-500/20 border-gold-500 text-ink-primary' : 'bg-elevated border-border-subtle text-ink-secondary hover:text-ink-primary hover:border-gold-500'}`}
                      >
                        <Icon name="mask" className="text-gold-500" /> Suspeita de Trote
                      </button>
                      <button 
                        onClick={() => setJustification('gravidade')}
                        className={`p-2 border rounded-lg text-xs transition-colors text-left flex items-center gap-2 ${justification === 'gravidade' ? 'bg-gold-500/20 border-gold-500 text-ink-primary' : 'bg-elevated border-border-subtle text-ink-secondary hover:text-ink-primary hover:border-gold-500'}`}
                      >
                        <Icon name="scale-unbalanced" className="text-gold-500" /> Gravidade Superestimada pela IA
                      </button>
                      <button 
                        onClick={() => setJustification('recurso')}
                        className={`p-2 border rounded-lg text-xs transition-colors text-left flex items-center gap-2 ${justification === 'recurso' ? 'bg-gold-500/20 border-gold-500 text-ink-primary' : 'bg-elevated border-border-subtle text-ink-secondary hover:text-ink-primary hover:border-gold-500'}`}
                      >
                        <Icon name="truck-medical" className="text-gold-500" /> Recurso Ideal Indisponível (Downgrade)
                      </button>
                    </div>
                  </div>
                )}

                {/* Pre-arrival Instructions */}
                <div>
                  <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-3">Instruções Pré-Chegada (Ler para o Solicitante)</h3>
                  <div className="flex flex-col gap-2">
                    <div className="p-3 bg-surface border border-border-subtle rounded-xl flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-elevated border border-border-subtle flex items-center justify-center text-[0.6rem] font-bold text-gold-500 shrink-0">1</div>
                      <p className="text-sm text-ink-primary">Mantenha a vítima em repouso absoluto, de preferência sentada ou semi-sentada se estiver consciente.</p>
                    </div>
                    <div className="p-3 bg-surface border border-border-subtle rounded-xl flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-elevated border border-border-subtle flex items-center justify-center text-[0.6rem] font-bold text-gold-500 shrink-0">2</div>
                      <p className="text-sm text-ink-primary">Afrouxe roupas apertadas, cintos e colarinhos para facilitar a respiração.</p>
                    </div>
                    <div className="p-3 bg-surface border border-border-subtle rounded-xl flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-elevated border border-border-subtle flex items-center justify-center text-[0.6rem] font-bold text-gold-500 shrink-0">3</div>
                      <p className="text-sm text-ink-primary">Se ele usar algum remédio para o coração (como AAS ou isordil) e estiver acordado, pode ajudar a tomar.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Resource Map & Dispatch */}
            <div className="w-full lg:w-[300px] flex flex-col gap-4 shrink-0">
              <div className="gp rounded-2xl flex flex-col overflow-hidden flex-1">
                <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Icon name="truck-medical" className="text-gold-500 text-xs" />
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Recursos & Despacho</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {/* Map Placeholder */}
                  <div className="h-32 rounded-xl bg-surface border border-border-subtle relative overflow-hidden flex items-center justify-center">
                    {MapIframe || (
                      <>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #BF9A3D 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                        <Icon name="map-location-dot" className="text-3xl text-ink-secondary/30" />
                      </>
                    )}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.35)]"></div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-canvas/80 backdrop-blur rounded text-[0.6rem] font-mono text-gold-500 border border-border-subtle z-10">
                      Distância: 4.2km
                    </div>
                  </div>

                  {/* Vehicles List */}
                  <div>
                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-3 flex items-center justify-between">
                      Viaturas Recomendadas
                      <span className="text-[0.55rem] text-ok flex items-center gap-1"><Icon name="circle" className="text-[4px] animate-pulse" /> LIVE</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {recommendedVehicles.map((v, i) => {
                        const isRecommended = i === 0;
                        const isSelected = selectedVehicleId === v.id || (selectedVehicleId === null && isRecommended);
                        return (
                        <div 
                          key={v.id} 
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'bg-gold-500/10 border-gold-500 shadow-[0_0_15px_rgba(191,154,61,0.2)]' : 'bg-surface border-border-subtle hover:border-ink-secondary'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full bg-${v.color}`}></div>
                            <div>
                              <div className="text-xs font-bold text-ink-primary">{v.id}</div>
                              <div className="text-[0.6rem] text-ink-secondary">{v.type}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-gold-500">ETA {v.eta} min</div>
                            <div className="text-[0.6rem] text-ink-secondary">{v.base}</div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                </div>
              </div>

              {/* Despacho designado pelo sistema após a regulação */}
              <div className="p-3 rounded-xl bg-ai/5 border border-ai/30 text-[0.7rem] text-ink-secondary flex items-start gap-2 shrink-0">
                <Icon name="robot" className="text-ai mt-0.5" />
                <span><b className="text-ai">Designação automática:</b> concluída a regulação, o sistema aciona {recommendedVehicles[0]?.id || 'USA-01'} (melhor ETA × gravidade). Você pode alterar a viatura ao lado ou permanecer na linha com o solicitante.</span>
              </div>
              <button 
                onClick={() => {
                  setIsDispatching(true);
                  const codigo = selectedVehicleId || recommendedVehicles[0]?.id || 'USA-01';
                  if (connected && occId) {
                    supabase.from('ocorrencias').update({
                      risco_final: extractedData.risk === 'PENDING' ? 'YELLOW' : extractedData.risk,
                      regulador_id: role === 'MEDICO' ? authUserId : null,
                    }).eq('id', occId).then();
                    const vid = vehicleIds[codigo];
                    if (vid) {
                      supabase.from('despachos')
                        .insert({ tenant_id: TENANT_ID, ocorrencia_id: occId, viatura_id: vid })
                        .select('id').single()
                        .then(({ data }) => { if (data) setDispatchId(data.id); });
                    }
                    audit('DESPACHO_CONFIRMADO', { viatura: codigo, risco: extractedData.risk });
                  }
                  setTimeout(() => {
                    setIsDispatching(false);
                    setIncomingCall(false);
                    showToast('Viatura acionada e despachada com sucesso!', 'success');
                    setCurrentModule('VIATURA');
                  }, 800);
                }}
                disabled={isDispatching}
                className="w-full py-4 px-3 bg-gradient-to-r from-danger to-danger/80 text-white font-extrabold font-sans uppercase tracking-wider text-xs md:text-sm rounded-xl shadow-[0_0_30px_rgba(229,57,53,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shrink-0 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isDispatching ? (
                  <><Icon name="circle-notch" className="animate-spin text-lg" /> Acionando...</>
                ) : (
                  <><Icon name="truck-fast" className="text-base shrink-0" /> <span className="truncate">Confirmar Despacho · {selectedVehicleId || recommendedVehicles[0]?.id || 'USA-01'}</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {currentModule === 'VIATURA' && currentCaller && (
          <div className="flex-1 flex flex-col fu min-h-0 -m-4 md:-m-5 overflow-hidden">
            {/* 3 zonas: rota (60%) · paciente (40%) · barra de missão */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">

              {/* ZONA ROTA */}
              <div className="relative flex-[3] min-h-[260px] bg-elevated">
                {RouteMapIframe || MapIframe || (
                  <div className="w-full h-full flex items-center justify-center text-ink-secondary">Sem dados de localização</div>
                )}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]"></div>

                {/* Navegação no app de mapas do tablet */}
                {amlData && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${amlData.lat},${amlData.lng}&travelmode=driving&dir_action=navigate`}
                    target="_blank"
                    rel="noopener"
                    className="absolute top-4 right-4 z-10 px-4 py-3 min-h-[48px] rounded-xl bg-gold-500 text-ink-inverse text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(191,154,61,0.4)] hover:bg-gold-300 transition-colors whitespace-nowrap"
                  >
                    <Icon name="location-arrow" /> Iniciar navegação
                  </a>
                )}
                {/* ETA gigante */}
                <div className="absolute top-4 left-4 bg-canvas/90 backdrop-blur-md border border-border-subtle px-5 py-3 rounded-xl shadow-2xl z-10">
                  <div className="flex items-end gap-3">
                    <div>
                      <div className="text-4xl font-mono font-medium text-ok leading-none">08<span className="text-base">min</span></div>
                      <div className="text-[0.55rem] text-ink-secondary uppercase tracking-widest mt-1">ETA · 4.2 km</div>
                    </div>
                    <div className="w-px h-10 bg-hover"></div>
                    <div className="pb-0.5">
                      <div className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                        <Icon name={selectedVehicleId?.includes('MOT') ? 'motorcycle' : 'truck-medical'} className="text-gold-500" /> {selectedVehicleId || 'USA-01'}
                      </div>
                      <div className="text-[0.55rem] font-mono text-ink-secondary mt-1">68 km/h · GPS ±2.5m · 5G</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ZONA PACIENTE */}
              <div className="flex-[2] bg-surface border-t lg:border-t-0 lg:border-l border-border-subtle flex flex-col overflow-y-auto">
                <div className={`px-5 py-4 flex items-center justify-between border-b border-border-subtle ${
                  extractedData.risk === 'RED' ? 'bg-danger/10' : extractedData.risk === 'YELLOW' ? 'bg-warn/10' : 'bg-ok/10'
                }`}>
                  <div>
                    <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-secondary mb-1">Classificação Manchester</div>
                    <div className={`text-2xl font-disp font-bold ${
                      extractedData.risk === 'RED' ? 'text-danger' : extractedData.risk === 'YELLOW' ? 'text-warn' : 'text-ok'
                    }`}>
                      {extractedData.risk === 'RED' ? 'VERMELHO' : extractedData.risk === 'YELLOW' ? 'AMARELO' : 'VERDE'}
                    </div>
                  </div>
                  <div className={`w-14 h-14 rounded-full border-4 ${
                    extractedData.risk === 'RED' ? 'border-danger bg-danger/20' : extractedData.risk === 'YELLOW' ? 'border-warn bg-warn/20' : 'border-ok bg-ok/20'
                  }`}></div>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mb-1">Paciente</div>
                    <div className="text-lg font-bold text-ink-primary">{extractedData.patientName || 'Desconhecido'}</div>
                    <div className="text-sm text-ink-secondary font-mono">{extractedData.age || '--'} · {extractedData.gender || '--'}</div>
                  </div>
                  <div>
                    <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mb-1">Suspeita / Protocolo</div>
                    <div className="text-base font-bold text-danger">{extractedData.protocol}</div>
                  </div>
                  <div>
                    <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mb-1.5">Queixa relatada</div>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedData.symptoms.map((sym, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-danger/10 border border-danger/20 text-danger text-xs">{sym}</span>
                      ))}
                    </div>
                  </div>
                  {extractedData.comorbidities.length > 0 && (
                    <div>
                      <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mb-1.5">Comorbidades</div>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedData.comorbidities.map((c, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-elevated border border-border-default text-ink-secondary text-xs">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mb-1">Local</div>
                    <div className="text-sm font-bold text-ink-primary">{amlData?.address || 'Endereço não disponível'}, {amlData?.number}</div>
                    <div className="text-xs text-ink-secondary">{amlData?.neighborhood} - {amlData?.city}</div>
                  </div>
<div className="p-3 rounded-xl bg-elevated border border-border-subtle text-[0.7rem] text-ink-tertiary">
                    Para apoio médico adicional, contate a CRU pelo rádio — o CoPilot acompanha de forma passiva.
                  </div>
                </div>
              </div>
            </div>

            {/* BARRA DE MISSÃO — status de 1 toque, alvos grandes (luva), alimenta T0–T4 */}
            {missionStatus === 'NO HOSPITAL' ? (
              <div className="shrink-0 bg-canvas border-t border-border-subtle p-3 pb-14 md:pb-16">
                <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mb-2 text-center">Desfecho do atendimento · 1 toque encerra e registra</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {([
                    { d: 'TRANSPORTADO', cls: 'bg-ok/15 border-ok/50 text-ok hover:bg-ok/25' },
                    { d: 'ORIENTAÇÃO', cls: 'bg-info/10 border-info/40 text-info hover:bg-info/20' },
                    { d: 'RECUSA', cls: 'bg-warn/10 border-warn/40 text-warn hover:bg-warn/20' },
                    { d: 'ÓBITO NO LOCAL', cls: 'bg-danger/10 border-danger/40 text-danger hover:bg-danger/20' },
                  ] as const).map(o => (
                    <button
                      key={o.d}
                      onClick={() => encerrarAtendimento(o.d)}
                      className={`min-h-[60px] rounded-xl border font-bold uppercase tracking-wider text-[0.65rem] md:text-xs flex items-center justify-center gap-2 transition-colors px-2 ${o.cls}`}
                    >
                      <Icon name="check-double" /> <span className="truncate">{o.d}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
            <div className="shrink-0 bg-canvas border-t border-border-subtle p-3 pb-14 md:pb-16 grid grid-cols-4 gap-2">
              {MISSION_STEPS.map((step, i) => {
                const stateIdx = MISSION_STEPS.indexOf(missionStatus);
                const isDone = i < stateIdx;
                const isCurrent = i === stateIdx;
                return (
                  <button
                    key={step}
                    onClick={() => {
                      setMissionStatus(step);
                      const col = ({ 'A CAMINHO': 't1_a_caminho', 'NO LOCAL': 't2_no_local', 'TRANSPORTANDO': 't3_transportando', 'NO HOSPITAL': 't4_no_hospital' } as Record<string, string>)[step];
                      if (connected && dispatchId && col) supabase.from('despachos').update({ [col]: new Date().toISOString() }).eq('id', dispatchId).then();
                      audit(`MISSAO_${step.replace(/ /g, '_')}`, { viatura: selectedVehicleId });
                      playSound('vehicle', soundEnabledRef.current);
                      showToast(`${selectedVehicleId || 'USA-01'} → ${step} · ${new Date().toLocaleTimeString('pt-BR')}`, 'success');
                    }}
                    className={`min-h-[60px] rounded-xl text-[0.65rem] md:text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 border ${
                      isCurrent
                        ? 'bg-gold-500 text-ink-inverse border-gold-500 shadow-[0_0_20px_rgba(191,154,61,0.4)]'
                        : isDone
                          ? 'bg-ok/15 text-ok border-ok/40'
                          : 'bg-elevated text-ink-secondary border-border-subtle hover:border-gold-500'
                    }`}
                  >
                    {isDone && <Icon name="circle-check" />}
                    {step}
                  </button>
                );
              })}
            </div>
            )}
          </div>
        )}
        {showEscala && (() => {
          const weekStart = addDays(startOfWeek(new Date()), myWeek * 7);
          const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
          const todayIso = isoDate(new Date());
          const own = roster[operatorId] || {};
          const plantoes = days.filter(d => { const t = own[isoDate(d)]; return t && t !== 'FOLGA'; }).length;
          return (
          <div className="fixed inset-0 z-[700] bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEscala(false)}>
          <div className="bg-surface border border-border-default rounded-xl shadow-2xl max-w-5xl w-full max-h-[88vh] overflow-y-auto p-6 flex flex-col gap-6 fu" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="eyebrow mb-1">{operatorId} · {operatorName.toUpperCase()}{connected ? ' · BACKEND ATIVO' : ' · DEMO'}</div>
                <h2 className="text-2xl font-disp font-bold text-ink-primary flex items-center gap-3">
                  <Icon name="calendar" className="text-gold-500" /> Minha Escala
                </h2>
                <p className="text-sm text-ink-secondary">Escala designada pela coordenação · consulta até 1 mês à frente</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setMyWeek(w => Math.max(0, w - 1))} disabled={myWeek === 0} aria-label="Semana anterior" className="w-9 h-9 rounded-md bg-elevated border border-border-subtle text-ink-secondary hover:border-gold-500 hover:text-gold-300 disabled:opacity-30 flex items-center justify-center">
                  <Icon name="chevron-left" />
                </button>
                <span className="font-mono text-xs text-ink-primary min-w-[170px] text-center">
                  {days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} – {days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{myWeek === 0 ? ' · atual' : ''}
                </span>
                <button onClick={() => setMyWeek(w => Math.min(MAX_WEEKS_AHEAD, w + 1))} disabled={myWeek === MAX_WEEKS_AHEAD} aria-label="Semana seguinte" className="w-9 h-9 rounded-md bg-elevated border border-border-subtle text-ink-secondary hover:border-gold-500 hover:text-gold-300 disabled:opacity-30 flex items-center justify-center">
                  <Icon name="chevron-right" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
              {days.map((d, i) => {
                const dia = isoDate(d);
                const turno = own[dia];
                const info = turno ? TURNO_BADGE[turno] : null;
                const isToday = dia === todayIso;
                const off = !turno || turno === 'FOLGA';
                return (
                  <div key={dia} className={`card-data p-4 flex flex-col gap-2 ${isToday ? 'border-gold-500 shadow-[0_0_20px_rgba(191,154,61,0.15)]' : ''} ${off ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">{WEEKDAYS[i]}</span>
                      <span className="font-mono text-[0.65rem] text-ink-tertiary">{d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    <div className={`text-sm font-bold ${off ? 'text-ink-secondary' : 'text-gold-500'}`}>{info ? info.full : 'Sem escala'}</div>
                    <div className="font-mono text-[0.7rem] text-ink-secondary">{info ? info.hours : '—'}</div>
                    <div className="text-[0.65rem] text-ink-tertiary">{turno && turno !== 'FOLGA' ? 'CRU Central' : '—'}</div>
                    {isToday && <span className="chip chip-ok text-[0.55rem] w-fit mt-1">HOJE</span>}
                  </div>
                );
              })}
            </div>
            <div className="gp p-4 rounded-2xl flex flex-wrap items-center gap-4">
              <span className="chip chip-nude text-[0.65rem]">{plantoes} plantões na semana</span>
              <span className="text-[0.7rem] text-ink-tertiary">Trocas de plantão são solicitadas à coordenação e aparecem aqui após aprovação do Gestor.</span>
              <button onClick={() => setShowEscala(false)} className="ml-auto px-4 py-2 rounded-md bg-elevated border border-border-default text-xs font-bold text-ink-primary hover:border-gold-500">Fechar</button>
            </div>
          </div>
          </div>
          );
        })()}
        {currentModule === 'GESTOR' && (
          <div className="flex-1 flex flex-col gap-6 fu overflow-y-auto pb-6 pr-2 -mr-2 lg:pr-0 lg:mr-0">
            <div>
              <div className="eyebrow mb-1">CRU SÃO PAULO · TENANT DEMO</div>
              <h2 className="text-2xl font-disp font-bold text-ink-primary flex items-center gap-3">
                <Icon name="list-check" className="text-gold-500" /> Gestão da Operação
              </h2>
              <p className="text-sm text-ink-secondary">Frota, equipe, escala e manutenção — visão sem dados de paciente (PII)</p>
            </div>

            {/* KPIs derivados do estado vivo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-data p-5">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">Viaturas disponíveis</div>
                <div className="text-4xl font-mono font-medium text-ok">{vehicles.filter(v => v.status === 'DISPONÍVEL').length}</div>
              </div>
              <div className="card-data p-5">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">Em atendimento</div>
                <div className="text-4xl font-mono font-medium text-danger">{vehicles.filter(v => v.status === 'EM ATENDIMENTO').length}</div>
              </div>
              <div className="card-data p-5">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">Em manutenção</div>
                <div className="text-4xl font-mono font-medium text-warn">{vehicles.filter(v => v.status === 'MANUTENÇÃO').length}</div>
              </div>
              <div className="card-data p-5">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">Equipe em plantão</div>
                <div className="text-4xl font-mono font-medium text-gold-500">{team.filter(m => { const t = (roster[m.id] || {})[isoDate(new Date())]; return t && t !== 'FOLGA'; }).length}<span className="text-base text-ink-tertiary">/{team.length}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Mapa geral da frota */}
              <div className="gp rounded-2xl overflow-hidden lg:col-span-2 min-h-[320px] relative">
                <div className="absolute top-3 left-3 z-10 bg-canvas/90 backdrop-blur px-3 py-1.5 rounded-lg border border-border-subtle text-[0.65rem] font-mono uppercase tracking-widest text-ink-secondary">Posicionamento da frota</div>
                {IdleMapIframe}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]"></div>
                {FleetMarkers}
              </div>
              {/* Acessos focados — uma tarefa por tela */}
              <div className="flex flex-col gap-4">
                {([
                  { mod: 'DASHBOARD', icon: 'chart-simple', title: 'Dashboard', desc: 'Métricas, SLA e BI da operação' },
                  { mod: 'FROTA', icon: 'truck-medical', title: 'Frota', desc: 'Status e manutenção das viaturas' },
                  { mod: 'ESCALAS', icon: 'calendar', title: 'Escalas', desc: 'Equipe — até 1 mês à frente' },
                ] as const).map(c => (
                  <button key={c.mod} onClick={() => setCurrentModule(c.mod)} className="card-data p-5 text-left hover:border-gold-500 transition-colors flex items-center gap-4 flex-1">
                    <div className="w-11 h-11 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-500 flex items-center justify-center text-xl shrink-0">
                      <Icon name={c.icon} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-disp font-bold text-ink-primary">{c.title}</div>
                      <div className="text-xs text-ink-secondary">{c.desc}</div>
                    </div>
                    <Icon name="chevron-right" className="ml-auto text-ink-tertiary" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {currentModule === 'FROTA' && (
          <div className="flex-1 flex flex-col gap-6 fu overflow-y-auto pb-6 pr-2 -mr-2 lg:pr-0 lg:mr-0">
            <div>
              <div className="eyebrow mb-1">CRU SÃO PAULO · GESTÃO</div>
              <h2 className="text-2xl font-disp font-bold text-ink-primary flex items-center gap-3">
                <Icon name="truck-medical" className="text-gold-500" /> Frota
              </h2>
              <p className="text-sm text-ink-secondary">Status e manutenção — alterações refletem em toda a operação</p>
            </div>
            <div className="max-w-3xl">
              {/* Frota: status editável + manutenção programada */}
              <div className="gp p-5 rounded-2xl">
                <div className="text-xs font-bold text-ink-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Icon name="truck-medical" className="text-gold-500" /> Frota — status e manutenção
                </div>
                <div className="flex flex-col gap-3">
                  {vehicles.map(v => (
                    <div key={v.id} className="p-3 rounded-xl bg-elevated border border-border-subtle flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <Icon name={v.type.includes('MOTOLÂNCIA') ? 'motorcycle' : 'truck-medical'} className={`text-${v.color === 'nude' ? 'ink-secondary' : v.color}`} />
                        <div>
                          <div className="text-sm font-bold text-ink-primary">{v.id}</div>
                          <div className="text-[0.65rem] text-ink-secondary">{v.type} · {v.base}</div>
                        </div>
                      </div>
                      <select
                        value={v.status}
                        onChange={(e) => {
                          const status = e.target.value;
                          setVehicles(prev => prev.map(x => x.id === v.id ? { ...x, status, color: VEHICLE_STATUS_COLOR[status] || 'nude' } : x));
                          if (connected) supabase.from('viaturas').update({ status: VEHICLE_STATUS_UI_TO_DB[status] }).eq('codigo', v.id).then();
                          showToast(`${v.id} → ${status}`, 'success');
                        }}
                        className="inp !w-auto text-xs font-bold py-1.5"
                        aria-label={`Status da viatura ${v.id}`}
                      >
                        {['DISPONÍVEL', 'EM ATENDIMENTO', 'RETORNO', 'MANUTENÇÃO'].map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                      <div className="flex items-center gap-2 ml-auto">
                        <label className="text-[0.6rem] text-ink-secondary uppercase tracking-widest" htmlFor={`maint-${v.id}`}>Manutenção</label>
                        <input
                          id={`maint-${v.id}`}
                          type="date"
                          value={maintSchedule[v.id] || ''}
                          onChange={(e) => {
                            setMaintSchedule(prev => ({ ...prev, [v.id]: e.target.value }));
                            if (connected) supabase.from('viaturas').update({ manutencao_prevista: e.target.value || null }).eq('codigo', v.id).then();
                            if (e.target.value) showToast(`Manutenção de ${v.id} programada para ${new Date(e.target.value + 'T12:00').toLocaleDateString('pt-BR')}`, 'info');
                          }}
                          className="inp !w-auto text-xs py-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {currentModule === 'ESCALAS' && (
          <div className="flex-1 flex flex-col gap-6 fu overflow-y-auto pb-6 pr-2 -mr-2 lg:pr-0 lg:mr-0">
            <div>
              <div className="eyebrow mb-1">CRU SÃO PAULO · GESTÃO</div>
              <h2 className="text-2xl font-disp font-bold text-ink-primary flex items-center gap-3">
                <Icon name="calendar" className="text-gold-500" /> Escalas da equipe
              </h2>
              <p className="text-sm text-ink-secondary">Criação, conferência e alteração — semana atual até 1 mês à frente</p>
            </div>
              {/* Planner de escalas — semana navegável, edição de 1 clique */}
              <div className="gp p-5 rounded-2xl xl:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                  <div className="text-xs font-bold text-ink-primary uppercase tracking-widest flex items-center gap-2">
                    <Icon name="calendar" className="text-gold-500" /> Escalas da equipe
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGWeek(w => Math.max(0, w - 1))} disabled={gWeek === 0} aria-label="Semana anterior" className="w-8 h-8 rounded-md bg-elevated border border-border-subtle text-ink-secondary hover:border-gold-500 hover:text-gold-300 disabled:opacity-30 flex items-center justify-center">
                      <Icon name="chevron-left" />
                    </button>
                    <span className="font-mono text-xs text-ink-primary min-w-[160px] text-center">
                      {addDays(startOfWeek(new Date()), gWeek * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} – {addDays(startOfWeek(new Date()), gWeek * 7 + 6).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{gWeek === 0 ? ' · atual' : ''}
                    </span>
                    <button onClick={() => setGWeek(w => Math.min(MAX_WEEKS_AHEAD, w + 1))} disabled={gWeek === MAX_WEEKS_AHEAD} aria-label="Semana seguinte" className="w-8 h-8 rounded-md bg-elevated border border-border-subtle text-ink-secondary hover:border-gold-500 hover:text-gold-300 disabled:opacity-30 flex items-center justify-center">
                      <Icon name="chevron-right" />
                    </button>
                  </div>
                </div>
                <p className="text-[0.7rem] text-ink-tertiary mb-4">Clique na célula para definir o turno (Diurno → Noturno → Folga → vazio) · criação e edição até 1 mês à frente · cada colaborador vê a própria escala no menu Escala</p>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate" style={{ borderSpacing: '4px' }}>
                    <thead>
                      <tr>
                        <th className="text-left text-[0.65rem] font-mono uppercase tracking-widest text-ink-tertiary pb-1 pr-2 min-w-[150px]">Colaborador</th>
                        {Array.from({ length: 7 }, (_, i) => {
                          const d = addDays(startOfWeek(new Date()), gWeek * 7 + i);
                          const isToday = isoDate(d) === isoDate(new Date());
                          return (
                            <th key={i} className={`text-center text-[0.65rem] font-mono uppercase tracking-widest pb-1 ${isToday ? 'text-gold-300' : 'text-ink-tertiary'}`}>
                              {WEEKDAYS[i]}<br /><span className="text-[0.6rem]">{d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {team.map(m => (
                        <tr key={m.id}>
                          <td className="pr-2 py-1">
                            <div className="text-xs font-bold text-ink-primary leading-tight">{m.name}</div>
                            <div className="text-[0.6rem] text-ink-tertiary">{m.role} · <span className="font-mono">{m.id}</span>{connected && !userIds[m.id] ? ' · local' : ''}</div>
                          </td>
                          {Array.from({ length: 7 }, (_, i) => {
                            const d = addDays(startOfWeek(new Date()), gWeek * 7 + i);
                            const dia = isoDate(d);
                            const turno = (roster[m.id] || {})[dia] || null;
                            const info = turno ? TURNO_BADGE[turno] : null;
                            const isToday = dia === isoDate(new Date());
                            const next = () => {
                              const idx = turno ? TURNO_CYCLE.indexOf(turno) : -1;
                              const nx = idx === -1 ? TURNO_CYCLE[0] : (idx + 1 < TURNO_CYCLE.length ? TURNO_CYCLE[idx + 1] : null);
                              setShift(m.id, dia, nx);
                            };
                            return (
                              <td key={dia} className="text-center">
                                <button
                                  onClick={next}
                                  title={`${m.name} · ${d.toLocaleDateString('pt-BR')} · ${info ? info.full : 'sem escala'}`}
                                  aria-label={`Turno de ${m.name} em ${d.toLocaleDateString('pt-BR')}`}
                                  className={`w-full min-w-[40px] h-9 rounded-md border font-mono text-xs font-bold transition-colors ${info ? info.cls : 'bg-transparent border-dashed border-border-default text-ink-disabled hover:border-gold-500'} ${isToday ? 'ring-1 ring-gold-500/60' : ''}`}
                                >
                                  {info ? info.label : '·'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  {Object.entries(TURNO_BADGE).map(([k, v]) => (
                    <span key={k} className={`px-2 py-0.5 rounded border font-mono text-[0.6rem] ${v.cls}`}>{v.label} · {v.full}</span>
                  ))}
                </div>
              </div>
          </div>
        )}
        {currentModule === 'DASHBOARD' && (
          <div className="flex-1 flex flex-col gap-6 fu overflow-y-auto pb-6 pr-2 -mr-2 lg:pr-0 lg:mr-0">
            {/* Cabeçalho só na impressão — subsídio ao relatório semestral do MS */}
            <div className="hidden print:block">
              <div className="text-xl font-bold">Samais CoPilot OS — Relatório de Indicadores Operacionais</div>
              <div className="text-xs mt-1">Subsídio ao relatório semestral de indicadores (Portaria GM/MS nº 1.010/2012) · {selectedBase} · período: {selectedPeriod} · emitido em {new Date().toLocaleDateString('pt-BR')}</div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-disp font-bold text-ink-primary flex items-center gap-3">
                  <Icon name="chart-simple" className="text-gold-500" /> Relatório Operacional & BI
                </h2>
                <p className="text-sm text-ink-secondary">Central 192 · Métricas de performance e assertividade do Co-piloto</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <div 
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="bg-elevated border border-border-subtle rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-surface transition-colors"
                  >
                    <span className="text-xs font-bold text-ink-primary">{selectedPeriod}</span>
                    <Icon name="chevron-down" className="text-ink-secondary text-[0.6rem]" />
                  </div>
                  
                  {showDatePicker && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-canvas border border-border-subtle rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-3 border-b border-border-subtle bg-elevated">
                        <div className="text-xs font-bold text-ink-primary mb-2">Período</div>
                        <div className="grid grid-cols-2 gap-2">
                          {['7 dias', '14 dias', '21 dias', '28 dias', '30 dias', '60 dias', '90 dias', 'Personalizado'].map(p => (
                            <button 
                              key={p}
                              onClick={() => { setSelectedPeriod(p); setShowDatePicker(false); }}
                              className="px-2 py-1.5 text-[0.65rem] font-bold rounded bg-surface border border-border-subtle text-ink-secondary hover:text-ink-primary hover:border-gold-500 transition-colors"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Icon name="chevron-left" className="text-ink-secondary text-[0.6rem] cursor-pointer hover:text-ink-primary" />
                          <span className="text-xs font-bold text-ink-primary">Abril 2026</span>
                          <Icon name="chevron-right" className="text-ink-secondary text-[0.6rem] cursor-pointer hover:text-ink-primary" />
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                          {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="text-[0.6rem] text-ink-secondary font-bold">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {Array.from({length: 30}).map((_, i) => (
                            <div key={i} className={`text-[0.65rem] py-1 rounded cursor-pointer ${i === 6 ? 'bg-gold-500 text-ink-inverse font-bold' : 'text-ink-primary hover:bg-elevated'}`}>
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <select
                  value={selectedBase}
                  onChange={(e) => setSelectedBase(e.target.value)}
                  className="inp !w-auto text-xs font-bold py-2"
                  aria-label="Filtrar por base"
                >
                  {Object.keys(BASE_FACTOR).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-surface border border-border-subtle text-xs font-bold text-ink-primary hover:bg-elevated transition-colors flex items-center gap-2">
                  <Icon name="file-pdf" className="text-ink-secondary" /> Exportar PDF
                </button>
              </div>
            </div>

            {/* LGPD Banner */}
            <div className="gp p-4 rounded-2xl border border-ok/20 bg-ok/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-ok/10 flex items-center justify-center shrink-0">
                <Icon name="lock" className="text-ok text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-ok uppercase tracking-widest mb-1">DESENHO LGPD-FIRST (LEI 13.709/2018)</div>
                <div className="text-[0.65rem] text-ok/70 truncate">Este painel exibe apenas dados agregados, sem informação pessoal do paciente. Trilha de auditoria append-only por usuário; encadeamento criptográfico dos registros em homologação.</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="px-2 py-1 rounded border border-ok/30 text-[0.65rem] font-bold text-ok mb-1">Rastreável</div>
                <div className="text-[0.55rem] text-ok/50 uppercase tracking-widest">AUDITORIA · PERFIS · RLS</div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="gp p-5 rounded-2xl border-l-4 border-l-ink-secondary">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">CHAMADAS RECEBIDAS</div>
                <div className="text-4xl font-disp font-bold text-ink-primary mb-2">{(realStats?.chamadas ?? Math.round(1432 * bf)).toLocaleString('pt-BR')}</div>
                <div className="text-xs text-ok"><Icon name="arrow-trend-up" /> {realStats ? 'dados reais do backend' : '+5% vs período anterior'}</div>
              </div>
              <div className="gp p-5 rounded-2xl border-l-4 border-l-gold-500 relative overflow-hidden">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">TROTES FILTRADOS (SCORE IA)</div>
                <div className="text-4xl font-disp font-bold text-gold-500 mb-2">{Math.round(118 * bf)}</div>
                <div className="text-xs text-gold-500/70">8,2% do total · faixa nacional 5,8–9,7%</div>
                <div className="absolute bottom-4 right-4 px-2 py-1 rounded bg-gold-500/10 border border-gold-500/30 text-xs font-mono font-bold text-gold-500">R$ 38k</div>
              </div>
              <div className="gp p-5 rounded-2xl border-l-4 border-l-ok">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">T. MÉDIO REGULAÇÃO</div>
                <div className="text-4xl font-disp font-bold text-ok mb-2">1m 12s</div>
                <div className="text-xs text-ok/70"><Icon name="arrow-trend-down" /> -45s vs Média Nac.</div>
              </div>
              <div className="gp p-5 rounded-2xl border-l-4 border-l-danger">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">DESPACHOS USA (VERMELHO)</div>
                <div className="text-4xl font-disp font-bold text-danger mb-2">{Math.round(94 * bf)}</div>
                <div className="text-xs text-ink-secondary">Meta de acurácia da classificação: <span className="text-ok">&ge;90%</span> · critério de go-live</div>
              </div>
            </div>

            {/* Indicadores operacionais de CRU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-data p-5">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">T. RESPOSTA MÉDIO (T0→T2)</div>
                <div className="text-4xl font-mono font-medium text-ink-primary mb-1">
                  {realStats?.tRespostaSeg
                    ? `${Math.floor(realStats.tRespostaSeg / 60)}m ${String(realStats.tRespostaSeg % 60).padStart(2, '0')}s`
                    : '14m 06s'}
                </div>
                <div className="text-xs text-ink-tertiary">do despacho à chegada à cena{realStats?.tRespostaSeg ? ' · real' : ' · demonstração'}</div>
              </div>
              <div className="card-data p-5">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">OCUPAÇÃO DA FROTA</div>
                <div className="text-4xl font-mono font-medium text-gold-500 mb-1">
                  {vehicles.length ? Math.round((vehicles.filter(v => v.status === 'EM ATENDIMENTO').length / vehicles.length) * 100) : 0}%
                </div>
                <div className="text-xs text-ink-tertiary">viaturas em missão agora · ao vivo</div>
              </div>
              <div className="card-data p-5">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">CHAMADAS ABANDONADAS</div>
                <div className="text-4xl font-mono font-medium text-warn mb-1">4,1%</div>
                <div className="text-xs text-ink-tertiary">desligaram antes do atendimento · sinalização do PABX</div>
              </div>
            </div>

            {/* Charts — um eixo por gráfico; série única nomeada no título (dataviz: nunca dual-axis) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[320px]">
              <div className="gp p-5 rounded-2xl flex flex-col min-h-[280px]">
                <div className="text-xs font-bold text-ink-primary uppercase tracking-widest">VOLUME DE CHAMADAS</div>
                <div className="text-[0.6rem] font-mono text-ink-tertiary uppercase tracking-widest mb-4">por faixa horária · hoje</div>
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={HOURLY_STATS.map(h => ({ ...h, volume: Math.round(h.volume * bf) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                      <XAxis dataKey="time" stroke={chartTheme.axis} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke={chartTheme.axis} fontSize={10} tickLine={false} axisLine={false} width={30} />
                      <Tooltip
                        cursor={{ fill: chartTheme.grid, opacity: 0.35 }}
                        contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px', color: chartTheme.tooltipText }}
                        labelStyle={{ fontSize: '12px', color: chartTheme.axis, marginBottom: '4px' }}
                      />
                      <Bar dataKey="volume" name="Chamadas" fill={chartTheme.serieGold} radius={[4, 4, 0, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="gp p-5 rounded-2xl flex flex-col min-h-[280px]">
                <div className="text-xs font-bold text-ink-primary uppercase tracking-widest">TEMPO MÉDIO DE RESPOSTA</div>
                <div className="text-[0.6rem] font-mono text-ink-tertiary uppercase tracking-widest mb-4">minutos · por faixa horária</div>
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={HOURLY_STATS}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                      <XAxis dataKey="time" stroke={chartTheme.axis} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke={chartTheme.axis} fontSize={10} tickLine={false} axisLine={false} width={30} unit="m" />
                      <Tooltip
                        contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px', color: chartTheme.tooltipText }}
                        labelStyle={{ fontSize: '12px', color: chartTheme.axis, marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="resposta" name="T. resposta (min)" stroke={chartTheme.serieInfo} strokeWidth={2} dot={{ r: 3, fill: chartTheme.serieInfo }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="gp p-5 rounded-2xl flex flex-col min-h-[280px]">
                <div className="text-xs font-bold text-ink-primary uppercase tracking-widest">CLASSIFICAÇÃO DE DESPACHOS</div>
                <div className="text-[0.6rem] font-mono text-ink-tertiary uppercase tracking-widest mb-4">protocolo Manchester · rótulo direto</div>
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={MANCHESTER_DIST.map(d => ({ ...d, value: Math.round(d.value * bf) }))} margin={{ left: 4, right: 40 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} width={68} />
                      <Tooltip
                        cursor={{ fill: chartTheme.grid, opacity: 0.35 }}
                        contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px', color: chartTheme.tooltipText }}
                        labelStyle={{ fontSize: '12px', color: chartTheme.axis, marginBottom: '4px' }}
                      />
                      <Bar dataKey="value" name="Despachos" radius={[0, 4, 4, 0]} barSize={18}>
                        {MANCHESTER_DIST.map(e => <Cell key={e.name} fill={e.color} />)}
                        <LabelList dataKey="value" position="right" fill={chartTheme.axis} fontSize={11} fontFamily="'JetBrains Mono', monospace" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="gp p-5 rounded-2xl flex flex-col">
              <div className="text-xs font-bold text-ink-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <Icon name="clock-rotate-left" className="text-gold-500" /> Histórico de Chamadas Recentes
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border-subtle text-[0.65rem] text-ink-secondary uppercase tracking-widest">
                      <th className="pb-3 font-bold">ID</th>
                      <th className="pb-3 font-bold">Número</th>
                      <th className="pb-3 font-bold">Hora</th>
                      <th className="pb-3 font-bold">Tipo de Ocorrência</th>
                      <th className="pb-3 font-bold">Status Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_RECENT_CALLS.map((call, idx) => (
                      <tr key={idx} onClick={() => setFhirRecord(call)} className="border-b border-border-subtle/50 hover:bg-elevated/50 transition-colors cursor-pointer" title="Abrir registro de atendimento (FHIR R4)">
                        <td className="py-3 text-[0.65rem] font-mono text-ink-secondary">#{call.id}</td>
                        <td className="py-3 text-sm font-mono font-bold text-ink-primary">{call.phone}</td>
                        <td className="py-3 text-xs text-ink-secondary">{call.time}</td>
                        <td className="py-3 text-xs font-bold text-ink-primary">{call.type}</td>
                        <td className="py-3">
                          <span className={`chip chip-${call.statusColor} text-[0.6rem]`}>
                            {call.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-[0.6rem] font-mono text-ink-tertiary mt-2">Clique numa linha para abrir o registro de atendimento em estrutura FHIR R4 (pré-visualização de formato)</div>
              </div>
            </div>
            {fhirRecord && (
              <div className="fixed inset-0 z-[700] bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFhirRecord(null)}>
                <div className="bg-surface border border-border-default rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <div className="eyebrow mb-1">REGISTRO DE ATENDIMENTO · ESTRUTURA FHIR R4</div>
                    <h3 className="text-xl font-disp font-bold text-ink-primary">Ocorrência #{fhirRecord.id}</h3>
                    <p className="text-xs text-ink-secondary">Pré-visualização do formato de saída — a interoperabilidade com sistemas externos é etapa de roadmap</p>
                  </div>
                  <pre className="bg-elevated border border-border-subtle rounded-lg p-4 text-[0.65rem] font-mono text-ink-secondary overflow-x-auto leading-relaxed">{JSON.stringify({
                    resourceType: 'Bundle', type: 'document', identifier: { system: 'urn:samais:aph-br', value: `OCC-${fhirRecord.id}` },
                    entry: [
                      { resource: { resourceType: 'Encounter', status: 'finished', class: { code: 'EMER', display: 'Emergência pré-hospitalar' }, period: { start: `2026-06-10T${fhirRecord.time}:00-03:00` }, serviceProvider: { display: 'CRU São Paulo · Base Central' } } },
                      { resource: { resourceType: 'Patient', identifier: [{ system: 'urn:samais:telefone', value: fhirRecord.phone }], name: [{ text: 'Registrado na triagem' }] } },
                      { resource: { resourceType: 'Condition', code: { text: fhirRecord.type }, clinicalStatus: { text: 'ativo no momento do despacho' } } },
                      { resource: { resourceType: 'ServiceRequest', status: 'completed', intent: 'order', code: { text: fhirRecord.status }, performer: [{ display: 'SAMU 192' }] } },
                    ],
                  }, null, 2)}</pre>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => window.print()} className="px-4 py-2 rounded-md bg-elevated border border-border-default text-xs font-bold text-ink-primary hover:border-gold-500">Exportar PDF</button>
                    <button onClick={() => setFhirRecord(null)} className="px-4 py-2 rounded-md bg-gold-500 text-ink-inverse text-xs font-bold">Fechar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


      </main>

      {/* BOTTOM NAV (OSX Dock Style) */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-8 md:h-12 z-[1000] flex justify-center items-end pb-4 md:pb-6"
        onMouseEnter={() => setIsNavOpen(true)}
        onMouseLeave={() => setIsNavOpen(false)}
      >
        {/* Mobile Toggle Area (Invisible hit area to open nav on tap) */}
        <div 
          className="absolute inset-0 md:hidden" 
          onClick={() => setIsNavOpen(!isNavOpen)}
        ></div>

        {/* Mobile Indicator (Small pill at the bottom) */}
        <div className={`absolute bottom-2 w-12 h-1.5 bg-ink-secondary/30 rounded-full md:hidden transition-opacity duration-300 ${isNavOpen ? 'opacity-0' : 'opacity-100'}`}></div>

        <nav 
          className={`relative p-2 rounded-full flex gap-2 bg-surface/90 border border-border-subtle shadow-[0_15px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl overflow-x-auto max-w-[92vw] no-scrollbar snap-x snap-mandatory transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isNavOpen ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto' : 'translate-y-full opacity-0 scale-95 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside nav
        >
          {(role === 'TARM' || role === 'MEDICO') && (<>
          <button 
            onClick={() => jumpToStage('IDLE')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'IDLE' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="house-signal" /> Home
          </button>
          <button 
            onClick={() => jumpToStage('AML')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'AML' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="location-crosshairs" /> Ligação
          </button>
          <button 
            onClick={() => jumpToStage('TARM')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'TARM' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="microphone-lines" /> TARM
          </button>
          <button 
            onClick={() => jumpToStage('REGULADOR')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'REGULADOR' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="user-doctor" /> Médico
          </button>
          <button 
            onClick={() => jumpToStage('VIATURA')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'VIATURA' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="truck-medical" /> Viatura
          </button>
          </>)}
          {role === 'GESTOR' && (<>
          <button
            onClick={() => { setCurrentModule('GESTOR'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'GESTOR' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="house-signal" /> Início
          </button>
          <button
            onClick={() => { setCurrentModule('FROTA'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'FROTA' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="truck-medical" /> Frota
          </button>
          <button
            onClick={() => { setCurrentModule('ESCALAS'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'ESCALAS' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="calendar" /> Escalas
          </button>
          </>)}
          {role === 'GESTOR' && (
          <button
            onClick={() => { setCurrentModule('DASHBOARD'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'DASHBOARD' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="chart-simple" /> Dashboard
          </button>
          )}
        </nav>
      </div>
    </div>
  );
}
