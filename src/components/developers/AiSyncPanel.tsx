/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Database,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { pathForSettingsSection } from '../../routes';
import { api, parseApiError } from '../../lib/api';

type AiSyncDashboard = {
  connectionStatus: string;
  lastSyncTime: string | null;
  lastEventTime: string | null;
  venueId: string | null;
  knowledgeHealth: {
    services: number;
    products: number;
    customers: number;
    staff: number;
  };
  pendingQueueJobs: number;
  failedEvents: number;
};

type SyncEvent = {
  id: string;
  eventType: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  connected: 'bg-[#e6f7ec] text-accent-green border-[#5dfd8a]/40',
  syncing: 'bg-sky-50 text-primary border-primary/20',
  failed: 'bg-red-50 text-danger-red border-red-200',
  disconnected: 'bg-amber-50 text-amber-700 border-amber-200',
  not_configured: 'bg-gray-100 text-gray-600 border-gray-200',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AiSyncPanel() {
  const [dashboard, setDashboard] = useState<AiSyncDashboard | null>(null);
  const [events, setEvents] = useState<SyncEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [dash, evts] = await Promise.all([
        api.getDeveloperAiSync() as Promise<AiSyncDashboard>,
        api.getDeveloperAiSyncEvents() as Promise<SyncEvent[]>,
      ]);
      setDashboard(dash);
      setEvents(evts);
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(interval);
  }, [load]);

  const rebuild = async () => {
    setRebuilding(true);
    setRebuildMsg(null);
    setError(null);
    try {
      const res = (await api.rebuildDeveloperKnowledge()) as { message?: string };
      setRebuildMsg(res.message ?? 'Rebuild queued');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setRebuilding(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading AI Sync…
      </div>
    );
  }

  const status = dashboard?.connectionStatus ?? 'not_configured';
  const health = dashboard?.knowledgeHealth;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs text-gray-500 max-w-lg">
          Uses existing AI Knowledge Sync. Rebuild enqueues an event-driven full sync — ready for
          Vector DB, AI Agent, and Journey Engine pipelines.
        </p>
        <Link
          to={pathForSettingsSection('ai-knowledge')}
          className="text-meta font-bold text-primary hover:underline shrink-0"
        >
          Configure MongoDB →
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-danger-red">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {rebuildMsg && (
        <div className="rounded-xl border border-[#5dfd8a]/40 bg-[#e6f7ec] px-3 py-2 text-xs text-accent-green font-semibold">
          {rebuildMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-gray-900">Connection</h4>
          </div>
          <span
            className={`inline-flex text-sm font-bold px-2 py-0.5 rounded-lg border capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.not_configured}`}
          >
            {status.replace('_', ' ')}
          </span>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Venue ID</dt>
              <dd className="font-mono font-semibold text-gray-800 truncate max-w-[180px]">
                {dashboard?.venueId ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Last sync</dt>
              <dd className="text-gray-800">{formatDate(dashboard?.lastSyncTime ?? null)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Last event</dt>
              <dd className="text-gray-800">{formatDate(dashboard?.lastEventTime ?? null)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-gray-900">Knowledge health</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Services', value: health?.services ?? 0 },
              { label: 'Products', value: health?.products ?? 0 },
              { label: 'Customers', value: health?.customers ?? 0 },
              { label: 'Staff', value: health?.staff ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-center"
              >
                <p className="text-lg font-bold text-gray-900">{item.value}</p>
                <p className="text-sm font-semibold text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-xs">
          <span>
            <span className="text-gray-500">Pending jobs: </span>
            <span className="font-bold text-amber-600">{dashboard?.pendingQueueJobs ?? 0}</span>
          </span>
          <span>
            <span className="text-gray-500">Failed events: </span>
            <span className="font-bold text-danger-red">{dashboard?.failedEvents ?? 0}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-primary px-3 py-2 rounded-lg border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            disabled={rebuilding || status === 'not_configured'}
            onClick={() => void rebuild()}
            className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full bg-channel-green text-white disabled:opacity-50"
          >
            {rebuilding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Rebuild knowledge
          </button>
        </div>
      </div>

      {events.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 text-sm font-bold uppercase text-gray-500">
            Recent sync events
          </div>
          <table className="w-full text-xs">
            <thead className="text-left text-sm font-bold uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 text-gray-600">{formatDate(ev.createdAt)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{ev.eventType}</td>
                  <td className="px-3 py-2 capitalize">
                    <span
                      className={
                        ev.status === 'completed'
                          ? 'text-accent-green font-bold'
                          : ev.status === 'failed'
                            ? 'text-danger-red font-bold'
                            : 'text-amber-600 font-bold'
                      }
                    >
                      {ev.status}
                    </span>
                    {ev.errorMessage && (
                      <p className="text-xs text-gray-400 truncate max-w-[240px]">
                        {ev.errorMessage}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
