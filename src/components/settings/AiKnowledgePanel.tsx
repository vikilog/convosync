/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { api, parseApiError } from '../../lib/api';

type SyncStatus = 'pending' | 'syncing' | 'success' | 'failed';

type SyncProgress = {
  step: number;
  totalSteps: number;
  message: string;
};

type KnowledgeConfig = {
  venueId: string | null;
  connectionStringMasked: string | null;
  hasConnectionString: boolean;
  updatedAt: string | null;
};

type KnowledgeRecord = {
  venueId: string;
  status: SyncStatus;
  syncedAt: string | null;
  errorMessage: string | null;
  syncProgress: SyncProgress | null;
  data: Record<string, unknown>;
};

const STATUS_LABELS: Record<SyncStatus, string> = {
  pending: 'Not synced',
  syncing: 'Syncing…',
  success: 'Synced',
  failed: 'Failed',
};

const STATUS_STYLES: Record<SyncStatus, string> = {
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  syncing: 'bg-sky-50 text-primary border-primary/20',
  success: 'bg-[#e6f7ec] text-accent-green border-[#5dfd8a]/40',
  failed: 'bg-red-50 text-danger-red border-red-200',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

type CollectionItem = {
  name: string;
  synced: boolean;
  documentsFound: number | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function countPreviewItems(data: Record<string, unknown>): string {
  const parts: string[] = [];
  const salon = data.salon as Record<string, unknown> | undefined;
  const workingHours = salon?.workingHours;
  if (Array.isArray(workingHours) && workingHours.length > 0) {
    parts.push(`${workingHours.length} working days`);
  } else if (
    workingHours &&
    typeof workingHours === 'object' &&
    Object.keys(workingHours as object).length > 0
  ) {
    parts.push('working hours set');
  }

  for (const key of [
    'services',
    'staff',
    'customersSummary',
    'memberships',
    'vouchers',
    'products',
    'faqs',
    'policies',
    'branches',
    'serviceCategories',
  ]) {
    const arr = data[key];
    if (Array.isArray(arr) && arr.length > 0) {
      parts.push(`${arr.length} ${key}`);
    }
  }
  return parts.length ? parts.join(' · ') : 'No records found';
}

export function AiKnowledgePanel() {
  const [connectionString, setConnectionString] = useState('');
  const [venueId, setVenueId] = useState('');
  const [showConnection, setShowConnection] = useState(false);
  const [config, setConfig] = useState<KnowledgeConfig | null>(null);
  const [record, setRecord] = useState<KnowledgeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingCollection, setSyncingCollection] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [syncAllProgress, setSyncAllProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRecord = useCallback(async (id: string) => {
    try {
      const data = (await api.getAiKnowledge(id)) as KnowledgeRecord;
      setRecord(data);
      return data;
    } catch {
      setRecord(null);
      return null;
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cfg = (await api.getAiKnowledgeConfig()) as KnowledgeConfig;
      setConfig(cfg);
      if (cfg.venueId) {
        setVenueId(cfg.venueId);
        await loadRecord(cfg.venueId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [loadRecord]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const requireCredentials = () => {
    if (!connectionString.trim() || !venueId.trim()) {
      setError('Connection string and Venue ID are both required.');
      return false;
    }
    return true;
  };

  const handleLoadCollections = async () => {
    if (!requireCredentials()) return;
    setLoadingCollections(true);
    setError(null);
    try {
      const result = (await api.listAiKnowledgeCollections({
        connectionString: connectionString.trim(),
        venueId: venueId.trim(),
      })) as { collections: CollectionItem[] };
      setCollections(result.collections);
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleSyncCollection = async (collectionName: string) => {
    if (!requireCredentials()) return;
    setSyncingCollection(collectionName);
    setError(null);
    try {
      const result = (await api.syncAiKnowledgeCollection({
        connectionString: connectionString.trim(),
        venueId: venueId.trim(),
        collectionName,
      })) as {
        documentsFound: number;
        data: Record<string, unknown>;
        syncedCollections: string[];
      };

      setCollections((prev) =>
        prev.map((c) =>
          c.name === collectionName
            ? { ...c, synced: true, documentsFound: result.documentsFound }
            : c
        )
      );

      setRecord({
        venueId: venueId.trim(),
        status: 'success',
        syncedAt: new Date().toISOString(),
        errorMessage: null,
        syncProgress: null,
        data: result.data ?? {},
      });

      setConfig((c) => ({
        venueId: venueId.trim(),
        connectionStringMasked: c?.connectionStringMasked ?? 'mongodb://****',
        hasConnectionString: true,
        updatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setSyncingCollection(null);
    }
  };

  const handleSyncAll = async () => {
    if (!requireCredentials()) return;

    setSyncingAll(true);
    setError(null);

    let list = collections;
    if (list.length === 0) {
      setLoadingCollections(true);
      try {
        const result = (await api.listAiKnowledgeCollections({
          connectionString: connectionString.trim(),
          venueId: venueId.trim(),
        })) as { collections: CollectionItem[] };
        list = result.collections;
        setCollections(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : parseApiError(String(e)));
        setSyncingAll(false);
        setLoadingCollections(false);
        return;
      } finally {
        setLoadingCollections(false);
      }
    }

    if (list.length === 0) {
      setError('No collections found in this database.');
      setSyncingAll(false);
      return;
    }

    const total = list.length;

    try {
      for (let i = 0; i < list.length; i++) {
        const col = list[i];
        setSyncAllProgress({ current: i + 1, total, name: col.name });
        setSyncingCollection(col.name);

        const result = (await api.syncAiKnowledgeCollection({
          connectionString: connectionString.trim(),
          venueId: venueId.trim(),
          collectionName: col.name,
        })) as { documentsFound: number; data: Record<string, unknown> };

        setCollections((prev) =>
          prev.map((c) =>
            c.name === col.name
              ? { ...c, synced: true, documentsFound: result.documentsFound }
              : c
          )
        );

        setRecord({
          venueId: venueId.trim(),
          status: 'success',
          syncedAt: new Date().toISOString(),
          errorMessage: null,
          syncProgress: null,
          data: result.data ?? {},
        });

        await sleep(300);
      }

      setConfig((c) => ({
        venueId: venueId.trim(),
        connectionStringMasked: c?.connectionStringMasked ?? 'mongodb://****',
        hasConnectionString: true,
        updatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setSyncingAll(false);
      setSyncingCollection(null);
      setSyncAllProgress(null);
      void loadRecord(venueId.trim());
    }
  };

  const syncing = syncingAll || syncingCollection !== null;
  const status: SyncStatus = syncing ? 'syncing' : record?.status ?? 'pending';

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading AI Knowledge settings…
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-sky-50 text-primary">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">External salon database</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Sync one MongoDB collection at a time — no timeout, full control. Start with{' '}
              <span className="font-mono font-semibold">Venue</span>, then Service, Client, etc.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-meta font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              MongoDB connection string
            </label>
            <div className="relative">
              <input
                type={showConnection ? 'text' : 'password'}
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                placeholder="mongodb+srv://user:pass@cluster/db"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowConnection((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary"
                aria-label={showConnection ? 'Hide connection string' : 'Show connection string'}
              >
                {showConnection ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config?.hasConnectionString && config.connectionStringMasked && (
              <p className="text-xs text-gray-400 mt-1 font-mono">
                Saved: {config.connectionStringMasked}
              </p>
            )}
          </div>

          <div>
            <label className="block text-meta font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Venue ID
            </label>
            <input
              type="text"
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              placeholder="Salon / venue / branch ObjectId"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-danger-red">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleLoadCollections()}
              disabled={loadingCollections || syncing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-gray-800 text-sm font-bold px-4 py-2.5 transition-colors"
            >
              {loadingCollections ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              {loadingCollections ? 'Loading…' : 'Load collections'}
            </button>

            <button
              type="button"
              onClick={() => void handleSyncAll()}
              disabled={syncing || loadingCollections}
              className="inline-flex items-center gap-2 rounded-xl bg-channel-green hover:bg-[#20bd5a] disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 transition-colors"
            >
              {syncingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {syncingAll ? 'Syncing all…' : 'Sync all (one by one)'}
            </button>
          </div>
        </div>
      </div>

      {collections.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-meta font-bold text-gray-400 uppercase tracking-wide">
              Collections ({collections.filter((c) => c.synced).length}/{collections.length} synced)
            </p>
            {syncAllProgress && (
              <p className="text-sm font-semibold text-primary">
                {syncAllProgress.current}/{syncAllProgress.total} — {syncAllProgress.name}
              </p>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-200">
            {collections.map((col) => {
              const isActive = syncingCollection === col.name;
              return (
                <div
                  key={col.name}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-semibold text-gray-900 truncate">{col.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {col.synced
                        ? col.documentsFound != null
                          ? `${col.documentsFound} document(s) synced`
                          : 'Synced'
                        : 'Not synced yet'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {col.synced && (
                      <CheckCircle2 className="w-4 h-4 text-accent-green" aria-hidden />
                    )}
                    <button
                      type="button"
                      onClick={() => void handleSyncCollection(col.name)}
                      disabled={syncing}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-channel-green hover:text-white disabled:opacity-50 text-emerald-800 text-sm font-bold px-2.5 py-1.5 transition-colors"
                    >
                      {isActive ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      Sync
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-meta font-bold text-gray-400 uppercase tracking-wide">Status</p>
            <span
              className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg border text-meta font-bold ${STATUS_STYLES[status]}`}
            >
              {status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {status === 'syncing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {status === 'failed' && <AlertCircle className="w-3.5 h-3.5" />}
              {STATUS_LABELS[status]}
            </span>
          </div>
          <div className="text-right">
            <p className="text-meta font-bold text-gray-400 uppercase tracking-wide">Last sync</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">
              {formatDate(record?.syncedAt ?? config?.updatedAt ?? null)}
            </p>
          </div>
        </div>

        {(syncing || syncAllProgress) && (
          <div>
            <div className="flex justify-between text-sm font-semibold text-gray-500 mb-1">
              <span>
                {syncAllProgress
                  ? `Syncing ${syncAllProgress.name}…`
                  : syncingCollection
                    ? `Syncing ${syncingCollection}…`
                    : 'Syncing…'}
              </span>
              {syncAllProgress && (
                <span>
                  {Math.round((syncAllProgress.current / syncAllProgress.total) * 100)}%
                </span>
              )}
            </div>
            {syncAllProgress && (
              <div className="h-2 rounded-full bg-sky-50 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${Math.round((syncAllProgress.current / syncAllProgress.total) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {record?.errorMessage && status === 'failed' && (
          <p className="text-xs text-danger-red">{record.errorMessage}</p>
        )}
      </div>

      {record?.data && Object.keys(record.data).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-meta font-bold text-gray-400 uppercase tracking-wide">
                Preview data
              </p>
              <p className="text-xs text-gray-500 mt-1">{countPreviewItems(record.data)}</p>
            </div>
          </div>
          <pre className="max-h-96 overflow-auto rounded-xl bg-[#0f0f1a] text-slate-300 p-4 text-meta font-mono leading-relaxed">
            {JSON.stringify(record.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
