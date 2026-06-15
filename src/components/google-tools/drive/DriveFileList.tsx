import { ArrowLeft, Grid3x3, List, Loader2, MoreHorizontal, Search } from 'lucide-react';
import type { DriveFile, LayoutMode } from './types';
import { FileTypeIcon } from '../shared/FileTypeIcon';
import { formatBytes, formatDate, fileTypeLabel } from './utils';

type DriveFileListProps = {
  files: DriveFile[];
  selectedId: string | null;
  layout: LayoutMode;
  searchQuery: string;
  listLoading: boolean;
  hasMore: boolean;
  folderId: string | null;
  onSearchChange: (q: string) => void;
  onLayoutChange: (layout: LayoutMode) => void;
  onSelect: (file: DriveFile) => void;
  onOpen: (file: DriveFile) => void;
  onFolderBack: () => void;
  onLoadMore: () => void;
};

export function DriveFileList({
  files,
  selectedId,
  layout,
  searchQuery,
  listLoading,
  hasMore,
  folderId,
  onSearchChange,
  onLayoutChange,
  onSelect,
  onOpen,
  onFolderBack,
  onLoadMore,
}: DriveFileListProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 p-3 space-y-2 border-b border-[#E2E8F0] bg-white">
        {folderId && (
          <button
            type="button"
            onClick={onFolderBack}
            className="text-sm font-semibold text-[#2563EB] flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#2563EB]/20">
          <Search className="w-4 h-4 text-[#64748B] shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files..."
            className="flex-1 min-w-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
          />
        </div>
        <div className="inline-flex items-center rounded-lg border border-[#E2E8F0] p-0.5">
          <button
            type="button"
            onClick={() => onLayoutChange('list')}
            className={`p-1.5 rounded-md transition-colors ${
              layout === 'list' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              layout === 'grid' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
            }`}
            title="Grid view"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {listLoading && files.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#64748B]">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading files…
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 px-4 text-center text-sm text-[#64748B]">No files in this view.</div>
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-2 gap-2 p-3">
            {files.map((file) => {
              const selected = selectedId === file.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => onSelect(file)}
                  onDoubleClick={() => onOpen(file)}
                  className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                    selected
                      ? 'border-[#2563EB] bg-[#EFF6FF] shadow-sm'
                      : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                  }`}
                >
                  <FileTypeIcon file={file} className="w-10 h-10" />
                  <p className="text-sm font-semibold text-[#0F172A] mt-2 truncate">{file.name}</p>
                  <span className="inline-block mt-1 text-xs font-medium px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                    {fileTypeLabel(file)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            {files.map((file) => {
              const selected = selectedId === file.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => onSelect(file)}
                  onDoubleClick={() => onOpen(file)}
                  className={`w-full h-12 flex items-center gap-3 px-3 text-left transition-colors border-l-[3px] ${
                    selected
                      ? 'border-l-[#2563EB] bg-[#EFF6FF]'
                      : 'border-l-transparent hover:bg-[#F8FAFC]'
                  }`}
                >
                  <FileTypeIcon file={file} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{file.name}</p>
                    <p className="text-xs text-[#64748B] truncate">
                      {fileTypeLabel(file)} · {formatBytes(file.size)}
                    </p>
                  </div>
                  <p className="hidden sm:block text-xs text-[#64748B] shrink-0 tabular-nums">
                    {formatDate(file.modifiedTime)}
                  </p>
                  <span
                    role="presentation"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md text-[#94A3B8] hover:text-[#64748B] hover:bg-white shrink-0"
                  >
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
              disabled={listLoading}
              className="w-full py-2 rounded-lg text-sm font-semibold text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#EFF6FF] disabled:opacity-50"
            >
              {listLoading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
