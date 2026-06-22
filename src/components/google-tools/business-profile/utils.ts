import type { GbpAccount, GbpAddress, GbpLocation, GbpTimeOfDay, GbpTimePeriod } from './types';

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

function formatTime(t?: GbpTimeOfDay): string {
  if (!t || t.hours === undefined) return '';
  const h = t.hours;
  const m = t.minutes ?? 0;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatAddress(address?: GbpAddress): string {
  if (!address) return 'No address on file';
  const parts = [
    ...(address.addressLines ?? []),
    [address.locality, address.administrativeArea].filter(Boolean).join(', '),
    [address.postalCode, address.regionCode].filter(Boolean).join(' '),
  ].filter(Boolean);
  return parts.join('\n') || 'No address on file';
}

export function formatAddressLine(address?: GbpAddress): string {
  return formatAddress(address).replace(/\n/g, ', ');
}

export function formatLastSync(iso: string | null | undefined): string {
  if (!iso) return 'Never synced';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Never synced';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function groupHoursByDay(periods: GbpTimePeriod[] = []): { day: string; label: string; hours: string }[] {
  const byDay = new Map<string, string[]>();

  for (const period of periods) {
    const day = period.openDay ?? 'UNKNOWN';
    const open = formatTime(period.openTime);
    const close = formatTime(period.closeTime);
    if (!open || !close) continue;
    const range = `${open} – ${close}`;
    const existing = byDay.get(day) ?? [];
    existing.push(range);
    byDay.set(day, existing);
  }

  return DAY_ORDER.filter((day) => byDay.has(day)).map((day) => ({
    day,
    label: DAY_LABELS[day] ?? day,
    hours: byDay.get(day)?.join(', ') ?? 'Closed',
  }));
}

export function locationInitials(title?: string): string {
  if (!title) return 'L';
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function mapCachedAccount(row: {
  id: string;
  googleAccountName: string;
  displayName: string | null;
  accountType: string | null;
  lastSyncedAt?: string | null;
}): GbpAccount {
  return {
    id: row.id,
    name: row.googleAccountName,
    accountName: row.displayName ?? row.googleAccountName,
    type: row.accountType ?? undefined,
    lastSyncedAt: row.lastSyncedAt,
  };
}

export function mapCachedLocation(row: {
  id: string;
  googleLocationName: string;
  title: string | null;
  address: Record<string, unknown> | null;
  regularHours: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}): GbpLocation {
  return {
    id: row.id,
    name: row.googleLocationName,
    title: row.title ?? undefined,
    storefrontAddress: (row.address ?? undefined) as GbpAddress | undefined,
    regularHours: row.regularHours as GbpLocation['regularHours'],
    metadata: row.metadata as GbpLocation['metadata'],
  };
}

export function mapsUrl(location: GbpLocation): string | null {
  if (location.metadata?.mapsUri) return location.metadata.mapsUri;
  const address = formatAddressLine(location.storefrontAddress);
  if (!address || address === 'No address on file') return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
