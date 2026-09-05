/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ColumnDef,
  type FilterFn,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ConnectFlowModal } from './ConnectFlowModal';
import { AddColumnDialog } from './AddColumnDialog';
import { RowFormDialog } from './RowFormDialog';
import type { DataColumnType, DataTableRecord, DataTableRow } from './types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Props = { tableId: string; onBack: () => void };

function formatCell(value: unknown, type: DataColumnType): string {
  if (value === null || value === undefined || value === '') return '';
  if (type === 'boolean') return value === true || value === 'true' ? 'Yes' : 'No';
  return String(value);
}

const globalFilterFn: FilterFn<DataTableRow> = (row, _columnId, filterValue) => {
  const search = String(filterValue).trim().toLowerCase();
  if (!search) return true;
  return Object.values(row.original.data).some(
    (v) => v != null && String(v).toLowerCase().includes(search)
  );
};

export function DataTableDetailView({ tableId, onBack }: Props) {
  const [table, setTable] = useState<DataTableRecord | null>(null);
  const [rows, setRows] = useState<DataTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectOpen, setConnectOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [rowDialog, setRowDialog] = useState<{ open: boolean; row: DataTableRow | null }>({
    open: false,
    row: null,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tableRes, rowsRes] = await Promise.all([
        api.getDataTable(tableId) as Promise<{ item: DataTableRecord }>,
        api.listDataTableRows(tableId, { limit: 500 }) as Promise<{ items: DataTableRow[] }>,
      ]);
      setTable(tableRes.item);
      setRows(rowsRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table');
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddColumn = async (input: { label: string; type: DataColumnType; options?: string[] }) => {
    if (!table) return;
    const res = (await api.addDataTableColumn(tableId, input)) as {
      item: DataTableRecord['columns'][number];
    };
    setTable({ ...table, columns: [...table.columns, res.item] });
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!table) return;
    if (!window.confirm('Delete this column? Data in it will be lost.')) return;
    try {
      await api.deleteDataTableColumn(tableId, columnId);
      setTable({ ...table, columns: table.columns.filter((c) => c.id !== columnId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete column');
    }
  };

  const handleSubmitRow = async (values: Record<string, unknown>) => {
    if (rowDialog.row) {
      const res = (await api.updateDataTableRow(tableId, rowDialog.row.id, values)) as {
        item: DataTableRow;
      };
      setRows((prev) => prev.map((r) => (r.id === rowDialog.row!.id ? res.item : r)));
    } else {
      const res = (await api.createDataTableRow(tableId, values)) as { item: DataTableRow };
      setRows((prev) => [res.item, ...prev]);
      if (table) setTable({ ...table, rowCount: table.rowCount + 1 });
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm('Delete this row?')) return;
    try {
      await api.deleteDataTableRow(tableId, rowId);
      setRows((prev) => prev.filter((r) => r.id !== rowId));
      if (table) setTable({ ...table, rowCount: Math.max(0, table.rowCount - 1) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete row');
    }
  };

  const columns = useMemo<ColumnDef<DataTableRow>[]>(() => {
    if (!table) return [];

    const selectColumn: ColumnDef<DataTableRow> = {
      id: 'select',
      header: ({ table: t }) => (
        <Checkbox
          checked={t.getIsAllPageRowsSelected() || (t.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(v) => t.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 32,
    };

    const dataColumns: ColumnDef<DataTableRow>[] = table.columns.map((col) => ({
      id: col.id,
      accessorFn: (row) => row.data[col.key],
      header: ({ column }) => (
        <button
          type="button"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          {col.label}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ getValue }) => {
        const formatted = formatCell(getValue(), col.type);
        return <span className={formatted ? '' : 'text-muted-foreground'}>{formatted || '—'}</span>;
      },
    }));

    const actionsColumn: ColumnDef<DataTableRow> = {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      size: 40,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Row actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRowDialog({ open: true, row: row.original })}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => void handleDeleteRow(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    };

    return [selectColumn, ...dataColumns, actionsColumn];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table?.columns]);

  const reactTable = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnVisibility, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const selectedIds = useMemo(
    () => reactTable.getFilteredSelectedRowModel().rows.map((r) => r.original.id),
    [reactTable, rowSelection]
  );

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected row(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => api.deleteDataTableRow(tableId, id)));
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setRowSelection({});
      if (table) setTable({ ...table, rowCount: Math.max(0, table.rowCount - selectedIds.length) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rows');
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-swiss-muted hover:text-swiss-ink"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <p className="text-sm text-red-600">{error || 'Table not found'}</p>
      </div>
    );
  }

  const pageCount = reactTable.getPageCount();
  const pageIndex = reactTable.getState().pagination.pageIndex;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 font-swiss">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-swiss-muted hover:text-swiss-ink mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All tables
          </button>
          <h2 className="text-lg font-semibold text-gray-950 truncate">{table.name}</h2>
          {table.description ? <p className="text-xs text-swiss-muted">{table.description}</p> : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="relative w-full max-w-[200px] shrink-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search rows…"
              className="pl-8"
            />
          </div>

          {selectedIds.length > 0 ? (
            <Button
              variant="destructive"
              onClick={() => void handleBulkDelete()}
              disabled={bulkDeleting}
              className="shrink-0"
            >
              {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete {selectedIds.length} selected
            </Button>
          ) : null}

          <Button variant="outline" className="shrink-0" onClick={() => setConnectOpen(true)}>
            <Link2 className="h-3.5 w-3.5" />
            Connect a Flow
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Settings2 className="h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {reactTable
                .getAllColumns()
                .filter((c) => c.getCanHide())
                .map((c) => {
                  const col = table.columns.find((tc) => tc.id === c.id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={c.id}
                      checked={c.getIsVisible()}
                      onCheckedChange={(v) => c.toggleVisibility(!!v)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {col?.label ?? c.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="shrink-0" onClick={() => setAddColumnOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Column
          </Button>
          <Button className="shrink-0" onClick={() => setRowDialog({ open: true, row: null })}>
            <Plus className="h-3.5 w-3.5" />
            Row
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-swiss-line bg-white">
        <Table>
          <TableHeader>
            {reactTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="group">
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center justify-between gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.id !== 'select' &&
                        header.column.id !== 'actions' &&
                        table.columns.some((c) => c.id === header.column.id) ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteColumn(header.column.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600"
                            aria-label={`Delete column ${header.column.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {reactTable.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No rows yet.
                </TableCell>
              </TableRow>
            ) : (
              reactTable.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {reactTable.getFilteredSelectedRowModel().rows.length} of{' '}
          {reactTable.getFilteredRowModel().rows.length} row(s) selected
        </span>
        <div className="flex items-center gap-3">
          <Select
            value={String(reactTable.getState().pagination.pageSize)}
            onValueChange={(v) => reactTable.setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[110px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => reactTable.previousPage()}
            disabled={!reactTable.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => reactTable.nextPage()}
            disabled={!reactTable.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConnectFlowModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        tableId={tableId}
        columns={table.columns}
      />
      <AddColumnDialog open={addColumnOpen} onClose={() => setAddColumnOpen(false)} onSubmit={handleAddColumn} />
      <RowFormDialog
        open={rowDialog.open}
        onClose={() => setRowDialog({ open: false, row: null })}
        columns={table.columns}
        row={rowDialog.row}
        onSubmit={handleSubmitRow}
      />
    </div>
  );
}
