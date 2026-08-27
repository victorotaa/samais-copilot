import type { ItemFilaPabx } from '../../core/tipos';

export const MOCK_QUEUE: ItemFilaPabx[] = [
  { id: 'Q1', phone: '(11) 98765-4321', waitTime: '01:42', priority: 'high' },
  { id: 'Q2', phone: '(11) 91234-5678', waitTime: '00:55', priority: 'normal' },
  { id: 'Q3', phone: '(11) 99999-8888', waitTime: '00:12', priority: 'normal' },
];
