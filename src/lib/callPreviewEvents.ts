export const AGENT_CALL_PREVIEW_EVENT = 'convosync:agent-call-preview';

export type AgentCallPreviewDetail = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  welcomeMessage?: string | null;
  fallbackLanguage?: string;
};

export function dispatchAgentCallPreview(detail: AgentCallPreviewDetail) {
  window.dispatchEvent(new CustomEvent(AGENT_CALL_PREVIEW_EVENT, { detail }));
}

export function isAgentCallPreviewId(callId: string | undefined | null): boolean {
  return Boolean(callId?.startsWith('__preview_agent_'));
}

export function previewAgentIdFromCallId(callId: string): string | null {
  if (!isAgentCallPreviewId(callId)) return null;
  return callId.slice('__preview_agent_'.length).replace(/__$/, '') || null;
}
