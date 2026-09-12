import { describe, expect, it } from 'vitest'

import { extractEmailVars, insertAtCursor } from './emailHtmlEditor'

describe('emailHtmlEditor', () => {
  it('extracts unique template variables', () => {
    expect(extractEmailVars('Hi {{first_name}}', '<a href="{{cta_url}}">{{first_name}}</a>')).toEqual([
      'cta_url',
      'first_name',
    ])
  })

  it('inserts at the cursor and replaces a selection', () => {
    expect(insertAtCursor('Hello world', ' {{name}}', 5)).toBe('Hello {{name}} world')
    expect(insertAtCursor('Hello world', 'there', 6, 11)).toBe('Hello there')
  })
})
