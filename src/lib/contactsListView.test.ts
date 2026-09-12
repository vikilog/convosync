import { describe, expect, it } from 'vitest'

import { contactsViewFromPath, parseCustomColumns } from './contactsListView'

describe('contactsListView', () => {
  it('maps list path vs everything else to dashboard', () => {
    expect(contactsViewFromPath('/contacts/list')).toBe('list')
    expect(contactsViewFromPath('/contacts/list/extra')).toBe('list')
    expect(contactsViewFromPath('/contacts/dashboard')).toBe('dashboard')
    expect(contactsViewFromPath('/contacts')).toBe('dashboard')
  })

  it('parses stored custom columns and drops junk', () => {
    expect(parseCustomColumns(null)).toEqual([])
    expect(parseCustomColumns('["city","gst"]')).toEqual(['city', 'gst'])
    expect(parseCustomColumns('["ok",1,null]')).toEqual(['ok'])
    expect(parseCustomColumns('{')).toEqual([])
    expect(parseCustomColumns('"nope"')).toEqual([])
  })
})
