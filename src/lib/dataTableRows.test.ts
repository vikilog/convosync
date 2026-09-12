import { describe, expect, it } from 'vitest'

import { filterSortRows, paginateRows, rowMatchesQuery } from './dataTableRows'
import type { DataTableColumn, DataTableRow } from '@/services/realDataTables.service'

const columns: DataTableColumn[] = [
  { id: '1', key: 'name', label: 'Name', type: 'text' },
  { id: '2', key: 'score', label: 'Score', type: 'number' },
]

function row(id: string, data: Record<string, unknown>): DataTableRow {
  return { id, data, source: 'manual', createdAt: '', updatedAt: '' }
}

describe('dataTableRows', () => {
  const rows = [row('a', { name: 'Zed', score: 2 }), row('b', { name: 'Amy', score: 10 })]

  it('matches any cell value', () => {
    expect(rowMatchesQuery(rows[0], 'ze')).toBe(true)
    expect(rowMatchesQuery(rows[0], 'amy')).toBe(false)
    expect(rowMatchesQuery(rows[0], '')).toBe(true)
  })

  it('filters then sorts by number desc', () => {
    const next = filterSortRows(rows, columns, '', { key: 'score', dir: 'desc' })
    expect(next.map((r) => r.id)).toEqual(['b', 'a'])
    expect(filterSortRows(rows, columns, 'am', null).map((r) => r.id)).toEqual(['b'])
  })

  it('paginates', () => {
    expect(paginateRows([1, 2, 3, 4], 1, 2)).toEqual([3, 4])
  })
})
