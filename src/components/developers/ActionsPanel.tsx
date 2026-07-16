/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, Save, Zap } from 'lucide-react';
import { api, parseApiError } from '../../lib/api';

type DeveloperAction = {
  id: string;
  actionType: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  timeoutMs: number;
  enabled: boolean;
};

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export function ActionsPanel() {
  const [actions, setActions] = useState<DeveloperAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DeveloperAction>>({});
  const [headersText, setHeadersText] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = (await api.getDeveloperActions()) as DeveloperAction[];
      setActions(rows);
      const map: Record<string, DeveloperAction> = {};
      const headersMap: Record<string, string> = {};
      for (const a of rows) {
        map[a.actionType] = { ...a };
        headersMap[a.actionType] = JSON.stringify(a.headers ?? {}, null, 2);
      }
      setDrafts(map);
      setHeadersText(headersMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateDraft = (actionType: string, patch: Partial<DeveloperAction>) => {
    setDrafts((prev) => ({
      ...prev,
      [actionType]: { ...prev[actionType], ...patch },
    }));
  };

  const saveAction = async (actionType: string) => {
    const draft = drafts[actionType];
    if (!draft) return;
    setSaving(actionType);
    setError(null);
    try {
      let headers: Record<string, string> = {};
      try {
        headers = JSON.parse(headersText[actionType] ?? '{}') as Record<string, string>;
      } catch {
        setError(`Invalid JSON headers for ${actionType}`);
        return;
      }

      const saved = (await api.upsertDeveloperAction({
        actionType: draft.actionType,
        name: draft.name,
        method: draft.method,
        url: draft.url,
        headers,
        timeoutMs: draft.timeoutMs,
        enabled: draft.enabled,
      })) as DeveloperAction;

      setActions((prev) => prev.map((a) => (a.actionType === actionType ? saved : a)));
      setDrafts((prev) => ({ ...prev, [actionType]: saved }));
      setHeadersText((prev) => ({
        ...prev,
        [actionType]: JSON.stringify(saved.headers ?? {}, null, 2),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading actions…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Configure HTTP endpoints for AI Agents and Journey Engine. Each action type maps to one
        external API call.
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-danger-red">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {actions.map((action) => {
          const draft = drafts[action.actionType] ?? action;
          const headersStr = headersText[action.actionType] ?? '{}';

          return (
            <div
              key={action.actionType}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-50 text-primary">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <code className="text-sm font-bold text-primary">{action.actionType}</code>
                    <input
                      value={draft.name}
                      onChange={(e) => updateDraft(action.actionType, { name: e.target.value })}
                      className="block text-sm font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-full"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) =>
                      updateDraft(action.actionType, { enabled: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  Enabled
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <select
                  value={draft.method}
                  onChange={(e) => updateDraft(action.actionType, { method: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-semibold"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="https://api.example.com/..."
                  value={draft.url}
                  onChange={(e) => updateDraft(action.actionType, { url: e.target.value })}
                  className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
                <input
                  type="number"
                  min={1000}
                  max={120000}
                  value={draft.timeoutMs}
                  onChange={(e) =>
                    updateDraft(action.actionType, { timeoutMs: Number(e.target.value) })
                  }
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs"
                  title="Timeout (ms)"
                />
              </div>

              <div>
                <label className="text-sm font-bold uppercase text-gray-500">Headers (JSON)</label>
                <textarea
                  rows={3}
                  value={headersStr}
                  onChange={(e) =>
                    setHeadersText((prev) => ({
                      ...prev,
                      [action.actionType]: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono"
                />
              </div>

              <button
                type="button"
                disabled={saving === action.actionType}
                onClick={() => void saveAction(action.actionType)}
                className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full bg-channel-green text-white disabled:opacity-50"
              >
                {saving === action.actionType ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
