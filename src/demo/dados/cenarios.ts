// Cenários de demonstração: pares COERENTES roteiro ↔ chamador (o sorteio antigo
// combinava qualquer script com qualquer telefone — trote saindo de número com 5
// ocorrências de histórico). O seletor do IDLE permite demonstração dirigida; o
// aleatório usa bolsa embaralhada (percorre todos antes de repetir qualquer um).
export const CENARIOS_DEMO = [
  { id: 'iam',        rotulo: 'IAM · vermelho',        script: 0, caller: 0 },
  { id: 'pcr',        rotulo: 'PCR · RCP guiada',      script: 7, caller: 2 },
  { id: 'trauma',     rotulo: 'Trauma · amarelo',      script: 1, caller: 3 },
  { id: 'ovace',      rotulo: 'OVACE · reversão',      script: 2, caller: 1 },
  { id: 'avc',        rotulo: 'AVC · laranja',         script: 4, caller: 2 },
  { id: 'obstetrico', rotulo: 'Obstétrico · laranja',  script: 5, caller: 1 },
  { id: 'verde',      rotulo: 'Verde · orientação',    script: 6, caller: 4 },
  { id: 'trote',      rotulo: 'Trote',                 script: 3, caller: 3 },
  { id: 'sem-aml',    rotulo: 'Sem localização (AML)', script: 0, caller: 5 },
] as const;
