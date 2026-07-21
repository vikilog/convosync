/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Plug,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api, formatCatchError, getUserRole } from '../../lib/api';

type AiProviderMode = 'convosync' | 'byok';
type AiProviderType = 'openai' | 'anthropic' | 'custom';

type AiProviderConfig = {
  mode: AiProviderMode;
  provider: AiProviderType;
  model: string;
  baseUrl: string | null;
  hasApiKey: boolean;
  status: string;
  lastTestedAt: string | null;
  availableModels: string[];
};

const PLATFORM_LABELS: Record<AiProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  custom: 'Custom endpoint',
};

const PLATFORM_MODELS: Record<AiProviderType, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest', 'claude-3-opus-latest'],
  custom: ['llama3.2', 'mistral', 'qwen2.5', 'gpt-4o-mini'],
};

function buildTestPayload(
  mode: AiProviderMode,
  provider: AiProviderType,
  model: string,
  apiKey: string,
  baseUrl: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = { mode, provider, model };
  if (mode === 'byok' && apiKey.trim()) payload.apiKey = apiKey.trim();
  if (provider === 'custom') payload.baseUrl = baseUrl.trim() || null;
  return payload;
}

export function AiProviderPanel() {
  const isAdmin = getUserRole() === 'admin';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [config, setConfig] = useState<AiProviderConfig | null>(null);

  const [mode, setMode] = useState<AiProviderMode>('convosync');
  const [provider, setProvider] = useState<AiProviderType>('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  const modelOptions = useMemo(() => {
    const base = config?.availableModels?.length
      ? config.availableModels
      : PLATFORM_MODELS[provider] ?? PLATFORM_MODELS.openai;
    if (model && !base.includes(model)) return [model, ...base];
    return base;
  }, [config?.availableModels, model, provider]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const res = (await api.getAiProviderConfig()) as { config: AiProviderConfig };
      const c = res.config;
      setConfig(c);
      setMode(c.mode);
      setProvider(c.provider);
      setModel(c.model);
      setBaseUrl(c.baseUrl ?? '');
      if (!options?.silent) setApiKey('');
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: Record<string, unknown> = { mode, provider, model };
      if (mode === 'byok' && apiKey.trim()) payload.apiKey = apiKey.trim();
      if (provider === 'custom') payload.baseUrl = baseUrl.trim() || null;

      const res = (await api.updateAiProviderConfig(payload)) as { config: AiProviderConfig };
      setConfig(res.config);
      setApiKey('');
      setSuccess('AI settings saved.');
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();
    if (!isAdmin) return;
    setTesting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildTestPayload(mode, provider, model, apiKey, baseUrl);
      const res = (await api.testAiProviderConnection(payload)) as {
        ok: boolean;
        message: string;
      };
      if (res.ok) {
        setSuccess('Connection successful. Save settings to apply changes.');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setTesting(false);
    }
  };

  const canTest =
    mode === 'convosync' || Boolean(apiKey.trim()) || Boolean(config?.hasApiKey);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading AI settings…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="rounded-2xl border border-black/5 bg-surface p-5 shadow-sm text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">AI</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose managed AI included with your workspace, or connect your own API key for agents,
              copilot, and automations.
            </p>
          </div>
        </div>

        {config?.status === 'credentials_missing' && mode === 'byok' && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Add an API key below to enable your own key.
          </div>
        )}
      </div>

      {!isAdmin && (
        <p className="text-sm text-gray-500">
          Only workspace admins can change AI settings.
        </p>
      )}

      <form
        className="rounded-2xl border border-black/5 bg-surface p-5 shadow-sm space-y-5"
        onSubmit={(e) => void handleSave(e)}
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
            How to run AI
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                {
                  id: 'convosync' as const,
                  title: 'Managed AI',
                  desc: 'Included with your plan — no setup required',
                },
                {
                  id: 'byok' as const,
                  title: 'Your API key',
                  desc: 'Bring your own key for direct billing with your provider',
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={!isAdmin}
                onClick={() => setMode(opt.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  mode === opt.id
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                    : 'border-black/5 hover:border-black/10'
                } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <p className="font-semibold text-gray-900">{opt.title}</p>
                <p className="mt-1 text-xs text-gray-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {mode === 'byok' && (
          <>
            <div>
              <label
                htmlFor="ai-platform"
                className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1"
              >
                Platform
              </label>
              <select
                id="ai-platform"
                disabled={!isAdmin}
                value={provider}
                onChange={(e) => {
                  const next = e.target.value as AiProviderType;
                  setProvider(next);
                  setModel(PLATFORM_MODELS[next][0] ?? 'gpt-4o-mini');
                }}
                className="w-full rounded-xl border border-black/5 px-3 py-2.5 text-sm"
              >
                {(Object.keys(PLATFORM_LABELS) as AiProviderType[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ai-model"
                className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1"
              >
                Model
              </label>
              <select
                id="ai-model"
                disabled={!isAdmin}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl border border-black/5 px-3 py-2.5 text-sm"
              >
                {modelOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {provider === 'custom' && (
              <div>
                <label
                  htmlFor="ai-base-url"
                  className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1"
                >
                  API base URL
                </label>
                <input
                  id="ai-base-url"
                  type="url"
                  disabled={!isAdmin}
                  placeholder="https://your-api.example.com/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full rounded-xl border border-black/5 px-3 py-2.5 text-sm"
                />
              </div>
            )}

            <div>
              <label htmlFor="ai-api-key" className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                API key
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="ai-api-key"
                  type="password"
                  disabled={!isAdmin}
                  placeholder={config?.hasApiKey ? 'Leave blank to keep current key' : 'Paste your API key'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full rounded-xl border border-black/5 py-2.5 pl-10 pr-3 text-sm"
                />
              </div>
            </div>
          </>
        )}

        {mode === 'convosync' && (
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            Managed AI is ready to use for agents, inbox copilot, and journeys.
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {isAdmin && (
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save settings
            </button>
            <button
              type="button"
              onClick={(e) => void handleTest(e)}
              disabled={testing || !canTest}
              className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-surface px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-surface-muted disabled:opacity-60"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              Test connection
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-surface px-4 py-2.5 text-sm text-gray-600 hover:bg-surface-muted"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
