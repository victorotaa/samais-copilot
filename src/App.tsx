import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from './lib/theme';
import { Icon } from './ui/Icon';
import { SamaisMonogram, SamaisWordmark } from './ui/Brand';
import { supabase, tryRealLogin, mapDbVehicle, VEHICLE_STATUS_UI_TO_DB, TENANT_ID, hasBackend } from './lib/supabase';
import type { Chamador, DadosAml, ExtracaoClinica, Veiculo, MembroEquipe, ItemFilaPabx, MensagemChat, ChamadaRecente, Risco, Papel, Escala } from './core/tipos';
import type { FalaTranscrita } from './core/teatro';
import { startOfWeek, addDays, isoDate, WEEKDAYS, MAX_WEEKS_AHEAD, TURNO_CYCLE, TURNO_BADGE } from './core/calendario';
import { MOCK_CALLERS } from './demo/dados/chamadores';
import { MOCK_SCRIPTS } from './demo/dados/roteiros';
import { CENARIOS_DEMO } from './demo/dados/cenarios';
import { MOCK_VEHICLES, MANUTENCAO_INICIAL } from './demo/dados/frota';
import { MOCK_TEAM, buildInitialRoster } from './demo/dados/equipe';
import { MEDICO_CASES } from './demo/dados/regulacao';
import { MOCK_QUEUE } from './demo/dados/fila';
import { HOURLY_STATS, MANCHESTER_DIST, MOCK_RECENT_CALLS } from './demo/dados/estatisticas';
import { TypingMessage, AudioWaveform, MapaEsquematico } from './demo/componentes';
import { analisadorDeTexto } from './demo/analise-texto';
import { fonteRoteiro } from './demo/fonte-roteiro';

const MISSION_STEPS = ['A CAMINHO', 'NO LOCAL', 'TRANSPORTANDO', 'NO HOSPITAL'];

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

// UI por classificação Manchester — TODAS as 5 cores (os ternários antigos só
// conheciam RED/YELLOW e pintavam LARANJA/VERDE/AZUL de neutro ou verde).
const RISCO_UI: Record<string, { label: string; box: string; dot: string; text: string; chip: string; bg: string; ring: string }> = {
  RED:    { label: 'VERMELHO', box: 'bg-danger/10 border-danger/40',  dot: 'bg-danger shadow-[0_0_10px_rgba(229,57,53,0.8)]',   text: 'text-danger',     chip: 'chip-danger', bg: 'bg-danger/10',     ring: 'border-danger bg-danger/20' },
  ORANGE: { label: 'LARANJA',  box: 'bg-orange-500/10 border-orange-500/40', dot: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]', text: 'text-orange-500', chip: 'chip-warn',  bg: 'bg-orange-500/10', ring: 'border-orange-500 bg-orange-500/20' },
  YELLOW: { label: 'AMARELO',  box: 'bg-warn/10 border-warn/40',      dot: 'bg-warn shadow-[0_0_10px_rgba(253,216,53,0.8)]',    text: 'text-warn',       chip: 'chip-warn',   bg: 'bg-warn/10',       ring: 'border-warn bg-warn/20' },
  GREEN:  { label: 'VERDE',    box: 'bg-ok/10 border-ok/40',          dot: 'bg-ok shadow-[0_0_10px_rgba(67,160,71,0.8)]',       text: 'text-ok',         chip: 'chip-ok',     bg: 'bg-ok/10',         ring: 'border-ok bg-ok/20' },
  BLUE:   { label: 'AZUL',     box: 'bg-info/10 border-info/40',      dot: 'bg-info shadow-[0_0_10px_rgba(41,121,255,0.8)]',    text: 'text-info',       chip: 'chip-ai',     bg: 'bg-info/10',       ring: 'border-info bg-info/20' },
  PENDING:{ label: 'PENDENTE', box: 'bg-surface border-border-subtle', dot: 'bg-hover',                                          text: 'text-ink-primary', chip: 'chip-nude',  bg: 'bg-elevated',      ring: 'border-border-subtle bg-hover' },
};

// Meta de tempo da chamada — PARÂMETRO da central, nunca constante nacional
// (docs/21 §3.3: o contador do MV-PR alerta ao exceder tempo "parametrizado no
// sistema"; 1 min ideal / teto 3 min é protocolo LOCAL de Fortaleza; para o
// médico, o manual MS 2006 indica 30s–1min para julgar gravidade). A demo usa
// 60/180s como default declarado — em produto, configuração por tenant.
const META_CHAMADA_S = { meta: 60, teto: 180 };

// Cronômetro da etapa: neutro dentro da meta, âmbar acima dela, vermelho no
// teto — o padrão vivo nos sistemas reais de CRU (docs/21 §2.2b).
function CronometroMeta({ inicio, agora, rotulo }: { inicio: number | null; agora: Date; rotulo?: string }) {
  if (!inicio) return null;
  const seg = Math.max(0, Math.floor((agora.getTime() - inicio) / 1000));
  const mm = String(Math.floor(seg / 60)).padStart(2, '0');
  const ss = String(seg % 60).padStart(2, '0');
  const estado = seg >= META_CHAMADA_S.teto ? 'teto' : seg >= META_CHAMADA_S.meta ? 'meta' : 'ok';
  const estilo = estado === 'teto' ? 'bg-danger/10 border-danger/40 text-danger animate-pulse'
    : estado === 'meta' ? 'bg-warn/10 border-warn/40 text-warn'
    : 'bg-elevated border-border-subtle text-ink-secondary';
  return (
    <span
      title={`Meta da etapa — parâmetro da central (demo: ${META_CHAMADA_S.meta / 60} min, teto ${META_CHAMADA_S.teto / 60} min · docs/21 §3.3)`}
      className={`px-2.5 py-1 rounded-full border font-mono text-[0.65rem] font-bold tracking-widest whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${estilo}`}
    >
      <Icon name="stopwatch" />{rotulo ? ` ${rotulo} ` : ' '}{mm}:{ss}
      {estado !== 'ok' && <span className="hidden min-[480px]:inline">· {estado === 'teto' ? 'TETO EXCEDIDO' : 'ACIMA DA META'}</span>}
    </span>
  );
}

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

  const [currentModule, setCurrentModule] = useState<'IDLE' | 'TARM' | 'REGULADOR' | 'VIATURA' | 'DASHBOARD' | 'GESTOR' | 'FROTA' | 'ESCALAS'>('IDLE');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [time, setTime] = useState(new Date());
  
  // Estado para armazenar os dados do chamador atual
  const [currentCaller, setCurrentCaller] = useState<Chamador | null>(null);

  const [amlData, setAmlData] = useState<DadosAml | null>(null);

  // TARM States
  const [aiActive, setAiActive] = useState(true);
  const [tarmChat, setTarmChat] = useState<MensagemChat[]>([]);
  const [extractedData, setExtractedData] = useState<ExtracaoClinica>({
    patientName: '', age: '', gender: '', symptoms: [], comorbidities: [], risk: 'PENDING', protocol: 'Analisando...', observations: '',
    confidence: { patientName: 0, symptoms: 0, protocol: 0 }
  });
  const [justification, setJustification] = useState<string | null>(null);
  // Tipificação do encerramento (taxonomia dos sistemas reais — docs/21 §2.2a):
  // quem decide o motivo é o operador, em um toque; o sistema registra.
  const [encerrarArm, setEncerrarArm] = useState(false);
  // Queda de ligação NUNCA perde contexto (docs/21 §2.3-2.4): o rascunho fica
  // preservado na espera e reassocia pela anti-duplicidade quando o número volta.
  const [quedaPendente, setQuedaPendente] = useState<{
    caller: Chamador; chat: MensagemChat[]; dados: ExtracaoClinica; em: number;
  } | null>(null);
  const [headerFora, setHeaderFora] = useState(false);
  // Cronômetros de etapa: nascem no ATENDER (nunca antes — shadow) e no handoff.
  const [chamadaInicio, setChamadaInicio] = useState<number | null>(null);
  const [regulacaoInicio, setRegulacaoInicio] = useState<number | null>(null);
  // Três modos da doutrina: escuta (shadow) · digitação (sem escuta, IA sobre o
  // texto do TARM) · manual total. aiActive continua sendo "a escuta está viva".
  const [modoIA, setModoIA] = useState<'escuta' | 'digitacao' | 'manual'>('escuta');
  const [textoDigitado, setTextoDigitado] = useState('');
  const digitacaoTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Classificação de risco é DECISÃO EXPLÍCITA do regulador — nunca default.
  // null = ainda não classificado; o despacho fica bloqueado até a escolha.
  const [riscoFinal, setRiscoFinal] = useState<Risco | null>(null);
  // T1–T4: horário de cada marca; a barra de missão só habilita o PRÓXIMO passo,
  // pulo exige confirmação (2 toques) e marca feita é imutável — tempo probatório
  // não se sobrescreve em silêncio.
  const [missionMarks, setMissionMarks] = useState<Record<string, string>>({});
  const [skipArm, setSkipArm] = useState<string | null>(null);
  // Seletor de cenário da demonstração (IDLE): 'aleatorio' sorteia da bolsa.
  const [cenarioDemo, setCenarioDemo] = useState<string>('aleatorio');
  const bolsaCenariosRef = useRef<string[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Hoje');

  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'info' | 'warn'} | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [vehicles, setVehicles] = useState<Veiculo[]>(MOCK_VEHICLES);
  const [role, setRole] = useState<Papel>('TARM');
  const [team] = useState(MOCK_TEAM);
  const [maintSchedule, setMaintSchedule] = useState<Record<string, string>>(MANUTENCAO_INICIAL);
  const [missionStatus, setMissionStatus] = useState('A CAMINHO');
  const [connected, setConnected] = useState(false);
  const [operatorName, setOperatorName] = useState('Mariana S.');
  const [operatorId, setOperatorId] = useState('TARM-04');
  const [loginMatricula, setLoginMatricula] = useState('TARM-04');
  const [loginPassword, setLoginPassword] = useState('');
  const [roster, setRoster] = useState<Escala>(buildInitialRoster);
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
  const [fhirRecord, setFhirRecord] = useState<ChamadaRecente | null>(null);
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
    } else if (extractedData.risk === 'ORANGE') {
      // Discriminadores "muito urgente" — o caso vivo é o AVC em janela.
      setProtocolSteps([
        { id: 'p1', label: 'Déficit Neurológico Agudo?', checked: true },
        { id: 'p2', label: 'Início há menos de 4,5h (janela)?', checked: true },
        { id: 'p3', label: 'Alteração do Estado de Consciência?', checked: false },
        { id: 'p4', label: 'Dor Severa?', checked: false },
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

  // Gate do despacho: classificação explícita sempre; justificativa quando a decisão
  // médica diverge da sugestão do sistema (é a divergência que treina o modelo e
  // sustenta a auditoria — doutrina "copiloto, não piloto").
  const RISCO_LABEL: Record<string, string> = Object.fromEntries(Object.entries(RISCO_UI).map(([k, v]) => [k, v.label]));
  const riscoDiverge = riscoFinal !== null && extractedData.risk !== 'PENDING' && riscoFinal !== extractedData.risk;
  const podeDespachar = riscoFinal !== null && (!riscoDiverge || justification !== null);

  // Chave do Maps só por env (SEC-01). Sem a variável, os mapas caem no embed
  // público keyless — nenhuma credencial vive no código-fonte.
  const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapFilter = theme === 'dark' ? 'invert(90%) hue-rotate(180deg) contrast(110%)' : 'none';

  const MapIframe = useMemo(() => {
    if (!amlData) return <div className="w-full h-full flex items-center justify-center text-ink-secondary">Sem dados de localização</div>;
    if (!hasBackend) return <MapaEsquematico pino />;
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
    if (!hasBackend) return <MapaEsquematico pino rota />;
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
    if (!hasBackend) return <MapaEsquematico />;
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
    // Rola SÓ o container do chat: scrollIntoView subia pelos ancestrais e
    // brigava com o auto-hide do header (e arrastava a tela no mobile).
    const fim = chatEndRef.current;
    if (fim?.parentElement) fim.parentElement.scrollTop = fim.parentElement.scrollHeight;
  }, [tarmChat]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Header fino no mobile: o layout é h-screen (a página não rola — os blocos
  // de tela rolam por dentro), então "fixo" era o estado permanente. O header
  // agora se ESCONDE quando o operador rola o conteúdo para baixo e volta ao
  // rolar para cima (padrão dos browsers mobile); o mini-chip do cronômetro
  // flutua enquanto ele está fora. Capture pega o scroll dos containers de
  // tela (filhos diretos do main) e ignora scrolls internos como o do chat.
  const ultimoScrollRef = useRef<{ el: EventTarget | null; top: number; acum: number }>({ el: null, top: 0, acum: 0 });
  useEffect(() => {
    const onScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || el.parentElement?.tagName !== 'MAIN') return;
      const r = ultimoScrollRef.current;
      const anterior = r.el === el ? r.top : el.scrollTop;
      const delta = el.scrollTop - anterior;
      // acumula na direção corrente: rolagem suave entrega deltas minúsculos
      const acum = delta === 0 ? r.acum : (delta > 0) === (r.acum > 0) ? r.acum + delta : delta;
      ultimoScrollRef.current = { el, top: el.scrollTop, acum };
      if (el.scrollTop < 24) setHeaderFora(false);
      else if (acum > 24) setHeaderFora(true);
      else if (acum < -24) setHeaderFora(false);
    };
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true } as any);
  }, []);
  useEffect(() => { setHeaderFora(false); }, [currentModule]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAuthenticated && currentModule === 'IDLE' && !incomingCall) {
      // Reset TARM states when going back to IDLE
      fonteRoteiro.encerrar();
      setTarmChat([]);
      setExtractedData({ patientName: '', age: '', gender: '', symptoms: [], comorbidities: [], risk: 'PENDING', protocol: 'Analisando...', observations: '', confidence: { patientName: 0, symptoms: 0, protocol: 0 } });
      setAiActive(true);
      let escolhido = CENARIOS_DEMO.find(c => c.id === cenarioDemo);
      if (!escolhido) {
        if (bolsaCenariosRef.current.length === 0) {
          bolsaCenariosRef.current = CENARIOS_DEMO.map(c => c.id).sort(() => Math.random() - 0.5);
        }
        const proximo = bolsaCenariosRef.current.pop()!;
        escolhido = CENARIOS_DEMO.find(c => c.id === proximo)!;
      }
      const cenario = escolhido;
      fonteRoteiro.selecionar(cenario.script);
      setMissionStatus('A CAMINHO');
      setMissionMarks({});
      setSkipArm(null);
      setRiscoFinal(null);
      setJustification(null);
      setChamadaInicio(null);
      setRegulacaoInicio(null);
      setModoIA('escuta');
      setTextoDigitado('');
      setOccId(null);
      setDispatchId(null);

      timer = setTimeout(() => {
        setCurrentCaller(MOCK_CALLERS[cenario.caller]);
        setAmlData(null);
        setIncomingCall(true);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [isAuthenticated, currentModule, incomingCall, cenarioDemo]);

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
      setMissionMarks({});
      setSkipArm(null);
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

  // O que uma fala transcrita FAZ no estado é produto — o STT real entregará o
  // mesmo shape (contrato FonteDeTranscricao). Cadência e dedup de entrega são
  // da fonte; aqui fica só o dedup de render e a extração incremental.
  const aoItemTranscricao = (fala: FalaTranscrita) => {
    setTarmChat(prev => {
      // Evita duplicatas caso o componente re-renderize
      if (prev.some(msg => msg.text === fala.text)) return prev;
      return [...prev, { speaker: fala.speaker, text: fala.text, time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'}) }];
    });

    if (fala.extract) {
      const extract = fala.extract;
      if (extract.patientName) {
        setExtractedData(prev => ({ ...prev, patientName: extract.patientName!, age: extract.age || prev.age, gender: extract.gender || prev.gender, confidence: { ...prev.confidence, patientName: 0.96 } }));
      }
      if (extract.symptoms) {
        setExtractedData(prev => ({ ...prev, symptoms: [...new Set([...prev.symptoms, ...extract.symptoms!])], confidence: { ...prev.confidence, symptoms: 0.89 } }));
      }
      if (extract.risk) {
        setExtractedData(prev => ({ ...prev, risk: extract.risk!, protocol: extract.protocol || prev.protocol, confidence: { ...prev.confidence, protocol: 0.92 } }));
      }
    }
  };

  const marcadorSistema = (texto: string) => {
    setTarmChat(prev => [...prev, { speaker: 'SYS', text: texto, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
  };

  // Três modos (doutrina docs/05 §2), com o comportamento do modo degradado real
  // (docs/17 §A.2.6): sair da escuta CONGELA a transcrição com marca visível e
  // registra a janela; voltar reagenda só o que ainda não apareceu. A GRAVAÇÃO
  // da chamada não passa por aqui — é obrigação normativa da central (docs/09 §1).
  const definirModoIA = (novo: 'escuta' | 'digitacao' | 'manual') => {
    if (novo === modoIA) return;
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (novo === 'escuta') {
      if (currentModule === 'TARM' && tarmChat.length > 0) {
        marcadorSistema(`— escuta religada às ${agora} · transcrição retomada; a janela fica registrada na auditoria —`);
        fonteRoteiro.retomar(aoItemTranscricao);
      }
      audit('IA_RELIGADA', { em: agora, modulo: currentModule, de: modoIA });
      setAiActive(true);
    } else {
      fonteRoteiro.pausar();
      if (currentModule === 'TARM' && tarmChat.length > 0) {
        marcadorSistema(novo === 'digitacao'
          ? `— escuta desligada às ${agora} · IA sobre digitação: a classificação passa a vir do texto do TARM —`
          : `— transcrição interrompida às ${agora} · IA desligada pelo operador —`);
      }
      audit(novo === 'digitacao' ? 'IA_MODO_DIGITACAO' : 'IA_DESLIGADA', { em: agora, modulo: currentModule });
      setAiActive(false);
    }
    setModoIA(novo);
  };

  // IA sobre digitação: reavalia o TEXTO INTEIRO a cada pausa — o campo é a
  // fonte de verdade; texto sem sinal volta a PENDING, nunca palpite.
  useEffect(() => {
    if (modoIA !== 'digitacao') return;
    if (digitacaoTimerRef.current) clearTimeout(digitacaoTimerRef.current);
    digitacaoTimerRef.current = setTimeout(() => {
      const r = analisadorDeTexto.analisar(textoDigitado);
      if (r) {
        setExtractedData(prev => ({ ...prev, symptoms: r.symptoms, risk: r.risk, protocol: r.protocol, confidence: { ...prev.confidence, symptoms: 0.75, protocol: 0.75 } }));
      } else {
        setExtractedData(prev => ({ ...prev, symptoms: [], risk: 'PENDING', protocol: textoDigitado.trim() ? 'Sem sinal identificado no texto' : 'Analisando...', confidence: { ...prev.confidence, symptoms: 0, protocol: 0 } }));
      }
    }, 450);
    return () => { if (digitacaoTimerRef.current) clearTimeout(digitacaoTimerRef.current); };
  }, [textoDigitado, modoIA]);

  useEffect(() => {
    if (currentModule === 'TARM' && aiActive && tarmChat.length === 0) {
      fonteRoteiro.iniciar(aoItemTranscricao);
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
      if (role === 'MEDICO') {
        // O papel promete regulação — aterrissar no IDLE era surpresa. Entra direto
        // na fila de regulação com um handoff pronto, como no login real.
        applyDemoSnapshot();
        setSelectedVehicleId(recommendedVehicles[0]?.id || 'USA-01');
        setCurrentModule('REGULADOR');
      } else {
        setCurrentModule(role === 'GESTOR' ? 'GESTOR' : role === 'VIATURA' ? 'VIATURA' : 'IDLE');
      }
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
      setVehicles(data.map(r => mapDbVehicle(r, VEHICLE_STATUS_COLOR)));
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
    setRiscoFinal(null);
    setJustification(null);
    setMissionMarks({});
    setSkipArm(null);
    setTarmChat(prev => prev.length > 0 ? prev : MOCK_SCRIPTS[0].slice(0, 7).map(i => ({
      speaker: i.speaker, text: i.text,
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

  const abrirOcorrencia = (caller: Chamador) => {
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
    setMissionMarks({});
    setSkipArm(null);
    setRiscoFinal(null);
    setJustification(null);
    setOccId(null);
    setDispatchId(null);
    if (role !== 'VIATURA') setCurrentModule('IDLE');
  };

  const jumpToStage = (stage: 'IDLE' | 'TARM' | 'REGULADOR' | 'VIATURA') => {
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

  const encerrarSemRegulacao = (motivo: 'trote' | 'engano' | 'queda') => {
    audit('CHAMADA_ENCERRADA_SEM_REGULACAO', { motivo, extracao: extractedData.risk });
    fonteRoteiro.pausar();
    if (motivo === 'queda' && currentCaller) {
      // Queda: o rascunho sobrevive à volta ao IDLE — protocolo real manda
      // retornar a ligação, e o retorno reassocia à MESMA ocorrência.
      setQuedaPendente({ caller: currentCaller, chat: tarmChat, dados: extractedData, em: Date.now() });
      showToast('Queda registrada — contexto preservado; retorne a ligação', 'warn');
    } else {
      showToast(`Encerrada sem regulação (${motivo}) — registrada em auditoria`, 'info');
    }
    setEncerrarArm(false);
    setIncomingCall(false);
    setCurrentModule('IDLE');
  };

  const acceptCall = () => {
    setIncomingCall(false);
    if (currentCaller) abrirOcorrencia(currentCaller);
    if (role === 'MEDICO') {
      applyDemoSnapshot();
      setSelectedVehicleId(recommendedVehicles[0]?.id || 'USA-01');
      setRegulacaoInicio(Date.now());
      setCurrentModule('REGULADOR');
      showToast('Handoff recebido do TARM-04', 'success');
      return;
    }
    showToast('Chamada atendida na central — triagem aberta · cronômetro da etapa iniciado', 'success');
    setChamadaInicio(Date.now());
    setCurrentModule('TARM');
    // Reassociação: o mesmo número religando complementa a ocorrência da queda
    // em vez de abrir outra (mecanismo dos sistemas reais — docs/21 §2.4).
    if (quedaPendente && currentCaller && quedaPendente.caller.phone === currentCaller.phone) {
      const q = quedaPendente;
      setTimeout(() => {
        setTarmChat(q.chat);
        setExtractedData(q.dados);
        marcadorSistema('— retorno da ligação: contexto reassociado à ocorrência da queda (anti-duplicidade por telefone) —');
      }, 400);
      setQuedaPendente(null);
      showToast('Mesmo número religou — contexto da queda reassociado', 'success');
    }
    
    setTimeout(() => {
      if (currentCaller) {
        setAmlData(currentCaller.aml);
        if (currentCaller.aml) showToast('Localização AML triangulada', 'info');
        else showToast('Sem localização automática — coletar endereço por voz', 'warn');
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
          setRegulacaoInicio(Date.now());
          setCurrentModule('REGULADOR');
        }}
        className="w-full py-4 px-3 bg-gradient-to-r from-gold-500 to-gold-700 text-ink-inverse font-extrabold font-sans uppercase tracking-wider text-xs md:text-sm rounded-xl shadow-[0_0_30px_rgba(191,154,61,0.2)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
      >
        <Icon name="user-doctor" className="text-base shrink-0" /> <span className="truncate">Handoff & Ir p/ Regulador</span>
      </button>
      {/* Sempre habilitado: chamada sem extração conclusiva não pode TRAVAR o
          TARM — os dois botões acima exigem risco definido. O MOTIVO é decisão
          explícita do operador (taxonomia dos sistemas reais, docs/21 §2.2a);
          QUEDA preserva o contexto para reassociação quando o número religa. */}
      {!encerrarArm ? (
        <button
          onClick={() => setEncerrarArm(true)}
          className="w-full py-2 text-[0.65rem] font-mono uppercase tracking-widest text-ink-secondary hover:text-warn transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="mask" /> Encerrar sem regulação · trote / engano / queda
        </button>
      ) : (
        <div className="w-full flex items-center justify-center gap-2 py-1.5 fu flex-wrap">
          <span className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary shrink-0">Motivo:</span>
          {([['trote', 'Trote'], ['engano', 'Engano'], ['queda', 'Queda']] as const).map(([m, rot]) => (
            <button
              key={m}
              onClick={() => encerrarSemRegulacao(m)}
              className={`px-3 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-widest border transition-colors ${m === 'queda' ? 'border-warn/40 text-warn hover:bg-warn/10' : 'border-border-subtle text-ink-secondary hover:border-danger hover:text-danger'}`}
            >
              {rot}
            </button>
          ))}
          <button onClick={() => setEncerrarArm(false)} className="px-3 py-1.5 rounded-full text-[0.65rem] font-mono uppercase tracking-widest text-ink-tertiary hover:text-ink-primary">
            Cancelar
          </button>
        </div>
      )}
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

            {/* Antes do ATENDER só existe sinalização do PABX — o sistema recebe cópia
                do áudio da chamada atendida (shadow) e NUNCA escuta ou transcreve
                pré-atendimento. O box "Transcrição Prévia" que existia aqui violava
                essa premissa e foi removido (22/08). */}
            <div className="w-full px-4 py-3 bg-elevated/50 border border-border-subtle rounded-2xl mb-8 flex items-center gap-2 justify-center text-center">
              <Icon name="circle" className="text-[6px] text-ink-secondary animate-pulse shrink-0" />
              <span className="text-[0.6rem] md:text-[0.65rem] font-mono uppercase tracking-widest text-ink-secondary">Sinalização do PABX · no produto a triagem abre sozinha quando o TARM atende na central</span>
            </div>

            <div className="flex gap-4 w-full">
              <button onClick={ignoreCall} className="flex-1 px-4 py-3 rounded-xl border border-border-subtle text-ink-secondary font-bold tracking-widest hover:bg-elevated transition-all text-xs md:text-sm whitespace-nowrap">
                DISPENSAR · DEMO
              </button>
              <button onClick={acceptCall} className="flex-[1.7] px-4 py-3 bg-ok text-ink-inverse font-extrabold font-disp text-xs md:text-base rounded-xl shadow-[0_0_30px_rgba(67,160,71,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-2 md:gap-3">
                <Icon name="headset" /> <span className="leading-tight">SIMULAR ATENDIMENTO NA CENTRAL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cronômetro flutuante: o header rola livre (nada de barra fixa
          grosseira); quando ele sai da viewport EM CHAMADA, só o tempo flutua. */}
      {(() => {
        const etapa = currentModule === 'REGULADOR' ? regulacaoInicio : currentModule === 'TARM' ? chamadaInicio : null;
        if (!headerFora || !etapa || !isAuthenticated) return null;
        return (
          <div className="fixed top-2 right-3 z-40 fu bg-canvas rounded-full shadow-lg">
            <CronometroMeta inicio={etapa} agora={time} />
          </div>
        );
      })()}

      {/* GLOBAL HEADER */}
      <header className={`h-[3.75rem] border-b border-border-subtle bg-surface flex items-center justify-between px-3 sm:px-5 shrink-0 z-50 shadow-md relative max-lg:transition-[margin-top] max-lg:duration-300 ${headerFora ? 'max-lg:mt-[-3.75rem]' : 'max-lg:mt-0'}`}>
        <div className="flex items-center gap-4">
          <SamaisMonogram className="h-9 shrink-0 text-gold-500" />
          <div className="hidden sm:block">
            <SamaisWordmark className="h-5 text-ink-primary" />
            <div className="text-[0.6rem] text-gold-500 uppercase tracking-widest font-mono">
              {role === 'GESTOR' ? 'Central 192 — Gestão da Operação' : role === 'MEDICO' ? 'Central 192 — Regulação Médica' : role === 'VIATURA' ? 'Central 192 — Unidade Embarcada' : currentModule === 'IDLE' ? 'Central 192 — Recepção' : 'Central 192 — Atendimento'}
            </div>
          </div>

        </div>

        {/* Abaixo de lg a pílula entra no fluxo (3º item do justify-between): absoluta
            e centrada, ela pintava por cima do relógio e dos botões — visto a 390 E a
            768px. E viatura em prontidão (sem ocorrência) não está "EM CHAMADA". */}
        {(() => {
          const emChamada = role !== 'GESTOR' && currentModule !== 'IDLE' && !(role === 'VIATURA' && !currentCaller);
          const rotulo = role === 'GESTOR' ? 'GESTÃO'
            : role === 'VIATURA' && !currentCaller ? 'PRONTIDÃO'
            : currentModule !== 'IDLE' ? 'EM CHAMADA' : 'EM ESPERA';
          // Tempo da etapa corrente na própria pílula: no mobile o chip do chat
          // rola para fora da tela — a pílula (header sticky) é o que fica à vista.
          const etapaInicio = currentModule === 'REGULADOR' ? regulacaoInicio
            : currentModule === 'TARM' ? chamadaInicio : null;
          let tempoPill: React.ReactNode = null;
          if (emChamada && etapaInicio) {
            const seg = Math.max(0, Math.floor((time.getTime() - etapaInicio) / 1000));
            const corTempo = seg >= META_CHAMADA_S.teto ? 'text-danger animate-pulse'
              : seg >= META_CHAMADA_S.meta ? 'text-warn' : 'text-ink-primary';
            tempoPill = <span className={`font-mono text-[0.65rem] font-bold tracking-widest ${corTempo}`}>{String(Math.floor(seg / 60)).padStart(2, '0')}:{String(seg % 60).padStart(2, '0')}</span>;
          }
          return (
        <div className={`max-lg:static max-lg:translate-x-0 max-lg:mx-1.5 max-sm:px-2.5 max-lg:px-3 lg:absolute lg:left-1/2 lg:-translate-x-1/2 flex items-center gap-3 px-5 py-1.5 rounded-full border transition-all duration-300 whitespace-nowrap shrink-0 ${emChamada ? 'bg-danger/10 border-danger/50' : 'bg-elevated border-border-subtle'} shadow-inner`}>
          <Icon name="circle" className={`text-[7px] ${emChamada ? 'text-danger animate-pulse' : 'text-ink-secondary'}`} />
          <span className={`text-[0.65rem] font-mono font-bold uppercase tracking-widest ${emChamada ? 'text-danger' : 'text-ink-secondary'} ${tempoPill ? 'max-[430px]:hidden' : ''}`}>
            {rotulo}
          </span>
          {tempoPill}
        </div>
          );
        })()}

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden lg:block">
            <div className="text-[0.6rem] text-ink-secondary uppercase tracking-widest font-bold">Hora Local</div>
            <div className="text-sm font-bold font-mono text-ink-primary">
              {new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
          <div className="h-7 w-px bg-hover hidden lg:block"></div>
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
          <div className="h-7 w-px bg-hover hidden sm:block"></div>
          {(role === 'TARM' || role === 'MEDICO') && (
          <button
            onClick={() => setShowEscala(true)}
            className="px-2 sm:px-3 h-9 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors bg-elevated border border-border-subtle text-ink-secondary hover:text-gold-500 hover:border-gold-500"
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
      {/* pb-10 no mobile: folga para a faixa do dock fixo (h-8 + pílula) — sem ela,
          a última linha de texto dos módulos corre por baixo do menu de rodapé. */}
      <main className={`flex-1 flex flex-col relative overflow-hidden p-4 pb-10 md:p-5`}>
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
        {(currentModule === 'TARM' || currentModule === 'REGULADOR') && !currentCaller && (
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

            {/* Seletor de cenário — ferramenta de APRESENTAÇÃO: permite dirigir a
                próxima chamada (IAM, AVC, trote, sem AML…) em vez de torcer pelo
                sorteio. Aleatório usa bolsa: todos os cenários antes de repetir. */}
            <div className="w-full max-w-7xl px-5 mb-8">
              <div className="gp rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
                <span className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mr-1 shrink-0">Demonstração · próxima chamada</span>
                <button
                  onClick={() => setCenarioDemo('aleatorio')}
                  className={`px-3 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border transition-colors ${cenarioDemo === 'aleatorio' ? 'bg-gold-500 text-ink-inverse border-gold-500' : 'bg-elevated border-border-subtle text-ink-secondary hover:border-gold-500'}`}
                >
                  Aleatório
                </button>
                {CENARIOS_DEMO.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCenarioDemo(c.id)}
                    className={`px-3 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border transition-colors ${cenarioDemo === c.id ? 'bg-gold-500 text-ink-inverse border-gold-500' : 'bg-elevated border-border-subtle text-ink-secondary hover:border-gold-500'}`}
                  >
                    {c.rotulo}
                  </button>
                ))}
              </div>
            </div>

            {/* Ocorrência em aberto após QUEDA: o contexto não se perde — o
                protocolo real manda retornar a ligação (docs/21 §2.3) e o mesmo
                número religando reassocia automaticamente (anti-duplicidade). */}
            {quedaPendente && (
              <div className="w-full max-w-7xl px-5 mb-8 fu">
                <div className="gp rounded-xl px-4 py-3 border-l-4 border-l-warn flex items-center gap-3 flex-wrap">
                  <Icon name="phone-slash" className="text-warn shrink-0" />
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-xs font-bold uppercase tracking-widest text-warn">Ocorrência em aberto · queda de ligação</div>
                    <div className="text-[0.7rem] font-mono text-ink-secondary mt-0.5">
                      {quedaPendente.caller.phone} · há {Math.max(0, Math.floor((time.getTime() - quedaPendente.em) / 60000))} min · contexto preservado — retorne a ligação; o mesmo número religando reassocia sozinho
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const q = quedaPendente;
                        setQuedaPendente(null);
                        setCurrentCaller(q.caller);
                        setChamadaInicio(q.em);
                        setModoIA('manual');
                        setAiActive(false);
                        setCurrentModule('TARM');
                        setTimeout(() => {
                          setTarmChat(q.chat);
                          setExtractedData(q.dados);
                          marcadorSistema('— contexto restaurado após queda · aguardando retorno da ligação —');
                        }, 300);
                      }}
                      className="px-3 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-widest bg-warn/10 border border-warn/40 text-warn hover:bg-warn hover:text-ink-inverse transition-colors"
                    >
                      Retomar contexto
                    </button>
                    <button
                      onClick={() => { audit('OCORRENCIA_ARQUIVADA_QUEDA', { telefone: quedaPendente.caller.phone }); setQuedaPendente(null); showToast('Ocorrência da queda arquivada — registrada em auditoria', 'info'); }}
                      className="px-3 py-1.5 rounded-full text-[0.65rem] font-mono uppercase tracking-widest text-ink-tertiary hover:text-ink-primary"
                    >
                      Arquivar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicles Grid & Map */}
            <div className="w-full max-w-7xl px-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col">
                {/* flex-wrap: com fonte fallback (SO sem as webfonts — cenário real
                    de CRU) o título + chips estouravam a 390px; quebrando, nunca. */}
                <div className="flex flex-wrap items-center gap-3 gap-y-2 mb-6 border-b border-border-subtle pb-3">
                  <Icon name="truck-medical" className="text-gold-500 text-xl" />
                  <h3 className="text-lg font-disp font-bold text-ink-primary uppercase tracking-widest">Status da Frota</h3>
                  <div className="ml-auto flex gap-2 shrink-0">
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

        {/* A tela-gate de AML morreu (decisão do Ota, 24/08 — fidelidade shadow):
            quando o TARM atende na central, a transcrição JÁ começa. A localização
            vive como painel dentro da triagem — auto-preenchida, editável, nunca
            bloqueia (docs/10 §5). */}
        {currentModule === 'TARM' && currentCaller && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 fu min-h-0 overflow-y-auto lg:overflow-hidden pb-6 lg:pb-0 pr-2 -mr-2 lg:pr-0 lg:mr-0">
            {/* Left Panel: Call Queue (Hidden on Mobile) */}
            <div className="w-full lg:w-[250px] h-48 lg:h-auto gp rounded-2xl flex flex-col lg:overflow-hidden shrink-0 hidden md:flex">
              <div className="p-3.5 border-b border-border-subtle bg-elevated flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Icon name="list-ol" className="text-gold-500 text-xs" />
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Fila no PABX<span className="block text-[0.55rem] font-mono font-normal text-ink-tertiary normal-case tracking-normal mt-0.5">sinalização colhida · leitura passiva</span></span>
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

                  {/* Localização & origem — o gate AML morreu (fidelidade shadow,
                      decisão do Ota 24/08): a triagem abre no atendimento e a
                      localização é painel auto-preenchido pela sinalização,
                      editável, que NUNCA bloqueia o atendimento. */}
                  <div className={`p-4 rounded-xl border ${!currentCaller?.aml ? 'bg-warn/10 border-warn/40' : 'bg-surface border-border-subtle'}`}>
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary flex items-center gap-1.5">
                        <Icon name="location-crosshairs" className={!currentCaller?.aml ? 'text-warn' : 'text-gold-500'} /> Localização &amp; Origem
                      </div>
                      {/* AML é IMPLEMENTAÇÃO FUTURA (decisão do Ota, 24/08): o
                          produto adota quando regulamentação e infra das centrais
                          amadurecerem. A demo antecipa o cenário — rotulado. */}
                      {currentCaller?.aml
                        ? (amlData
                            ? <span className="chip chip-ai text-[0.6rem]"><Icon name="satellite-dish" /> AML · futuro (simulado)</span>
                            : <span className="chip chip-nude text-[0.6rem]"><Icon name="circle-notch" className="animate-spin" /> AML…</span>)
                        : <span className="chip chip-warn text-[0.6rem]">Colher por voz</span>}
                    </div>
                    <div className="text-[0.7rem] font-mono text-ink-secondary mb-2.5">
                      {currentCaller?.phone} · {currentCaller?.hasHistory ? `${currentCaller.historyCount} ocorrência(s) 30d` : 'sem histórico na CRU'}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <input className="inp col-span-3 text-xs py-2" placeholder="Endereço — colete por voz" defaultValue={amlData?.address || ''} key={`end-${amlData?.address || 'v'}`} />
                      <input className="inp text-xs py-2 text-center" placeholder="Nº" defaultValue={amlData?.number || ''} key={`num-${amlData?.number || 'v'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input className="inp text-xs py-2" placeholder="Bairro / referência" defaultValue={amlData?.neighborhood || ''} key={`bai-${amlData?.neighborhood || 'v'}`} />
                      <input className="inp text-xs py-2" placeholder="Município" defaultValue={amlData?.city || ''} key={`mun-${amlData?.city || 'v'}`} />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2.5 flex-wrap">
                      <span className="text-[0.55rem] font-mono text-ink-tertiary">
                        {amlData ? `AML simulado (implementação futura) · ${amlData.lat}°, ${amlData.lng}°` : currentCaller?.aml ? 'aguardando sinalização…' : 'sem AML nesta linha (fixo/VoIP) — endereço por voz é o padrão de hoje'}
                      </span>
                      <button
                        onClick={() => { audit('LOCALIZACAO_CONFIRMADA', { fonte: amlData ? 'aml' : 'voz' }); showToast('Localização confirmada — registrada em auditoria', 'success'); }}
                        className="text-[0.6rem] font-bold uppercase tracking-widest text-gold-500 hover:text-gold-300 transition-colors"
                      >
                        Confirmar localização
                      </button>
                    </div>
                  </div>

                  {/* Risk Classification */}
                  <div className={`p-4 rounded-xl border ${
                    (RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).box
                  } transition-colors duration-500`}>
                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-2">Classificação de Risco Sugerida</div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        (RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).dot
                      }`}></div>
                      <div className="min-w-0">
                        {/* O rótulo Manchester por extenso acompanha a cor — a
                            classificação não pode depender de o operador ler o tom
                            da borda (daltonismo, projetor ruim, sala clara). */}
                        <div className={`text-[0.65rem] font-mono font-bold uppercase tracking-widest ${
                          (RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).text
                        }`}>
                          {RISCO_LABEL[extractedData.risk] || extractedData.risk}
                        </div>
                        <span className={`text-lg font-bold font-disp ${
                          (RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).text
                        }`}>
                          {extractedData.protocol}
                        </span>
                      </div>
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
              <div className="p-3.5 border-b border-border-subtle bg-elevated flex flex-wrap items-center justify-between gap-y-2 shrink-0">
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
                      <Icon name="circle" className={`text-[5px] ${modoIA === 'escuta' ? 'animate-pulse' : ''}`} /> {modoIA === 'escuta' ? 'STT Engine Ativo' : modoIA === 'digitacao' ? 'Sem escuta · IA sobre o texto digitado' : 'IA desligada — modo manual'}
                    </div>
                  </div>
                </div>

                <CronometroMeta inicio={chamadaInicio} agora={time} />

                {/* Três modos (doutrina docs/05 §2): escuta · digitação · manual.
                    O MANUAL é o kill switch integral; a gravação da chamada não
                    depende de nenhum destes estados. */}
                <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface p-1 shrink-0">
                  {([['escuta', 'Escuta'], ['digitacao', 'Digitação'], ['manual', 'Manual']] as const).map(([m, rot]) => (
                    <button
                      key={m}
                      onClick={() => definirModoIA(m)}
                      className={`px-2.5 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-widest transition-colors ${
                        modoIA === m
                          ? m === 'manual' ? 'bg-danger text-white' : m === 'digitacao' ? 'bg-gold-500 text-ink-inverse' : 'bg-ai/15 text-ai'
                          : 'text-ink-secondary hover:text-ink-primary'
                      }`}
                    >
                      {rot}
                    </button>
                  ))}
                </div>
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
                
                {modoIA === 'manual' && (
                  <div className="mt-4 p-4 bg-warn/10 border border-warn/30 rounded-xl flex items-start gap-3 fu">
                    <Icon name="triangle-exclamation" className="text-warn mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-warn mb-1">Modo Manual Ativado</p>
                      <p className="text-xs text-ink-secondary leading-relaxed">
                        A transcrição e extração por IA foram pausadas. <strong className="text-ink-primary">A gravação da chamada continua</strong> — ela é obrigação normativa da central (CFM 2.110/2014) e não depende da IA. Utilize o painel acima para preencher os dados clínicos manualmente.
                      </p>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* IA sobre digitação: o TARM digita como no sistema da central e a
                  classificação ao lado reage ao texto. Extração de DEMONSTRAÇÃO
                  por palavras-chave — rotulada; sem modelo real (SEC-20). */}
              {modoIA === 'digitacao' && (
                <div className="p-3.5 border-t border-border-subtle bg-elevated shrink-0">
                  <div className="text-[0.6rem] font-mono font-bold uppercase tracking-widest text-gold-500 mb-1.5 flex items-center gap-1.5">
                    <Icon name="keyboard" /> IA sobre digitação — sem escuta
                  </div>
                  <textarea
                    value={textoDigitado}
                    onChange={e => setTextoDigitado(e.target.value)}
                    placeholder="Digite a ocorrência como no sistema da central — a classificação ao lado reage ao texto…"
                    rows={3}
                    className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-gold-500 resize-none"
                  />
                  <div className="text-[0.55rem] font-mono text-ink-tertiary mt-1.5">
                    Extração de demonstração por palavras-chave — sem modelo real. Sem sinal no texto, a classificação permanece pendente.
                  </div>
                </div>
              )}
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
                            setExtractedData(c.data);
                            setSelectedVehicleId(null);
                            setRiscoFinal(null);
                            setJustification(null);
                            showToast(`Atendimento ${c.num} em foco`, 'info');
                          }}
                          className={`w-full p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${active ? 'bg-gold-500/10 border-gold-500' : 'bg-surface border-border-subtle hover:border-gold-500'}`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${(RISCO_UI[c.data.risk] || RISCO_UI.PENDING).dot}`}></span>
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
                <span className={`chip ${(RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).chip} text-[0.6rem]`}>{RISCO_LABEL[extractedData.risk] || extractedData.risk}</span>
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
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-ai mb-1 flex items-center justify-between">
                      Recomendação do Sistema
                      {extractedData.confidence.protocol > 0 && <span className="text-[0.55rem] text-ai font-mono bg-ai/10 px-1.5 py-0.5 rounded">CONF: {(extractedData.confidence.protocol * 100).toFixed(0)}%</span>}
                    </h3>
                    <p className="text-xs text-ink-primary leading-relaxed mb-3">
                      Com base nos sintomas extraídos, o protocolo sugerido é <strong>{extractedData.protocol}</strong>. Recomenda-se envio imediato de Suporte Avançado de Vida.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle flex items-center gap-2">
                        <span className="text-[0.65rem] text-ink-secondary uppercase tracking-widest">Prioridade</span>
                        <span className={`text-xs font-bold ${(RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).text}`}>{RISCO_LABEL[extractedData.risk] || extractedData.risk}</span>
                      </div>
                      <CronometroMeta inicio={regulacaoInicio} agora={time} rotulo="EM REGULAÇÃO" />
                      <div className="px-3 py-1.5 rounded-lg bg-surface border border-border-subtle flex items-center gap-2">
                        <span className="text-[0.65rem] text-ink-secondary uppercase tracking-widest">Recurso</span>
                        <span className="text-xs font-bold text-ink-primary">USA (UTI Móvel)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Classificação de risco — A DECISÃO É DO MÉDICO. A sugestão da IA é
                    proposta; sem escolha explícita aqui, o despacho fica bloqueado.
                    Nada de default silencioso (havia um YELLOW automático — removido). */}
                <div className="p-4 bg-surface border border-border-subtle rounded-xl">
                  <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-1 flex items-center gap-2">
                    <Icon name="user-doctor" className="text-gold-500" /> Classificação de risco — decisão do regulador
                  </h3>
                  <p className="text-[0.65rem] text-ink-tertiary mb-3">A sugestão do sistema está marcada. Confirme ou classifique diferente — divergência exige justificativa.</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([
                      { c: 'RED', l: 'VERMELHO', cls: 'text-danger border-danger/50', sel: 'bg-danger text-white border-danger' },
                      { c: 'ORANGE', l: 'LARANJA', cls: 'text-orange-500 border-orange-500/50', sel: 'bg-orange-500 text-white border-orange-500' },
                      { c: 'YELLOW', l: 'AMARELO', cls: 'text-warn border-warn/50', sel: 'bg-warn text-ink-inverse border-warn' },
                      { c: 'GREEN', l: 'VERDE', cls: 'text-ok border-ok/50', sel: 'bg-ok text-white border-ok' },
                      { c: 'BLUE', l: 'AZUL', cls: 'text-info border-info/50', sel: 'bg-info text-white border-info' },
                    ] as const).map(o => {
                      const sugerido = extractedData.risk === o.c;
                      const ativo = riscoFinal === o.c;
                      return (
                        <button
                          key={o.c}
                          onClick={() => { setRiscoFinal(o.c); audit('RISCO_CLASSIFICADO', { risco: o.c, sugestao: extractedData.risk, divergiu: extractedData.risk !== 'PENDING' && o.c !== extractedData.risk }); }}
                          className={`min-h-[46px] px-0.5 rounded-lg border text-[0.5rem] min-[420px]:text-[0.55rem] md:text-[0.6rem] font-bold uppercase tracking-tight md:tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 ${ativo ? o.sel : `bg-elevated hover:scale-[1.03] ${o.cls}`}`}
                        >
                          {o.l}
                          {sugerido && <span className={`text-[0.5rem] font-mono normal-case tracking-normal ${ativo ? 'opacity-80' : 'text-ai'}`}>sugerido</span>}
                        </button>
                      );
                    })}
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

                {/* Divergent Decision Justification — obrigatória quando o risco
                    escolhido difere da sugestão (gate do despacho), e também exibida
                    quando a viatura escolhida não é a recomendada. */}
                {(riscoDiverge || (selectedVehicleId && selectedVehicleId !== vehicles.filter(v => v.type.includes('USA'))[0]?.id)) && (
                  <div className={`p-4 bg-surface border rounded-xl shrink-0 ${riscoDiverge && !justification ? 'border-warn/60 shadow-[0_0_16px_rgba(240,180,41,0.12)]' : 'border-border-subtle'}`}>
                    <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-secondary mb-3 flex items-center gap-2">
                      <Icon name="code-branch" /> Decisão Divergente {riscoDiverge && <span className="chip chip-warn text-[0.55rem]">justificativa obrigatória</span>}
                    </h3>
                    <p className="text-xs text-ink-primary mb-3">{riscoDiverge ? `Você classificou ${RISCO_LABEL[riscoFinal!] || riscoFinal} e o sistema sugeriu ${RISCO_LABEL[extractedData.risk] || extractedData.risk}. Registre a justificativa — ela vai à auditoria e treina o modelo:` : 'Se a sua decisão for diferente da recomendação, selecione a justificativa abaixo para fins de auditoria e aprendizado do sistema:'}</p>
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

              {/* Recomendação de despacho — o sistema SUGERE; quem aciona é a regulação
                  (copiloto, não piloto: a copy anterior dizia "o sistema aciona"). */}
              <div className="p-3 rounded-xl bg-ai/5 border border-ai/30 text-[0.7rem] text-ink-secondary flex items-start gap-2 shrink-0">
                <Icon name="robot" className="text-ai mt-0.5" />
                <span><b className="text-ai">Recomendação de despacho:</b> o sistema sugere {recommendedVehicles[0]?.id || 'USA-01'} (melhor ETA × gravidade). A decisão e o acionamento são da regulação — confirme abaixo, ou altere a viatura ao lado.</span>
              </div>
              <button 
                onClick={() => {
                  setIsDispatching(true);
                  const codigo = selectedVehicleId || recommendedVehicles[0]?.id || 'USA-01';
                  if (connected && occId) {
                    supabase.from('ocorrencias').update({
                      risco_final: riscoFinal,
                      divergencia_justificativa: riscoDiverge ? justification : null,
                      regulador_id: role === 'MEDICO' ? authUserId : null,
                    }).eq('id', occId).then();
                    const vid = vehicleIds[codigo];
                    if (vid) {
                      supabase.from('despachos')
                        .insert({ tenant_id: TENANT_ID, ocorrencia_id: occId, viatura_id: vid })
                        .select('id').single()
                        .then(({ data }) => { if (data) setDispatchId(data.id); });
                    }
                    audit('DESPACHO_CONFIRMADO', { viatura: codigo, risco: riscoFinal, sugestao: extractedData.risk, divergiu: riscoDiverge, justificativa: riscoDiverge ? justification : null });
                  }
                  setTimeout(() => {
                    setIsDispatching(false);
                    setIncomingCall(false);
                    showToast('Viatura acionada e despachada com sucesso!', 'success');
                    setCurrentModule('VIATURA');
                  }, 800);
                }}
                disabled={isDispatching || !podeDespachar}
                className="w-full py-4 px-3 bg-gradient-to-r from-danger to-danger/80 text-white font-extrabold font-sans uppercase tracking-wider text-xs md:text-sm rounded-xl shadow-[0_0_30px_rgba(229,57,53,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shrink-0 disabled:opacity-60 disabled:hover:scale-100 disabled:shadow-none"
              >
                {isDispatching ? (
                  <><Icon name="circle-notch" className="animate-spin text-lg" /> Acionando...</>
                ) : (
                  <><Icon name="truck-fast" className="text-base shrink-0" /> <span className="whitespace-normal leading-snug text-center">Confirmar Despacho · {selectedVehicleId || recommendedVehicles[0]?.id || 'USA-01'}</span></>
                )}
              </button>
              {!podeDespachar && !isDispatching && (
                <p className="text-[0.65rem] font-mono text-warn text-center shrink-0 -mt-1">
                  {riscoFinal === null ? 'Classifique o risco para liberar o despacho — a decisão é do regulador.' : 'Divergência da sugestão: selecione a justificativa para liberar o despacho.'}
                </p>
              )}
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
                    className="absolute right-4 lg:top-4 max-lg:bottom-12 z-10 px-4 py-3 min-h-[48px] rounded-xl bg-gold-500 text-ink-inverse text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(191,154,61,0.4)] hover:bg-gold-300 transition-colors whitespace-nowrap"
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
                  (RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).bg
                }`}>
                  <div>
                    <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-secondary mb-1">Classificação Manchester</div>
                    <div className={`text-2xl font-disp font-bold ${
                      (RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).text
                    }`}>
                      {(RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).label}
                    </div>
                  </div>
                  <div className={`w-14 h-14 rounded-full border-4 ${
                    (RISCO_UI[extractedData.risk] || RISCO_UI.PENDING).ring
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
                <div className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mb-2 text-center">Desfecho operacional · 1 toque libera a viatura — a conclusão clínica é da regulação</div>
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
              {/* Trava de sequência: tempo probatório não se sobrescreve. Só o PRÓXIMO
                  passo é acionável; marca feita é imutável e mostra o horário; pular
                  exige confirmação (2 toques) e fica registrado — o buraco em T2/T3
                  vira decisão auditada da equipe, nunca acidente de toque com luva. */}
              {(() => {
                const nextIdx = MISSION_STEPS.findIndex(s => !missionMarks[s]);
                return MISSION_STEPS.map((step, i) => {
                  const marca = missionMarks[step];
                  const isNext = i === nextIdx;
                  const armado = skipArm === step;
                  const marcar = (comSalto: boolean) => {
                    const hora = new Date().toLocaleTimeString('pt-BR');
                    setMissionMarks(prev => ({ ...prev, [step]: hora }));
                    setSkipArm(null);
                    setMissionStatus(step);
                    const col = ({ 'A CAMINHO': 't1_a_caminho', 'NO LOCAL': 't2_no_local', 'TRANSPORTANDO': 't3_transportando', 'NO HOSPITAL': 't4_no_hospital' } as Record<string, string>)[step];
                    if (connected && dispatchId && col) supabase.from('despachos').update({ [col]: new Date().toISOString() }).eq('id', dispatchId).then();
                    if (comSalto) audit('MISSAO_SALTO_CONFIRMADO', { ate: step, sem_marca: MISSION_STEPS.slice(nextIdx, i), viatura: selectedVehicleId });
                    audit(`MISSAO_${step.replace(/ /g, '_')}`, { viatura: selectedVehicleId, salto: comSalto || undefined });
                    playSound('vehicle', soundEnabledRef.current);
                    showToast(`${selectedVehicleId || 'USA-01'} → ${step} · ${hora}`, 'success');
                  };
                  return (
                    <button
                      key={step}
                      disabled={!!marca}
                      onClick={() => {
                        if (marca) return;
                        if (isNext) { marcar(false); return; }
                        if (armado) { marcar(true); return; }
                        setSkipArm(step);
                        setTimeout(() => setSkipArm(prev => (prev === step ? null : prev)), 4000);
                      }}
                      className={`min-h-[60px] rounded-xl text-[0.65rem] md:text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 border ${
                        marca
                          ? 'bg-ok/15 text-ok border-ok/40 cursor-default'
                          : isNext
                            ? 'bg-gold-500 text-ink-inverse border-gold-500 shadow-[0_0_20px_rgba(191,154,61,0.4)]'
                            : armado
                              ? 'bg-warn/15 text-warn border-warn/60 animate-pulse'
                              : 'bg-elevated text-ink-secondary/60 border-border-subtle hover:border-warn/50'
                      }`}
                    >
                      {marca && <Icon name="circle-check" />}
                      {armado ? 'PULAR ATÉ AQUI?' : step}
                      {marca ? <span className="font-mono text-[0.55rem] normal-case tracking-normal opacity-80">{marca}</span>
                        : armado ? <span className="font-mono text-[0.5rem] normal-case tracking-normal">toque de novo p/ confirmar</span> : null}
                    </button>
                  );
                });
              })()}
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
              </div>
              <div className="gp p-5 rounded-2xl border-l-4 border-l-ok">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">T. MÉDIO REGULAÇÃO</div>
                <div className="text-4xl font-disp font-bold text-ok mb-2">1m 12s</div>
                <div className="text-xs text-ok/70">da chamada atendida à decisão do regulador · demonstração</div>
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

      {/* BOTTOM NAV (OSX Dock Style)
          O invólucro é pointer-events-none: com 48px de altura interativa no desktop,
          ele ENGOLIA o clique de qualquer botão de conteúdo na faixa inferior (provado
          em teste — o "Confirmar AML" ficava com a metade de baixo morta). Só a faixa
          fina de hover, a área de toque mobile e a própria nav recebem eventos. */}
      <div className="fixed bottom-0 left-0 right-0 h-8 md:h-12 z-[1000] flex justify-center items-end pb-4 md:pb-6 pointer-events-none">
        {/* Faixa fina de hover (desktop): abre a nav sem bloquear cliques acima dela */}
        <div
          className="absolute inset-x-0 bottom-0 h-2.5 hidden md:block pointer-events-auto"
          onMouseEnter={() => setIsNavOpen(true)}
        ></div>

        {/* Mobile Toggle Area (Invisible hit area to open nav on tap) */}
        <div
          className="absolute inset-0 md:hidden pointer-events-auto"
          onClick={() => setIsNavOpen(!isNavOpen)}
        ></div>

        {/* Mobile Indicator (Small pill at the bottom) */}
        <div className={`absolute bottom-2 w-12 h-1.5 bg-ink-secondary/30 rounded-full md:hidden transition-opacity duration-300 pointer-events-none ${isNavOpen ? 'opacity-0' : 'opacity-100'}`}></div>

        <nav
          className={`relative p-2 rounded-full flex gap-2 bg-surface/90 border border-border-subtle shadow-[0_15px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl overflow-x-auto max-w-[92vw] no-scrollbar snap-x snap-mandatory transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isNavOpen ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto' : 'translate-y-full opacity-0 scale-95 pointer-events-none'
          }`}
          onMouseEnter={() => setIsNavOpen(true)}
          onMouseLeave={() => setIsNavOpen(false)}
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
