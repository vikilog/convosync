import { describe, expect, it } from 'vitest'

import { triggerLabel } from './automationLabels'

describe('triggerLabel', () => {
  it('maps WhatsApp welcome / keyword / tag events', () => {
    expect(triggerLabel('whatsapp', 'contact.created')).toBe('Welcome')
    expect(triggerLabel('whatsapp', 'message.received')).toBe('Keyword / message')
    expect(triggerLabel('whatsapp', 'contact.tag_added')).toBe('Tag added')
    expect(triggerLabel('whatsapp', 'manual')).toBe('Manual')
    expect(triggerLabel('whatsapp', null)).toBe('No trigger')
  })

  it('maps Instagram DM and comment events', () => {
    expect(triggerLabel('instagram', 'dm.received')).toBe('DM')
    expect(triggerLabel('instagram', 'comment.received')).toBe('Comment')
    expect(triggerLabel('instagram', 'dm.received,comment.received')).toBe('DM + Comment')
  })
})
