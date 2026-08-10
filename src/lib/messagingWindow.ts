/** Meta customer-service messaging window (IG / Messenger free-form replies). */

const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;

export type MessagingWindowState = {
  open: boolean;
  remainingMs: number;
  elapsedMs: number;
};

export function messagingWindowFromLastInbound(
  lastInboundAt: string | Date | null | undefined,
  nowMs = Date.now(),
  windowMs = DEFAULT_WINDOW_MS
): MessagingWindowState | null {
  if (lastInboundAt == null || lastInboundAt === '') return null;
  const t =
    typeof lastInboundAt === 'string'
      ? new Date(lastInboundAt).getTime()
      : lastInboundAt.getTime();
  if (!Number.isFinite(t)) return null;
  const elapsedMs = nowMs - t;
  const remainingMs = windowMs - elapsedMs;
  return { open: remainingMs > 0, remainingMs, elapsedMs };
}

/** Compact remaining label, e.g. "3h 12m left" / "Expired". */
export function formatMessagingWindowRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return 'Expired';
  const totalSec = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m left`;
  return `${totalSec}s left`;
}
