import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import {
  BRANDS,
  CATEGORIES,
  PRODUCTS,
  brandName,
  categoryName,
  formatInr,
  formatRelative,
} from '../mock/data';
import type { CommerceProduct } from '../types';
import {
  AiBadge,
  InventoryBadge,
  PublishBadge,
  WhatsAppBadge,
} from '../components/badges';
import { EmptyState } from '../components/EmptyState';
import { PageHeader, cx } from '../components/ui';

export function ProductsPage() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [status, setStatus] = useState('all');
  const [inventory, setInventory] = useState('all');
  const [rowSelection, setRowSelection] = useState({});

  const data = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (category !== 'all' && p.categoryId !== category) return false;
      if (brand !== 'all' && p.brandId !== brand) return false;
      if (status !== 'all' && p.publishStatus !== status) return false;
      if (inventory !== 'all' && p.inventoryStatus !== inventory) return false;
      return true;
    });
  }, [category, brand, status, inventory]);

  const columns = useMemo<ColumnDef<CommerceProduct>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Select all"
            className="rounded border-black/20"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label={`Select ${row.original.name}`}
            className="rounded border-black/20"
          />
        ),
        size: 40,
      },
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => navigate(`/commerce/products/${row.original.id}`)}
            className="flex items-center gap-3 text-left"
          >
            <img
              src={row.original.images[0]}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
            <span>
              <span className="block text-sm font-medium text-dark-navy">
                {row.original.name}
              </span>
              <span className="block text-[11px] text-neutral-400">{row.original.sku}</span>
            </span>
          </button>
        ),
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500">{String(getValue())}</span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (r) => categoryName(r.categoryId),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{formatInr(Number(getValue()))}</span>
        ),
      },
      {
        id: 'inventory',
        header: 'Inventory',
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-700">{row.original.inventory}</p>
            <InventoryBadge status={row.original.inventoryStatus} />
          </div>
        ),
      },
      {
        id: 'published',
        header: 'Published',
        cell: ({ row }) => <PublishBadge status={row.original.publishStatus} />,
      },
      {
        id: 'whatsapp',
        header: 'WhatsApp',
        cell: ({ row }) => <WhatsAppBadge on={row.original.whatsappSynced} />,
      },
      {
        id: 'ai',
        header: 'AI Ready',
        cell: ({ row }) => <AiBadge status={row.original.aiStatus} />,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-500">{formatRelative(String(getValue()))}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => navigate(`/commerce/products/${row.original.id}`)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-surface-muted hover:text-dark-navy"
            aria-label={`Open ${row.original.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    initialState: { pagination: { pageSize: 8 } },
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className={cx.page}>
      <PageHeader
        title="Products"
        subtitle="Manage SKUs for AI-assisted WhatsApp selling"
        actions={
          <button type="button" className={cx.btnPrimary}>
            <Plus className="h-3.5 w-3.5" />
            Create Product
          </button>
        }
      />

      <div className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center ${cx.card}`}>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search name, SKU, tags…"
            className={cx.input}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={cx.select}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className={cx.select}>
          <option value="all">All brands</option>
          {BRANDS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={cx.select}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={inventory}
          onChange={(e) => setInventory(e.target.value)}
          className={cx.select}
        >
          <option value="all">All inventory</option>
          <option value="in_stock">In stock</option>
          <option value="low">Low</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      {selectedCount > 0 ? (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
          <span className="font-semibold text-primary">{selectedCount} selected</span>
          <button type="button" className="rounded-lg bg-surface px-2.5 py-1 font-semibold">
            Publish
          </button>
          <button type="button" className="rounded-lg bg-surface px-2.5 py-1 font-semibold">
            Sync to WhatsApp
          </button>
          <button type="button" className="rounded-lg bg-surface px-2.5 py-1 font-semibold">
            Regenerate AI
          </button>
        </div>
      ) : null}

      {table.getRowModel().rows.length === 0 ? (
        <EmptyState
          title="No products match"
          description="Try clearing filters or create a new product for your catalog."
        />
      ) : (
        <div className={`overflow-hidden ${cx.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-[1] bg-surface-muted/95 backdrop-blur">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-black/5">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        style={{ width: h.getSize() }}
                        className="relative px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500"
                      >
                        {h.isPlaceholder ? null : (
                          <button
                            type="button"
                            className={h.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </button>
                        )}
                        {h.column.getCanResize() ? (
                          <div
                            onMouseDown={h.getResizeHandler()}
                            onTouchStart={h.getResizeHandler()}
                            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-primary/40 ${
                              h.column.getIsResizing() ? 'bg-primary' : ''
                            }`}
                          />
                        ) : null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-black/5 transition-colors hover:bg-surface-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-black/5 px-4 py-3 text-xs">
            <p className="text-neutral-500">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ·{' '}
              {data.length} products
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                className={`${cx.btnGhost} py-1.5 disabled:opacity-40`}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                className={`${cx.btnGhost} py-1.5 disabled:opacity-40`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
