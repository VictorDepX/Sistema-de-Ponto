import { EntryType, TimeEntry } from '@ponto/types';

export const pad = (n: number) => String(n).padStart(2, '0');

export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const fmtDateStr = (dateStr: string) =>
  dateStr.split('-').reverse().join('/');

export const formatMinutes = (min: number): string => {
  const sign = min < 0 ? '-' : '';
  const abs  = Math.abs(min);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
};

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
export const MONTH_SHORT = MONTH_NAMES.map(m => m.slice(0, 3));
export const DAY_NAMES   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export const dayOfWeek = (dateStr: string) =>
  DAY_NAMES[new Date(dateStr + 'T12:00:00').getDay()];

export const ENTRY_ORDER: EntryType[] = [
  EntryType.CLOCK_IN,
  EntryType.BREAK_START,
  EntryType.BREAK_END,
  EntryType.CLOCK_OUT,
];

export const ENTRY_LABELS: Record<EntryType, string> = {
  [EntryType.CLOCK_IN]:    'Entrada',
  [EntryType.BREAK_START]: 'Intervalo',
  [EntryType.BREAK_END]:   'Retorno',
  [EntryType.CLOCK_OUT]:   'Saída',
};

export const ENTRY_COLORS: Record<EntryType, string> = {
  [EntryType.CLOCK_IN]:    '#22c55e',
  [EntryType.BREAK_START]: '#f59e0b',
  [EntryType.BREAK_END]:   '#3b82f6',
  [EntryType.CLOCK_OUT]:   '#ef4444',
};

export const nextEntryType = (
  entries: Pick<TimeEntry, 'type' | 'timestamp'>[],
): EntryType | null => {
  const sorted = [...entries].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  const last = sorted[sorted.length - 1];
  if (!last) return EntryType.CLOCK_IN;
  const idx = ENTRY_ORDER.indexOf(last.type);
  return idx === ENTRY_ORDER.length - 1 ? null : ENTRY_ORDER[idx + 1];
};

export const calcWorkedMinutes = (
  entries: Pick<TimeEntry, 'type' | 'timestamp'>[],
): number => {
  const sorted = [...entries].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  let worked = 0;
  let lastIn: number | null = null;
  for (const e of sorted) {
    const ts = new Date(e.timestamp).getTime();
    if (e.type === EntryType.CLOCK_IN || e.type === EntryType.BREAK_END) {
      lastIn = ts;
    } else if (
      (e.type === EntryType.BREAK_START || e.type === EntryType.CLOCK_OUT) &&
      lastIn !== null
    ) {
      worked += (ts - lastIn) / 60000;
      lastIn = null;
    }
  }
  return Math.round(worked);
};
