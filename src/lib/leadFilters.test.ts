import { describe, expect, it } from 'vitest'

import { leadMatchesFilters, resolveDropStageId } from './leadFilters'

const lead = {
  id: 'l1',
  name: 'Ada Lovelace',
  phone: '+91999',
  email: 'ada@ex.com',
  requirement: 'Wants a demo',
  source: 'instagram',
  stageId: 's1',
  origin: { username: 'ada_ig' },
}

describe('leadMatchesFilters', () => {
  it('filters by source', () => {
    expect(leadMatchesFilters(lead, '', 'instagram')).toBe(true)
    expect(leadMatchesFilters(lead, '', 'manual')).toBe(false)
  })

  it('searches name, phone, email, requirement, and IG handle', () => {
    expect(leadMatchesFilters(lead, 'ada', 'all')).toBe(true)
    expect(leadMatchesFilters(lead, '91999', 'all')).toBe(true)
    expect(leadMatchesFilters(lead, 'ex.com', 'all')).toBe(true)
    expect(leadMatchesFilters(lead, 'demo', 'all')).toBe(true)
    expect(leadMatchesFilters(lead, 'ada_ig', 'all')).toBe(true)
    expect(leadMatchesFilters(lead, 'nope', 'all')).toBe(false)
  })
})

describe('resolveDropStageId', () => {
  const stages = [{ id: 's1' }, { id: 's2' }]
  const leads = [
    { id: 'l1', stageId: 's1' },
    { id: 'l2', stageId: 's2' },
  ]

  it('uses a column id directly', () => {
    expect(resolveDropStageId('s2', stages, leads)).toBe('s2')
  })

  it('maps a card drop to that card’s stage', () => {
    expect(resolveDropStageId('l2', stages, leads)).toBe('s2')
  })

  it('returns null when over nothing known', () => {
    expect(resolveDropStageId('x', stages, leads)).toBeNull()
  })
})
