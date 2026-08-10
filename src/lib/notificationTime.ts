/** Pure relative-time for notification / activity rows. */
export function formatNotificationRelativeTime(
  fromMs: number,
  nowMs: number = Date.now()
): string {
  const diff = Math.max(0, nowMs - fromMs);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
