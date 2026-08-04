import {
  CircleStop,
  CornerDownRight,
  Dices,
  FolderOpen,
  FolderX,
  GitBranch,
  Globe,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  MousePointerClick,
  Tag,
  Target,
  Timer,
  UserCog,
  UserPlus,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { IgJourneyNodeType, IgTriggerEvent } from '../types';
import { IG_CHIP } from '../igTheme';

export type StepVisual = {
  icon: LucideIcon;
  accent: string;
  accentBg: string;
};

export const STEP_VISUALS: Record<IgJourneyNodeType, StepVisual> = {
  TRIGGER: {
    icon: Zap,
    accent: 'text-[#833AB4]',
    accentBg: IG_CHIP,
  },
  SEND_MESSAGE: {
    icon: MessageSquare,
    accent: 'text-[#FD1D1D]',
    accentBg: IG_CHIP,
  },
  ASK_QUESTION: {
    icon: HelpCircle,
    accent: 'text-[#833AB4]',
    accentBg: IG_CHIP,
  },
  BUTTONS: {
    icon: MousePointerClick,
    accent: 'text-[#833AB4]',
    accentBg: IG_CHIP,
  },
  WAIT: {
    icon: Timer,
    accent: 'text-[#FCB045]',
    accentBg: IG_CHIP,
  },
  GOTO_STEP: {
    icon: CornerDownRight,
    accent: 'text-[#FCB045]',
    accentBg: IG_CHIP,
  },
  CONDITION: {
    icon: GitBranch,
    accent: 'text-[#833AB4]',
    accentBg: IG_CHIP,
  },
  RANDOMIZER: {
    icon: Dices,
    accent: 'text-[#833AB4]',
    accentBg: IG_CHIP,
  },
  UPDATE_TAG: {
    icon: Tag,
    accent: 'text-[#FCB045]',
    accentBg: IG_CHIP,
  },
  UPDATE_FIELD: {
    icon: UserCog,
    accent: 'text-[#FD1D1D]',
    accentBg: IG_CHIP,
  },
  ADD_TO_FUNNEL: {
    icon: Target,
    accent: 'text-[#FCB045]',
    accentBg: IG_CHIP,
  },
  OPEN_CONVERSATION: {
    icon: FolderOpen,
    accent: 'text-[#833AB4]',
    accentBg: IG_CHIP,
  },
  CLOSE_CONVERSATION: {
    icon: FolderX,
    accent: 'text-slate-600',
    accentBg: 'bg-slate-100',
  },
  ASSIGN_TO: {
    icon: UserPlus,
    accent: 'text-[#FD1D1D]',
    accentBg: IG_CHIP,
  },
  WEBHOOK: {
    icon: Globe,
    accent: 'text-slate-600',
    accentBg: 'bg-slate-100',
  },
  TRIGGER_JOURNEY: {
    icon: Workflow,
    accent: 'text-[#FCB045]',
    accentBg: IG_CHIP,
  },
  END: {
    icon: CircleStop,
    accent: 'text-slate-500',
    accentBg: 'bg-slate-100',
  },
};

export function getStepVisual(type: IgJourneyNodeType): StepVisual {
  return STEP_VISUALS[type];
}

export function getTriggerEventIcon(event: IgTriggerEvent | string | undefined): LucideIcon {
  if (event === 'comment.received') return MessageSquare;
  return MessageCircle;
}
