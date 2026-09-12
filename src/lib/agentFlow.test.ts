import { describe, expect, it } from 'vitest'

import {
  checkAgentFlow,
  defaultAgentFlowDefinition,
  parseAgentFlowDefinition,
  SAMPLE_SUPPORT_FLOW,
} from './agentFlow'

describe('agentFlow', () => {
  it('parses a saved flow definition', () => {
    const parsed = parseAgentFlowDefinition({
      name: 'WELCOME',
      status: 'active',
      triggerType: 'keyword',
      keywordMatchRule: 'exact_match',
      keywordList: ['hi'],
      nodes: [{ id: 'n1', type: 'send_messages', title: 'Send messages', x: 0, y: 0 }],
    })
    expect(parsed?.status).toBe('active')
    expect(parsed?.keywordList).toEqual(['hi'])
    expect(parsed?.nodes).toHaveLength(1)
  })

  it('treats unknown trigger as unset', () => {
    expect(parseAgentFlowDefinition({ triggerType: 'nope', nodes: [] })?.triggerType).toBeNull()
  })

  it('returns null for garbage', () => {
    expect(parseAgentFlowDefinition(null)).toBeNull()
    expect(parseAgentFlowDefinition('x')).toBeNull()
  })

  it('checks required trigger and nodes', () => {
    expect(checkAgentFlow(defaultAgentFlowDefinition())).toContain('Select a trigger type')
    expect(checkAgentFlow(SAMPLE_SUPPORT_FLOW)).toContain('ready to save')
  })
})
