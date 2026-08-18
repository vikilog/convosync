/** Shared "Mon D[, YYYY] HH:MM" formatter for campaign date/time displays. */
export function formatCampaignDateTime(
  iso: string | null,
  opts?: { includeYear?: boolean }
): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const includeYear = opts?.includeYear ?? true;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' as const } : {}),
    hour: '2-digit',
    minute: '2-digit',
  });
}
