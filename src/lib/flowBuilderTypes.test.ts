import { describe, expect, it } from 'vitest'

import { builderStateToFlowJson, emptyBuilderState, flowJsonToBuilderState, newFieldId } from './flowBuilderTypes'

describe('flowBuilderTypes', () => {
  it('round-trips a starter screen through Meta JSON', () => {
    const state = emptyBuilderState()
    state.screens[0].title = 'Get in touch'
    state.screens[0].fields.push({
      id: newFieldId(),
      type: 'TextInput',
      label: 'Full name',
      name: 'full_name',
      required: true,
      options: [],
    })
    const json = builderStateToFlowJson(state)
    const back = flowJsonToBuilderState(json)
    expect(back?.screens[0]?.title).toBe('Get in touch')
    expect(back?.screens[0]?.fields[0]?.name).toBe('full_name')
  })

  it('returns null for unrecognized JSON', () => {
    expect(flowJsonToBuilderState({ screens: [{ layout: { type: 'Nope' } }] })).toBeNull()
  })
})
