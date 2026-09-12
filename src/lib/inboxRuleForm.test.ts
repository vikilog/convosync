import { describe, expect, it } from 'vitest'

import {
  emptyInboxRuleForm,
  inboxRuleFormToInput,
  inboxRuleSummary,
  inboxRuleToForm,
} from './inboxRuleForm'
import type { InboxRule } from '@/services/realWorkspaceSettings.service'

const rule: InboxRule = {
  id: 'r1',
  workspaceId: 'w1',
  name: 'VIP WhatsApp',
  enabled: true,
  priority: 0,
  conditions: {
    channels: ['whatsapp'],
    contactTags: ['vip', 'priority'],
    businessHours: { days: [1, 2], start: '09:00', end: '17:00', timezone: 'Asia/Kolkata' },
  },
  actionType: 'group',
  actionGroupId: 'g1',
  actionUserId: null,
}

describe('inboxRuleForm', () => {
  it('round-trips a rule into create/update input', () => {
    const form = inboxRuleToForm(rule)
    expect(form.contactTags).toEqual(['vip', 'priority'])
    expect(form.timezone).toBe('Asia/Kolkata')
    const input = inboxRuleFormToInput(form)
    expect(input).toEqual({
      name: 'VIP WhatsApp',
      enabled: true,
      conditions: rule.conditions,
      actionType: 'group',
      actionGroupId: 'g1',
      actionUserId: null,
    })
  })

  it('rejects a nameless rule and summarizes a match', () => {
    expect(inboxRuleFormToInput(emptyInboxRuleForm())).toEqual({ error: 'Rule name is required' })
    expect(inboxRuleSummary(rule, [{ id: 'g1', name: 'Sales' }], [])).toBe(
      'whatsapp · tags: vip, priority · 09:00–17:00 Asia/Kolkata → Sales'
    )
  })
})
