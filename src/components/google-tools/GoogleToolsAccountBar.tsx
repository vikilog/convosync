import { Loader2, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GOOGLE_TOOL_META } from '../../lib/googleTools';
import { pathForTab } from '../../routes';
import { useGoogleToolsProducts } from './hooks/useGoogleToolsProducts';
import { useGoogleToolsToolbar } from './GoogleToolsToolbarContext';

function formatSyncLabel(iso: string | null | undefined): string {
  if (!iso) return 'Never synced';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Never synced';
  return `Last sync ${d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
}

export function GoogleToolsAccountBar() {
  const navigate = useNavigate();
  const { toolbar } = useGoogleToolsToolbar();
  const { productByTool } = useGoogleToolsProducts();

  const tool = toolbar?.tool;
  const meta = tool ? GOOGLE_TOOL_META[tool] : null;
  const product = tool ? productByTool(tool) : null;
  const email = toolbar?.email ?? product?.connectionEmail ?? null;
  const lastSyncAt = toolbar?.lastSyncAt ?? product?.lastSyncAt ?? null;
  const syncing = toolbar?.syncing ?? false;
  const connected = Boolean(product?.connectionId);

  const handleRefresh = () => {
    if (toolbar?.onRefresh) void toolbar.onRefresh();
  };

  const handleSync = () => {
    if (toolbar?.onSync) void toolbar.onSync();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 md:px-5 py-3 bg-slate-50/80 border-b border-slate-200">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm ${
            connected ? 'bg-[#e8f4ff] text-[#4285F4]' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {(email?.[0] ?? meta?.shortLabel[0] ?? 'G').toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-950 truncate">
            {connected ? (meta?.label ?? 'Google account') : `${meta?.shortLabel ?? 'Tool'} not connected`}
          </p>
          <p className="text-meta text-gray-500 truncate">
            {connected ? (email ?? 'Connected account') : 'Connect from Integrations → Google'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`hidden sm:inline text-meta font-medium tabular-nums ${
            connected ? 'text-gray-500' : 'text-amber-600'
          }`}
        >
          {connected ? formatSyncLabel(lastSyncAt) : 'Not connected'}
        </span>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={!connected || !toolbar?.onRefresh}
          title="Refresh"
          className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-gray-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleSync}
          disabled={!connected || !toolbar?.onSync || syncing}
          title="Sync now"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-bold text-[#4285F4] border border-[#4285F4]/20 bg-[#e8f4ff] hover:bg-[#dbeafe] disabled:opacity-40 transition-colors"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="hidden sm:inline">Sync</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(`${pathForTab('integrations')}?channel=google`)}
          title="Settings"
          className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-gray-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
