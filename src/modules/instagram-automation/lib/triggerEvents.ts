import type { IgTriggerEvent } from '../types';
import { IG_TRIGGER_EVENTS } from '../types';

const ALLOWED = new Set<string>(IG_TRIGGER_EVENTS.map((e) => e.value));

/** Normalize TRIGGER node data → unique events (defaults to dm.received). */
export function normalizeIgTriggerEvents(data: {
  event?: unknown;
  events?: unknown;
}): IgTriggerEvent[] {
  if (Array.isArray(data.events) && data.events.length > 0) {
    const out: IgTriggerEvent[] = [];
    for (const e of data.events) {
      if (typeof e === 'string' && ALLOWED.has(e) && !out.includes(e as IgTriggerEvent)) {
        out.push(e as IgTriggerEvent);
      }
    }
    if (out.length > 0) return out;
  }
  if (typeof data.event === 'string' && ALLOWED.has(data.event)) {
    return [data.event as IgTriggerEvent];
  }
  return ['dm.received'];
}

/** Next event not yet selected, or null if both DM + Comment are on. */
export function nextAvailableTriggerEvent(
  current: IgTriggerEvent[]
): IgTriggerEvent | null {
  for (const e of IG_TRIGGER_EVENTS) {
    if (!current.includes(e.value)) return e.value;
  }
  return null;
}
