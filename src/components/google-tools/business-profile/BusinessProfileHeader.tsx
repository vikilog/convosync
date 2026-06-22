import { ChevronDown, Loader2, RefreshCw, Settings } from 'lucide-react';
import type { GbpAccount } from './types';
import { formatLastSync } from './utils';

type BusinessProfileHeaderProps = {
  accounts: GbpAccount[];
  selectedAccountId: string | null;
  onAccountChange: (accountId: string) => void;
  lastSyncAt: string | null;
  syncing: boolean;
  onSync: () => void;
  onSettings: () => void;
  onToggleSidebar?: () => void;
};

export function BusinessProfileHeader({
  accounts,
  selectedAccountId,
  onAccountChange,
  lastSyncAt,
  syncing,
  onSync,
  onSettings,
  onToggleSidebar,
}: BusinessProfileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200 bg-white shadow-[0_1px_0_rgba(232,230,240,0.8)]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden shrink-0 p-2 rounded-lg text-gray-500 hover:bg-slate-50"
              aria-label="Open sidebar"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => onAccountChange(e.target.value)}
              disabled={accounts.length === 0}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-sm font-semibold text-gray-900 outline-none focus:border-[#34A853]/40 focus:ring-2 focus:ring-[#34A853]/10 disabled:opacity-50"
            >
              {accounts.length === 0 ? (
                <option value="">No accounts — sync from Integrations</option>
              ) : (
                accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountName}
                    {account.type ? ` · ${account.type}` : ''}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <p className="hidden lg:block text-meta text-gray-400 whitespace-nowrap">
            Last sync: {formatLastSync(lastSyncAt)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={onSettings}
            title="Settings"
            aria-label="Settings"
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-gray-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={syncing || accounts.length === 0}
            onClick={onSync}
            title="Sync accounts"
            aria-label="Sync"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-sm font-bold text-[#34A853] border border-[#34A853]/20 bg-[#e8f5e9] hover:bg-[#d7f0db] disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function BusinessProfileBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="shrink-0 px-4 py-2 text-sm font-semibold text-gray-700 bg-[#e8f5e9] border-b border-[#c8e6c9]">
      {message}
    </div>
  );
}

export function BusinessProfileLoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-20 text-sm text-gray-400">
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      {label}
    </div>
  );
}
