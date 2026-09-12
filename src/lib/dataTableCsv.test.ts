import { describe, expect, it } from 'vitest'

import { buildDataTableCsv, parseDataTableCsv } from './dataTableCsv'
import type { DataTableColumn, DataTableRow } from '@/services/realDataTables.service'

const columns: DataTableColumn[] = [
  { id: '1', key: 'name', label: 'Name', type: 'text' },
  { id: '2', key: 'phone', label: 'Phone', type: 'phone' },
  { id: '3', key: 'vip', label: 'VIP', type: 'boolean' },
  { id: '4', key: 'score', label: 'Score', type: 'number' },
]

describe('parseDataTableCsv', () => {
  it('maps headers to column labels and coerces types', () => {
    const csv = `Name,Phone,VIP,Score,Note
Alice,+9198,yes,12,hi
Bob,+9111,0,x,ok
,,,,only-unmapped
`
    const parsed = parseDataTableCsv(csv, columns)
    expect(parsed.matchedColumns.map((c) => c.key)).toEqual(['name', 'phone', 'vip', 'score'])
    expect(parsed.rows).toEqual([
      { name: 'Alice', phone: '+9198', vip: true, score: 12 },
      { name: 'Bob', phone: '+9111', vip: false },
    ])
    expect(parsed.skipped).toEqual([4])
  })

  it('matches column keys and rejects unknown headers', () => {
    expect(() => parseDataTableCsv('foo,bar\n1,2', columns)).toThrow(/match at least one/)
    const parsed = parseDataTableCsv('name,extra\nZed,nope', columns)
    expect(parsed.rows).toEqual([{ name: 'Zed' }])
  })
})

describe('buildDataTableCsv', () => {
  it('writes labels, formats booleans, and defuses formulas', () => {
    const rows: DataTableRow[] = [
      {
        id: 'r1',
        data: { name: "=cmd|'/C calc'!A0", phone: '+1', vip: true, score: 3 },
        source: 'manual',
        createdAt: '',
        updatedAt: '',
      },
    ]
    const csv = buildDataTableCsv(columns, rows, ['1', '3'])
    expect(csv.startsWith('"Name","VIP"\n')).toBe(true)
    expect(csv).toContain('"\'=cmd')
    expect(csv).toContain('"Yes"')
  })
})
