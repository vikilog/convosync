import React, { useCallback, useEffect, useState } from 'react';
import { Search, HelpCircle, FileText, Link2, Paperclip, Trash2 } from 'lucide-react';
import type { KnowledgeItem, KnowledgeStatus, KnowledgeType } from '../types';
import { api } from '../../../lib/api';
import { AddKnowledgeModal } from './AddKnowledgeModal';

type Props = {
  agentId: string;
};

const TYPE_ICONS: Record<KnowledgeType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  online_data: <Link2 className="w-4 h-4" />,
  qna: <HelpCircle className="w-4 h-4" />,
  attachment: <Paperclip className="w-4 h-4" />,
};

const TYPE_LABELS: Record<KnowledgeType, string> = {
  document: 'Document',
  online_data: 'Online data',
  qna: 'Q&A',
  attachment: 'Attachment',
};

const STATUS_STYLES: Record<KnowledgeStatus, string> = {
  ready: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

function mapItem(raw: Record<string, unknown>): KnowledgeItem {
  const typeRaw = String(raw.type ?? 'document');
  const type: KnowledgeType =
    typeRaw === 'online_data' || typeRaw === 'qna' || typeRaw === 'attachment'
      ? typeRaw
      : 'document';
  const statusRaw = String(raw.status ?? 'processing');
  return {
    id: String(raw.id),
    agentId: String(raw.agentId),
    type,
    title: String(raw.title),
    content: raw.content ? String(raw.content) : null,
    url: raw.url ? String(raw.url) : null,
    fileUrl: raw.fileUrl ? String(raw.fileUrl) : null,
    status:
      statusRaw === 'ready' || statusRaw === 'failed' ? statusRaw : 'processing',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export const KnowledgeBase: React.FC<Props> = ({ agentId }) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  // ponytail: temp Pinecone upsert button — remove after backfill
  const [reindexing, setReindexing] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await api.getAgentKnowledge(agentId);
      setItems((raw as Record<string, unknown>[]).map(mapItem));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleAdd = async (data: {
    type: KnowledgeType;
    title: string;
    content?: string;
    url?: string;
    metadata?: Record<string, unknown>;
  }) => {
    setSubmitting(true);
    try {
      const created = await api.createAgentKnowledge(agentId, data);
      const item = mapItem(created as Record<string, unknown>);
      setItems((prev) => [item, ...prev]);
      setShowAdd(false);
      setToast('Knowledge item added successfully');
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemAdded = (item: KnowledgeItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [item, ...prev];
    });
    setToast('Online data added successfully');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteAgentKnowledge(agentId, deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // ponytail: temp Pinecone upsert button — remove after backfill
  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = (await api.reindexAgentKnowledge(agentId)) as { queued?: number };
      setToast(`Pinecone upsert queued for ${res.queued ?? 0} item(s) — check backend logs`);
    } catch {
      setToast('Reindex failed — check backend / Pinecone config');
    } finally {
      setReindexing(false);
    }
  };

  const filtered = items.filter((i) =>
    i.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1E1B2E] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">Knowledge</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Enable the AI to learn knowledge, automatically answer common questions…
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* ponytail: temp Pinecone upsert button — remove after backfill */}
          <button
            type="button"
            disabled={reindexing || items.length === 0}
            onClick={() => void handleReindex()}
            className="px-4 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-900 rounded-xl text-sm font-bold"
          >
            {reindexing ? 'Upserting…' : 'Upsert to Pinecone'}
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#1E1B2E] hover:bg-black text-white rounded-xl text-sm font-bold"
          >
            + Add knowledge
          </button>
        </div>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search knowledge"
          className="w-full pl-10 pr-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
        />
      </div>

      <p className="text-sm text-[#6B7280] mb-6">
        {filtered.length} Item{filtered.length !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <p className="text-sm text-[#6B7280] text-center py-12">Loading knowledge…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F3F0FF] flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8 text-sky-600" />
          </div>
          <p className="text-sm font-medium text-[#6B7280]">No data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 bg-white border border-[#E5E7EB] rounded-xl p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[#F3F0FF] text-sky-600 shrink-0">
                  {TYPE_ICONS[item.type]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-[#111827] truncate">{item.title}</p>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {TYPE_LABELS[item.type]} · Added{' '}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddKnowledgeModal
          agentId={agentId}
          onClose={() => setShowAdd(false)}
          onSubmit={(data) => void handleAdd(data)}
          onItemAdded={handleItemAdded}
          submitting={submitting}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-[#E5E7EB] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#111827] mb-2">Delete knowledge item?</h3>
            <p className="text-sm text-[#6B7280] mb-6">
              &ldquo;{deleteTarget.title}&rdquo; will be permanently removed from this agent.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-bold text-[#6B7280] hover:text-[#111827]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
