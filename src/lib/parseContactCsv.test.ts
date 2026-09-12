import { describe, expect, it } from 'vitest'

import { parseContactCsv } from './parseContactCsv'

describe('parseContactCsv', () => {
  it('parses name, phone, tags and skips bad rows', () => {
    const sample = `name,phone,email,source,tags
Alice,+919876543210,alice@example.com,csv,Hot;Lead
Bob,9876543211,,website,Student
,911,,csv,
Charlie,+1-555-0100,bad-email,csv,A|B
`
    const { rows, skipped } = parseContactCsv(sample)
    expect(rows).toHaveLength(3)
    expect(skipped).toHaveLength(1)
    expect(rows[0].phone).toBe('+919876543210')
    expect(rows[0].tags).toEqual(['Hot', 'Lead'])
    expect(rows[1].phone).toBe('+9876543211')
    expect(rows[2].tags).toEqual(['A', 'B'])
  })

  it('keeps quoted newlines inside a cell', () => {
    const withEmbeddedNewline = `name,phone,tags
"Smith, John\nJr.",+919876543210,VIP
Dana,+15550100,`
    const embedded = parseContactCsv(withEmbeddedNewline)
    expect(embedded.rows).toHaveLength(2)
    expect(embedded.rows[0].name).toBe('Smith, John\nJr.')
    expect(embedded.rows[1].phone).toBe('+15550100')
  })
})
