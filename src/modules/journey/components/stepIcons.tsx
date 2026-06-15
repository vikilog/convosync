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
  TRIGGER: { icon: Zap, accent: 'text-violet-700', accentBg: 'bg-violet-100', nodeBar: 'bg-violet-500' },
  SEND_MESSAGE: { icon: MessageSquare, accent: 'text-emerald-700', accentBg: 'bg-emerald-100', nodeBar: 'bg-emerald-500' },
  ASK_QUESTION: { icon: HelpCircle, accent: 'text-cyan-700', accentBg: 'bg-cyan-100', nodeBar: 'bg-cyan-500' },
  ASSIGN_TO: { icon: UserPlus, accent: 'text-teal-700', accentBg: 'bg-teal-100', nodeBar: 'bg-teal-500' },
  WAIT: { icon: Clock, accent: 'text-amber-700', accentBg: 'bg-amber-100', nodeBar: 'bg-amber-500' },
  CONDITION: { icon: GitBranch, accent: 'text-sky-700', accentBg: 'bg-sky-100', nodeBar: 'bg-sky-500' },
  UPDATE_FIELD: { icon: RefreshCw, accent: 'text-purple-700', accentBg: 'bg-purple-100', nodeBar: 'bg-purple-500' },
  WEBHOOK: { icon: Webhook, accent: 'text-indigo-700', accentBg: 'bg-indigo-100', nodeBar: 'bg-indigo-500' },
  UPDATE_TAG: { icon: Tag, accent: 'text-fuchsia-700', accentBg: 'bg-fuchsia-100', nodeBar: 'bg-fuchsia-500' },
  OPEN_CONVERSATION: { icon: Inbox, accent: 'text-blue-700', accentBg: 'bg-blue-100', nodeBar: 'bg-blue-500' },
  CLOSE_CONVERSATION: { icon: CircleStop, accent: 'text-slate-700', accentBg: 'bg-slate-100', nodeBar: 'bg-slate-500' },
  TRIGGER_JOURNEY: { icon: Workflow, accent: 'text-orange-700', accentBg: 'bg-orange-100', nodeBar: 'bg-orange-500' },
  UPDATE_LIFECYCLE: { icon: RefreshCw, accent: 'text-violet-700', accentBg: 'bg-violet-100', nodeBar: 'bg-violet-500' },
  SEND_CAPI: { icon: Globe, accent: 'text-slate-600', accentBg: 'bg-slate-100', nodeBar: 'bg-slate-400' },
  SEND_TIKTOK: { icon: Play, accent: 'text-slate-600', accentBg: 'bg-slate-100', nodeBar: 'bg-slate-400' },
  GOOGLE_SHEETS: { icon: Sheet, accent: 'text-green-700', accentBg: 'bg-green-100', nodeBar: 'bg-green-500' },
  AI_OBJECTIVE: { icon: Bot, accent: 'text-sky-700', accentBg: 'bg-sky-100', nodeBar: 'bg-sky-500' },
  END: { icon: CircleStop, accent: 'text-slate-700', accentBg: 'bg-slate-200', nodeBar: 'bg-slate-600' },
};

export function getStepVisual(type: JourneyNodeType): StepVisual {
  return STEP_VISUALS[type];
}
