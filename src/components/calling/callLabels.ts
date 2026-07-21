import type { CallSessionDto } from '../../lib/api';

/** Assigned AI agent on this call (conversation assignee). */
export function getAiAgentName(call: CallSessionDto | null | undefined): string | null {
  if (!call) return null;
  return call.aiAgent?.name || (call.handler?.type === 'ai' ? call.handler.name : null) || null;
}

/** Human who took over the call. */
export function getHumanHandlerName(call: CallSessionDto | null | undefined): string | null {
  if (!call) return null;
  return (
    call.humanAgent?.name ||
    (call.handler?.type === 'human' ? call.handler.name : null) ||
    null
  );
}

export function isAiHandlingCall(call: CallSessionDto | null | undefined): boolean {
  if (!call) return false;
  return call.currentHandler === 'ai' || call.handler?.type === 'ai';
}
