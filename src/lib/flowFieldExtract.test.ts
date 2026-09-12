import { describe, expect, it } from 'vitest'

import { extractFlowFields } from './flowFieldExtract'

describe('extractFlowFields', () => {
  it('collects unique name/label pairs from flow screens', () => {
    const fields = extractFlowFields({
      screens: [
        {
          layout: {
            children: [
              { name: 'full_name', label: 'Name' },
              { name: 'phone', label: 'Phone' },
              { type: 'TextHeading', text: 'Hi' },
            ],
          },
        },
        {
          layout: {
            children: [{ name: 'full_name', label: 'Full name' }],
          },
        },
      ],
    })
    expect(fields).toEqual([
      { name: 'full_name', label: 'Full name' },
      { name: 'phone', label: 'Phone' },
    ])
  })

  it('returns empty for missing or invalid json', () => {
    expect(extractFlowFields(null)).toEqual([])
    expect(extractFlowFields({})).toEqual([])
  })
})
