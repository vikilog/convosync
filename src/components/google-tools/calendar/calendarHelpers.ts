export type CalendarEvent = {
  id: string;
  summary?: string | null;
  description?: string | null;
  htmlLink?: string | null;
  start: string | null;
  end: string | null;
  location?: string | null;
};

export type CalendarDay = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
};

export type CalViewMode = 'day' | 'week' | 'month' | 'year';

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const VIEW_MODES: { id: CalViewMode; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
export const HOUR_PX = 48;

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isPastDay(day: CalendarDay): boolean {
  return startOfDay(day.date).getTime() < startOfDay(new Date()).getTime();
}

export function parseEventStart(start: string | null): Date | null {
  if (!start) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    const [y, m, day] = start.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  const parsed = new Date(start);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isAllDayEvent(event: CalendarEvent): boolean {
  return event.start?.length === 10;
}

export function eventOccursOnDay(event: CalendarEvent, day: Date): boolean {
  const start = parseEventStart(event.start);
  if (!start) return false;
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
  const end = event.end ? parseEventStart(event.end) : null;

  if (isAllDayEvent(event)) {
    const eventStart = startOfDay(start).getTime();
    const eventEnd = end ? startOfDay(end).getTime() : eventStart;
    return dayStart >= eventStart && dayStart < eventEnd;
  }

  const eventStartMs = start.getTime();
  const eventEndMs = end ? end.getTime() : eventStartMs;
  return eventStartMs <= dayEnd && eventEndMs >= dayStart;
}

export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const todayKey = dateKey(new Date());
  const first = new Date(year, month, 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = dateKey(date);
    days.push({
      date,
      key,
      inMonth: date.getMonth() === month,
      isToday: key === todayKey,
    });
  }
  return days;
}

export function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

export function weekDays(anchor: Date): CalendarDay[] {
  const todayKey = dateKey(new Date());
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = dateKey(date);
    return { date, key, inMonth: true, isToday: key === todayKey };
  });
}

export function getVisibleRange(mode: CalViewMode, anchor: Date): { timeMin: string; timeMax: string } {
  if (mode === 'day') {
    const start = startOfDay(anchor);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }
  if (mode === 'week') {
    const start = startOfWeek(anchor);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }
  if (mode === 'year') {
    const start = new Date(anchor.getFullYear(), 0, 1);
    const end = new Date(anchor.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }
  const grid = buildMonthGrid(anchor.getFullYear(), anchor.getMonth());
  const firstDay = grid[0]?.date ?? new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lastDay = grid[grid.length - 1]?.date ?? firstDay;
  const timeMin = startOfDay(firstDay).toISOString();
  const timeMax = new Date(startOfDay(lastDay).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
  return { timeMin, timeMax };
}

export function periodLabel(mode: CalViewMode, anchor: Date): string {
  if (mode === 'day') {
    return anchor.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (mode === 'week') {
    const days = weekDays(anchor);
    const first = days[0].date;
    const last = days[6].date;
    const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (first.getFullYear() !== last.getFullYear()) {
      return `${first.toLocaleDateString(undefined, { ...fmt, year: 'numeric' })} – ${last.toLocaleDateString(undefined, { ...fmt, year: 'numeric' })}`;
    }
    if (first.getMonth() === last.getMonth()) {
      return `${first.toLocaleDateString(undefined, fmt)} – ${last.getDate()}, ${last.getFullYear()}`;
    }
    return `${first.toLocaleDateString(undefined, fmt)} – ${last.toLocaleDateString(undefined, { ...fmt, year: 'numeric' })}`;
  }
  if (mode === 'year') return String(anchor.getFullYear());
  return anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatEventTime(event: CalendarEvent): string {
  if (!event.start) return '';
  if (isAllDayEvent(event)) return 'All day';
  const d = new Date(event.start);
  const end = event.end && !isAllDayEvent(event) ? new Date(event.end) : null;
  const startStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (!end) return startStr;
  const endStr = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${startStr} – ${endStr}`;
}

export function formatDayHeading(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function defaultFormForDay(day: Date) {
  const start = new Date(day);
  start.setHours(9, 0, 0, 0);
  const end = new Date(day);
  end.setHours(10, 0, 0, 0);
  return {
    summary: '',
    description: '',
    start: toLocalInputValue(start.toISOString()),
    end: toLocalInputValue(end.toISOString()),
  };
}

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((e) => eventOccursOnDay(e, day))
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
}

export function parseEventEnd(end: string | null, start: string | null): Date | null {
  if (!end) return parseEventStart(start);
  return parseEventStart(end);
}

export function timedEventStyle(event: CalendarEvent, day: Date): { top: number; height: number } | null {
  if (isAllDayEvent(event)) return null;
  const start = parseEventStart(event.start);
  if (!start) return null;
  const end = parseEventEnd(event.end, event.start) ?? start;
  const dayStart = startOfDay(day);
  const startMin = Math.max(0, (start.getTime() - dayStart.getTime()) / 60000 - DAY_START_HOUR * 60);
  const endMin = Math.min(
    (DAY_END_HOUR - DAY_START_HOUR) * 60,
    (end.getTime() - dayStart.getTime()) / 60000 - DAY_START_HOUR * 60
  );
  const duration = Math.max(endMin - startMin, 24);
  return {
    top: (startMin / 60) * HOUR_PX,
    height: Math.max((duration / 60) * HOUR_PX, 22),
  };
}

export const TIMELINE_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
