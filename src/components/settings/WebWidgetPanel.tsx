/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { resolveApiBaseUrl } from '../../lib/publicUrls';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

type WidgetConfig = {
  token: string;
  enabled: boolean;
  botName: string;
  greeting: string;
  accentColor: string;
  agentId: string | null;
};

type AgentOption = {
  id: string;
  name: string;
  category: string;
  isPublished: boolean;
  isEnabled: boolean;
};

export function WebWidgetPanel() {
  const [widget, setWidget] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [botName, setBotName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [accentColor, setAccentColor] = useState('#16a34a');
  const [agentId, setAgentId] = useState('');
  const [agents, setAgents] = useState<AgentOption[]>([]);

  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [widgetRes, agentsRes] = await Promise.all([
        api.getWebWidget() as Promise<{ item: WidgetConfig }>,
        api.getAgents() as Promise<AgentOption[]>,
      ]);
      setWidget(widgetRes.item);
      setEnabled(widgetRes.item.enabled);
      setBotName(widgetRes.item.botName);
      setGreeting(widgetRes.item.greeting);
      setAccentColor(widgetRes.item.accentColor);
      setAgentId(widgetRes.item.agentId ?? '');
      setAgents((agentsRes ?? []).filter((a) => a.category === 'ai_agent'));
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = (await api.updateWebWidget({
        enabled,
        botName: botName.trim() || 'Assistant',
        greeting: greeting.trim() || 'Hi! How can I help you today?',
        accentColor,
        agentId: agentId || null,
      })) as { item: WidgetConfig };
      setWidget(res.item);
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate the token? The old embed snippet will stop working immediately.')) {
      return;
    }
    setRegenerating(true);
    setError(null);
    try {
      const res = (await api.regenerateWebWidgetToken()) as { item: WidgetConfig };
      setWidget(res.item);
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-swiss-faint">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const snippet = widget
    ? `<script src="${resolveApiBaseUrl()}/widget.js" data-token="${widget.token}" defer></script>`
    : '';

  const copySnippet = () => {
    void navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="max-w-2xl space-y-5">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="p-4 bg-white border border-swiss-line space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-950">Embed on your website</h3>
          <p className="mt-1 text-xs text-slate-500">
            Paste this snippet before the closing <code>&lt;/body&gt;</code> tag on any page. It
            works on any domain — the token in the URL is what authorizes it.
          </p>
        </div>
        <div className="relative">
          <pre className="rounded-lg bg-neutral-900 text-neutral-100 text-xs p-3 pr-12 overflow-x-auto">
            <code>{snippet}</code>
          </pre>
          <button
            type="button"
            onClick={copySnippet}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 text-neutral-200 hover:bg-white/20"
            aria-label="Copy embed snippet"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          type="button"
          disabled={regenerating}
          onClick={() => void handleRegenerate()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {regenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Regenerate token
        </button>
      </div>

      <div className="p-4 bg-white border border-swiss-line space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-950">AI Agent</h3>
          <p className="mt-1 text-xs text-slate-500">
            The widget answers using this agent's skills and knowledge base — the same one used
            for WhatsApp/inbox AI Copilot. It must be published and enabled.
          </p>
        </div>
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-full rounded-lg border border-swiss-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-swiss-accent/20"
        >
          <option value="">— none selected —</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id} disabled={!a.isPublished || !a.isEnabled}>
              {a.name}
              {!a.isPublished || !a.isEnabled ? ' (not published)' : ''}
            </option>
          ))}
        </select>
        {agents.length === 0 ? (
          <p className="text-xs text-amber-600">
            No AI agents yet — create and publish one under AI Agent first.
          </p>
        ) : null}
      </div>

      <div className="p-4 bg-white border border-swiss-line space-y-4">
        <h3 className="text-sm font-semibold text-gray-950">Appearance</h3>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-swiss-ink">Widget enabled</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-swiss-accent"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-bold text-swiss-muted uppercase tracking-wide">Bot name</span>
          <Input
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            maxLength={60}
            className="h-auto w-full rounded-lg border border-swiss-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-swiss-accent/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-bold text-swiss-muted uppercase tracking-wide">
            Greeting message
          </span>
          <Textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            maxLength={300}
            rows={2}
            className="min-h-0 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-swiss-accent/20"
          />
        </label>

        <label className="flex items-center gap-3">
          <span className="text-xs font-bold text-swiss-muted uppercase tracking-wide">
            Accent color
          </span>
          <Input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-auto h-8 w-12 rounded cursor-pointer border border-swiss-line"
          />
          <span className="text-xs text-slate-500">{accentColor}</span>
        </label>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-lg bg-swiss-accent px-4 py-2 text-sm font-semibold text-white hover:bg-swiss-accent-hover disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
