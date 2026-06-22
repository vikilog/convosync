import { ChevronLeft } from 'lucide-react';
import { GMAIL_FOLDERS } from './constants';
import type { GmailFolder, GmailFolderCounts } from './types';
import { formatCount } from './utils';

type GmailSidebarProps = {
  folder: GmailFolder;
  onFolderChange: (folder: GmailFolder) => void;
  folderCounts: GmailFolderCounts;
  onClose?: () => void;
};

export function GmailSidebar({
  folder,
  onFolderChange,
  folderCounts,
  onClose,
}: GmailSidebarProps) {
  return (
    <aside className="shrink-0 w-[200px] flex flex-col min-h-0 bg-slate-50 border-r border-slate-200 overflow-y-auto overflow-x-hidden">
      <div className="p-3 border-b border-slate-200 bg-white/70 flex items-center justify-between gap-2">
        <p className="text-sm font-bold uppercase tracking-wider text-gray-400">Mailboxes</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-slate-50"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {GMAIL_FOLDERS.map((item) => {
          const Icon = item.icon;
          const active = folder === item.id;
          const count = formatCount(folderCounts[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFolderChange(item.id)}
              className={`group relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                active
                  ? 'bg-white text-primary font-bold shadow-[0_1px_4px_rgba(91,76,245,0.08)] ring-1 ring-primary/15'
                  : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-primary" />
              )}
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {count && (
                <span
                  className={`text-meta font-mono tabular-nums shrink-0 min-w-[2ch] text-right ${
                    active ? 'text-primary/70' : 'text-gray-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
