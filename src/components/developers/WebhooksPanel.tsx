/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Webhook,
} from 'lucide-react';
import { api, parseApiError } from '../../lib/api';

const WEBHOOK_EVENTS = [
  'contact.created',
  'contact.updated',
  'message.received',
  'message.sent',
  'booking.created',
  'booking.updated',
  'booking.cancelled',
  'knowledge.synced',
  'knowledge.failed',
  'knowledge.rebuild.requested',
] as const;

type WebhookTab = 'incoming' | 'outgoing' | 'logs';

type IncomingWebhook = {
  id: string;
  slug: string;
  secret: string;
  enabled: boolean;
  subscribedEvents: string[];
  webhookUrl: string;
  lastEventAt: string | null;
};

type OutgoingWebhook = {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  enabled: boolean;
  subscribedEvents: string[];
  maxRetries: number;
  timeoutMs: number;
};

type WebhookLog = {
  id: string;
  direction: 'incoming' | 'outgoing';
  eventType: string;
  status: string;
  statusCode: number | null;
  attempt: number;
  errorMessage: string | null;
  createdAt: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

export function WebhooksPanel() {
  const [tab, setTab] = useState<WebhookTab>('incoming');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<IncomingWebhook | null>(null);
  const [outgoing, setOutgoing] = useState<OutgoingWebhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [showAddOutgoing, setShowAddOutgoing] = useState(false);
  const [newOutgoing, setNewOutgoing] = useState({
    name: '',
    url: '',
    secret: '',
    subscribedEvents: [] as string[],
    maxRetries: 3,
    timeoutMs: 10000,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inc, out, logRows] = await Promise.all([
        api.getDeveloperIncomingWebhook() as Promise<IncomingWebhook>,
        api.getDeveloperOutgoingWebhooks() as Promise<OutgoingWebhook[]>,
        api.getDeveloperWebhookLogs({ limit: '50' }) as Promise<WebhookLog[]>,
      ]);
      setIncoming(inc);
      setOutgoing(out);
      setLogs(logRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveIncoming = async (patch: {
    enabled?: boolean;
    subscribedEvents?: string[];
    regenerateSecret?: boolean;
  }) => {
    setSaving(true);
    setError(null);
    try {
      const updated = (await api.updateDeveloperIncomingWebhook(patch)) as IncomingWebhook;
      setIncoming(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setSaving(false);
    }
  };

  const toggleIncomingEvent = (event: string) => {
    if (!incoming) return;
    const next = incoming.subscribedEvents.includes(event)
      ? incoming.subscribedEvents.filter((e) => e !== event)
      : [...incoming.subscribedEvents, event];
    void saveIncoming({ subscribedEvents: next });
  };

  const createOutgoing = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.createDeveloperOutgoingWebhook({
        ...newOutgoing,
        enabled: true,
        secret: newOutgoing.secret || undefined,
      });
      setShowAddOutgoing(false);
      setNewOutgoing({
        name: '',
        url: '',
        secret: '',
        subscribedEvents: [],
        maxRetries: 3,
        timeoutMs: 10000,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setSaving(false);
    }
  };

  const deleteOutgoing = async (id: string) => {
    setSaving(true);
    try {
      await api.deleteDeveloperOutgoingWebhook(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: WebhookTab; label: string }[] = [
    { id: 'incoming', label: 'Incoming' },
    { id: 'outgoing', label: 'Outgoing' },
    { id: 'logs', label: 'Event Logs' },
  ];

  if (loading && !incoming) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading webhooks…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              tab === t.id
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:bg-slate-50 hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-primary"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-danger-red">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {tab === 'incoming' && incoming && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-50 text-primary">
              <Webhook className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900">Incoming webhook</h4>
              <p className="text-xs text-gray-500 mt-1">
                Unique URL and secret per organization. Send events with header{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">X-ConvoSync-Secret</code>.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={incoming.enabled}
                disabled={saving}
                onChange={(e) => void saveIncoming({ enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              Enabled
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Webhook URL
            </label>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 truncate">
                {incoming.webhookUrl}
              </code>
              <button
                type="button"
                onClick={() => void copyText(incoming.webhookUrl)}
                className="p-2 rounded-lg border border-slate-200 hover:border-primary/40 text-gray-500"
                aria-label="Copy URL"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Secret
            </label>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 truncate font-mono">
                {incoming.secret}
              </code>
              <button
                type="button"
                onClick={() => void copyText(incoming.secret)}
                className="p-2 rounded-lg border border-slate-200 hover:border-primary/40 text-gray-500"
                aria-label="Copy secret"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveIncoming({ regenerateSecret: true })}
                className="text-sm font-bold px-3 rounded-lg border border-slate-200 hover:border-primary/40 text-primary"
              >
                Regenerate
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Last event: {formatDate(incoming.lastEventAt)}
          </p>

          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
              Accepted event types
            </p>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((ev) => (
                <label
                  key={ev}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
                    incoming.subscribedEvents.includes(ev)
                      ? 'bg-sky-50 border-primary/30 text-primary'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={incoming.subscribedEvents.includes(ev)}
                    onChange={() => toggleIncomingEvent(ev)}
                  />
                  {ev}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'outgoing' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Subscribe to platform events. Retries and delivery logs are recorded automatically.
            </p>
            <button
              type="button"
              onClick={() => setShowAddOutgoing(true)}
              className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add webhook
            </button>
          </div>

          {showAddOutgoing && (
            <div className="rounded-2xl border border-primary/20 bg-slate-50 p-4 space-y-3">
              <input
                placeholder="Name"
                value={newOutgoing.name}
                onChange={(e) => setNewOutgoing((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="https://your-server.com/webhook"
                value={newOutgoing.url}
                onChange={(e) => setNewOutgoing((p) => ({ ...p, url: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Signing secret (optional)"
                value={newOutgoing.secret}
                onChange={(e) => setNewOutgoing((p) => ({ ...p, secret: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {WEBHOOK_EVENTS.map((ev) => (
                  <button
                    key={ev}
                    type="button"
                    onClick={() =>
                      setNewOutgoing((p) => ({
                        ...p,
                        subscribedEvents: p.subscribedEvents.includes(ev)
                          ? p.subscribedEvents.filter((x) => x !== ev)
                          : [...p.subscribedEvents, ev],
                      }))
                    }
                    className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${
                      newOutgoing.subscribedEvents.includes(ev)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    {ev}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving || !newOutgoing.name || !newOutgoing.url}
                  onClick={() => void createOutgoing()}
                  className="text-sm font-bold px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddOutgoing(false)}
                  className="text-sm font-semibold text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {outgoing.length === 0 && (
            <p className="text-sm text-gray-400 py-8 text-center">No outgoing webhooks yet.</p>
          )}

          {outgoing.map((hook) => (
            <div
              key={hook.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-3 justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{hook.name}</span>
                  {hook.enabled ? (
                    <span className="text-sm font-bold text-accent-green bg-[#e6f7ec] px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{hook.url}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Retries: {hook.maxRetries} · Timeout: {hook.timeoutMs}ms · Events:{' '}
                  {hook.subscribedEvents.length || 'none'}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void deleteOutgoing(hook.id)}
                className="p-2 text-gray-400 hover:text-danger-red"
                aria-label="Delete webhook"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-left text-sm font-bold uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Direction</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Attempt</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                    No delivery logs yet.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-3 py-2 capitalize">{log.direction}</td>
                  <td className="px-3 py-2 font-mono text-xs">{log.eventType}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        log.status === 'success'
                          ? 'text-accent-green'
                          : log.status === 'failed'
                            ? 'text-danger-red'
                            : 'text-amber-600'
                      }`}
                    >
                      {log.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                      {log.status}
                      {log.statusCode != null && ` (${log.statusCode})`}
                    </span>
                    {log.errorMessage && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                        {log.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2">{log.attempt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
