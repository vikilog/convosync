import {
  Bot,
  CircleStop,
  Clock,
  GitBranch,
  Globe,
  HelpCircle,
  Inbox,
  MessageSquare,
  Play,
  RefreshCw,
  Sheet,
  Tag,
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

export const STEP_VISUALS: Record<JourneyNodeType, StepVisual> = {
  TRIGGER: { icon: Zap, accent: 'text-primary', accentBg: 'bg-primary/10', nodeBar: 'bg-primary' },
  SEND_MESSAGE: {
    icon: MessageSquare,
    accent: 'text-channel-green',
    accentBg: 'bg-[#e6f7ec]',
    nodeBar: 'bg-channel-green',
  },
  ASK_QUESTION: { icon: HelpCircle, accent: 'text-teal-700', accentBg: 'bg-teal-100', nodeBar: 'bg-teal-500' },
  ASSIGN_TO: { icon: UserPlus, accent: 'text-teal-700', accentBg: 'bg-teal-100', nodeBar: 'bg-teal-500' },
  WAIT: { icon: Clock, accent: 'text-amber-700', accentBg: 'bg-amber-100', nodeBar: 'bg-amber-500' },
  CONDITION: { icon: GitBranch, accent: 'text-amber-800', accentBg: 'bg-amber-100', nodeBar: 'bg-amber-500' },
  UPDATE_FIELD: { icon: RefreshCw, accent: 'text-slate-700', accentBg: 'bg-slate-100', nodeBar: 'bg-slate-500' },
  WEBHOOK: { icon: Webhook, accent: 'text-slate-700', accentBg: 'bg-slate-100', nodeBar: 'bg-slate-500' },
  UPDATE_TAG: { icon: Tag, accent: 'text-orange-700', accentBg: 'bg-orange-100', nodeBar: 'bg-orange-500' },
  OPEN_CONVERSATION: { icon: Inbox, accent: 'text-teal-700', accentBg: 'bg-teal-100', nodeBar: 'bg-teal-500' },
  CLOSE_CONVERSATION: { icon: CircleStop, accent: 'text-slate-700', accentBg: 'bg-slate-100', nodeBar: 'bg-slate-500' },
  TRIGGER_JOURNEY: { icon: Workflow, accent: 'text-orange-700', accentBg: 'bg-orange-100', nodeBar: 'bg-orange-500' },
  UPDATE_LIFECYCLE: { icon: RefreshCw, accent: 'text-primary', accentBg: 'bg-primary/10', nodeBar: 'bg-primary' },
  SEND_CAPI: { icon: Globe, accent: 'text-slate-600', accentBg: 'bg-slate-100', nodeBar: 'bg-slate-400' },
  SEND_TIKTOK: { icon: Play, accent: 'text-slate-600', accentBg: 'bg-slate-100', nodeBar: 'bg-slate-400' },
  GOOGLE_SHEETS: { icon: Sheet, accent: 'text-green-700', accentBg: 'bg-green-100', nodeBar: 'bg-green-500' },
  AI_OBJECTIVE: { icon: Bot, accent: 'text-primary', accentBg: 'bg-primary/10', nodeBar: 'bg-primary' },
  END: { icon: CircleStop, accent: 'text-slate-700', accentBg: 'bg-slate-200', nodeBar: 'bg-slate-600' },
};

export function getStepVisual(type: JourneyNodeType): StepVisual {
  return STEP_VISUALS[type];
}
