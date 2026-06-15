import { GMAIL_CATEGORY_LABELS, GMAIL_SYSTEM_LABELS } from './constants';

export function displayName(raw: string): string {
  const match = raw.match(/^([^<]+)</);
  if (match) return match[1].trim().replace(/^"|"$/g, '');
  return raw.split('@')[0] || raw;
}

export function senderEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match?.[1] ?? raw;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-sky-50 text-primary',
  'bg-[#e8f4ff] text-[#4285F4]',
  'bg-[#fce8f0] text-[#EA4335]',
  'bg-[#e7f8ef] text-[#128C7E]',
  'bg-[#fff4e5] text-[#e37400]',
  'bg-[#f3eeff] text-[#7c3aed]',
];

export function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 9973;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function formatListDate(internalDate: string | null, dateHeader: string): string {
  let d: Date | null = null;
  if (internalDate) {
    const parsed = new Date(Number(internalDate));
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }
  if (!d && dateHeader) {
    const parsed = new Date(dateHeader);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }
  if (!d) return '';

  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatDetailDate(internalDate: string | null, dateHeader: string): string {
  let d: Date | null = null;
  if (internalDate) {
    const parsed = new Date(Number(internalDate));
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }
  if (!d && dateHeader) {
    const parsed = new Date(dateHeader);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }
  if (!d) return dateHeader || '';
  return d.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function visibleLabels(labelIds: string[]): string[] {
  return labelIds
    .filter((id) => !GMAIL_SYSTEM_LABELS.has(id))
    .map((id) => GMAIL_CATEGORY_LABELS[id] ?? id.replace(/_/g, ' ').toLowerCase())
    .slice(0, 3);
}

export function formatCount(n: number | undefined): string {
  if (n === undefined || n <= 0) return '';
  if (n > 999) return '999+';
  return String(n);
}
