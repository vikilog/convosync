/** Mock data for AI Content Suggestion panel — no API. */

export type ReplyToneOption = 'friendly' | 'professional' | 'playful';

export type ScanUiState = 'scanning' | 'ready' | 'failed';

export type MockFunnel = { id: string; name: string };
export type MockSkill = { id: string; title: string; agentName: string };

export type AiSuggestionSet = {
  scannedAtLabel: string;
  funnel: { id: string; name: string; reason: string };
  skill: { id: string; title: string; reason: string };
  tone: { value: ReplyToneOption; label: string; reason: string };
};

export type PostConfigValues = {
  funnelId: string | null;
  skillId: string | null;
  tone: ReplyToneOption | null;
};

export const MOCK_FUNNELS: MockFunnel[] = [
  { id: 'fun_ig', name: 'Instagram Leads' },
  { id: 'fun_warm', name: 'Warm Prospects' },
  { id: 'fun_demo', name: 'Demo Requests' },
];

export const MOCK_SKILLS: MockSkill[] = [
  { id: 'sk_dm', title: 'IG DM Closer', agentName: 'Sales Agent' },
  { id: 'sk_faq', title: 'Product FAQ', agentName: 'Support Agent' },
  { id: 'sk_warm', title: 'Warm Welcome', agentName: 'Sales Agent' },
];

export const TONE_OPTIONS: Array<{ value: ReplyToneOption; label: string }> = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'playful', label: 'Playful' },
];

export const MOCK_SUGGESTIONS_A: AiSuggestionSet = {
  scannedAtLabel: 'Scanned 2m ago',
  funnel: {
    id: 'fun_ig',
    name: 'Instagram Leads',
    reason: 'Based on: product-focused caption mentioning pricing',
  },
  skill: {
    id: 'sk_dm',
    title: 'IG DM Closer',
    reason: 'Based on: CTA language inviting DMs and demos',
  },
  tone: {
    value: 'friendly',
    label: 'Friendly & informative',
    reason: 'Based on: conversational caption and emoji-friendly brand voice',
  },
};

export const MOCK_SUGGESTIONS_B: AiSuggestionSet = {
  scannedAtLabel: 'Scanned just now',
  funnel: {
    id: 'fun_demo',
    name: 'Demo Requests',
    reason: 'Based on: caption asks viewers to book a walkthrough',
  },
  skill: {
    id: 'sk_faq',
    title: 'Product FAQ',
    reason: 'Based on: feature list that typically draws product questions',
  },
  tone: {
    value: 'professional',
    label: 'Professional',
    reason: 'Based on: B2B wording and formal brand presentation',
  },
};

/** Deterministic mock pick from post id. */
export function mockSuggestionsForPost(postId: string): AiSuggestionSet {
  let h = 0;
  for (let i = 0; i < postId.length; i++) h = (h + postId.charCodeAt(i) * (i + 1)) % 97;
  return h % 2 === 0 ? MOCK_SUGGESTIONS_A : MOCK_SUGGESTIONS_B;
}

export function toneLabel(tone: ReplyToneOption | null): string {
  if (!tone) return '—';
  return TONE_OPTIONS.find((t) => t.value === tone)?.label ?? tone;
}

export function funnelName(id: string | null): string {
  if (!id) return '—';
  return MOCK_FUNNELS.find((f) => f.id === id)?.name ?? '—';
}

export function skillTitle(id: string | null): string {
  if (!id) return '—';
  return MOCK_SKILLS.find((s) => s.id === id)?.title ?? '—';
}
