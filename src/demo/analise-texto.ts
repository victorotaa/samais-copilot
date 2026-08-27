// ── IA sobre digitação (modo 2 da doutrina — docs/05 §2) ──────────────────
// Extração DETERMINÍSTICA por palavras-chave sobre o texto que o TARM digita.
// É simulação rotulada (sem modelo real): demonstra o fluxo — o TARM digita
// como no sistema próprio da central e a IA rankeia/chaveia o quadro a partir
// do texto. Sem sinal identificado → PENDING; nunca palpite (Princípio da
// Realidade). Ordem das regras = prioridade clínica (vermelho primeiro).
const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const REGRAS_TEXTO: { sinais: RegExp; symptoms: string[]; risk: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'; protocol: string }[] = [
  { sinais: /(dor no peito|aperto no peito|infarto)/, symptoms: ['Dor torácica'], risk: 'RED', protocol: 'Suspeita de IAM (Infarto)' },
  { sinais: /(engasg|asfixia|nao respira|sem respirar|parada)/, symptoms: ['Obstrução de vias aéreas / apneia'], risk: 'RED', protocol: 'OVACE / Parada — resposta imediata' },
  { sinais: /(inconsciente|desmaiad|nao acorda|sem sentidos)/, symptoms: ['Inconsciência'], risk: 'RED', protocol: 'Rebaixamento de consciência' },
  { sinais: /(boca torta|fala enrolada|derrame|\bavc\b|sem forca no braco|braco nao obedece)/, symptoms: ['Déficit neurológico agudo'], risk: 'ORANGE', protocol: 'Suspeita de AVC — janela terapêutica' },
  { sinais: /(trabalho de parto|contraco|bolsa (estourou|rompeu|rota))/, symptoms: ['Trabalho de parto ativo'], risk: 'ORANGE', protocol: 'Obstétrico — parto iminente' },
  { sinais: /(acidente|atropel|colisao|capot|queda de (moto|andaime|altura)|fratura)/, symptoms: ['Vítima de trauma'], risk: 'YELLOW', protocol: 'Trauma — avaliação' },
  { sinais: /(dor nas costas|lombalgia|gripe|resfriado|receita|dor de garganta)/, symptoms: ['Queixa de baixa complexidade'], risk: 'GREEN', protocol: 'Orientação — rede básica (UBS)' },
];
const SINAIS_EXTRA: { re: RegExp; s: string }[] = [
  { re: /(suando|sudorese|suor frio)/, s: 'Sudorese fria' },
  { re: /(falta de ar|dispneia|nao consegue respirar)/, s: 'Dispneia' },
  { re: /(sangra|sangue|hemorragia)/, s: 'Sangramento ativo' },
  { re: /(gravida|gestante|\d+ semanas)/, s: 'Gestante' },
  { re: /(muita dor|dor forte|dor intensa)/, s: 'Dor intensa' },
];
export function extrairDeTexto(texto: string): { symptoms: string[]; risk: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'; protocol: string } | null {
  const t = normalizar(texto);
  const regra = REGRAS_TEXTO.find(r => r.sinais.test(t));
  if (!regra) return null;
  const extras = SINAIS_EXTRA.filter(x => x.re.test(t)).map(x => x.s);
  return { symptoms: [...new Set([...regra.symptoms, ...extras])], risk: regra.risk, protocol: regra.protocol };
}
