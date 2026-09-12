import {
  CircleStop,
  Clock,
  CornerDownRight,
  FileInput,
  Filter,
  GitBranch,
  HelpCircle,
  MessageSquare,
  MousePointerClick,
  PencilLine,
  RefreshCw,
  Shuffle,
  Tag,
  UserPlus,
  Webhook,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import type { AutomationChannel } from '@/services/realAutomations.service'

export type FlowStepKind =
  | 'trigger'
  | 'message'
  | 'ask'
  | 'buttons'
  | 'sendFlow'
  | 'wait'
  | 'condition'
  | 'randomizer'
  | 'tag'
  | 'updateField'
  | 'addToFunnel'
  | 'updateLifecycle'
  | 'assign'
  | 'webhook'
  | 'open'
  | 'close'
  | 'goto'
  | 'triggerJourney'
  | 'end'
  | 'custom'

export type StepCategory = 'messages' | 'logic' | 'contact' | 'conversation' | 'integrations' | 'flow'

export type FlowStepNodeData = {
  kind: FlowStepKind
  backendType: string
  label: string
  detail: string
  rawData: Record<string, unknown>
  channel?: AutomationChannel
  onDelete: (id: string) => void
  onAddStep: (sourceId: string, handleId: string | undefined, kind: FlowStepKind) => void
  onEdit: (id: string) => void
}

export type StepVisual = {
  icon: LucideIcon
  iconBg: string
  iconText: string
}

export const STEP_VISUAL: Record<FlowStepKind, StepVisual> = {
  trigger: { icon: Zap, iconBg: 'bg-amber-100', iconText: 'text-amber-700' },
  message: { icon: MessageSquare, iconBg: 'bg-[#e6fcef]', iconText: 'text-channel-green' },
  ask: { icon: HelpCircle, iconBg: 'bg-sky-100', iconText: 'text-sky-700' },
  buttons: { icon: MousePointerClick, iconBg: 'bg-violet-100', iconText: 'text-violet-700' },
  sendFlow: { icon: FileInput, iconBg: 'bg-[#e6fcef]', iconText: 'text-channel-green' },
  wait: { icon: Clock, iconBg: 'bg-amber-100', iconText: 'text-amber-700' },
  condition: { icon: GitBranch, iconBg: 'bg-violet-100', iconText: 'text-violet-700' },
  randomizer: { icon: Shuffle, iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-700' },
  tag: { icon: Tag, iconBg: 'bg-sky-100', iconText: 'text-sky-700' },
  updateField: { icon: PencilLine, iconBg: 'bg-sky-100', iconText: 'text-sky-700' },
  addToFunnel: { icon: Filter, iconBg: 'bg-teal-100', iconText: 'text-teal-700' },
  updateLifecycle: { icon: RefreshCw, iconBg: 'bg-teal-100', iconText: 'text-teal-700' },
  assign: { icon: UserPlus, iconBg: 'bg-emerald-100', iconText: 'text-emerald-700' },
  webhook: { icon: Webhook, iconBg: 'bg-orange-100', iconText: 'text-orange-700' },
  open: { icon: MessageSquare, iconBg: 'bg-emerald-50', iconText: 'text-emerald-700' },
  close: { icon: CircleStop, iconBg: 'bg-rose-50', iconText: 'text-rose-700' },
  goto: { icon: CornerDownRight, iconBg: 'bg-slate-100', iconText: 'text-slate-700' },
  triggerJourney: { icon: Workflow, iconBg: 'bg-indigo-100', iconText: 'text-indigo-700' },
  end: { icon: CircleStop, iconBg: 'bg-muted', iconText: 'text-muted-foreground' },
  custom: { icon: Zap, iconBg: 'bg-muted', iconText: 'text-muted-foreground' },
}

export type StepCatalogItem = {
  kind: Exclude<FlowStepKind, 'trigger' | 'custom'>
  label: string
  description: string
  category: StepCategory
  /** Omitted = both WhatsApp and Instagram. */
  channels?: AutomationChannel[]
}

export const STEP_CATEGORY_LABELS: Record<StepCategory, string> = {
  messages: 'Messages',
  logic: 'Logic',
  contact: 'Contact',
  conversation: 'Conversation',
  integrations: 'Integrations',
  flow: 'Flow',
}

export const STEP_CATEGORY_ORDER: StepCategory[] = [
  'messages',
  'logic',
  'contact',
  'conversation',
  'integrations',
  'flow',
]

/** Palette aligned with JOURNEY_STEP_CATALOG / IG_STEP_CATALOG. No CAPI / Sheets / TikTok / AI_OBJECTIVE. */
export const STEP_CATALOG: StepCatalogItem[] = [
  { kind: 'message', label: 'Send a Message', description: 'Send a WhatsApp template or text message', category: 'messages' },
  { kind: 'ask', label: 'Ask a Question', description: 'Send a question and wait for the contact to reply', category: 'messages' },
  { kind: 'buttons', label: 'Buttons', description: 'Send a message with reply buttons and branch by choice', category: 'messages' },
  {
    kind: 'sendFlow',
    label: 'Send Flow',
    description: 'Send a WhatsApp Flow form and wait for it to be submitted',
    category: 'messages',
    channels: ['whatsapp'],
  },
  { kind: 'condition', label: 'Condition', description: 'Branch the workflow when a contact matches a condition', category: 'logic' },
  { kind: 'randomizer', label: 'Randomizer', description: 'Split contacts randomly across weighted paths', category: 'logic' },
  { kind: 'updateField', label: 'Update Contact Field', description: 'Modify contact name, email, or custom fields', category: 'contact' },
  { kind: 'tag', label: 'Update Contact Tag', description: 'Add, remove, or replace contact tags', category: 'contact' },
  { kind: 'addToFunnel', label: 'Add to Funnel', description: 'Capture this contact as a lead in a funnel board', category: 'contact' },
  {
    kind: 'updateLifecycle',
    label: 'Update Lifecycle',
    description: "Update the contact's lifecycle stage",
    category: 'contact',
    channels: ['whatsapp'],
  },
  { kind: 'assign', label: 'Assign To', description: 'Assign the conversation to a user, AI, bot, or journey', category: 'conversation' },
  { kind: 'open', label: 'Open Conversation', description: 'Reopen the contact conversation in the inbox', category: 'conversation' },
  { kind: 'close', label: 'Close Conversation', description: 'Resolve the conversation with optional closing note', category: 'conversation' },
  { kind: 'webhook', label: 'HTTP Request', description: 'Send an HTTP request to an external endpoint', category: 'integrations' },
  { kind: 'wait', label: 'Wait', description: 'Wait for a period of time before advancing', category: 'flow' },
  { kind: 'goto', label: 'Go to Step', description: 'Jump to another step in this same automation', category: 'flow' },
  { kind: 'triggerJourney', label: 'Trigger Another Workflow', description: 'Start another published journey for this contact', category: 'flow' },
  { kind: 'end', label: 'End', description: 'Finish the journey for this contact', category: 'flow' },
]

export function catalogForChannel(channel: AutomationChannel): StepCatalogItem[] {
  return STEP_CATALOG.filter((item) => !item.channels || item.channels.includes(channel))
}

export function defaultDetailForKind(kind: FlowStepKind): string {
  switch (kind) {
    case 'message':
      return 'New message'
    case 'ask':
      return 'Ask a question'
    case 'buttons':
      return 'Option A / Option B'
    case 'sendFlow':
      return 'No flow selected'
    case 'wait':
      return '1 hour'
    case 'condition':
      return 'If reply contains…'
    case 'randomizer':
      return 'Path A 50% · Path B 50%'
    case 'tag':
      return 'new_tag'
    case 'updateField':
      return 'name'
    case 'addToFunnel':
      return 'Select funnel'
    case 'updateLifecycle':
      return 'Set stage'
    case 'assign':
      return 'Unassigned'
    case 'webhook':
      return 'POST request'
    case 'open':
      return 'Reopen inbox'
    case 'close':
      return 'Resolve inbox'
    case 'goto':
      return 'Select step'
    case 'triggerJourney':
      return 'Select journey'
    case 'end':
    case 'trigger':
    case 'custom':
      return ''
  }
}
