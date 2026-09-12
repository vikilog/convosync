import { describe, expect, it } from 'vitest'

import { mapWhatsAppTemplate } from '@/services/realTemplates.service'

describe('mapWhatsAppTemplate', () => {
  it('normalizes Meta category/status and keeps flow + media keys', () => {
    const t = mapWhatsAppTemplate({
      id: 't1',
      name: 'order_ok',
      category: 'MARKETING',
      status: 'APPROVED',
      language: 'en_US',
      bodyPattern: 'Hi {{1}}',
      buttonFlowId: 'flow_1',
      headerMediaStorageKey: 'ws/template-headers/a.jpg',
      variables: ['Ada'],
    })
    expect(t.category).toBe('Marketing')
    expect(t.status).toBe('approved')
    expect(t.buttonFlowId).toBe('flow_1')
    expect(t.headerMediaStorageKey).toBe('ws/template-headers/a.jpg')
  })
})
