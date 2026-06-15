import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, RefreshCw } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { formatLastSync } from '../google-tools/business-profile/utils';

type GbpSyncPanelProps = {
  connectionId: string;
  connectionEmail?: string | null;
};

function quotaLabel(health: string): { text: string; className: string } {
  if (health === 'degraded') {
    return { text: 'Degraded', className: 'bg-red-50 text-red-700 border-red-200' };
  }
  if (health === 'busy') {
    return { text: 'Busy', className: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  return { text: 'Healthy', className: 'bg-[#e6f7ec] text-[#006d2f] border-[#5dfd8a]/40' };
}

export function GbpSyncPanel({ connectionId, connectionEmail }: GbpSyncPanelProps) {
  const [status, setStatus] = useState<Awaited<
    ReturnType<typeof api.getGoogleBusinessProfileSyncStatus>
  > | null>(null);
  const [logs, setLogs] = useState<
    Awaited<ReturnType<typeof api.getGoogleBusinessProfileSyncLogs>>['logs']
  >([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [st, logRes] = await Promise.all([
        api.getGoogleBusinessProfileSyncStatus(connectionId),
        api.getGoogleBusinessProfileSyncLogs(connectionId, 30),
      ]);
      setStatus(st);
      setLogs(logRes.logs ?? []);
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enqueue = async (
    syncType: 'accounts' | 'locations' | 'reviews' | 'metrics' | 'cache_rebuild'
  ) => {
    setBusy(syncType);
    setMessage('');
    try {
      await api.enqueueGoogleBusinessProfileSync({ connectionId, syncType, force: true });
      setMessage(`${syncType.replace('_', ' ')} sync queued.`);
      await refresh();
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setBusy(null);
    }
  };

  const quota = quotaLabel(status?.quotaHealth ?? 'healthy');

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#34A853]" />
            <h3 className="text-sm font-black text-gray-950">Google Business Profile — Sync</h3>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {connectionEmail ? `Account: ${connectionEmail}` : 'Cache-first sync via background workers'}
          </p>
        </div>
        <span
          className={`inline-flex text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${quota.className}`}
        >
          Quota: {quota.text}
        </span>
      </div>

      {message && (
        <p className="text-sm font-semibold text-[#006d2f] bg-[#e6f7ec] border border-[#5dfd8a]/30 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-bold uppercase text-gray-400">Accounts</p>
          <p className="font-semibold text-gray-800 mt-1">
            {formatLastSync(status?.lastSync.accounts ?? null)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{status?.counts.accounts ?? 0} cached</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-bold uppercase text-gray-400">Locations</p>
          <p className="font-semibold text-gray-800 mt-1">
            {formatLastSync(status?.lastSync.locations ?? null)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{status?.counts.locations ?? 0} cached</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-bold uppercase text-gray-400">Reviews</p>
          <p className="font-semibold text-gray-800 mt-1">
            {formatLastSync(status?.lastSync.reviews ?? null)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{status?.counts.reviews ?? 0} cached</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-bold uppercase text-gray-400">Metrics</p>
          <p className="font-semibold text-gray-800 mt-1">
            {formatLastSync(status?.lastSync.metrics ?? null)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{status?.counts.metrics ?? 0} cached</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['accounts', 'Sync Accounts'],
            ['locations', 'Sync Locations'],
            ['reviews', 'Sync Reviews'],
            ['metrics', 'Sync Metrics'],
            ['cache_rebuild', 'Rebuild Cache'],
          ] as const
        ).map(([type, label]) => (
          <button
            key={type}
            type="button"
            disabled={busy !== null}
            onClick={() => void enqueue(type)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-meta font-bold border border-[#34A853]/25 bg-[#e8f5e9] text-[#34A853] hover:bg-[#d7f0db] disabled:opacity-50"
          >
            {busy === type ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-meta font-bold border border-slate-200 text-gray-600 hover:bg-slate-50"
        >
          Refresh status
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-meta text-gray-500 font-medium">
        <span>Pending jobs: {status?.jobs.waiting ?? 0}</span>
        <span>Active: {status?.jobs.active ?? 0}</span>
        <span className={status?.jobs.failed ? 'text-red-600 font-bold' : ''}>
          Failed: {status?.jobs.failed ?? 0}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-black text-gray-800 mb-2">Sync logs</h4>
        {logs.length === 0 ? (
          <p className="text-xs text-gray-400">No sync activity yet.</p>
        ) : (
          <div className="max-h-56 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-meta">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-gray-500">
                  <th className="px-3 py-2 font-bold">Type</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                  <th className="px-3 py-2 font-bold">Duration</th>
                  <th className="px-3 py-2 font-bold">Req/Res</th>
                  <th className="px-3 py-2 font-bold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eef5]">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 font-semibold text-gray-800">{log.syncType}</td>
                    <td
                      className={`px-3 py-2 font-bold ${log.status === 'error' ? 'text-red-600' : 'text-[#34A853]'}`}
                    >
                      {log.status}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-600 tabular-nums">
                      {log.requestCount}/{log.responseCount}
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
