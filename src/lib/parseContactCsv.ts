export type ContactCsvRow = {
  name: string
  phone: string
  email?: string
  source?: string
  tags: string[]
}

export type ContactCsvParseResult = {
  rows: ContactCsvRow[]
  skipped: number[]
}

function parseCsvRows(text: string): string[][] {
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

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_-]+/g, '')
}

function normalizePhone(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const digits = trimmed.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return `+${digits.slice(1).replace(/\D/g, '')}`
  const only = digits.replace(/\D/g, '')
  return only ? `+${only}` : ''
}

export function parseContactCsv(text: string): ContactCsvParseResult {
  const allRows = parseCsvRows(text)
  if (allRows.length < 2) return { rows: [], skipped: [] }

  const heads = allRows[0].map(normalizeHeader)
  const nameI = heads.findIndex((h) => h === 'name' || h === 'fullname' || h === 'contactname')
  const phoneI = heads.findIndex(
    (h) => h === 'phone' || h === 'mobile' || h === 'phonenumber' || h === 'whatsapp'
  )
  if (nameI < 0 || phoneI < 0) {
    throw new Error('CSV must include name and phone columns')
  }
  const emailI = heads.findIndex((h) => h === 'email' || h === 'mail')
  const sourceI = heads.findIndex((h) => h === 'source')
  const tagsI = heads.findIndex((h) => h === 'tags' || h === 'tag' || h === 'labels')

  const rows: ContactCsvRow[] = []
  const skipped: number[] = []

  for (let i = 1; i < allRows.length; i++) {
    const cells = allRows[i]
    const name = (cells[nameI] ?? '').trim()
    const phone = normalizePhone(cells[phoneI] ?? '')
    if (!name || phone.length < 6) {
      skipped.push(i + 1)
      continue
    }
    const email = emailI >= 0 ? (cells[emailI] ?? '').trim() : ''
    const source = sourceI >= 0 ? (cells[sourceI] ?? '').trim() : ''
    const tagsRaw = tagsI >= 0 ? (cells[tagsI] ?? '') : ''
    const tags = tagsRaw
      .split(/[;|]/)
      .map((t) => t.trim())
      .filter(Boolean)

    rows.push({
      name,
      phone,
      ...(email ? { email } : {}),
      ...(source ? { source } : {}),
      tags,
    })
  }

  return { rows, skipped }
}
