/** sessionStorage snapshot so /data remounts restore search/sort (router has no tab KeepAlive). */

export type DataTableListAlive = { query: string }

export type DataTableDetailAlive = {
  query: string
  pageSize: number
  hiddenColumnIds: string[]
  sortKey?: string
  sortDir?: 'asc' | 'desc'
}

const LIST_KEY = 'convosync.dataTables.list'
const detailKey = (tableId: string) => `convosync.dataTables.detail.${tableId}`

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ponytail: private-mode / quota — lose keep-alive, not the write path
  }
}

export function readListAlive(): DataTableListAlive {
  return readJson<DataTableListAlive>(LIST_KEY) ?? { query: '' }
}

export function writeListAlive(state: DataTableListAlive) {
  writeJson(LIST_KEY, state)
}

export function readDetailAlive(tableId: string): DataTableDetailAlive {
  return (
    readJson<DataTableDetailAlive>(detailKey(tableId)) ?? {
      query: '',
      pageSize: 20,
      hiddenColumnIds: [],
    }
  )
}

export function writeDetailAlive(tableId: string, state: DataTableDetailAlive) {
  writeJson(detailKey(tableId), state)
}
