import type { FormEvent } from 'react';
import { Loader2, PenSquare, Search, X } from 'lucide-react';
import { Input } from '../../ui/input';

type GmailHeaderProps = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (e: FormEvent) => void;
  activeSearch: string;
  onClearSearch: () => void;
  onCompose: () => void;
  onToggleSidebar?: () => void;
};

export function GmailHeader({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  activeSearch,
  onClearSearch,
  onCompose,
  onToggleSidebar,
}: GmailHeaderProps) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-swiss-line bg-white shadow-[0_1px_0_rgba(232,230,240,0.8)]">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 min-w-0 h-[52px]">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden shrink-0 p-2 rounded-lg text-swiss-muted hover:bg-slate-50 hover:text-primary transition-colors"
            aria-label="Open folders"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <form onSubmit={onSearchSubmit} className="flex flex-1 min-w-0">
          <div className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-swiss-line bg-slate-50 px-3 py-2 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Search className="w-4 h-4 text-swiss-faint shrink-0" />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search mail…"
              className="h-auto flex-1 min-w-0 bg-transparent text-sm text-swiss-ink placeholder:text-swiss-faint outline-none"
            />
            {activeSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="p-1 rounded-md text-swiss-faint hover:text-swiss-muted hover:bg-white transition-colors shrink-0"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center gap-1.5 shrink-0 border-l border-swiss-line pl-3">
          <button
            type="button"
            onClick={onCompose}
            title="Compose"
            aria-label="Compose"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl text-sm font-bold bg-primary text-white shadow-[0_2px_8px_rgba(91,76,245,0.25)] hover:bg-[#20bd5a] transition-all whitespace-nowrap"
          >
            <PenSquare className="w-4 h-4 shrink-0" />
            <span>Compose</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function GmailBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="shrink-0 px-4 py-2 text-sm font-semibold text-swiss-ink bg-sky-50 border-b border-sky-100">
      {message}
    </div>
  );
}

export function GmailLoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-20 text-sm text-swiss-faint">
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      {label}
    </div>
  );
}
