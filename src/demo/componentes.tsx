// Componentes de TEATRO da demonstração: máquina de escrever, forma de onda
// sintética, mapa esquemático, overlay de chamada entrante e seletor de
// cenários. No build de operação nada disto entra no bundle — o plugue
// inerte substitui cada um (docs/24).
import { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon';
import { CENARIOS_DEMO } from './dados/cenarios';

const KEYWORDS = ['dor no peito', 'falta de ar', 'infarto', 'parada', 'sangramento', 'desmaio', 'pressão', 'suando', 'formigamento', 'braço', 'cabeça', 'tontura', 'consciente', 'inconsciente', 'respirando', 'coração', 'dor', 'sangue'];

export const TypingMessage = ({ text }: { text: string }) => {
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
    // Fronteira de palavra Unicode: sem isso "dor" acendia dentro de "regulador"
    // e "braço" dentro de "abraço" (visto em produção, print do Ota 24/08).
    const regex = new RegExp(`(?<![\\p{L}\\p{N}])(${KEYWORDS.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
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

export const AudioWaveform = ({ active }: { active: boolean }) => (
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

// Mapa esquemático local — usado no modo demonstração (sem backend): a demo é
// aberta em sala de reunião, pen drive e rede hostil, e um iframe de mapa sem
// rede vira ícone de imagem quebrada no meio da tela. Zero requisição externa;
// cores pelos tokens do tema (currentColor/classes), nunca hex novo.
export function MapaEsquematico({ pino, rota }: { pino?: boolean; rota?: boolean }) {
  return (
    <div className="relative w-full h-full bg-elevated overflow-hidden">
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full text-ink-secondary/25" aria-hidden="true">
        {/* malha viária */}
        {[40, 90, 140, 190, 240].map(y => <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="currentColor" strokeWidth="1" />)}
        {[60, 120, 180, 240, 300, 360].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300" stroke="currentColor" strokeWidth="1" />)}
        {/* avenidas */}
        <line x1="0" y1="270" x2="400" y2="150" stroke="currentColor" strokeWidth="2.5" />
        <line x1="30" y1="0" x2="250" y2="300" stroke="currentColor" strokeWidth="2.5" />
        {/* quadras de referência */}
        <rect x="70" y="50" width="38" height="28" rx="3" fill="currentColor" opacity=".35" />
        <rect x="200" y="100" width="46" height="30" rx="3" fill="currentColor" opacity=".35" />
        <rect x="300" y="200" width="40" height="26" rx="3" fill="currentColor" opacity=".35" />
        <rect x="130" y="200" width="34" height="24" rx="3" fill="currentColor" opacity=".35" />
        {rota && (
          <path d="M60,260 L120,220 L180,190 L200,150 L200,150" className="text-gold-500" stroke="currentColor" strokeWidth="2.5" strokeDasharray="7 6" fill="none" strokeLinecap="round" />
        )}
        {pino && (
          <g className="text-danger">
            <circle cx="200" cy="150" r="16" fill="currentColor" opacity=".18" />
            <circle cx="200" cy="150" r="6" fill="currentColor" />
          </g>
        )}
      </svg>
      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-canvas/80 border border-border-subtle text-[0.55rem] font-mono uppercase tracking-widest text-ink-secondary">
        Mapa esquemático · demonstração
      </div>
    </div>
  );
}

// Seletor de cenário — ferramenta de APRESENTAÇÃO: permite dirigir a
// próxima chamada (IAM, AVC, trote, sem AML…) em vez de torcer pelo
// sorteio. Aleatório usa bolsa: todos os cenários antes de repetir.
export function SeletorDeCenarios({ valor, aoEscolher }: { valor: string; aoEscolher: (id: string) => void }) {
  return (
    <div className="w-full max-w-7xl px-5 mb-8">
      <div className="gp rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-[0.6rem] font-mono uppercase tracking-widest text-ink-tertiary mr-1 shrink-0">Demonstração · próxima chamada</span>
        <button
          onClick={() => aoEscolher('aleatorio')}
          className={`px-3 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border transition-colors ${valor === 'aleatorio' ? 'bg-gold-500 text-ink-inverse border-gold-500' : 'bg-elevated border-border-subtle text-ink-secondary hover:border-gold-500'}`}
        >
          Aleatório
        </button>
        {CENARIOS_DEMO.map(c => (
          <button
            key={c.id}
            onClick={() => aoEscolher(c.id)}
            className={`px-3 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border transition-colors ${valor === c.id ? 'bg-gold-500 text-ink-inverse border-gold-500' : 'bg-elevated border-border-subtle text-ink-secondary hover:border-gold-500'}`}
          >
            {c.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}

// Selo de simulação do painel de extração (SEC-20: claim mapeado a roadmap).
export const SeloSimulacaoTriagem = () => (
  <div className="text-[0.6rem] font-mono text-ink-tertiary flex items-center gap-2 flex-wrap">
    <Icon name="server" className="text-ink-tertiary" /> Triagem assistida em simulação · roteiro de demonstração (sem transcrição real)
  </div>
);

// Overlay de chamada entrante — TEATRO: no produto real não existe botão de
// atender; a triagem abre sozinha quando o TARM atende no sistema da central
// (shadow — docs/09 §1). O botão SIMULA esse evento na demonstração.
export function OverlayChamada({ telefone, aoAtender, aoDispensar }: { telefone: string; aoAtender: () => void; aoDispensar: () => void }) {
  return (
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
          <span className="text-ink-primary font-mono text-xl md:text-2xl font-bold truncate">{telefone}</span>
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
          <button onClick={aoDispensar} className="flex-1 px-4 py-3 rounded-xl border border-border-subtle text-ink-secondary font-bold tracking-widest hover:bg-elevated transition-all text-xs md:text-sm whitespace-nowrap">
            DISPENSAR · DEMO
          </button>
          <button onClick={aoAtender} className="flex-[1.7] px-4 py-3 bg-ok text-ink-inverse font-extrabold font-disp text-xs md:text-base rounded-xl shadow-[0_0_30px_rgba(67,160,71,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-2 md:gap-3">
            <Icon name="headset" /> <span className="leading-tight">SIMULAR ATENDIMENTO NA CENTRAL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
