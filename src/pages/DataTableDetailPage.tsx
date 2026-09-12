import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Hash,
  Link2,
  List,
  Mail,
  Phone,
  Plus,
  Search,
  Settings2,
  ToggleLeft,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { AddColumnSheet, type NewColumnInput } from '@/components/data-tables/AddColumnSheet'
import { ConnectFlowSheet } from '@/components/data-tables/ConnectFlowSheet'
import { DataCell } from '@/components/data-tables/DataCell'
import { ImportDataTableSheet } from '@/components/data-tables/ImportDataTableSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { buildDataTableCsv, downloadCsv } from '@/lib/dataTableCsv'
import { readDetailAlive, writeDetailAlive } from '@/lib/dataTableKeepAlive'
import { filterSortRows, paginateRows, type RowSort } from '@/lib/dataTableRows'
import { ApiError } from '@/lib/httpClient'
import { realDataTablesService, type DataColumnType, type DataTable } from '@/services/realDataTables.service'

const TYPE_ICON: Record<DataColumnType, ComponentType<{ className?: string }>> = {
  text: Type,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
  select: List,
  phone: Phone,
  email: Mail,
}

const PAGE_SIZES = [10, 20, 50, 100] as const

function reportError(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
}

export function DataTableDetailPage({ table, onBack }: { table: DataTable; onBack: () => void }) {
  const confirm = useConfirm()
  const { data: rowsRes } = realDataTablesService.useRows(table.id)
  const { data: flows } = realDataTablesService.useFlows(table.id)
  const rows = rowsRes?.items ?? []

  const addRowMutation = realDataTablesService.useAddRow(table.id)
  const updateRowMutation = realDataTablesService.useUpdateRow(table.id)
  const removeRowMutation = realDataTablesService.useRemoveRow(table.id)
  const removeRowsMutation = realDataTablesService.useRemoveRows(table.id)
  const addColumnMutation = realDataTablesService.useAddColumn(table.id)
  const removeColumnMutation = realDataTablesService.useRemoveColumn(table.id)

  const alive = readDetailAlive(table.id)
  const [query, setQuery] = useState(alive.query)
  const [sort, setSort] = useState<RowSort | null>(
    alive.sortKey && alive.sortDir ? { key: alive.sortKey, dir: alive.sortDir } : null
  )
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(alive.hiddenColumnIds))
  const [pageSize, setPageSize] = useState(alive.pageSize)
  const [pageIndex, setPageIndex] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [connectOpen, setConnectOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    writeDetailAlive(table.id, {
      query,
      pageSize,
      hiddenColumnIds: [...hidden],
      sortKey: sort?.key,
      sortDir: sort?.dir,
    })
  }, [table.id, query, pageSize, hidden, sort])

  const visibleColumns = useMemo(
    () => table.columns.filter((c) => !hidden.has(c.id)),
    [table.columns, hidden]
  )

  const prepared = useMemo(
    () => filterSortRows(rows, table.columns, query, sort),
    [rows, table.columns, query, sort]
  )

  const pageCount = Math.max(1, Math.ceil(prepared.length / pageSize) || 1)
  const safePage = Math.min(pageIndex, pageCount - 1)
  const pageRows = useMemo(
    () => paginateRows(prepared, safePage, pageSize),
    [prepared, safePage, pageSize]
  )

  useEffect(() => {
    setPageIndex(0)
  }, [query, pageSize, table.id])

  const pageIds = pageRows.map((r) => r.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const somePageSelected = pageIds.some((id) => selected.has(id))

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const commitCell = (rowId: string, columnKey: string, value: unknown) => {
    updateRowMutation.mutate({ rowId, data: { [columnKey]: value } }, { onError: reportError })
  }

  const addColumn = async (input: NewColumnInput) => {
    try {
      await addColumnMutation.mutateAsync(input)
    } catch (err) {
      reportError(err)
      throw err
    }
  }

  const removeColumn = async (columnId: string, label: string) => {
    const ok = await confirm({
      title: `Delete column "${label}"?`,
      description: 'This removes the column. Existing row values for it will no longer be shown.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeColumnMutation.mutate(columnId, { onError: reportError })
  }

  const removeRow = async (rowId: string) => {
    const ok = await confirm({
      title: 'Delete this row?',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) {
      removeRowMutation.mutate(rowId, { onError: reportError })
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(rowId)
        return next
      })
    }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    const ok = await confirm({
      title: `Delete ${selected.size} selected row(s)?`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    const ids = [...selected]
    removeRowsMutation.mutate(ids, {
      onSuccess: () => setSelected(new Set()),
      onError: reportError,
    })
  }

  const exportCsv = () => {
    const exportRows = selected.size > 0 ? prepared.filter((r) => selected.has(r.id)) : prepared
    const csv = buildDataTableCsv(visibleColumns, exportRows)
    const slug = table.name.replace(/\s+/g, '-').toLowerCase() || 'table'
    downloadCsv(`${slug}-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  const connectedCount = flows?.connected.length ?? 0

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to tables">
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{table.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {table.description || `${table.rowCount} rows · ${table.columns.length} columns`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="relative w-full max-w-[200px] min-w-[160px]">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rows…"
              className="pl-8"
            />
          </div>
          {selected.size > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void bulkDelete()}
              disabled={removeRowsMutation.isPending}
            >
              <Trash2 />
              Delete {selected.size} selected
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setConnectOpen(true)}>
            <Link2 />
            {connectedCount > 0 ? `${connectedCount} flow${connectedCount === 1 ? '' : 's'}` : 'Connect a Flow'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={prepared.length === 0}>
            <Download />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={!hidden.has(col.id)}
                  onCheckedChange={(v) =>
                    setHidden((prev) => {
                      const next = new Set(prev)
                      if (v) next.delete(col.id)
                      else next.add(col.id)
                      return next
                    })
                  }
                  onSelect={(e) => e.preventDefault()}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <AddColumnSheet onAdd={addColumn} pending={addColumnMutation.isPending} />
          <Button
            size="sm"
            onClick={() => addRowMutation.mutate({}, { onError: reportError })}
            disabled={addRowMutation.isPending}
          >
            <Plus />
            Add row
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                  onCheckedChange={(v) => {
                    setSelected((prev) => {
                      const next = new Set(prev)
                      if (v) pageIds.forEach((id) => next.add(id))
                      else pageIds.forEach((id) => next.delete(id))
                      return next
                    })
                  }}
                  aria-label="Select all rows"
                />
              </TableHead>
              {visibleColumns.map((column) => {
                const Icon = TYPE_ICON[column.type]
                return (
                  <TableHead key={column.id} className="group/col whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Icon className="text-muted-foreground size-3.5" />
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {column.label}
                        <ArrowUpDown className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeColumn(column.id, column.label)}
                        aria-label={`Delete column ${column.label}`}
                        className="text-muted-foreground hover:text-destructive ml-0.5 opacity-0 transition-opacity group-hover/col:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  </TableHead>
                )
              })}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.id} data-state={selected.has(row.id) ? 'selected' : undefined}>
                <TableCell className="w-10">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(v) =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (v) next.add(row.id)
                        else next.delete(row.id)
                        return next
                      })
                    }
                    aria-label="Select row"
                  />
                </TableCell>
                {visibleColumns.map((column) => (
                  <TableCell key={column.id} className="p-0.5">
                    <DataCell
                      column={column}
                      value={row.data[column.key]}
                      onCommit={(value) => commitCell(row.id, column.key, value)}
                    />
                  </TableCell>
                ))}
                <TableCell className="p-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void removeRow(row.id)}
                    aria-label="Delete row"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 2}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  {rows.length === 0
                    ? 'No rows yet — click "Add row" to get started.'
                    : 'No rows match your search.'}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-sm">
        <span className="text-muted-foreground">
          {selected.size} of {prepared.length} row(s) selected
        </span>
        <div className="flex items-center gap-3">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[110px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">
            Page {prepared.length === 0 ? 0 : safePage + 1} of {prepared.length === 0 ? 0 : pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1 || prepared.length === 0}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <ConnectFlowSheet
        open={connectOpen}
        onOpenChange={setConnectOpen}
        tableId={table.id}
        columns={table.columns}
      />
      <ImportDataTableSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        tableId={table.id}
        tableName={table.name}
        columns={table.columns}
      />
    </div>
  )
}
