import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from './lib/theme';
import { Icon } from './ui/Icon';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const [currentModule, setCurrentModule] = useState<'IDLE' | 'AML' | 'TARM' | 'REGULADOR' | 'VIATURA' | 'DASHBOARD'>('IDLE');
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
  const [showCameraModal, setShowCameraModal] = useState(false);
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

      timer = setTimeout(() => {
        const randomCaller = MOCK_CALLERS[Math.floor(Math.random() * MOCK_CALLERS.length)];
        setCurrentCaller(randomCaller);
        setAmlData(null);
        setIncomingCall(true);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [isAuthenticated, currentModule, incomingCall]);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsAuthenticating(false);
    }, 1500);
  };

  const acceptCall = () => {
    setIncomingCall(false);
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
          setCurrentModule('REGULADOR');
        }}
        className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-700 text-ink-inverse font-extrabold font-sans uppercase tracking-widest text-sm rounded-xl shadow-[0_0_30px_rgba(191,154,61,0.2)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
      >
        <Icon name="user-doctor" className="text-lg" /> Handoff & Ir para Regulador
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
            <img src="/brand/samais-monograma-gold.svg" alt="Samais" className="h-16 mb-2" />
            <img src="/brand/samais-logo-white-currentcolor.svg" alt="SAMAIS" className="h-7 text-ink-primary" />
            <p className="text-xs text-gold-500 uppercase tracking-widest font-mono mt-1">SAMU CoPilot OS</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="lbl">Matrícula Operacional</label>
              <div className="relative">
                <Icon name="id-badge" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary/50" />
                <input type="text" className="inp pl-10" placeholder="Ex: TARM-04" required defaultValue="TARM-04" />
              </div>
            </div>
            
            <div>
              <label className="lbl">Senha de Acesso</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary/50" />
                <input type="password" className="inp pl-10" placeholder="••••••••" required defaultValue="password" />
              </div>
            </div>

            <div className="p-4 bg-elevated border border-border-subtle rounded-xl mt-2 flex items-start gap-3">
              <Icon name="fingerprint" className="text-ai text-xl mt-0.5" />
              <div>
                <p className="text-xs font-bold text-ink-primary">Verificação Biométrica MFA</p>
                <p className="text-[0.65rem] text-ink-secondary font-mono mt-1">Requisito LGPD para acesso a dados sensíveis (PII).</p>
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
          <img src="/brand/samais-monograma-gold.svg" alt="Samais" className="h-9 shrink-0" />
          <div className="hidden sm:block">
            <img src="/brand/samais-logo-white-currentcolor.svg" alt="SAMAIS" className="h-4 text-ink-primary" />
            <div className="text-[0.6rem] text-gold-500 uppercase tracking-widest font-mono">
              {currentModule === 'IDLE' ? 'Central 192 — Dashboard' : 'Central 192 — Recepção AML'}
            </div>
          </div>
          <button
            onClick={() => setCurrentModule('DASHBOARD')}
            className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${currentModule === 'DASHBOARD' ? 'bg-gold-500/20 border border-gold-500 text-gold-500' : 'bg-elevated border border-border-subtle text-ink-primary hover:bg-surface'}`}
          >
            <Icon name="chart-pie" /> <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>

        <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-1.5 rounded-full border transition-all duration-300 ${currentModule !== 'IDLE' ? 'bg-danger/10 border-danger/50' : 'bg-elevated border-border-subtle'} shadow-inner`}>
          <Icon name="circle" className={`text-[7px] ${currentModule !== 'IDLE' ? 'text-danger animate-pulse' : 'text-ink-secondary'}`} />
          <span className={`text-[0.65rem] font-mono font-bold uppercase tracking-widest ${currentModule !== 'IDLE' ? 'text-danger' : 'text-ink-secondary'}`}>
            {currentModule !== 'IDLE' ? 'EM CHAMADA' : 'EM ESPERA'}
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
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[0.65rem] text-ink-secondary uppercase tracking-widest">Mariana S.</div>
              <div className="text-xs font-bold text-gold-500">TARM-04</div>
            </div>
            <button 
              onClick={() => setIsAuthenticated(false)}
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
        {(currentModule === 'AML' || currentModule === 'TARM' || currentModule === 'REGULADOR' || currentModule === 'VIATURA') && !currentCaller && (
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
                  {MOCK_VEHICLES.map(v => (
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
                <div className="flex-1 relative bg-[#161618]">
                  {IdleMapIframe}
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(7,7,8,0.8)]"></div>
                  
                  {/* Simulated Moving Vehicles */}
                  <div className="absolute top-1/3 left-1/4 z-10 flex flex-col items-center pointer-events-none transition-all duration-[3000ms] ease-linear" style={{ transform: `translate(${Math.sin(time.getTime() / 2000) * 20}px, ${Math.cos(time.getTime() / 2000) * 20}px)` }}>
                    <div className="w-6 h-6 bg-ok border-2 border-white rounded-[50%_50%_50%_0] -rotate-45 shadow-[0_0_15px_rgba(67,160,71,0.7)] flex items-center justify-center">
                      <Icon name="truck-medical" className="text-white text-[0.5rem] rotate-45" />
                    </div>
                    <div className="text-[0.5rem] font-bold text-white bg-canvas/80 px-1 rounded mt-1">USA-01</div>
                  </div>

                  <div className="absolute top-2/3 left-2/3 z-10 flex flex-col items-center pointer-events-none transition-all duration-[2000ms] ease-linear" style={{ transform: `translate(${Math.cos(time.getTime() / 1500) * 30}px, ${Math.sin(time.getTime() / 1500) * 30}px)` }}>
                    <div className="w-6 h-6 bg-ok border-2 border-white rounded-[50%_50%_50%_0] -rotate-45 shadow-[0_0_15px_rgba(67,160,71,0.7)] flex items-center justify-center">
                      <Icon name="motorcycle" className="text-white text-[0.5rem] rotate-45" />
                    </div>
                    <div className="text-[0.5rem] font-bold text-white bg-canvas/80 px-1 rounded mt-1">MOT-01</div>
                  </div>
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
                    <span className="chip chip-warn text-[0.6rem]"><Icon name="keyboard" /> PREENCHIMENTO MANUAL</span>
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
                    <div className="fu">
                      <span className="lbl">Nome do Solicitante</span>
                      <input 
                        type="text" 
                        className="inp bg-surface border-border-subtle text-ink-primary focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all" 
                        placeholder="Digite o nome do solicitante..."
                        defaultValue=""
                      />
                      <div className="mt-2 p-3 bg-surface border border-border-subtle rounded-xl flex items-start gap-3">
                        <Icon name="circle-info" className="text-ink-secondary mt-0.5 text-xs" />
                        <div>
                          <p className="text-[0.65rem] text-ink-secondary font-mono leading-relaxed">
                            Sem lastro no CAD. Preencha manualmente ou aguarde a extração automática da IA no Módulo TARM.
                          </p>
                        </div>
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
                
                <div className="flex-1 relative bg-[#161618] overflow-hidden">
                  {MapIframe || (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-secondary/50">
                      <Icon name="satellite-dish" className="text-4xl mb-3 animate-pulse" />
                      <p className="font-mono text-xs uppercase tracking-widest">Aguardando triangulação...</p>
                    </div>
                  )}
                  {amlData && (
                    <>
                      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(7,7,8,0.8)]"></div>
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
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Fila de Espera</span>
                </div>
                <span className="chip chip-warn text-[0.6rem]">{MOCK_QUEUE.length} na fila</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {MOCK_QUEUE.map(q => (
                  <div key={q.id} className="p-3 rounded-xl bg-surface border border-border-subtle flex flex-col gap-2 relative overflow-hidden">
                    {q.priority === 'high' && <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-ink-primary">{q.phone}</span>
                      <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded font-mono ${q.priority === 'high' ? 'bg-danger/20 text-danger animate-pulse' : 'bg-elevated text-ink-secondary'}`}>
                        {q.waitTime}
                      </span>
                    </div>
                    <div className="text-[0.6rem] text-ink-secondary uppercase tracking-widest">Aguardando TARM</div>
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
                  {/* Telemetry Panel */}
                  <div className="p-3 rounded-xl border border-border-subtle bg-elevated/50 flex flex-col gap-2">
                    <div className="text-[0.6rem] font-bold uppercase tracking-widest text-ink-secondary flex items-center gap-2 mb-1">
                      <Icon name="server" className="text-gold-500" /> Telemetria do Sistema
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.65rem] font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-ink-secondary">STT Engine:</span>
                        <span className="text-ai font-bold">Deepgram Nova-2</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ink-secondary">Latência:</span>
                        <span className="text-ok font-bold">~118ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ink-secondary">LLM Engine:</span>
                        <span className="text-gold-500 font-bold">Gemini 1.5 Flash</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ink-secondary">Confiança:</span>
                        <span className="text-ok font-bold">98.4%</span>
                      </div>
                    </div>
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

              <div className="flex-1 p-5 lg:overflow-y-auto flex flex-col gap-4 bg-[#0E0E10]">
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
            <div className="flex lg:hidden flex-col gap-2 shrink-0 order-3 w-full mt-2 sticky bottom-0 bg-[#070708] pt-2 pb-4 z-10">
              {handoffCTAs}
            </div>
          </div>
        )}
        {currentModule === 'REGULADOR' && currentCaller && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 fu min-h-0 overflow-y-auto lg:overflow-hidden pb-6 lg:pb-0">
            {/* Left Panel: Handoff Summary & Chat */}
            <div className="w-full lg:w-[300px] gp rounded-2xl flex flex-col overflow-hidden shrink-0">
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
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(7,7,8,0.8)]"></div>
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

              {/* Dispatch CTA */}
              <button 
                onClick={() => {
                  setIsDispatching(true);
                  setTimeout(() => {
                    setIsDispatching(false);
                    setIncomingCall(false);
                    showToast('Viatura acionada e despachada com sucesso!', 'success');
                    setCurrentModule('VIATURA');
                  }, 800);
                }}
                disabled={isDispatching}
                className="w-full py-4 bg-gradient-to-r from-danger to-danger/80 text-white font-extrabold font-sans uppercase tracking-widest text-sm rounded-xl shadow-[0_0_30px_rgba(229,57,53,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shrink-0 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isDispatching ? (
                  <><Icon name="circle-notch" className="animate-spin text-lg" /> Acionando...</>
                ) : (
                  <><Icon name="truck-fast" className="text-lg" /> Acionar Viatura</>
                )}
              </button>
            </div>
          </div>
        )}

        {currentModule === 'VIATURA' && currentCaller && (
          <div className="flex-1 flex flex-col relative fu min-h-0 -m-4 md:-m-5 overflow-hidden">
            {/* Top Bar for Vehicle */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-canvas/90 to-transparent z-20 flex justify-between items-start pointer-events-none">
              <button className="pointer-events-auto w-12 h-12 bg-danger/90 backdrop-blur border border-danger/50 rounded-full text-white shadow-[0_0_20px_rgba(229,57,53,0.4)] flex items-center justify-center text-lg hover:scale-105 transition-transform">
                <Icon name="triangle-exclamation" />
              </button>
              <div className="flex flex-col gap-2 pointer-events-auto items-end">
                <button className="px-4 py-2 bg-canvas/90 backdrop-blur border border-border-subtle rounded-full text-xs font-bold text-ink-primary shadow-lg flex items-center gap-2">
                  <Icon name={selectedVehicleId?.includes('MOT') ? 'motorcycle' : 'truck-medical'} className="text-gold-500" /> {selectedVehicleId || 'VIATURA'}
                </button>
                <span className="px-3 py-1 bg-warn/20 border border-warn/30 text-warn text-[0.65rem] font-bold rounded-full w-fit flex items-center gap-1.5 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse"></span> QTI - A CAMINHO
                </span>
              </div>
            </div>

            {/* Full screen map */}
            <div className="absolute inset-0 bg-[#161618]">
              {MapIframe || (
                <div className="w-full h-full flex items-center justify-center text-ink-secondary">Sem dados de localização</div>
              )}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(7,7,8,0.8)]"></div>
            </div>

            {/* Floating Action Buttons (Right Side) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
              <button className="w-12 h-12 bg-surface/90 backdrop-blur border border-border-subtle rounded-full text-ink-primary shadow-lg flex items-center justify-center text-lg hover:bg-elevated transition-colors">
                <Icon name="location-arrow" className="text-ai" />
              </button>
              <button className="w-12 h-12 bg-surface/90 backdrop-blur border border-border-subtle rounded-full text-ink-primary shadow-lg flex items-center justify-center text-lg hover:bg-elevated transition-colors">
                <Icon name="walkie-talkie" className="text-gold-500" />
              </button>
              <button onClick={() => setShowCameraModal(true)} className="w-12 h-12 bg-surface/90 backdrop-blur border border-border-subtle rounded-full text-ink-primary shadow-lg flex items-center justify-center text-lg hover:bg-elevated transition-colors">
                <Icon name="camera" className="text-ok" />
              </button>
            </div>

            {/* Top Floating ETA */}
            <div className="absolute top-24 left-4 right-4 md:top-6 md:left-1/2 md:-translate-x-1/2 md:w-fit bg-canvas/90 backdrop-blur-md border border-border-subtle px-4 py-2 rounded-xl shadow-2xl flex items-center justify-center gap-4 z-10">
              <div className="text-center">
                <div className="text-xl font-disp font-bold text-ok">08<span className="text-xs">min</span></div>
                <div className="text-[0.55rem] text-ink-secondary uppercase tracking-widest">ETA</div>
              </div>
              <div className="w-px h-6 bg-hover"></div>
              <div className="text-center">
                <div className="text-sm font-mono font-bold text-ink-primary">4.2<span className="text-[0.6rem]">km</span></div>
                <div className="text-[0.55rem] text-ink-secondary uppercase tracking-widest">Distância</div>
              </div>
            </div>

            {/* Vehicle Telemetry Panel */}
            <div className="absolute top-40 left-4 md:top-24 md:left-4 bg-canvas/90 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-2xl z-10 flex flex-col gap-2 pointer-events-none w-[180px]">
              <div className="text-[0.6rem] font-bold uppercase tracking-widest text-ink-secondary flex items-center gap-2 mb-1">
                <Icon name="satellite" className="text-gold-500" /> Telemetria
              </div>
              <div className="flex flex-col gap-2 text-[0.65rem] font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-ink-secondary">Velocidade:</span>
                  <span className="text-ink-primary font-bold">68 km/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-secondary">Precisão GPS:</span>
                  <span className="text-ok font-bold">±2.5m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-secondary">Conexão:</span>
                  <span className="text-ai font-bold">5G (MQTT)</span>
                </div>
              </div>
            </div>

            {/* Bottom Sheet for Patient Info */}
            <div className="absolute bottom-28 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-canvas/95 backdrop-blur-xl border border-border-subtle rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden pb-2 max-h-[35vh] md:max-h-none">
              {/* Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-hover rounded-full"></div>
              </div>
              <div className="px-4 pb-3 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="file-medical" className="text-gold-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-primary">Handoff Médico</span>
                </div>
                <span className={`chip text-[0.6rem] ${extractedData.risk === 'RED' ? 'chip-danger' : extractedData.risk === 'YELLOW' ? 'chip-warn' : 'chip-ok'}`}>
                  PRIORIDADE {extractedData.risk === 'RED' ? 'VERMELHA' : extractedData.risk === 'YELLOW' ? 'AMARELA' : 'VERDE'}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-3 overflow-y-auto">
                <div>
                  <div className="text-[0.65rem] text-ink-secondary uppercase tracking-widest mb-1">Local da Ocorrência</div>
                  <div className="text-sm font-bold text-ink-primary">{amlData?.address || 'Endereço não disponível'}, {amlData?.number}</div>
                  <div className="text-xs text-ink-secondary">{amlData?.neighborhood} - {amlData?.city}</div>
                </div>
                <div>
                  <div className="text-[0.65rem] text-ink-secondary uppercase tracking-widest mb-1">Paciente</div>
                  <div className="text-sm font-bold text-ink-primary">{extractedData.patientName || 'Desconhecido'} • {extractedData.age || '--'} • {extractedData.gender || '--'}</div>
                </div>
                <div>
                  <div className="text-[0.65rem] text-ink-secondary uppercase tracking-widest mb-1">Suspeita / Protocolo</div>
                  <div className="text-sm font-bold text-danger">{extractedData.protocol}</div>
                </div>
                <div>
                  <div className="text-[0.65rem] text-ink-secondary uppercase tracking-widest mb-1">Sintomas Relatados</div>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.symptoms.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-danger/10 border border-danger/20 text-danger text-[0.65rem]">{s}</span>
                    ))}
                  </div>
                </div>
                
                {/* Action Grid */}
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <button onClick={() => setShowCameraModal(true)} className="py-3.5 bg-ok/20 border border-ok/40 rounded-xl text-xs font-bold text-ok hover:bg-ok/30 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(67,160,71,0.1)]">
                    <Icon name="video" /> Iniciar Live View da Cena
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {currentModule === 'DASHBOARD' && (
          <div className="flex-1 flex flex-col gap-6 fu overflow-y-auto pb-6 pr-2 -mr-2 lg:pr-0 lg:mr-0">
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
                          {['Hoje', '7 dias', '14 dias', '28 dias', '30 dias', '60 dias'].map(p => (
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
                <button className="px-4 py-2 rounded-lg bg-surface border border-border-subtle text-xs font-bold text-ink-primary hover:bg-elevated transition-colors flex items-center gap-2">
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
                <div className="text-xs font-bold text-ok uppercase tracking-widest mb-1">AES-256 · CONFORMIDADE LGPD (LEI 13.709/2018)</div>
                <div className="text-[0.65rem] text-ok/70 truncate">Dados deste painel são estritamente estatísticos e anonimizados. Trânsito via túnel criptografado. Cadeia de custódia imutável com hash SHA-256 em cada registro.</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="px-2 py-1 rounded border border-ok/30 text-[0.65rem] font-bold text-ok mb-1">Auditável</div>
                <div className="text-[0.55rem] text-ok/50 uppercase tracking-widest">TCU · MP · ANPD</div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="gp p-5 rounded-2xl border-l-4 border-l-ink-secondary">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">CHAMADAS RECEBIDAS</div>
                <div className="text-4xl font-disp font-bold text-ink-primary mb-2">1.432</div>
                <div className="text-xs text-ok"><Icon name="arrow-trend-up" /> +5% vs período anterior</div>
              </div>
              <div className="gp p-5 rounded-2xl border-l-4 border-l-gold-500 relative overflow-hidden">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">TROTES FILTRADOS (SCORE IA)</div>
                <div className="text-4xl font-disp font-bold text-gold-500 mb-2">418</div>
                <div className="text-xs text-gold-500/70">~29% do total</div>
                <div className="absolute bottom-4 right-4 px-2 py-1 rounded bg-gold-500/10 border border-gold-500/30 text-xs font-mono font-bold text-gold-500">R$ 38k</div>
              </div>
              <div className="gp p-5 rounded-2xl border-l-4 border-l-ok">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">T. MÉDIO REGULAÇÃO</div>
                <div className="text-4xl font-disp font-bold text-ok mb-2">1m 12s</div>
                <div className="text-xs text-ok/70"><Icon name="arrow-trend-down" /> -45s vs Média Nac.</div>
              </div>
              <div className="gp p-5 rounded-2xl border-l-4 border-l-danger">
                <div className="text-[0.65rem] font-bold text-ink-secondary uppercase tracking-widest mb-2">DESPACHOS USA (VERMELHO)</div>
                <div className="text-4xl font-disp font-bold text-danger mb-2">94</div>
                <div className="text-xs text-ink-secondary">Acurácia (Ground Truth): <span className="text-ok">96.8%</span></div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[400px]">
              {/* Left Chart */}
              <div className="gp p-5 rounded-2xl flex flex-col min-h-[300px]">
                <div className="text-xs font-bold text-ink-primary uppercase tracking-widest mb-6">VOLUME VS TEMPO DE RESPOSTA</div>
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={[
                      { time: '06h', volume: 45, responseTime: 6 },
                      { time: '08h', volume: 80, responseTime: 8 },
                      { time: '10h', volume: 110, responseTime: 12 },
                      { time: '12h', volume: 95, responseTime: 10 },
                      { time: '14h', volume: 105, responseTime: 9 },
                      { time: '16h', volume: 130, responseTime: 14 },
                      { time: '18h', volume: 150, responseTime: 15 },
                      { time: '20h', volume: 120, responseTime: 11 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2B33" vertical={false} />
                      <XAxis dataKey="time" stroke="#6E6E78" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#6E6E78" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="#6E6E78" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#161618', borderColor: '#3A3B45', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ fontSize: '12px', color: '#6E6E78', marginBottom: '4px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Bar yAxisId="left" dataKey="volume" name="Volume Ocorrências" fill="#6E8AAA" radius={[4, 4, 0, 0]} barSize={40} />
                      <Line yAxisId="right" type="monotone" dataKey="responseTime" name="T. Médio Resposta (min)" stroke="#BF9A3D" strokeWidth={2} dot={{ r: 4, fill: '#BF9A3D' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Chart */}
              <div className="gp p-5 rounded-2xl flex flex-col min-h-[300px]">
                <div className="text-xs font-bold text-ink-primary uppercase tracking-widest mb-6">CLASSIFICAÇÃO DE DESPACHOS</div>
                <div className="flex-1 w-full h-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Vermelho (USA)', value: 94, color: '#E53935' },
                          { name: 'Amarelo (USA/USB)', value: 150, color: '#FDD835' },
                          { name: 'Verde (USB)', value: 250, color: '#43A047' },
                          { name: 'Azul (Orientações)', value: 120, color: '#1E88E5' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="85%"
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {[
                          { name: 'Vermelho (USA)', value: 94, color: '#E53935' },
                          { name: 'Amarelo (USA/USB)', value: 150, color: '#FDD835' },
                          { name: 'Verde (USB)', value: 250, color: '#43A047' },
                          { name: 'Azul (Orientações)', value: 120, color: '#1E88E5' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#161618', borderColor: '#3A3B45', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px', color: '#fff' }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Calls History */}
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
                      <tr key={idx} className="border-b border-border-subtle/50 hover:bg-elevated/50 transition-colors">
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
              </div>
            </div>
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
          className={`relative p-2 rounded-full flex gap-2 bg-surface/90 border border-border-subtle shadow-[0_15px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-x-auto max-w-[92vw] no-scrollbar snap-x snap-mandatory transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isNavOpen ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto' : 'translate-y-full opacity-0 scale-95 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside nav
        >
          <button 
            onClick={() => { setCurrentModule('IDLE'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'IDLE' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="house-signal" /> Home
          </button>
          <button 
            onClick={() => { setCurrentModule('AML'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'AML' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="location-crosshairs" /> Ligação
          </button>
          <button 
            onClick={() => { setCurrentModule('TARM'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'TARM' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="microphone-lines" /> TARM
          </button>
          <button 
            onClick={() => { setCurrentModule('REGULADOR'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'REGULADOR' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="user-doctor" /> Médico
          </button>
          <button 
            onClick={() => { setCurrentModule('VIATURA'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'VIATURA' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="truck-medical" /> Viatura
          </button>
          <button
            onClick={() => { setCurrentModule('DASHBOARD'); setIsNavOpen(false); }}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2 transition-all shrink-0 snap-center ${currentModule === 'DASHBOARD' ? 'bg-gold-500 text-ink-inverse shadow-[0_0_20px_rgba(191,154,61,0.6)]' : 'text-ink-secondary hover:bg-hover'}`}
          >
            <Icon name="chart-simple" /> Dashboard
          </button>
        </nav>
      </div>
    </div>
  );
}
