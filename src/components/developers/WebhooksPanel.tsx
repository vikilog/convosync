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
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
      <div className="flex items-center gap-2 text-sm text-swiss-muted py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading webhooks…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-swiss-line pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              tab === t.id
                ? 'bg-primary text-white'
                : 'text-swiss-muted hover:bg-slate-50 hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-swiss-muted hover:text-primary"
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
        <div className="rounded-2xl border border-swiss-line bg-white p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-50 text-primary">
              <Webhook className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-swiss-ink">Incoming webhook</h4>
              <p className="text-xs text-swiss-muted mt-1">
                Unique URL and secret per organization. Send events with header{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">X-ConvoSync-Secret</code>.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-swiss-muted">
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
            <label className="text-sm font-bold uppercase tracking-wide text-swiss-muted">
              Webhook URL
            </label>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-slate-50 border border-swiss-line rounded-lg px-3 py-2 truncate">
                {incoming.webhookUrl}
              </code>
              <button
                type="button"
                onClick={() => void copyText(incoming.webhookUrl)}
                className="p-2 rounded-lg border border-swiss-line hover:border-primary/40 text-swiss-muted"
                aria-label="Copy URL"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide text-swiss-muted">
              Secret
            </label>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-slate-50 border border-swiss-line rounded-lg px-3 py-2 truncate font-mono">
                {incoming.secret}
              </code>
              <button
                type="button"
                onClick={() => void copyText(incoming.secret)}
                className="p-2 rounded-lg border border-swiss-line hover:border-primary/40 text-swiss-muted"
                aria-label="Copy secret"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveIncoming({ regenerateSecret: true })}
                className="text-sm font-bold px-3 rounded-lg border border-swiss-line hover:border-primary/40 text-primary"
              >
                Regenerate
              </button>
            </div>
          </div>

          <p className="text-xs text-swiss-muted">
            Last event: {formatDate(incoming.lastEventAt)}
          </p>

          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-swiss-muted mb-2">
              Accepted event types
            </p>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((ev) => (
                <label
                  key={ev}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
                    incoming.subscribedEvents.includes(ev)
                      ? 'bg-sky-50 border-primary/30 text-primary'
                      : 'bg-gray-50 border-gray-200 text-swiss-muted'
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
            <p className="text-xs text-swiss-muted">
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
              <Input
                placeholder="Name"
                value={newOutgoing.name}
                onChange={(e) => setNewOutgoing((p) => ({ ...p, name: e.target.value }))}
                className="h-auto w-full rounded-lg border border-swiss-line px-3 py-2 text-sm"
              />
              <Input
                placeholder="https://your-server.com/webhook"
                value={newOutgoing.url}
                onChange={(e) => setNewOutgoing((p) => ({ ...p, url: e.target.value }))}
                className="h-auto w-full rounded-lg border border-swiss-line px-3 py-2 text-sm"
              />
              <Input
                placeholder="Signing secret (optional)"
                value={newOutgoing.secret}
                onChange={(e) => setNewOutgoing((p) => ({ ...p, secret: e.target.value }))}
                className="h-auto w-full rounded-lg border border-swiss-line px-3 py-2 text-sm"
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
                        : 'bg-white border-gray-200 text-swiss-muted'
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
                  className="text-sm font-bold px-4 py-2 rounded-full bg-channel-green text-white disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddOutgoing(false)}
                  className="text-sm font-semibold text-swiss-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {outgoing.length === 0 && (
            <p className="text-sm text-swiss-faint py-8 text-center">No outgoing webhooks yet.</p>
          )}

          {outgoing.map((hook) => (
            <div
              key={hook.id}
              className="rounded-2xl border border-swiss-line bg-white p-4 flex flex-wrap gap-3 justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-swiss-ink">{hook.name}</span>
                  {hook.enabled ? (
                    <span className="text-sm font-bold text-accent-green bg-[#e6f7ec] px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-swiss-faint bg-gray-100 px-2 py-0.5 rounded-full">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-swiss-muted mt-1 truncate">{hook.url}</p>
                <p className="text-xs text-swiss-faint mt-2">
                  Retries: {hook.maxRetries} · Timeout: {hook.timeoutMs}ms · Events:{' '}
                  {hook.subscribedEvents.length || 'none'}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void deleteOutgoing(hook.id)}
                className="p-2 text-swiss-faint hover:text-danger-red"
                aria-label="Delete webhook"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div className="rounded-2xl border border-swiss-line bg-white overflow-hidden">
          <Table className="text-xs">
            <TableHeader className="bg-slate-50 text-left text-sm font-bold uppercase text-swiss-muted">
              <TableRow>
                <TableHead className="px-3 py-2 whitespace-normal">Time</TableHead>
                <TableHead className="px-3 py-2 whitespace-normal">Direction</TableHead>
                <TableHead className="px-3 py-2 whitespace-normal">Event</TableHead>
                <TableHead className="px-3 py-2 whitespace-normal">Status</TableHead>
                <TableHead className="px-3 py-2 whitespace-normal">Attempt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="px-3 py-8 text-center text-swiss-faint whitespace-normal">
                    No delivery logs yet.
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id} className="border-t border-swiss-line">
                  <TableCell className="px-3 py-2 text-swiss-muted whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="px-3 py-2 capitalize">{log.direction}</TableCell>
                  <TableCell className="px-3 py-2 font-mono text-xs">{log.eventType}</TableCell>
                  <TableCell className="px-3 py-2">
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
                      <p className="text-xs text-swiss-faint mt-0.5 truncate max-w-[200px]">
                        {log.errorMessage}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2">{log.attempt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
