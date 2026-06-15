import type { ChatMessage } from '../types';

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayDiff(from: Date, to: Date): number {
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
}

export function formatDateDivider(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return 'Unknown date';

  const now = new Date();
  const diff = dayDiff(d, now);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'long' });
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatMessageTime(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return '—';

  const now = new Date();
  const diff = dayDiff(d, now);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diff === 0) return time;
  if (diff === 1) return `Yesterday ${time}`;
  if (diff < 7) return `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`;
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
  }
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${time}`;
}

export function formatInboxListTime(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return '—';

  const now = new Date();
  const diff = dayDiff(d, now);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diff === 0) {
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return time;
  }
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' });
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
}

export function formatMessageClock(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function dateKeyForMessage(date: Date | string): string {
  const d = toDate(date);
  if (!d) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function groupMessagesByDate(
  messages: ChatMessage[]
): Array<{ dateKey: string; label: string; messages: ChatMessage[] }> {
  const groups = new Map<string, ChatMessage[]>();

  for (const message of messages) {
    const createdAt = message.createdAt ?? new Date().toISOString();
    const key = dateKeyForMessage(createdAt);
    const bucket = groups.get(key);
    if (bucket) bucket.push(message);
    else groups.set(key, [message]);
  }

  return Array.from(groups.entries()).map(([dateKey, bucket]) => ({
    dateKey,
    label: formatDateDivider(bucket[0].createdAt ?? new Date().toISOString()),
    messages: bucket,
  }));
}
