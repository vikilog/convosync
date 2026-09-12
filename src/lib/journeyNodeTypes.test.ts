import { describe, expect, it } from 'vitest'

import { catalogForChannel, STEP_CATALOG } from './flowStepTypes'
import {
  defaultDataForKind,
  detailForNode,
  kindForNodeType,
  nodeTypeForKind,
  normalizeConditionGroup,
  sourcePorts,
} from './journeyNodeTypes'

describe('journeyNodeTypes', () => {
  it('maps known types and preserves unknown backend types', () => {
    expect(kindForNodeType('ASK_QUESTION')).toBe('ask')
    expect(kindForNodeType('BUTTONS')).toBe('buttons')
    expect(kindForNodeType('RANDOMIZER')).toBe('randomizer')
    expect(kindForNodeType('UPDATE_FIELD')).toBe('updateField')
    expect(kindForNodeType('ADD_TO_FUNNEL')).toBe('addToFunnel')
    expect(kindForNodeType('GOTO_STEP')).toBe('goto')
    expect(kindForNodeType('TRIGGER_JOURNEY')).toBe('triggerJourney')
    expect(kindForNodeType('SEND_FLOW')).toBe('sendFlow')
    expect(kindForNodeType('UPDATE_LIFECYCLE')).toBe('updateLifecycle')
    expect(kindForNodeType('SEND_CAPI')).toBe('custom')
    expect(nodeTypeForKind('custom', 'SEND_CAPI')).toBe('SEND_CAPI')
    expect(nodeTypeForKind('message')).toBe('SEND_MESSAGE')
    expect(nodeTypeForKind('randomizer')).toBe('RANDOMIZER')
    expect(nodeTypeForKind('sendFlow')).toBe('SEND_FLOW')
  })

  it('defaults Instagram triggers to DM + keyword, WhatsApp to message', () => {
    expect(defaultDataForKind('trigger', 'instagram')).toEqual({
      event: 'dm.received',
      events: ['dm.received'],
      keyword: '',
    })
    expect(defaultDataForKind('trigger', 'whatsapp')).toEqual({ event: 'message.received' })
    expect(defaultDataForKind('trigger', 'whatsapp').event).toBe('message.received')
    expect(defaultDataForKind('randomizer').paths).toHaveLength(2)
    expect((defaultDataForKind('sendFlow') as { flowId: string }).flowId).toBe('')
  })

  it('exposes yes/no, button, randomizer, and custom path source ports', () => {
    expect(sourcePorts('condition', {})).toEqual([
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ])
    expect(sourcePorts('buttons', { buttons: [{ id: 'a', title: 'A' }] })).toEqual([{ id: 'a', label: 'A' }])
    expect(sourcePorts('randomizer', { paths: [{ id: 'p1', label: 'A', weight: 50 }] })).toEqual([
      { id: 'p1', label: 'A' },
    ])
    expect(sourcePorts('custom', { paths: [{ id: 'p1', label: 'A', weight: 50 }] })).toEqual([
      { id: 'p1', label: 'A' },
    ])
    expect(sourcePorts('webhook', {})).toEqual([])
    expect(sourcePorts('end', {})).toEqual([])
  })

  it('summarizes multi-row conditions with combinator', () => {
    const group = normalizeConditionGroup({
      combinator: 'any',
      conditions: [
        { type: 'field', field: 'tags', operator: 'contains', value: 'vip' },
        { type: 'email_known', field: '', operator: '=', value: 'yes' },
      ],
    })
    expect(group.combinator).toBe('any')
    expect(group.conditions).toHaveLength(2)
    expect(detailForNode('condition', group)).toContain('OR +1')
  })
})

describe('step catalog', () => {
  it('matches old WA / IG palettes and skips CAPI-class steps', () => {
    const wa = catalogForChannel('whatsapp').map((i) => i.kind)
    const ig = catalogForChannel('instagram').map((i) => i.kind)
    expect(wa).toContain('sendFlow')
    expect(wa).toContain('updateLifecycle')
    expect(ig).not.toContain('sendFlow')
    expect(ig).not.toContain('updateLifecycle')
    expect(wa).toEqual(expect.arrayContaining(['randomizer', 'updateField', 'addToFunnel', 'goto', 'triggerJourney']))
    expect(ig).toEqual(expect.arrayContaining(['randomizer', 'updateField', 'addToFunnel', 'goto', 'triggerJourney']))
    expect(STEP_CATALOG.map((i) => i.kind)).not.toEqual(expect.arrayContaining(['custom']))
    expect(wa).not.toContain('custom')
    expect(wa).not.toContain('trigger')
  })
})
