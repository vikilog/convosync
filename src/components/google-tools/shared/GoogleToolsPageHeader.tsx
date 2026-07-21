import { Loader2, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pathForTab } from '../../../routes';

function formatSyncLabel(iso: string | null | undefined): string {
  if (!iso) return 'Never synced';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Never synced';
  return `Last sync ${d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
}

type GoogleToolsPageHeaderProps = {
  toolLabel: string;
  email: string | null;
  avatarClassName?: string;
  lastSyncAt: string | null;
  syncing: boolean;
  onSync: () => void;
  onRefresh?: () => void;
  actions?: React.ReactNode;
};

export function GoogleToolsPageHeader({
  toolLabel,
  email,
  avatarClassName = 'bg-[#2563EB]/10 text-[#2563EB]',
  lastSyncAt,
  syncing,
  onSync,
  onRefresh,
  actions,
}: GoogleToolsPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-black/5 bg-surface min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${avatarClassName}`}
        >
          {(email?.[0] ?? toolLabel[0] ?? 'G').toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0F172A] truncate">{toolLabel}</p>
          <p className="text-xs text-[#64748B] truncate">{email ?? 'Connected account'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden md:inline text-xs text-[#64748B] whitespace-nowrap">
          {formatSyncLabel(lastSyncAt)}
        </span>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-[#64748B] border border-black/5 bg-surface hover:bg-surface-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          disabled={syncing}
          onClick={onSync}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold border border-black/5 text-[#0F172A] bg-surface hover:bg-surface-muted disabled:opacity-50 transition-colors"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync
        </button>

        {actions}

        <button
          type="button"
          onClick={() => navigate(`${pathForTab('integrations')}?channel=google`)}
          title="Settings"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-[#64748B] border border-black/5 bg-surface hover:bg-surface-muted transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
