import { describe, expect, it } from 'vitest'

import { UNCATEGORIZED_TAG_FOLDER, groupTagsByFolder, normalizeTagFolder, sortTagNamesByFolder } from './tagFolders'

describe('groupTagsByFolder', () => {
  it('clusters by folder, Uncategorized last, names A→Z', () => {
    const groups = groupTagsByFolder([
      { name: 'vip', folder: 'Sales' },
      { name: 'cold', folder: null },
      { name: 'lead', folder: 'Sales' },
      { name: 'new', folder: null },
    ])
    expect(groups.map((g) => g.folder)).toEqual(['Sales', UNCATEGORIZED_TAG_FOLDER])
    expect(groups[0]?.items.map((t) => t.name)).toEqual(['lead', 'vip'])
    expect(groups[1]?.items.map((t) => t.name)).toEqual(['cold', 'new'])
  })
})

describe('sortTagNamesByFolder', () => {
  it('flattens folder-clustered names for datalist suggestions', () => {
    expect(
      sortTagNamesByFolder([
        { name: 'vip', folder: 'Sales' },
        { name: 'cold', folder: null },
        { name: 'lead', folder: 'Sales' },
      ])
    ).toEqual(['lead', 'vip', 'cold'])
  })
})

describe('normalizeTagFolder', () => {
  it('treats blank as uncategorized', () => {
    expect(normalizeTagFolder('  Sales  ')).toBe('Sales')
    expect(normalizeTagFolder('   ')).toBeNull()
  })
})
