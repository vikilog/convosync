export type IgJourneyStatus = 'draft' | 'published';

export type IgJourneyNodeType =
  | 'TRIGGER'
  | 'SEND_MESSAGE'
  | 'ASK_QUESTION'
  | 'BUTTONS'
  | 'WAIT'
  | 'GOTO_STEP'
  | 'CONDITION'
  | 'RANDOMIZER'
  | 'UPDATE_TAG'
  | 'UPDATE_FIELD'
  | 'ADD_TO_FUNNEL'
  | 'OPEN_CONVERSATION'
  | 'CLOSE_CONVERSATION'
  | 'ASSIGN_TO'
  | 'WEBHOOK'
  | 'TRIGGER_JOURNEY'
  | 'END';

export type IgJourneyRecord = {
  id: string;
  name: string;
  status: IgJourneyStatus;
  createdAt: string;
  updatedAt: string;
  /** From TRIGGER node — e.g. dm.received | comment.received */
  triggerEvent?: string | null;
  _count?: { executions: number; nodes: number };
};

export type IgJourneyGraphNode = {
  id: string;
  type: IgJourneyNodeType;
  data: Record<string, unknown>;
  positionX: number;
  positionY: number;
};

export type IgJourneyGraphEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  conditionValue?: string | null;
};

export type IgJourneyGraph = {
  nodes: IgJourneyGraphNode[];
  edges: IgJourneyGraphEdge[];
};

export type IgTriggerEvent = 'dm.received' | 'comment.received';

export const IG_TRIGGER_EVENTS = [
  { value: 'dm.received' as const, label: 'DM received' },
  { value: 'comment.received' as const, label: 'Comment on post' },
] as const;

export type IgQuickReply = { title: string; payload?: string };

export const IG_QUICK_REPLY_MAX = 13;
export const IG_QUICK_REPLY_TITLE_MAX = 20;

export const CONDITION_OPERATORS = ['=', '!=', '>', '<', 'contains'] as const;

/**
 * "Send as" has exactly 2 modes (Meta constraint, not a UI choice):
 * - private_reply: reply to a comment, delivered as a DM. Text (+ buttons) only.
 * - window_24h: a regular DM in the standard customer-service window. Full content allowed.
 * `'dm'` is the pre-rename stored value and still resolves to `window_24h` on read.
 */
export const IG_SEND_AS_MODES = ['private_reply', 'window_24h'] as const;
export type IgSendAsMode = (typeof IG_SEND_AS_MODES)[number];
type LegacyIgSendAsMode = 'dm';

export const IG_SEND_AS_LABELS: Record<IgSendAsMode, string> = {
  private_reply: 'Private Reply',
  window_24h: '24-hour window',
};

/** Missing/invalid/legacy 'dm' → 'window_24h', matching pre-existing (always-DM) behavior. */
export function resolveIgSendAs(
  data: { sendAs?: IgSendAsMode | LegacyIgSendAsMode } | Record<string, unknown> | null | undefined
): IgSendAsMode {
  const raw = (data as { sendAs?: string } | null)?.sendAs;
  return raw === 'private_reply' ? 'private_reply' : 'window_24h';
}

/**
 * Content blocks a SEND_MESSAGE step could carry. Only 'text' and 'buttons' exist in the
 * builder today — the rest are forward-declared so this allowlist is correct the moment a
 * rich content-block picker lands (mirrors backend ig-journey.types.ts).
 */
export const IG_CONTENT_BLOCK_TYPES = [
  'text',
  'buttons',
  'image',
  'pdf',
  'audio',
  'video',
  'card',
  'gallery',
  'dynamic',
  'data_collection',
] as const;
export type IgContentBlockType = (typeof IG_CONTENT_BLOCK_TYPES)[number];

const PRIVATE_REPLY_ALLOWED_BLOCKS = new Set<IgContentBlockType>(['text', 'buttons']);

/** Gates the content-block grid: Private Reply only allows text (+ buttons) — Meta constraint. */
export function isContentAllowedForSendAs(
  sendAs: IgSendAsMode | LegacyIgSendAsMode | string | null | undefined,
  blockType: IgContentBlockType
): boolean {
  const mode = sendAs === 'private_reply' ? 'private_reply' : 'window_24h';
  return mode !== 'private_reply' || PRIVATE_REPLY_ALLOWED_BLOCKS.has(blockType);
}

const COMING_SOON_BLOCK_TYPES = new Set<IgContentBlockType>(['dynamic', 'data_collection']);

/** True for block types with no engine send path yet (Dynamic, Data Collection). */
export function isComingSoonBlockType(blockType: IgContentBlockType): boolean {
  return COMING_SOON_BLOCK_TYPES.has(blockType);
}

export type IgContentBlockButton = { id: string; title: string };

export type IgTextContentBlock = { id: string; type: 'text'; text: string };
export type IgButtonsContentBlock = {
  id: string;
  type: 'buttons';
  text: string;
  buttons: IgContentBlockButton[];
};
/** image/pdf/audio/video all send the same way (Meta needs one fetchable HTTPS URL). */
export type IgMediaContentBlock = {
  id: string;
  type: 'image' | 'pdf' | 'audio' | 'video';
  /** Media Gallery asset id — preferred, reuses existing upload/storage. */
  mediaId?: string;
  /** Direct HTTPS URL fallback; the only option for audio (Media Gallery has no audio type). */
  url?: string;
  caption?: string;
};
export type IgCardElement = {
  title: string;
  subtitle?: string;
  imageMediaId?: string;
  imageUrl?: string;
  buttonTitle?: string;
  buttonUrl?: string;
};
export type IgCardContentBlock = IgCardElement & { id: string; type: 'card' };
export type IgGalleryContentBlock = { id: string; type: 'gallery'; cards: IgCardElement[] };
/** No engine send path yet — picker shows these disabled with a "coming soon" badge. */
export type IgComingSoonContentBlock = { id: string; type: 'dynamic' | 'data_collection' };

export type IgContentBlock =
  | IgTextContentBlock
  | IgButtonsContentBlock
  | IgMediaContentBlock
  | IgCardContentBlock
  | IgGalleryContentBlock
  | IgComingSoonContentBlock;

function coerceContentBlock(raw: unknown, index: number): IgContentBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const type = (raw as { type?: unknown }).type;
  if (typeof type !== 'string' || !(IG_CONTENT_BLOCK_TYPES as readonly string[]).includes(type)) {
    return null;
  }
  const id = (raw as { id?: unknown }).id;
  return { ...(raw as object), id: typeof id === 'string' && id ? id : `block_${index}`, type } as IgContentBlock;
}

/**
 * Normalize SEND_MESSAGE node data → ordered content blocks. Migrate-on-read: a node saved
 * before the block picker existed only has `text` — treat that as a single text block so old
 * journeys keep rendering/sending exactly as before (mirrors backend ig-journey.types.ts).
 */
export function normalizeIgSendMessageBlocks(
  data: { text?: unknown; blocks?: unknown } | Record<string, unknown> | null | undefined
): IgContentBlock[] {
  const d = (data ?? {}) as { text?: unknown; blocks?: unknown };
  if (Array.isArray(d.blocks) && d.blocks.length > 0) {
    const coerced = d.blocks
      .map((b, i) => coerceContentBlock(b, i))
      .filter((b): b is IgContentBlock => b !== null);
    if (coerced.length > 0) return coerced;
  }
  return [{ id: 'legacy_text', type: 'text', text: typeof d.text === 'string' ? d.text : '' }];
}

export const CONTACT_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'journeyStatus', label: 'Lifecycle stage' },
  { value: 'custom', label: 'Custom field' },
] as const;

export const ASSIGNEE_TYPES = [
  { value: 'user', label: 'Team member' },
  { value: 'ai', label: 'AI Copilot' },
  { value: 'unassigned', label: 'Unassigned' },
] as const;

export const NODE_LABELS: Record<IgJourneyNodeType, string> = {
  TRIGGER: 'Trigger',
  SEND_MESSAGE: 'Send Message',
  ASK_QUESTION: 'Ask Question',
  BUTTONS: 'Buttons',
  WAIT: 'Wait',
  GOTO_STEP: 'Go to Step',
  CONDITION: 'Condition',
  RANDOMIZER: 'Randomizer',
  UPDATE_TAG: 'Update Tag',
  UPDATE_FIELD: 'Update Field',
  ADD_TO_FUNNEL: 'Add to Funnel',
  OPEN_CONVERSATION: 'Open Conversation',
  CLOSE_CONVERSATION: 'Close Conversation',
  ASSIGN_TO: 'Assign To',
  WEBHOOK: 'HTTP Request',
  TRIGGER_JOURNEY: 'Trigger Journey',
  END: 'End',
};

export const DEFAULT_NODE_DATA: Record<IgJourneyNodeType, Record<string, unknown>> = {
  TRIGGER: { event: 'dm.received', events: ['dm.received'], keyword: '' },
  SEND_MESSAGE: { text: '', simulateTyping: false, sendAs: 'window_24h' },
  ASK_QUESTION: {
    text: '',
    quickReplies: [
      { title: 'Yes', payload: 'yes' },
      { title: 'No', payload: 'no' },
    ],
    saveReplyTo: 'last_reply',
    quickCollect: false,
    simulateTyping: false,
  },
  BUTTONS: {
    text: '',
    buttons: [
      { id: 'btn_a', title: 'Option A' },
      { id: 'btn_b', title: 'Option B' },
    ],
    simulateTyping: false,
  },
  WAIT: {
    amount: 1,
    unit: 'hours',
    businessHours: {
      enabled: false,
      startTime: '08:00',
      endTime: '22:00',
      daysOfWeek: [],
    },
  },
  GOTO_STEP: { targetNodeId: '' },
  CONDITION: {
    combinator: 'all',
    conditions: [{ type: 'field', field: 'last_reply', operator: '=', value: '' }],
  },
  RANDOMIZER: {
    paths: [
      { id: 'a', label: 'Path A', weight: 50 },
      { id: 'b', label: 'Path B', weight: 50 },
    ],
  },
  UPDATE_TAG: { action: 'add', tags: [] },
  UPDATE_FIELD: { field: 'name', value: '', customFieldKey: '' },
  ADD_TO_FUNNEL: { funnelId: '', stageId: '' },
  OPEN_CONVERSATION: {},
  CLOSE_CONVERSATION: { closingNote: '' },
  ASSIGN_TO: { assigneeType: 'unassigned', assigneeId: '' },
  WEBHOOK: {
    name: '',
    method: 'POST',
    url: '',
    headers: {},
    body: '',
    timeoutMs: 15000,
    retries: 2,
  },
  TRIGGER_JOURNEY: { journeyId: '' },
  END: {},
};
