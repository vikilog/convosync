import type { AgentFlowDefinition } from '../../types';

/** Ready-made flow for testing keyword trigger + multi-step path in the builder. */
export const SAMPLE_AGENT_FLOW: AgentFlowDefinition = {
  name: 'SAMPLE_SUPPORT_FLOW',
  status: 'inactive',
  triggerType: 'keyword',
  keywordMatchRule: 'containing',
  keywordList: ['price', 'catalog', 'support'],
  nodes: [
    {
      id: 'sample_send_welcome',
      type: 'send_messages',
      title: 'Send messages',
      x: 0,
      y: 0,
    },
    {
      id: 'sample_ask_product',
      type: 'ask_question',
      title: 'Ask a question',
      x: 0,
      y: 0,
    },
    {
      id: 'sample_add_tag',
      type: 'add_tags',
      title: 'Add Tags',
      x: 0,
      y: 0,
    },
  ],
};

/** Second sample — exact match + click-style path with branch + human handoff. */
export const SAMPLE_EXACT_MATCH_FLOW: AgentFlowDefinition = {
  name: 'SAMPLE_EXACT_ORDER_FLOW',
  status: 'inactive',
  triggerType: 'keyword',
  keywordMatchRule: 'exact_match',
  keywordList: ['ORDER', 'TRACK'],
  nodes: [
    {
      id: 'sample_order_msg',
      type: 'send_messages',
      title: 'Send messages',
      x: 0,
      y: 0,
    },
    {
      id: 'sample_order_branch',
      type: 'branch',
      title: 'Branch',
      x: 0,
      y: 0,
    },
    {
      id: 'sample_order_human',
      type: 'agent_takeover',
      title: 'Agent takeover',
      x: 0,
      y: 0,
    },
  ],
};

export const SAMPLE_FLOW_TEST_HINTS = [
  'Open Trigger → verify keywords: price, catalog, support (Containing rule).',
  'Canvas should show: Trigger → Send messages → Ask a question → Add Tags.',
  'Click Check — should pass with no errors.',
  'Click Save, refresh page — flow should reload as saved.',
  'Try Load exact-match sample for ORDER / TRACK keywords (Exact match rule).',
];
