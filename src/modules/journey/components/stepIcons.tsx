import {
  Bot,
  CircleStop,
  Clock,
  CornerDownRight,
  Dices,
  GitBranch,
  Globe,
  HelpCircle,
  Inbox,
  LayoutGrid,
  MessageSquare,
  MousePointerClick,
  Play,
  RefreshCw,
  Sheet,
  Tag,
  Target,
  UserPlus,
  Webhook,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { JourneyNodeType } from '../types';

export type StepVisual = {
  icon: LucideIcon;
  accent: string;
  accentBg: string;
  nodeBar: string;
};

/** Category tint map — Trigger amber, message green, tag/field blue, question purple, end gray. */
export const STEP_VISUALS: Record<JourneyNodeType, StepVisual> = {
  TRIGGER: {
    icon: Zap,
    accent: 'text-amber-700',
    accentBg: 'bg-amber-100',
    nodeBar: 'bg-amber-500',
  },
  SEND_MESSAGE: {
    icon: MessageSquare,
    accent: 'text-channel-green',
    accentBg: 'bg-accent-green-bg',
    nodeBar: 'bg-channel-green',
  },
  ASK_QUESTION: {
    icon: HelpCircle,
    accent: 'text-violet-700',
    accentBg: 'bg-violet-100',
    nodeBar: 'bg-violet-500',
  },
  BUTTONS: {
    icon: MousePointerClick,
    accent: 'text-violet-700',
    accentBg: 'bg-violet-100',
    nodeBar: 'bg-violet-500',
  },
  SEND_FLOW: {
    icon: LayoutGrid,
    accent: 'text-channel-green',
    accentBg: 'bg-accent-green-bg',
    nodeBar: 'bg-channel-green',
  },
  ASSIGN_TO: {
    icon: UserPlus,
    accent: 'text-channel-blue',
    accentBg: 'bg-[#e8f3ff]',
    nodeBar: 'bg-channel-blue',
  },
  WAIT: {
    icon: Clock,
    accent: 'text-amber-700',
    accentBg: 'bg-amber-100',
    nodeBar: 'bg-amber-500',
  },
  GOTO_STEP: {
    icon: CornerDownRight,
    accent: 'text-amber-700',
    accentBg: 'bg-amber-100',
    nodeBar: 'bg-amber-500',
  },
  CONDITION: {
    icon: GitBranch,
    accent: 'text-violet-700',
    accentBg: 'bg-violet-100',
    nodeBar: 'bg-violet-500',
  },
  RANDOMIZER: {
    icon: Dices,
    accent: 'text-violet-700',
    accentBg: 'bg-violet-100',
    nodeBar: 'bg-violet-500',
  },
  UPDATE_FIELD: {
    icon: RefreshCw,
    accent: 'text-channel-blue',
    accentBg: 'bg-[#e8f3ff]',
    nodeBar: 'bg-channel-blue',
  },
  WEBHOOK: {
    icon: Webhook,
    accent: 'text-slate-600',
    accentBg: 'bg-slate-100',
    nodeBar: 'bg-slate-400',
  },
  UPDATE_TAG: {
    icon: Tag,
    accent: 'text-channel-blue',
    accentBg: 'bg-[#e8f3ff]',
    nodeBar: 'bg-channel-blue',
  },
  ADD_TO_FUNNEL: {
    icon: Target,
    accent: 'text-amber-700',
    accentBg: 'bg-amber-100',
    nodeBar: 'bg-amber-500',
  },
  OPEN_CONVERSATION: {
    icon: Inbox,
    accent: 'text-channel-blue',
    accentBg: 'bg-[#e8f3ff]',
    nodeBar: 'bg-channel-blue',
  },
  CLOSE_CONVERSATION: {
    icon: CircleStop,
    accent: 'text-slate-600',
    accentBg: 'bg-slate-100',
    nodeBar: 'bg-slate-400',
  },
  TRIGGER_JOURNEY: {
    icon: Workflow,
    accent: 'text-amber-700',
    accentBg: 'bg-amber-100',
    nodeBar: 'bg-amber-500',
  },
  UPDATE_LIFECYCLE: {
    icon: RefreshCw,
    accent: 'text-channel-blue',
    accentBg: 'bg-[#e8f3ff]',
    nodeBar: 'bg-channel-blue',
  },
  SEND_CAPI: {
    icon: Globe,
    accent: 'text-channel-green',
    accentBg: 'bg-accent-green-bg',
    nodeBar: 'bg-channel-green',
  },
  SEND_TIKTOK: {
    icon: Play,
    accent: 'text-channel-green',
    accentBg: 'bg-accent-green-bg',
    nodeBar: 'bg-channel-green',
  },
  GOOGLE_SHEETS: {
    icon: Sheet,
    accent: 'text-channel-green',
    accentBg: 'bg-accent-green-bg',
    nodeBar: 'bg-channel-green',
  },
  AI_OBJECTIVE: {
    icon: Bot,
    accent: 'text-violet-700',
    accentBg: 'bg-violet-100',
    nodeBar: 'bg-violet-500',
  },
  END: {
    icon: CircleStop,
    accent: 'text-slate-500',
    accentBg: 'bg-slate-100',
    nodeBar: 'bg-slate-400',
  },
};

export function getStepVisual(type: JourneyNodeType): StepVisual {
  return STEP_VISUALS[type];
}
