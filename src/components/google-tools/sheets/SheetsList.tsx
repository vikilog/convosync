import { FileSpreadsheet, Grid3x3, List, Loader2, MoreHorizontal, Search } from 'lucide-react';
import type { SortDir, SortKey, SpreadsheetSummary } from './types';
import { formatDate, formatNumber } from './utils';
import { SheetsToolbarSelect } from './SheetsHeader';

type SheetsListProps = {
  spreadsheets: SpreadsheetSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortKeyChange: (k: SortKey) => void;
  onSortDirChange: (d: SortDir) => void;
  statusFilter: 'all' | 'starred' | 'shared';
  onStatusFilterChange: (f: 'all' | 'starred' | 'shared') => void;
  hasMore: boolean;
  onLoadMore: () => void;
  layout?: 'list' | 'grid';
  onLayoutChange?: (layout: 'list' | 'grid') => void;
};

export function SheetsList({
  spreadsheets,
  selectedId,
  onSelect,
  loading,
  searchQuery,
  onSearchChange,
  sortKey,
  sortDir,
  onSortKeyChange,
  onSortDirChange,
  statusFilter,
  onStatusFilterChange,
  hasMore,
  onLoadMore,
  layout = 'list',
  onLayoutChange,
}: SheetsListProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 p-3 space-y-2 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#16A34A]/20">
          <Search className="w-4 h-4 text-[#64748B] shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sheets..."
            className="flex-1 min-w-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SheetsToolbarSelect
            label="Sort"
            value={sortKey}
            options={[
              { value: 'modified', label: 'Last modified' },
              { value: 'name', label: 'Name' },
              { value: 'worksheets', label: 'Worksheets' },
            ]}
            onChange={(v) => onSortKeyChange(v as SortKey)}
          />
          <SheetsToolbarSelect
            label="Order"
            value={sortDir}
            options={[
              { value: 'desc', label: 'Desc' },
              { value: 'asc', label: 'Asc' },
            ]}
            onChange={(v) => onSortDirChange(v as SortDir)}
          />
          <SheetsToolbarSelect
            label="Filter"
            value={statusFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'starred', label: 'Starred' },
              { value: 'shared', label: 'Shared' },
            ]}
            onChange={(v) => onStatusFilterChange(v as 'all' | 'starred' | 'shared')}
          />

          {onLayoutChange && (
            <div className="inline-flex items-center rounded-lg border border-[#E2E8F0] p-0.5 ml-auto">
              <button
                type="button"
                onClick={() => onLayoutChange('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  layout === 'list' ? 'bg-[#16A34A] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onLayoutChange('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  layout === 'grid' ? 'bg-[#16A34A] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && spreadsheets.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#64748B]">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading spreadsheets…
          </div>
        ) : spreadsheets.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-[#CBD5E1] mb-3" />
            <p className="text-sm font-medium text-[#64748B]">No spreadsheets found</p>
          </div>
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-2 gap-2 p-3">
            {spreadsheets.map((sheet) => {
              const selected = selectedId === sheet.id;
              return (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => onSelect(sheet.id)}
                  className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                    selected
                      ? 'border-[#16A34A] bg-emerald-50 shadow-sm'
                      : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A] mt-2 truncate">
                    {sheet.name ?? 'Untitled'}
                  </p>
                  <span className="inline-block mt-1 text-xs font-medium px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                    Sheet
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            {spreadsheets.map((sheet) => {
              const selected = selectedId === sheet.id;
              return (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => onSelect(sheet.id)}
                  className={`w-full h-12 flex items-center gap-3 px-3 text-left transition-colors border-l-[3px] ${
                    selected
                      ? 'border-l-[#16A34A] bg-emerald-50'
                      : 'border-l-transparent hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {sheet.name ?? 'Untitled'}
                    </p>
                    <p className="text-xs text-[#64748B] truncate">
                      Sheet · {formatNumber(sheet.rowCount)} rows
                    </p>
                  </div>
                  <p className="hidden sm:block text-xs text-[#64748B] shrink-0 tabular-nums">
                    {formatDate(sheet.modifiedTime)}
                  </p>
                  <span className="p-1 text-[#94A3B8] shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="p-3">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-semibold text-[#16A34A] border border-[#16A34A]/20 hover:bg-emerald-50 disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
