/**
 * "When this button is pressed" action catalog for the Edit Button panel, shared by the
 * WhatsApp and Instagram flow builders. Every action resolves to "ensure a node of type X
 * exists and wire this button's edge to it" — the same create/link machinery `addNodeAfter`
 * already uses, just keyed to a specific button handle instead of the node's default output.
 *
 * `open_website` is the one Meta-constrained action: WA reply buttons and IG quick replies
 * cannot themselves be URL buttons, so it targets a SEND_MESSAGE node in a channel-specific
 * "CTA" shape instead of a new node type — WA's `cta_url` interactive message on WhatsApp,
 * IG's existing `card` content block (Generic Template `web_url` button) on Instagram.
 */
import {
  Bot,
  CircleStop,
  Clock,
  CornerDownRight,
  Dices,
  GitBranch,
  Globe,
  MessageSquare,
  RefreshCw,
  Tag,
  UserPlus,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type ButtonDestinationChannel = 'whatsapp' | 'instagram';

export type ButtonActionId =
  | 'channel_message'
  | 'ai_step'
  | 'open_website'
  | 'perform_actions'
  | 'condition'
  | 'randomizer'
  | 'smart_delay'
  | 'start_automation'
  | 'select_existing_step';

export type PerformActionId =
  | 'escalate_to_human'
  | 'add_contact_tags'
  | 'update_contact_attributes'
  | 'close_conversations';

type ActionCardBase = {
  label: string;
  description: string;
  icon: LucideIcon;
};

export type ButtonActionCard = ActionCardBase & { id: ButtonActionId };
export type PerformActionCard = ActionCardBase & { id: PerformActionId };

/** Top-level "when pressed" cards, in display order. `perform_actions` expands a submenu. */
export const BUTTON_PRESS_ACTIONS: ButtonActionCard[] = [
  { id: 'channel_message', label: 'Channel message', description: 'Send another message', icon: MessageSquare },
  { id: 'ai_step', label: 'AI Step', description: 'Hand off to the AI agent', icon: Bot },
  { id: 'open_website', label: 'Open website', description: 'Send a link button', icon: Globe },
  { id: 'perform_actions', label: 'Perform actions', description: 'Tag, assign, or close', icon: Zap },
  { id: 'condition', label: 'Condition', description: 'Branch the journey', icon: GitBranch },
  { id: 'randomizer', label: 'Randomizer', description: 'Split traffic by weight', icon: Dices },
  { id: 'smart_delay', label: 'Smart Delay', description: 'Wait before continuing', icon: Clock },
  { id: 'start_automation', label: 'Start another Automation', description: 'Trigger another journey', icon: Workflow },
  { id: 'select_existing_step', label: 'Select Existing Step', description: 'Jump to a step already on canvas', icon: CornerDownRight },
];

export const PERFORM_ACTIONS: PerformActionCard[] = [
  { id: 'escalate_to_human', label: 'Escalate to human', description: 'Unassign from AI for a teammate', icon: UserPlus },
  { id: 'add_contact_tags', label: 'Add contact tags', description: 'Tag the contact', icon: Tag },
  { id: 'update_contact_attributes', label: 'Update contact attributes', description: 'Set a contact field', icon: RefreshCw },
  { id: 'close_conversations', label: 'Close conversations', description: 'Resolve the conversation', icon: CircleStop },
];

export type ButtonDestination = { nodeType: string; data: Record<string, unknown> };

/**
 * Pure mapping: action id → destination node type + seed data. Returns null for
 * `perform_actions`, which is a submenu, not a destination itself.
 */
export function buildButtonDestination(
  actionId: ButtonActionId | PerformActionId,
  opts: { channel: ButtonDestinationChannel; buttonTitle?: string }
): ButtonDestination | null {
  const title = opts.buttonTitle?.trim() || 'Option';
  switch (actionId) {
    case 'channel_message':
      return { nodeType: 'SEND_MESSAGE', data: {} };
    case 'ai_step':
      return { nodeType: 'ASSIGN_TO', data: { assigneeType: 'ai' } };
    case 'open_website':
      return opts.channel === 'whatsapp'
        ? { nodeType: 'SEND_MESSAGE', data: { messageMode: 'cta_url', ctaLabel: title.slice(0, 20), ctaUrl: '' } }
        : {
            nodeType: 'SEND_MESSAGE',
            data: {
              blocks: [
                { id: `block_cta_${Math.random().toString(36).slice(2, 8)}`, type: 'card', title, buttonTitle: 'Open link', buttonUrl: '' },
              ],
            },
          };
    case 'escalate_to_human':
      return { nodeType: 'ASSIGN_TO', data: { assigneeType: 'unassigned' } };
    case 'add_contact_tags':
      return { nodeType: 'UPDATE_TAG', data: { action: 'add', tags: [] } };
    case 'update_contact_attributes':
      return { nodeType: 'UPDATE_FIELD', data: {} };
    case 'close_conversations':
      return { nodeType: 'CLOSE_CONVERSATION', data: {} };
    case 'condition':
      return { nodeType: 'CONDITION', data: {} };
    case 'randomizer':
      return { nodeType: 'RANDOMIZER', data: {} };
    case 'smart_delay':
      return { nodeType: 'WAIT', data: {} };
    case 'start_automation':
      return { nodeType: 'TRIGGER_JOURNEY', data: {} };
    case 'select_existing_step':
      return { nodeType: 'GOTO_STEP', data: {} };
    case 'perform_actions':
      return null;
  }
}

/** One-line preview of a destination node for the "Currently: …" banner in EditButtonPanel. */
export function summarizeDestinationNode(type: string, data: Record<string, unknown>): string | undefined {
  const text = data.text;
  if (typeof text === 'string' && text.trim()) return text.trim().slice(0, 40);
  if (data.messageMode === 'cta_url' && typeof data.ctaUrl === 'string' && data.ctaUrl) {
    return data.ctaUrl.slice(0, 40);
  }
  switch (type) {
    case 'ASSIGN_TO':
      return typeof data.assigneeType === 'string' ? data.assigneeType : undefined;
    case 'CLOSE_CONVERSATION':
      return 'Resolve conversation';
    case 'UPDATE_TAG':
      return Array.isArray(data.tags) ? (data.tags as string[]).join(', ') || 'Add tags' : 'Add tags';
    case 'UPDATE_FIELD':
      return typeof data.field === 'string' ? data.field : undefined;
    case 'GOTO_STEP':
      return data.targetNodeId ? 'Jump configured' : 'Select step';
    case 'TRIGGER_JOURNEY':
      return data.journeyId ? 'Automation selected' : 'Select automation';
    default:
      return undefined;
  }
}
