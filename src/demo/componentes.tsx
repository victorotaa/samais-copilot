// Componentes de TEATRO da demonstração: máquina de escrever, forma de onda
// sintética e mapa esquemático. No build de operação nada disto entra no
// bundle — o plugue inerte substitui cada um (docs/24).
import { useEffect, useState } from 'react';

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
