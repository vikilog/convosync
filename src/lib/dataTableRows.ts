import type { DataColumnType, DataTableColumn, DataTableRow } from '@/services/realDataTables.service'

export type RowSort = { key: string; dir: 'asc' | 'desc' }

export function rowMatchesQuery(row: DataTableRow, query: string): boolean {
  const search = query.trim().toLowerCase()
  if (!search) return true
  return Object.values(row.data).some((v) => v != null && String(v).toLowerCase().includes(search))
}

function sortValue(value: unknown, type: DataColumnType): string | number {
  if (value === null || value === undefined || value === '') {
    return type === 'number' || type === 'date' || type === 'boolean' ? Number.NEGATIVE_INFINITY : ''
  }
  if (type === 'number') {
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY
  }
  if (type === 'boolean') return value === true || value === 'true' ? 1 : 0
  if (type === 'date') {
    const t = Date.parse(String(value))
    return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY
  }
  return String(value).toLowerCase()
}

export function filterSortRows(
  rows: DataTableRow[],
  columns: DataTableColumn[],
  query: string,
  sort: RowSort | null
): DataTableRow[] {
  const filtered = query.trim() ? rows.filter((row) => rowMatchesQuery(row, query)) : rows
  if (!sort) return filtered
  const column = columns.find((c) => c.key === sort.key)
  if (!column) return filtered
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    const av = sortValue(a.data[column.key], column.type)
    const bv = sortValue(b.data[column.key], column.type)
    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir
    return 0
  })
}

export function paginateRows<T>(rows: T[], pageIndex: number, pageSize: number): T[] {
  const start = pageIndex * pageSize
  return rows.slice(start, start + pageSize)
}
