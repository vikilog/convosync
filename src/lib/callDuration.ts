import { useEffect, useState } from 'react';

/** mm:ss display for in-call timers. */
export function formatCallTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Elapsed whole seconds from server `connectedAt` (shared anchor for all clients). */
export function elapsedCallSeconds(
  connectedAt: string | null | undefined,
  endedAt?: string | null | undefined
): number {
  if (!connectedAt) return 0;
  const start = new Date(connectedAt).getTime();
  if (Number.isNaN(start)) return 0;
  const endMs = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (Number.isNaN(endMs)) return 0;
  return Math.max(0, Math.floor((endMs - start) / 1000));
}

/**
 * Live call duration derived from server `connectedAt`, not a local incrementing counter.
 * Optional `serverNow` + offset sync can be added later for clock-skew correction.
 */
export function useCallDuration(
  connectedAt: string | null | undefined,
  options?: { active?: boolean; endedAt?: string | null | undefined }
): number {
  const active = options?.active ?? true;
  const endedAt = options?.endedAt;

  const [elapsed, setElapsed] = useState(() =>
    elapsedCallSeconds(connectedAt, endedAt)
  );

  useEffect(() => {
    if (!connectedAt) {
      setElapsed(0);
      return;
    }
    if (endedAt) {
      setElapsed(elapsedCallSeconds(connectedAt, endedAt));
      return;
    }
    const tick = () => setElapsed(elapsedCallSeconds(connectedAt));
    tick();
    if (!active) return;
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [connectedAt, active, endedAt]);

  return elapsed;
}
