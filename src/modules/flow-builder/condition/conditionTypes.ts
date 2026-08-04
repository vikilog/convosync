import {
  AtSign,
  BadgeCheck,
  CircleCheck,
  Clock,
  Fingerprint,
  Globe,
  Hourglass,
  LayoutGrid,
  ListFilter,
  Mail,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  Phone,
  SlidersHorizontal,
  Tag,
  User,
  UserCheck,
  Users,
  Waypoints,
  Webhook,
  type LucideIcon,
} from 'lucide-react';

export const CONDITION_OPERATORS = ['=', '!=', '>', '<', 'contains'] as const;
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

/** Mirrors backend/src/modules/journey/types/journey.types.ts (kept in sync manually). */
export const CONDITION_TYPES = [
  'field',
  'tag',
  'email_known',
  'phone_known',
  'follows_account',
  'custom_field',
  'channel',
  'journey_status',
  'system_field',
  'current_time',
] as const;
export type ConditionType = (typeof CONDITION_TYPES)[number];

export type Condition = {
  type?: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: string | number;
};

export type ConditionCombinator = 'all' | 'any';

export type ConditionNodeData = {
  field?: string;
  operator?: ConditionOperator;
  value?: string | number;
  conditions?: Condition[];
  combinator?: ConditionCombinator;
};

/**
 * Backward compatible: a lone legacy `{ field, operator, value }` object (no `conditions`
 * array) becomes a 1-item list with combinator "all" — old saved journeys keep evaluating
 * exactly as before, and the editor renders them as a single row.
 */
export function normalizeConditionGroup(
  data: ConditionNodeData | Record<string, unknown> | null | undefined
): { conditions: Condition[]; combinator: ConditionCombinator } {
  const d = (data ?? {}) as ConditionNodeData;
  if (Array.isArray(d.conditions) && d.conditions.length > 0) {
    return { conditions: d.conditions, combinator: d.combinator === 'any' ? 'any' : 'all' };
  }
  if (d.field != null && d.field !== '') {
    return {
      conditions: [{ type: 'field', field: d.field, operator: d.operator ?? '=', value: d.value ?? '' }],
      combinator: 'all',
    };
  }
  return { conditions: [], combinator: 'all' };
}

export type ConditionChannel = 'whatsapp' | 'instagram';

/** Real "home" tabs in the picker. The Recommended tab is virtual — see `recommended` flag below. */
export type ConditionCategory = 'general' | 'system';

export const CONDITION_CATEGORY_LABELS: Record<ConditionCategory, string> = {
  general: 'General Filters',
  system: 'System Fields',
};
export const CONDITION_CATEGORIES = Object.keys(CONDITION_CATEGORY_LABELS) as ConditionCategory[];

export type ConditionFieldStatus = 'ready' | 'coming_soon';

/** Drives which input widget ConditionRow renders for a `system_field` preset. */
export type SystemFieldValueKind = 'text' | 'number' | 'boolean' | 'messaging_window';

export type ConditionTypeDef = {
  type: ConditionType;
  /** Unique picker-row id (several rows can share `type: 'system_field'`). Not persisted. */
  key: string;
  label: string;
  description: string;
  category: ConditionCategory;
  /** Also surfaced in the virtual "Recommended" tab, in addition to its real `category` home. */
  recommended?: boolean;
  /** Rendered inside the collapsible "Instagram" sub-group within the System Fields tab. */
  instagramGroup?: boolean;
  icon: LucideIcon;
  /** Omitted = available on every channel. */
  channels?: ConditionChannel[];
  /** Default 'ready'. `coming_soon` rows show a badge and are disabled in the picker. */
  status?: ConditionFieldStatus;
  comingSoonNote?: string;
  /** Only set for `type: 'system_field'` rows — the key `resolveSystemField` (backend) reads. */
  fieldKey?: string;
  /** Only set for `type: 'system_field'` rows — which input ConditionRow should render. */
  valueKind?: SystemFieldValueKind;
  createCondition: () => Condition;
};

export const MESSAGING_WINDOW_OPTIONS = [
  { value: 'within_24h', label: 'Within 24h (free-form reply window)' },
  { value: 'within_7d', label: '24h–7d (human agent tag only)' },
  { value: 'expired', label: 'Expired (no open window)' },
] as const;

const systemField = (
  fieldKey: string,
  valueKind: SystemFieldValueKind,
  opts: {
    label: string;
    description: string;
    icon: LucideIcon;
    instagramGroup?: boolean;
    channels?: ConditionChannel[];
  }
): ConditionTypeDef => ({
  type: 'system_field',
  key: `system_field:${fieldKey}`,
  label: opts.label,
  description: opts.description,
  category: 'system',
  instagramGroup: opts.instagramGroup,
  icon: opts.icon,
  channels: opts.channels,
  fieldKey,
  valueKind,
  createCondition: () => ({
    type: 'system_field',
    field: fieldKey,
    operator: valueKind === 'number' ? '>' : '=',
    value: valueKind === 'boolean' ? 'yes' : valueKind === 'messaging_window' ? 'within_24h' : '',
  }),
});

const comingSoon = (
  key: string,
  opts: { label: string; description: string; category: ConditionCategory; icon: LucideIcon; note: string; instagramGroup?: boolean }
): ConditionTypeDef => ({
  // Placeholder type — never persisted, since coming_soon rows are disabled in the picker.
  type: 'field',
  key,
  label: opts.label,
  description: opts.description,
  category: opts.category,
  instagramGroup: opts.instagramGroup,
  icon: opts.icon,
  status: 'coming_soon',
  comingSoonNote: opts.note,
  createCondition: () => ({ type: 'field', field: '', operator: '=', value: '' }),
});

export const DEFAULT_BUSINESS_WINDOW = { startTime: '09:00', endTime: '18:00', daysOfWeek: [] as number[] };

export const CONDITION_TYPE_REGISTRY: ConditionTypeDef[] = [
  // --- Recommended (also live under their real category below) ---
  {
    type: 'tag',
    key: 'tag',
    label: 'Tag',
    description: 'Check if a contact has a specific tag',
    category: 'general',
    recommended: true,
    icon: Tag,
    createCondition: () => ({ type: 'tag', field: '', operator: '=', value: '' }),
  },
  {
    type: 'email_known',
    key: 'email_known',
    label: 'Email',
    description: "Check if a contact's email is known",
    category: 'system',
    recommended: true,
    icon: Mail,
    createCondition: () => ({ type: 'email_known', field: '', operator: '=', value: 'yes' }),
  },
  {
    type: 'follows_account',
    key: 'follows_account',
    label: 'Follows your account',
    description: 'Check if a contact is your follower',
    category: 'system',
    instagramGroup: true,
    recommended: true,
    icon: CircleCheck,
    channels: ['instagram'],
    createCondition: () => ({ type: 'follows_account', field: '', operator: '=', value: 'yes' }),
  },

  // --- General Filters ---
  comingSoon('opted_in_widget', {
    label: 'Opted-In Through Widget',
    description: 'Contact first messaged you via the chat widget',
    category: 'general',
    icon: MousePointerClick,
    note: 'Needs acquisition-source tracking — not recorded yet',
  }),
  comingSoon('opted_in_ad', {
    label: 'Opted-In Through Ad',
    description: 'Contact came from a click-to-chat ad',
    category: 'general',
    icon: Megaphone,
    note: 'Needs ad-referral tracking — not recorded yet',
  }),
  comingSoon('opted_in_api', {
    label: 'Opted-In Through API',
    description: 'Contact was created via the public API',
    category: 'general',
    icon: Webhook,
    note: 'Needs acquisition-source tracking — not recorded yet',
  }),
  {
    type: 'current_time',
    key: 'current_time',
    label: 'Current time',
    description: 'Check if right now falls inside a time-of-day / business-hours window',
    category: 'general',
    icon: Clock,
    createCondition: () => ({
      type: 'current_time',
      field: '',
      operator: '=',
      value: JSON.stringify(DEFAULT_BUSINESS_WINDOW),
    }),
  },
  comingSoon('segment', {
    label: 'Segment',
    description: 'Check if a contact belongs to a saved segment',
    category: 'general',
    icon: LayoutGrid,
    note: 'Segments are a premium feature — coming soon',
  }),
  {
    type: 'custom_field',
    key: 'custom_field',
    label: 'Custom field',
    description: 'Compare a custom field to a value',
    category: 'general',
    icon: SlidersHorizontal,
    createCondition: () => ({ type: 'custom_field', field: '', operator: '=', value: '' }),
  },
  {
    type: 'journey_status',
    key: 'journey_status',
    label: 'Journey status',
    description: "Filter by the contact's lifecycle / journey status",
    category: 'general',
    icon: Waypoints,
    createCondition: () => ({ type: 'journey_status', field: '', operator: '=', value: '' }),
  },
  {
    type: 'field',
    key: 'field',
    label: 'Contact attribute',
    description: 'Compare any contact field — name, phone, last reply, custom key…',
    category: 'general',
    icon: ListFilter,
    createCondition: () => ({ type: 'field', field: 'contact.name', operator: 'contains', value: '' }),
  },

  // --- System Fields (contact-level) ---
  systemField('firstName', 'text', {
    label: 'First Name',
    description: "First word of the contact's name",
    icon: User,
  }),
  systemField('lastName', 'text', {
    label: 'Last Name',
    description: "Remainder of the contact's name after the first word",
    icon: User,
  }),
  systemField('fullName', 'text', {
    label: 'Full Name',
    description: "The contact's full name",
    icon: User,
  }),
  systemField('phone', 'text', {
    label: 'Phone',
    description: "The contact's phone number",
    icon: Phone,
  }),
  comingSoon('subscribed', {
    label: 'Subscribed',
    description: 'Contact has not unsubscribed from messaging',
    category: 'system',
    icon: UserCheck,
    note: 'No subscribe/unsubscribe tracking yet',
  }),
  systemField('id', 'text', {
    label: 'Contact Id',
    description: "The contact's internal id",
    icon: Fingerprint,
  }),
  systemField('lastReplyType', 'text', {
    label: 'Last Reply Type',
    description: "Message type of the contact's last reply (text, image…)",
    icon: MessageSquare,
  }),

  // --- System Fields → Instagram (nested) ---
  systemField('ig.lastInteractionDays', 'number', {
    label: 'Last Interaction',
    description: 'Days since the last inbound Instagram DM',
    icon: Clock,
    instagramGroup: true,
    channels: ['instagram'],
  }),
  systemField('ig.lastSeenDays', 'number', {
    label: 'Last Seen',
    description: 'Days since any activity on the Instagram thread',
    icon: Hourglass,
    instagramGroup: true,
    channels: ['instagram'],
  }),
  systemField('ig.messagingWindow', 'messaging_window', {
    label: 'Messaging window segment',
    description: 'Which Meta messaging-window tag currently applies',
    icon: Hourglass,
    instagramGroup: true,
    channels: ['instagram'],
  }),
  systemField('ig.followerCount', 'number', {
    label: 'Follower Count',
    description: "The contact's Instagram follower count",
    icon: Users,
    instagramGroup: true,
    channels: ['instagram'],
  }),
  systemField('ig.username', 'text', {
    label: 'Username',
    description: 'The Instagram @username',
    icon: AtSign,
    instagramGroup: true,
    channels: ['instagram'],
  }),
  comingSoon('ig_opted_in', {
    label: 'Opted-in',
    description: 'Contact opted into promotional Instagram messaging',
    category: 'system',
    instagramGroup: true,
    icon: UserCheck,
    note: 'No distinct opt-in signal beyond messaging consent yet',
  }),
  systemField('ig.verified', 'boolean', {
    label: 'Verified',
    description: 'Instagram account has a verified badge',
    icon: BadgeCheck,
    instagramGroup: true,
    channels: ['instagram'],
  }),
  systemField('ig.businessFollowsContact', 'boolean', {
    label: 'Business Follows Contact',
    description: 'Your account follows this contact back',
    icon: Globe,
    instagramGroup: true,
    channels: ['instagram'],
  }),

  // --- Legacy / advanced (kept, not shown as duplicates in the spec's list above) ---
  {
    type: 'phone_known',
    key: 'phone_known',
    label: 'Phone known',
    description: 'Contact has a real phone number on file',
    category: 'system',
    icon: Phone,
    createCondition: () => ({ type: 'phone_known', field: '', operator: '=', value: 'yes' }),
  },
  {
    type: 'channel',
    key: 'channel',
    label: 'Channel',
    description: 'WhatsApp, Instagram, or Messenger',
    category: 'system',
    icon: Globe,
    createCondition: () => ({ type: 'channel', field: '', operator: '=', value: 'whatsapp' }),
  },
];

export function conditionTypesForChannel(channel: ConditionChannel): ConditionTypeDef[] {
  return CONDITION_TYPE_REGISTRY.filter((def) => !def.channels || def.channels.includes(channel));
}

/**
 * Look up by `type` alone. Reliable only for types with a single registry row (everything
 * except `system_field`, which has one row per field — use `systemFieldDef` for those).
 */
export function conditionTypeDef(type: ConditionType | undefined): ConditionTypeDef | undefined {
  return CONDITION_TYPE_REGISTRY.find((def) => def.type === (type ?? 'field') && def.status !== 'coming_soon');
}

export function systemFieldDef(fieldKey: string | undefined): ConditionTypeDef | undefined {
  return CONDITION_TYPE_REGISTRY.find((def) => def.type === 'system_field' && def.fieldKey === fieldKey);
}

/** Resolves the picker-row definition that produced a given condition — handles the `system_field` fan-out. */
export function conditionDefFor(condition: Pick<Condition, 'type' | 'field'>): ConditionTypeDef | undefined {
  return condition.type === 'system_field' ? systemFieldDef(condition.field) : conditionTypeDef(condition.type);
}

function parseCurrentTimeValue(value: string | number): { startTime: string; endTime: string; daysOfWeek: number[] } {
  try {
    const parsed = JSON.parse(String(value || '{}')) as Partial<typeof DEFAULT_BUSINESS_WINDOW>;
    return {
      startTime: parsed.startTime || DEFAULT_BUSINESS_WINDOW.startTime,
      endTime: parsed.endTime || DEFAULT_BUSINESS_WINDOW.endTime,
      daysOfWeek: Array.isArray(parsed.daysOfWeek) ? parsed.daysOfWeek : [],
    };
  } catch {
    return { ...DEFAULT_BUSINESS_WINDOW };
  }
}

export { parseCurrentTimeValue };

export function summarizeCondition(condition: Condition): string {
  const def = conditionDefFor(condition);
  const label = def?.label ?? 'Condition';
  switch (condition.type ?? 'field') {
    case 'tag':
      return `Tag ${condition.operator === '!=' ? '≠' : '='} ${condition.value || '…'}`;
    case 'email_known':
    case 'phone_known':
      return `${label}: ${String(condition.value) === 'no' ? 'No' : 'Yes'}`;
    case 'follows_account':
      return `Follows account: ${String(condition.value) === 'no' ? 'No' : 'Yes'}`;
    case 'custom_field':
      return `${condition.field || 'field'} ${condition.operator} ${condition.value}`;
    case 'channel':
      return `Channel = ${condition.value || '…'}`;
    case 'journey_status':
      return `Status = ${condition.value || '…'}`;
    case 'system_field': {
      if (def?.valueKind === 'boolean') return `${label}: ${String(condition.value) === 'no' ? 'No' : 'Yes'}`;
      return `${label} ${condition.operator} ${condition.value || '…'}`;
    }
    case 'current_time': {
      const cfg = parseCurrentTimeValue(condition.value);
      const negated = condition.operator === '!=' ? 'outside' : 'within';
      return `Current time ${negated} ${cfg.startTime}–${cfg.endTime}`;
    }
    case 'field':
    default:
      return `${condition.field || 'field'} ${condition.operator} ${condition.value}`;
  }
}

/** One-line canvas card summary for the CONDITION step. */
export function summarizeConditionGroup(data: ConditionNodeData | Record<string, unknown> | null | undefined): string {
  const { conditions, combinator } = normalizeConditionGroup(data);
  if (conditions.length === 0) return '';
  if (conditions.length === 1) return summarizeCondition(conditions[0]);
  const joiner = combinator === 'any' ? 'OR' : 'AND';
  return `${summarizeCondition(conditions[0])} ${joiner} +${conditions.length - 1} more`;
}
