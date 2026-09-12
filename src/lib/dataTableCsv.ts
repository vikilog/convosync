import type { DataColumnType, DataTableColumn, DataTableRow } from '@/services/realDataTables.service'

function defuseFormulaInjection(v: string): string {
  if (/^[=+\-@\t]/.test(v)) return `'${v}`
  return v
}

function csvEscape(v: string): string {
  const safe = defuseFormulaInjection(v)
  return `"${safe.replace(/"/g, '""')}"`
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuotes = false
  let sawAnyCell = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
      sawAnyCell = true
    } else if (ch === ',') {
      row.push(cur)
      cur = ''
      sawAnyCell = true
    } else if (ch === '\r') {
      // ignore
    } else if (ch === '\n') {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
      sawAnyCell = false
    } else {
      cur += ch
      sawAnyCell = true
    }
  }
  if (sawAnyCell || cur || row.length) {
    row.push(cur)
    rows.push(row)
  }

  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''))
}

export function normalizeCsvHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_-]+/g, '')
}

function coerceCell(raw: string, type: DataColumnType): unknown {
  const v = raw.trim()
  if (!v) return null
  if (type === 'boolean') return /^(true|yes|1|y)$/i.test(v)
  if (type === 'number') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return v
}

export type DataTableCsvParseResult = {
  rows: Record<string, unknown>[]
  skipped: number[]
  matchedColumns: DataTableColumn[]
}

export function parseDataTableCsv(text: string, columns: DataTableColumn[]): DataTableCsvParseResult {
  const allRows = parseCsvRows(text)
  if (allRows.length < 2) return { rows: [], skipped: [], matchedColumns: [] }

  const headers = allRows[0]
  const matches = headers
    .map((header, headerIndex) => {
      const n = normalizeCsvHeader(header)
      const column = columns.find(
        (c) => normalizeCsvHeader(c.label) === n || normalizeCsvHeader(c.key) === n
      )
      return column ? { headerIndex, column } : null
    })
    .filter((m): m is { headerIndex: number; column: DataTableColumn } => m !== null)

  const seen = new Set<string>()
  const uniqueMatches = matches.filter((m) => {
    if (seen.has(m.column.key)) return false
    seen.add(m.column.key)
    return true
  })

  if (uniqueMatches.length === 0) {
    throw new Error('CSV headers must match at least one table column (label or key).')
  }

  const rows: Record<string, unknown>[] = []
  const skipped: number[] = []

  for (let i = 1; i < allRows.length; i++) {
    const cells = allRows[i]
    const data: Record<string, unknown> = {}
    let any = false
    for (const m of uniqueMatches) {
      const raw = cells[m.headerIndex] ?? ''
      const value = coerceCell(raw, m.column.type)
      if (value !== null && value !== '') {
        data[m.column.key] = value
        any = true
      }
    }
    if (!any) {
      skipped.push(i + 1)
      continue
    }
    rows.push(data)
  }

  return { rows, skipped, matchedColumns: uniqueMatches.map((m) => m.column) }
}

export function formatCsvCell(value: unknown, type: DataColumnType): string {
  if (value === null || value === undefined || value === '') return ''
  if (type === 'boolean') return value === true || value === 'true' ? 'Yes' : 'No'
  return String(value)
}

export function buildDataTableCsv(
  columns: DataTableColumn[],
  rows: DataTableRow[],
  columnIds?: string[]
): string {
  const cols = columnIds?.length ? columns.filter((c) => columnIds.includes(c.id)) : columns
  if (cols.length === 0) return ''
  const header = cols.map((c) => csvEscape(c.label)).join(',')
  const body = rows.map((row) =>
    cols.map((c) => csvEscape(formatCsvCell(row.data[c.key], c.type))).join(',')
  )
  return [header, ...body].join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
