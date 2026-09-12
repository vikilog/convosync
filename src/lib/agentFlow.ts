export type AgentFlowNodeType =
  | 'ask_question'
  | 'send_messages'
  | 'call_api'
  | 'agent_takeover'
  | 'unsubscribe'
  | 'add_tags'
  | 'send_shop_product'
  | 'branch'

export type FlowTriggerType = 'keyword' | 'click_button'
export type KeywordMatchRule = 'containing' | 'exact_match'

export type AgentFlowNode = {
  id: string
  type: AgentFlowNodeType
  title: string
  x: number
  y: number
}

export type AgentFlowDefinition = {
  name: string
  status: 'active' | 'inactive'
  triggerType: FlowTriggerType | null
  keywordMatchRule?: KeywordMatchRule
  keywordList?: string[]
  nodes: AgentFlowNode[]
}

export const NODE_LABELS: Record<AgentFlowNodeType, string> = {
  ask_question: 'Ask a question',
  send_messages: 'Send messages',
  call_api: 'Call API',
  agent_takeover: 'Agent takeover',
  unsubscribe: 'Unsubscribe',
  add_tags: 'Add Tags',
  send_shop_product: 'Send Shop product',
  branch: 'Branch',
}

export const TRIGGER_LABELS: Record<FlowTriggerType, string> = {
  keyword: 'Keyword trigger',
  click_button: 'Click button trigger',
}

export const TRIGGER_DESCRIPTIONS: Record<FlowTriggerType, string> = {
  keyword: "When a customer's message or a clicked quick reply contains the keyword.",
  click_button: 'When a customer clicks a quick reply button in a WhatsApp template.',
}

export function defaultAgentFlowDefinition(): AgentFlowDefinition {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
  return {
    name: `${stamp}FLOW`,
    status: 'inactive',
    triggerType: null,
    keywordMatchRule: 'containing',
    keywordList: [],
    nodes: [],
  }
}

const NODE_TYPES = new Set<string>(Object.keys(NODE_LABELS))

export function parseAgentFlowDefinition(raw: unknown): AgentFlowDefinition | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const nodesRaw = Array.isArray(obj.nodes) ? obj.nodes : []
  const nodes = nodesRaw
    .filter((n): n is Record<string, unknown> => Boolean(n && typeof n === 'object'))
    .map((n) => {
      const typeRaw = String(n.type ?? 'send_messages')
      const type = (NODE_TYPES.has(typeRaw) ? typeRaw : 'send_messages') as AgentFlowNodeType
      return {
        id: String(n.id ?? `node_${Math.random().toString(36).slice(2, 8)}`),
        type,
        title: String(n.title ?? NODE_LABELS[type]),
        x: Number(n.x ?? 0),
        y: Number(n.y ?? 0),
      }
    })

  const triggerTypeRaw = obj.triggerType
  const triggerType: FlowTriggerType | null =
    triggerTypeRaw === 'keyword' || triggerTypeRaw === 'click_button' ? triggerTypeRaw : null

  let keywordList: string[] = []
  if (Array.isArray(obj.keywordList)) {
    keywordList = obj.keywordList.map((k) => String(k))
  } else if (obj.triggerKeywords) {
    keywordList = String(obj.triggerKeywords)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return {
    name: String(obj.name ?? defaultAgentFlowDefinition().name),
    status: obj.status === 'active' ? 'active' : 'inactive',
    triggerType,
    keywordMatchRule: obj.keywordMatchRule === 'exact_match' ? 'exact_match' : 'containing',
    keywordList,
    nodes,
  }
}

export function checkAgentFlow(flow: AgentFlowDefinition): string {
  const issues: string[] = []
  if (!flow.triggerType) issues.push('Select a trigger type')
  if (flow.triggerType === 'keyword') {
    const filled = (flow.keywordList ?? []).map((k) => k.trim()).filter(Boolean)
    if (!filled.length) issues.push('Add at least one keyword')
  }
  if (flow.nodes.length === 0) issues.push('Add at least one action after the trigger')
  return issues.length === 0 ? 'Flow looks good — ready to save and activate.' : issues.join(' · ')
}

export const SAMPLE_SUPPORT_FLOW: AgentFlowDefinition = {
  name: 'SAMPLE_SUPPORT_FLOW',
  status: 'inactive',
  triggerType: 'keyword',
  keywordMatchRule: 'containing',
  keywordList: ['price', 'catalog', 'support'],
  nodes: [
    { id: 'sample_send_welcome', type: 'send_messages', title: NODE_LABELS.send_messages, x: 0, y: 0 },
    { id: 'sample_ask_product', type: 'ask_question', title: NODE_LABELS.ask_question, x: 0, y: 0 },
    { id: 'sample_add_tag', type: 'add_tags', title: NODE_LABELS.add_tags, x: 0, y: 0 },
  ],
}

export const SAMPLE_EXACT_MATCH_FLOW: AgentFlowDefinition = {
  name: 'SAMPLE_EXACT_ORDER_FLOW',
  status: 'inactive',
  triggerType: 'keyword',
  keywordMatchRule: 'exact_match',
  keywordList: ['ORDER', 'TRACK'],
  nodes: [
    { id: 'sample_order_msg', type: 'send_messages', title: NODE_LABELS.send_messages, x: 0, y: 0 },
    { id: 'sample_order_branch', type: 'branch', title: NODE_LABELS.branch, x: 0, y: 0 },
    { id: 'sample_order_human', type: 'agent_takeover', title: NODE_LABELS.agent_takeover, x: 0, y: 0 },
  ],
}
