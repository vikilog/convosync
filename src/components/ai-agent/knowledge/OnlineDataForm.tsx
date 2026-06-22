import React, { useState } from 'react';
import { CheckCircle2, Link2, Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';
import type { KnowledgeItem } from '../types';

type FetchResult = {
  title: string;
  wordCount: number;
  preview: string;
  item: Record<string, unknown>;
};

type Props = {
  agentId: string;
  onSaved?: (item: KnowledgeItem) => void;
};

function normalizeUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function mapFetchError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (message.includes('timeout') || message.includes('too long')) {
    return 'Website took too long to respond';
  }
  if (message.includes('blocks automated') || message.includes('403')) {
    return 'This website blocks automated access';
  }
  if (message.includes('valid URL') || message.includes('Invalid')) {
    return 'Please enter a valid URL';
  }
  if (message.includes('file') || message.includes('Document upload')) {
    return 'This URL contains a file. Please use Document upload instead.';
  }
  if (message.includes('recently') || message.includes('hour')) {
    return message;
  }
  return message || 'Could not fetch this URL. Please check if the URL is publicly accessible.';
}

export const OnlineDataForm: React.FC<Props> = ({ agentId, onSaved }) => {
  const [url, setUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState('weekly');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFetch = async () => {
    const normalized = normalizeUrlInput(url);
    if (!normalized || !isValidUrl(normalized)) {
      setError('Please enter a valid URL');
      return;
    }

    setFetching(true);
    setError(null);
    setResult(null);

    try {
      const res = (await api.fetchAgentKnowledgeUrl(agentId, {
        url: normalized,
        refreshInterval,
      })) as FetchResult;
      setUrl(normalized);
      setResult(res);
    } catch (err) {
      setError(mapFetchError(err));
    } finally {
      setFetching(false);
    }
  };

  const handleSave = () => {
    if (!result?.item) return;
    setSaving(true);
    const raw = result.item;
    const item: KnowledgeItem = {
      id: String(raw.id),
      agentId: String(raw.agentId),
      type: 'online_data',
      title: String(raw.title),
      content: raw.content ? String(raw.content) : null,
      url: raw.url ? String(raw.url) : null,
      fileUrl: null,
      status: 'ready',
      createdAt: String(raw.createdAt ?? new Date().toISOString()),
    };
    onSaved?.(item);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1.5">Page URL</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              disabled={fetching}
              placeholder="https://example.com/pricing"
              className="w-full pl-10 pr-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none disabled:opacity-60"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleFetch()}
            disabled={fetching || !url.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111827] hover:bg-[#F8FAFC] disabled:opacity-60"
          >
            {fetching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching...
              </>
            ) : (
              'Fetch'
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1.5">Refresh interval</label>
        <select
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(e.target.value)}
          disabled={fetching}
          className="w-full border border-[#E5E7EB] rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none disabled:opacity-60"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Content fetched successfully!
          </div>
          <div className="text-sm text-[#111827] space-y-1">
            <p>
              <span className="font-semibold">Title:</span> {result.title}
            </p>
            <p>
              <span className="font-semibold">Words extracted:</span> {result.wordCount}
            </p>
            <p className="text-[#6B7280]">
              <span className="font-semibold text-[#111827]">Preview:</span>{' '}
              {result.preview.substring(0, 150)}
              {result.preview.length > 150 ? '…' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold"
          >
            {saving ? 'Saving…' : 'Save to Knowledge Base'}
          </button>
        </div>
      )}
    </div>
  );
};
