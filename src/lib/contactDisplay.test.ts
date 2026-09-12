import { describe, expect, it } from 'vitest'

import {
  formatCustomFieldValue,
  labelForCustomFieldKey,
  listLabelForContact,
  visibleCustomFieldEntries,
} from './contactDisplay'

describe('contactDisplay', () => {
  it('labels camelCase and snake_case keys', () => {
    expect(labelForCustomFieldKey('sourceUrl')).toBe('Source url')
    expect(labelForCustomFieldKey('company_name')).toBe('Company name')
  })

  it('formats custom field values', () => {
    expect(formatCustomFieldValue(null)).toBe('—')
    expect(formatCustomFieldValue(true)).toBe('Yes')
    expect(formatCustomFieldValue(12)).toBe('12')
  })

  it('maps list tags', () => {
    expect(listLabelForContact(['Blocked'])).toBe('Blocklist')
    expect(listLabelForContact(['Unsubscribed'])).toBe('Unsubscribe')
    expect(listLabelForContact(['Hot'])).toBe('All')
  })

  it('hides Instagram profile keys from generic custom fields', () => {
    const entries = visibleCustomFieldEntries({
      instagramBio: 'hello',
      company: 'Acme',
      empty: '',
    })
    expect(entries).toEqual([['company', 'Acme']])
  })
})
