import type { FlowStepKind } from '@/lib/flowStepTypes'
import type { AutomationChannel } from '@/services/realAutomations.service'

export type JourneyNodeType =
  | 'TRIGGER'
  | 'SEND_MESSAGE'
  | 'ASK_QUESTION'
  | 'BUTTONS'
  | 'SEND_FLOW'
  | 'WAIT'
  | 'CONDITION'
  | 'RANDOMIZER'
  | 'UPDATE_TAG'
  | 'UPDATE_FIELD'
  | 'ADD_TO_FUNNEL'
  | 'UPDATE_LIFECYCLE'
  | 'ASSIGN_TO'
  | 'WEBHOOK'
  | 'OPEN_CONVERSATION'
  | 'CLOSE_CONVERSATION'
  | 'GOTO_STEP'
  | 'TRIGGER_JOURNEY'
  | 'END'

export const KIND_TO_NODE_TYPE: Record<Exclude<FlowStepKind, 'custom'>, string> = {
  trigger: 'TRIGGER',
  message: 'SEND_MESSAGE',
  ask: 'ASK_QUESTION',
  buttons: 'BUTTONS',
  sendFlow: 'SEND_FLOW',
  wait: 'WAIT',
  condition: 'CONDITION',
  randomizer: 'RANDOMIZER',
  tag: 'UPDATE_TAG',
  updateField: 'UPDATE_FIELD',
  addToFunnel: 'ADD_TO_FUNNEL',
  updateLifecycle: 'UPDATE_LIFECYCLE',
  assign: 'ASSIGN_TO',
  webhook: 'WEBHOOK',
  open: 'OPEN_CONVERSATION',
  close: 'CLOSE_CONVERSATION',
  goto: 'GOTO_STEP',
  triggerJourney: 'TRIGGER_JOURNEY',
  end: 'END',
}

const NODE_TYPE_TO_KIND: Record<string, FlowStepKind> = {
  TRIGGER: 'trigger',
  SEND_MESSAGE: 'message',
  ASK_QUESTION: 'ask',
  BUTTONS: 'buttons',
  SEND_FLOW: 'sendFlow',
  WAIT: 'wait',
  CONDITION: 'condition',
  RANDOMIZER: 'randomizer',
  UPDATE_TAG: 'tag',
  UPDATE_FIELD: 'updateField',
  ADD_TO_FUNNEL: 'addToFunnel',
  UPDATE_LIFECYCLE: 'updateLifecycle',
  ASSIGN_TO: 'assign',
  WEBHOOK: 'webhook',
  OPEN_CONVERSATION: 'open',
  CLOSE_CONVERSATION: 'close',
  GOTO_STEP: 'goto',
  TRIGGER_JOURNEY: 'triggerJourney',
  END: 'end',
}

/** Unknown backend types stay as `custom` so save can write the original type back. */
export function kindForNodeType(type: string): FlowStepKind {
  return NODE_TYPE_TO_KIND[type] ?? 'custom'
}

export function nodeTypeForKind(kind: FlowStepKind, backendType?: string): string {
  if (kind === 'custom') return backendType || 'SEND_MESSAGE'
  return KIND_TO_NODE_TYPE[kind]
}

export const TRIGGER_EVENTS = [
  { value: 'message.received', label: 'Keyword / message received' },
  { value: 'contact.created', label: 'Welcome (contact created)' },
  { value: 'contact.tag_added', label: 'Tag added' },
  { value: 'conversation.opened', label: 'Conversation opened' },
  { value: 'manual', label: 'Manual' },
] as const

export const IG_TRIGGER_EVENTS = [
  { value: 'dm.received', label: 'DM received' },
  { value: 'comment.received', label: 'Comment on post' },
] as const

export const CONDITION_OPERATORS = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: 'contains', label: 'contains' },
] as const

export const CONTACT_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'journeyStatus', label: 'Lifecycle stage' },
  { value: 'custom', label: 'Custom field' },
] as const

export const ASSIGNEE_TYPES = [
  { value: 'user', label: 'Team member' },
  { value: 'ai', label: 'AI Copilot' },
  { value: 'journey', label: 'Journey' },
  { value: 'unassigned', label: 'Unassigned' },
] as const

export const RANDOMIZER_PATHS_MAX = 6

export const IG_SEND_AS_MODES = [
  { value: 'window_24h', label: '24-hour window' },
  { value: 'private_reply', label: 'Private reply (comment)' },
] as const

export type TriggerData = { event: string; events?: string[]; keyword?: string }
export type MessageMode = 'text' | 'template' | 'cta_url'
export type SendMessageData = {
  text: string
  messageMode?: MessageMode
  templateId?: string
  templateName?: string
  language?: string
  variables?: string[]
  ctaLabel?: string
  ctaUrl?: string
  sendAs?: string
}
export type AskQuestionData = { text: string }
export type ButtonsData = { text: string; buttons: { id: string; title: string }[] }
export type WaitData = { amount: number; unit: 'minutes' | 'hours' | 'days' }
export type ConditionRow = { type: string; field: string; operator: string; value: string }
export type ConditionData = { conditions: ConditionRow[]; combinator: 'all' | 'any' }
export type UpdateTagData = { action: 'add' | 'remove' | 'set'; tags: string[] }
export type UpdateFieldData = { field: string; value: string; customFieldKey?: string }
export type AddToFunnelData = { funnelId: string; stageId?: string }
export type UpdateLifecycleData = { stage: string }
export type AssignToData = { assigneeType: string; assigneeId: string }
export type WebhookData = { method: string; url: string; name?: string }
export type CloseConversationData = { closingNote?: string }
export type RandomizerPath = { id: string; label: string; weight: number }
export type RandomizerData = { paths: RandomizerPath[] }
export type GotoStepData = { targetNodeId: string }
export type TriggerJourneyData = { journeyId: string }
export type SendFlowData = {
  flowId: string
  text: string
  ctaLabel?: string
  headerText?: string
  saveFieldsPrefix?: string
  mapNameField?: string
  mapPhoneField?: string
  mapEmailField?: string
  funnelId?: string
  stageId?: string
}

export function defaultDataForKind(
  kind: FlowStepKind,
  channel: AutomationChannel = 'whatsapp'
): Record<string, unknown> {
  switch (kind) {
    case 'trigger':
      return channel === 'instagram'
        ? ({ event: 'dm.received', events: ['dm.received'], keyword: '' } satisfies TriggerData)
        : ({ event: 'message.received' } satisfies TriggerData)
    case 'message':
      return channel === 'instagram'
        ? ({ text: '', sendAs: 'window_24h' } satisfies SendMessageData)
        : ({ messageMode: 'text', text: '' } satisfies SendMessageData)
    case 'ask':
      return { text: '' } satisfies AskQuestionData
    case 'buttons':
      return {
        text: '',
        buttons: [
          { id: 'btn_a', title: 'Option A' },
          { id: 'btn_b', title: 'Option B' },
        ],
      } satisfies ButtonsData
    case 'sendFlow':
      return {
        flowId: '',
        text: '',
        ctaLabel: 'Open',
        headerText: '',
        saveFieldsPrefix: 'flow_',
        mapNameField: '',
        mapPhoneField: '',
        mapEmailField: '',
        funnelId: '',
        stageId: '',
      } satisfies SendFlowData
    case 'wait':
      return { amount: 1, unit: 'hours' } satisfies WaitData
    case 'condition':
      return {
        conditions: [{ type: 'field', field: 'tags', operator: 'contains', value: '' }],
        combinator: 'all',
      } satisfies ConditionData
    case 'randomizer':
      return {
        paths: [
          { id: 'a', label: 'Path A', weight: 50 },
          { id: 'b', label: 'Path B', weight: 50 },
        ],
      } satisfies RandomizerData
    case 'tag':
      return { action: 'add', tags: [] } satisfies UpdateTagData
    case 'updateField':
      return { field: 'name', value: '', customFieldKey: '' } satisfies UpdateFieldData
    case 'addToFunnel':
      return { funnelId: '', stageId: '' } satisfies AddToFunnelData
    case 'updateLifecycle':
      return { stage: '' } satisfies UpdateLifecycleData
    case 'assign':
      return { assigneeType: 'unassigned', assigneeId: '' } satisfies AssignToData
    case 'webhook':
      return { method: 'POST', url: '', name: '' } satisfies WebhookData
    case 'close':
      return { closingNote: '' } satisfies CloseConversationData
    case 'goto':
      return { targetNodeId: '' } satisfies GotoStepData
    case 'triggerJourney':
      return { journeyId: '' } satisfies TriggerJourneyData
    case 'open':
    case 'end':
    case 'custom':
      return {}
  }
}

export function labelForKind(kind: FlowStepKind, backendType?: string): string {
  switch (kind) {
    case 'trigger':
      return 'Trigger'
    case 'message':
      return 'Send message'
    case 'ask':
      return 'Ask a question'
    case 'buttons':
      return 'Buttons'
    case 'sendFlow':
      return 'Send Flow'
    case 'wait':
      return 'Wait'
    case 'condition':
      return 'Condition'
    case 'randomizer':
      return 'Randomizer'
    case 'tag':
      return 'Update tag'
    case 'updateField':
      return 'Update field'
    case 'addToFunnel':
      return 'Add to funnel'
    case 'updateLifecycle':
      return 'Update lifecycle'
    case 'assign':
      return 'Assign to'
    case 'webhook':
      return 'HTTP request'
    case 'open':
      return 'Open conversation'
    case 'close':
      return 'Close conversation'
    case 'goto':
      return 'Go to step'
    case 'triggerJourney':
      return 'Trigger another workflow'
    case 'end':
      return 'End'
    case 'custom':
      return backendType
        ? backendType
            .toLowerCase()
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : 'Step'
  }
}

function clip(text: string, max = 40): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function normalizeConditionGroup(data: Record<string, unknown>): ConditionData {
  const raw = data as Partial<ConditionData>
  if (Array.isArray(raw.conditions) && raw.conditions.length > 0) {
    return {
      conditions: raw.conditions.map((c) => ({
        type: String(c?.type || 'field'),
        field: String(c?.field ?? ''),
        operator: String(c?.operator ?? '='),
        value: String(c?.value ?? ''),
      })),
      combinator: raw.combinator === 'any' ? 'any' : 'all',
    }
  }
  const field = typeof data.field === 'string' ? data.field : ''
  if (field) {
    return {
      conditions: [
        {
          type: 'field',
          field,
          operator: String(data.operator ?? '='),
          value: String(data.value ?? ''),
        },
      ],
      combinator: 'all',
    }
  }
  return { conditions: [], combinator: 'all' }
}

export function detailForNode(kind: FlowStepKind, data: Record<string, unknown>): string {
  switch (kind) {
    case 'trigger': {
      const event = (data as Partial<TriggerData>).event
      const keyword = (data as Partial<TriggerData>).keyword?.trim()
      const ig = IG_TRIGGER_EVENTS.find((e) => e.value === event)?.label
      const wa = TRIGGER_EVENTS.find((e) => e.value === event)?.label
      const base = ig ?? wa ?? event ?? 'No event set'
      return keyword ? `${base} · “${keyword}”` : base
    }
    case 'message': {
      const d = data as Partial<SendMessageData>
      if ((d.messageMode === 'template' || d.templateName || d.templateId) && d.messageMode !== 'text') {
        return d.templateName ? `Template: ${d.templateName}` : 'Template'
      }
      if (d.messageMode === 'cta_url') return d.ctaLabel ? `Link · ${d.ctaLabel}` : 'Link button'
      return d.text ? clip(d.text) : 'No message set'
    }
    case 'ask': {
      const text = (data as Partial<AskQuestionData>).text
      return text ? clip(text) : 'No message set'
    }
    case 'buttons': {
      const buttons = (data as Partial<ButtonsData>).buttons ?? []
      return buttons.length ? buttons.map((b) => b.title).filter(Boolean).join(' / ') : 'No buttons'
    }
    case 'sendFlow': {
      const d = data as Partial<SendFlowData>
      if (d.flowId) return d.ctaLabel || d.text || 'WhatsApp Flow'
      return 'No flow selected'
    }
    case 'wait': {
      const { amount, unit } = data as Partial<WaitData>
      return amount ? `${amount} ${unit ?? 'hours'}` : 'No duration set'
    }
    case 'condition': {
      const { conditions, combinator } = normalizeConditionGroup(data)
      const c = conditions[0]
      if (!c) return 'No condition set'
      const first = c.field ? `${c.field} ${c.operator} ${c.value}` : c.type
      if (conditions.length === 1) return first
      return `${first} ${combinator === 'any' ? 'OR' : 'AND'} +${conditions.length - 1}`
    }
    case 'randomizer': {
      const paths = (data as Partial<RandomizerData>).paths ?? []
      return paths.length
        ? paths.map((p) => `${p.label || p.id} ${p.weight ?? 0}%`).join(' · ')
        : 'Add paths'
    }
    case 'tag': {
      const { action, tags } = data as Partial<UpdateTagData>
      return tags?.length ? `${action ?? 'add'}: ${tags.join(', ')}` : 'No tag set'
    }
    case 'updateField': {
      const d = data as Partial<UpdateFieldData>
      const field = d.field === 'custom' ? d.customFieldKey || 'custom' : d.field || 'name'
      return d.value ? `${field} = ${d.value}` : field
    }
    case 'addToFunnel':
      return (data as Partial<AddToFunnelData>).funnelId ? 'Lead funnel selected' : 'Select funnel'
    case 'updateLifecycle':
      return (data as Partial<UpdateLifecycleData>).stage || 'Set stage'
    case 'assign': {
      const t = (data as Partial<AssignToData>).assigneeType
      return t || 'Unassigned'
    }
    case 'webhook': {
      const { method, url } = data as Partial<WebhookData>
      return url ? `${method ?? 'POST'} ${url}` : 'No URL set'
    }
    case 'close': {
      const note = (data as Partial<CloseConversationData>).closingNote
      return note || 'Resolve conversation'
    }
    case 'goto': {
      const id = (data as Partial<GotoStepData>).targetNodeId?.trim()
      return id ? `Jump · ${id.slice(0, 8)}` : 'Select step'
    }
    case 'triggerJourney':
      return (data as Partial<TriggerJourneyData>).journeyId ? 'Journey selected' : 'Select journey'
    case 'open':
      return 'Reopen inbox'
    case 'end':
    case 'custom':
      return ''
  }
}

export function buttonRows(data: Record<string, unknown>): { id: string; title: string }[] {
  const raw = (data as Partial<ButtonsData>).buttons
  if (!Array.isArray(raw)) return []
  return raw
    .filter((b) => b && typeof b === 'object')
    .map((b, i) => ({
      id: String(b.id || `btn_${i}`),
      title: String(b.title ?? ''),
    }))
}

export type SourcePort = { id: string; label: string }

/** RANDOMIZER / custom nodes store branch ids on `paths`. */
export function pathRows(data: Record<string, unknown>): { id: string; title: string }[] {
  const raw = data.paths
  if (!Array.isArray(raw)) return []
  return raw
    .filter((p) => p && typeof p === 'object')
    .map((p, i) => {
      const row = p as { id?: unknown; label?: unknown; title?: unknown }
      return {
        id: String(row.id || `path_${i}`),
        title: String(row.label ?? row.title ?? ''),
      }
    })
}

/** Labeled source ports for CONDITION / BUTTONS / RANDOMIZER / custom multi-output nodes. Empty = single default handle. */
export function sourcePorts(kind: FlowStepKind, data: Record<string, unknown>): SourcePort[] {
  if (kind === 'end') return []
  if (kind === 'condition')
    return [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ]
  if (kind === 'buttons') return buttonRows(data).map((b) => ({ id: b.id, label: b.title || 'Button' }))
  const paths = pathRows(data)
  if (paths.length) return paths.map((p) => ({ id: p.id, label: p.title || p.id }))
  if (kind === 'custom') {
    const buttons = buttonRows(data)
    if (buttons.length) return buttons.map((b) => ({ id: b.id, label: b.title || 'Button' }))
  }
  return []
}

export function igTriggerEvents(data: Record<string, unknown>): string[] {
  const events = (data as Partial<TriggerData>).events
  if (Array.isArray(events) && events.length) return events.map(String)
  const event = (data as Partial<TriggerData>).event
  return event ? [event] : ['dm.received']
}

export function resolveMessageMode(data: Record<string, unknown>): MessageMode {
  const mode = (data as Partial<SendMessageData>).messageMode
  if (mode === 'text' || mode === 'template' || mode === 'cta_url') return mode
  if (data.templateName || data.templateId) return 'template'
  return 'text'
}
