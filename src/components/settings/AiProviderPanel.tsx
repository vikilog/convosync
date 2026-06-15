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

type AiProviderMode = 'wabiz' | 'byok';
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

const PROVIDER_LABELS: Record<AiProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
  custom: 'Custom (Ollama / LiteLLM)',
};

const PROVIDER_MODELS: Record<AiProviderType, string[]> = {
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

  const [mode, setMode] = useState<AiProviderMode>('wabiz');
  const [provider, setProvider] = useState<AiProviderType>('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  const modelOptions = useMemo(() => {
    if (mode === 'wabiz' && config?.model) return [config.model];
    return PROVIDER_MODELS[provider] ?? PROVIDER_MODELS.openai;
  }, [config?.model, mode, provider]);

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
      setSuccess('AI provider settings saved.');
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
        provider?: AiProviderType;
        mode?: AiProviderMode;
      };
      if (res.ok) {
        const label =
          res.provider && res.mode === 'byok'
            ? PROVIDER_LABELS[res.provider]
            : res.mode === 'wabiz'
              ? 'WaBiz hosted (OpenAI)'
              : 'Provider';
        setSuccess(`Connection OK (${label}): ${res.message}. Save settings to apply changes.`);
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
    mode === 'wabiz' || Boolean(apiKey.trim()) || Boolean(config?.hasApiKey);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading AI provider settings…
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">AI Provider</h3>
            <p className="mt-1 text-sm text-gray-500">
              Use WaBiz-hosted OpenAI tokens from your plan, or bring your own API key (BYOK) for
              OpenAI, Claude, or a local OpenAI-compatible server.
            </p>
          </div>
        </div>

        {config?.status === 'credentials_missing' && mode === 'byok' && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Add an API key below to enable BYOK mode.
          </div>
        )}

        {config?.lastTestedAt && (
          <p className="mt-3 text-xs text-gray-400">
            Last saved config tested: {new Date(config.lastTestedAt).toLocaleString()}
          </p>
        )}
      </div>

      {!isAdmin && (
        <p className="text-sm text-gray-500">
          Only workspace admins can change AI provider settings.
        </p>
      )}

      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5"
        onSubmit={(e) => void handleSave(e)}
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
            Billing mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { id: 'wabiz' as const, title: 'WaBiz hosted', desc: 'Uses platform OpenAI key & plan quota' },
                { id: 'byok' as const, title: 'Bring your own key', desc: 'Your API key; no WaBiz token quota' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={!isAdmin}
                onClick={() => setMode(opt.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  mode === opt.id
                    ? 'border-sky-400 bg-sky-50 ring-1 ring-sky-200'
                    : 'border-slate-200 hover:border-slate-300'
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
              <label htmlFor="ai-provider" className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                Provider
              </label>
              <select
                id="ai-provider"
                disabled={!isAdmin}
                value={provider}
                onChange={(e) => {
                  const p = e.target.value as AiProviderType;
                  setProvider(p);
                  setModel(PROVIDER_MODELS[p][0] ?? 'gpt-4o-mini');
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                {(Object.keys(PROVIDER_LABELS) as AiProviderType[]).map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ai-model" className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                Model
              </label>
              <select
                id="ai-model"
                disabled={!isAdmin}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                <label htmlFor="ai-base-url" className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                  Base URL (OpenAI-compatible)
                </label>
                <input
                  id="ai-base-url"
                  type="url"
                  disabled={!isAdmin}
                  placeholder="http://localhost:11434"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Ollama: <code className="text-gray-600">http://localhost:11434</code> · LiteLLM: your proxy URL
                </p>
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
                  placeholder={config?.hasApiKey ? '••••••••  (leave blank to keep current)' : 'sk-... or sk-ant-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                OpenAI keys start with <code className="text-gray-600">sk-</code> · Anthropic keys with{' '}
                <code className="text-gray-600">sk-ant-</code>
              </p>
            </div>
          </>
        )}

        {mode === 'wabiz' && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-gray-600">
            Model: <span className="font-semibold text-gray-800">{model}</span>
            {config?.hasApiKey ? (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Platform key configured
              </span>
            ) : (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" /> Platform key not set on server
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Test connection checks the settings shown above (including an unsaved API key). Click Save
          after a successful test to use them in chat.
        </p>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {isAdmin && (
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save settings
            </button>
            <button
              type="button"
              onClick={(e) => void handleTest(e)}
              disabled={testing || !canTest}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              Test connection
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-slate-50"
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
