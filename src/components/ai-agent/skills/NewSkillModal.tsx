import React, { useEffect, useState } from 'react';
import { X, Search, Plus, Trash2 } from 'lucide-react';
import type { KnowledgeItem } from '../types';
import { api } from '../../../lib/api';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

export type SkillDraft = {
  title: string;
  trigger: string;
  instructions: string;
  description?: string | null;
  knowledgeItemIds?: string[];
  status?: 'draft' | 'live';
};

type Props = {
  agentId: string;
  onClose: () => void;
  onCreate: (draft: SkillDraft) => void | Promise<void>;
  onBulkCreate?: (drafts: SkillDraft[]) => void | Promise<void>;
  creating?: boolean;
  mode?: 'single' | 'bulk';
};

const SUGGESTED_SKILLS: SkillDraft[] = [
  {
    title: 'Send media',
    trigger:
      'User asks for a brochure, catalog, menu, price list, PDF, image, photo, flyer, document, sample, download, or says file bhejo / send me the …',
    instructions: `When the user wants a file, image, brochure, catalog, menu, price list, or document — or when related media may help:
1. Answer the question briefly first.
2. Pricing / explicit "bhejo/send" requests: the system may attach the file automatically — keep text short.
3. Feature/product questions with related media: the system may ask "Bhej doon?" — do not invent files or fake links.
4. If nothing relevant is available, do not invent a file; offer human help if needed.
5. Reply in the user's language (English or Hinglish).`,
  },
  {
    title: 'Order tracking',
    trigger: 'User asks where their order is, tracking status, delivery ETA, or shipment update.',
    instructions:
      'Ask for the order ID if missing. Share tracking status from knowledge/CRM only. Never invent a tracking number or ETA.',
  },
  {
    title: 'Refund request',
    trigger: 'User wants a refund, return, chargeback, or money back.',
    instructions:
      'Collect order ID and reason. Explain the refund policy from knowledge only. Escalate billing disputes or angry customers.',
  },
  {
    title: 'Product inquiry',
    trigger: 'User asks about a product, features, availability, or how something works.',
    instructions:
      'Answer from knowledge base only. Keep replies short. Offer Send media when a brochure/catalog would help.',
  },
  {
    title: 'Appointment booking',
    trigger: 'User wants to book, reschedule, or cancel an appointment or demo call.',
    instructions:
      'Collect name, preferred time, and use-case. Confirm next steps. Escalate if calendar is unavailable.',
  },
  {
    title: 'FAQ handling',
    trigger: 'User asks a common FAQ covered in the knowledge base.',
    instructions:
      'Answer briefly from knowledge. If not covered, say so and offer human handoff — do not invent facts.',
  },
];

const emptyRow = (): SkillDraft => ({
  title: '',
  trigger: '',
  instructions: '',
  description: '',
  knowledgeItemIds: [],
});

function KnowledgeMultiSelect({
  items,
  selected,
  onChange,
  disabled,
}: {
  items: KnowledgeItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-[#6B7280]">No knowledge items yet.</p>;
  }
  return (
    <div className="max-h-36 overflow-y-auto border border-swiss-line rounded-xl divide-y divide-swiss-line">
      {items.map((item) => {
        const checked = selected.includes(item.id);
        return (
          <label
            key={item.id}
            className="flex items-start gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-surface-muted"
          >
            <input
              type="checkbox"
              className="mt-0.5"
              disabled={disabled}
              checked={checked}
              onChange={() =>
                onChange(
                  checked ? selected.filter((id) => id !== item.id) : [...selected, item.id]
                )
              }
            />
            <span className="min-w-0">
              <span className="block font-medium text-[#111827] truncate">{item.title}</span>
              <span className="block text-xs text-[#6B7280] capitalize">{item.type}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export const NewSkillModal: React.FC<Props> = ({
  agentId,
  onClose,
  onCreate,
  onBulkCreate,
  creating,
  mode: initialMode = 'single',
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>(initialMode);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [knowledgeItemIds, setKnowledgeItemIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<SkillDraft | null>(null);
  const [kbItems, setKbItems] = useState<KnowledgeItem[]>([]);
  const [rows, setRows] = useState<SkillDraft[]>([emptyRow(), emptyRow()]);
  const [jsonPaste, setJsonPaste] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    void api
      .getAgentKnowledge(agentId)
      .then((raw) => {
        const list = (raw as Record<string, unknown>[]).map((r) => ({
          id: String(r.id),
          agentId: String(r.agentId),
          type: (r.type as KnowledgeItem['type']) || 'document',
          title: String(r.title),
          content: (r.content as string | null) ?? null,
          url: (r.url as string | null) ?? null,
          fileUrl: (r.fileUrl as string | null) ?? null,
          status: (r.status as KnowledgeItem['status']) || 'ready',
          createdAt: String(r.createdAt ?? ''),
        }));
        setKbItems(list);
      })
      .catch(() => setKbItems([]));
  }, [agentId]);

  const filtered = SUGGESTED_SKILLS.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    const name = title.trim() || search.trim();
    if (!name) return;
    if (selected && selected.title === name) {
      void onCreate({
        ...selected,
        description: description.trim() || selected.description || null,
        knowledgeItemIds,
      });
      return;
    }
    void onCreate({
      title: name,
      trigger: '',
      instructions: '',
      description: description.trim() || null,
      knowledgeItemIds,
    });
  };

  const applyJsonPaste = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonPaste) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { skills?: unknown }).skills)
          ? (parsed as { skills: unknown[] }).skills
          : null;
      if (!list) {
        setJsonError('JSON must be an array or { "skills": [...] }');
        return;
      }
      const mapped: SkillDraft[] = list.map((row, i) => {
        if (!row || typeof row !== 'object') throw new Error(`Row ${i}: expected object`);
        const r = row as Record<string, unknown>;
        const t = String(r.title ?? '').trim();
        if (!t) throw new Error(`Row ${i}: title required`);
        return {
          title: t,
          trigger: String(r.trigger ?? ''),
          instructions: String(r.instructions ?? ''),
          description: r.description == null ? null : String(r.description).slice(0, 500),
          knowledgeItemIds: Array.isArray(r.knowledgeItemIds)
            ? r.knowledgeItemIds.map(String)
            : [],
          status: r.status === 'live' ? 'live' : 'draft',
        };
      });
      setRows(mapped.length > 0 ? mapped : [emptyRow()]);
      setJsonPaste('');
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleBulk = () => {
    const drafts = rows
      .map((r) => ({
        ...r,
        title: r.title.trim(),
        description: r.description?.trim() || null,
        knowledgeItemIds: r.knowledgeItemIds ?? [],
      }))
      .filter((r) => r.title);
    if (drafts.length === 0 || !onBulkCreate) return;
    void onBulkCreate(drafts);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-swiss-line shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-swiss-line shrink-0">
          <h3 className="text-base font-bold text-[#111827]">
            {mode === 'bulk' ? 'Bulk add skills' : 'New Skill'}
          </h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 px-6 pt-4 shrink-0">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              mode === 'single' ? 'bg-swiss-accent/15 text-swiss-accent' : 'text-[#6B7280] hover:bg-surface-muted'
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              mode === 'bulk' ? 'bg-swiss-accent/15 text-swiss-accent' : 'text-[#6B7280] hover:bg-surface-muted'
            }`}
          >
            Bulk
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {mode === 'single' ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skills or enter a name"
                  className="h-auto w-full pl-10 pr-3 py-2.5 border border-swiss-line rounded-xl text-sm focus:ring-2 focus:ring-swiss-accent/20 focus:border-swiss-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">Name</label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSelected(null);
                  }}
                  placeholder="Enter name here"
                  className="h-auto w-full border border-swiss-line rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-swiss-accent/20 focus:border-swiss-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">
                  Description <span className="text-[#6B7280] font-normal">(optional)</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  rows={2}
                  placeholder="Short blurb for the skills list"
                  className="min-h-0 w-full border border-swiss-line rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-swiss-accent/20 focus:border-swiss-accent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">
                  Linked knowledge <span className="text-[#6B7280] font-normal">(optional)</span>
                </label>
                <KnowledgeMultiSelect
                  items={kbItems}
                  selected={knowledgeItemIds}
                  onChange={setKnowledgeItemIds}
                  disabled={creating}
                />
              </div>

              {filtered.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wide">
                    Suggestions
                  </p>
                  {filtered.map((s) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => {
                        setTitle(s.title);
                        setSelected(s);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selected?.title === s.title
                          ? 'bg-swiss-accent/15 text-[#111827] font-medium'
                          : 'text-[#111827] hover:bg-swiss-accent/10'
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                disabled={creating || (!title.trim() && !search.trim())}
                onClick={handleCreate}
                className="w-full py-2.5 bg-swiss-accent hover:bg-swiss-accent-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold"
              >
                {creating ? 'Creating…' : 'Create Skill'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">
                  Paste JSON <span className="text-[#6B7280] font-normal">(optional)</span>
                </label>
                <Textarea
                  value={jsonPaste}
                  onChange={(e) => setJsonPaste(e.target.value)}
                  rows={3}
                  placeholder='[{"title":"…","trigger":"","instructions":"","description":"","knowledgeItemIds":[]}]'
                  className="min-h-0 w-full border border-swiss-line rounded-xl py-2.5 px-3 text-xs font-mono focus:ring-2 focus:ring-swiss-accent/20 focus:border-swiss-accent outline-none resize-none"
                />
                {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
                <button
                  type="button"
                  onClick={applyJsonPaste}
                  disabled={!jsonPaste.trim()}
                  className="mt-2 text-sm font-medium text-swiss-accent hover:underline disabled:opacity-50"
                >
                  Apply JSON to rows
                </button>
              </div>

              <div className="space-y-3">
                {rows.map((row, idx) => (
                  <div key={idx} className="border border-swiss-line rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#6B7280]">Row {idx + 1}</span>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRows((r) => r.filter((_, i) => i !== idx))}
                          className="p-1 text-[#6B7280] hover:text-red-600"
                          aria-label="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      type="text"
                      value={row.title}
                      onChange={(e) =>
                        setRows((r) =>
                          r.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x))
                        )
                      }
                      placeholder="Name"
                      className="h-auto w-full border border-swiss-line rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-swiss-accent/20"
                    />
                    <Input
                      type="text"
                      value={row.description ?? ''}
                      onChange={(e) =>
                        setRows((r) =>
                          r.map((x, i) =>
                            i === idx ? { ...x, description: e.target.value.slice(0, 500) } : x
                          )
                        )
                      }
                      placeholder="Description (optional)"
                      className="h-auto w-full border border-swiss-line rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-swiss-accent/20"
                    />
                    <Textarea
                      value={row.trigger}
                      onChange={(e) =>
                        setRows((r) =>
                          r.map((x, i) => (i === idx ? { ...x, trigger: e.target.value } : x))
                        )
                      }
                      placeholder="Trigger (optional — empty OK)"
                      rows={2}
                      className="min-h-0 w-full border border-swiss-line rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-swiss-accent/20 resize-none"
                    />
                    <KnowledgeMultiSelect
                      items={kbItems}
                      selected={row.knowledgeItemIds ?? []}
                      onChange={(ids) =>
                        setRows((r) =>
                          r.map((x, i) => (i === idx ? { ...x, knowledgeItemIds: ids } : x))
                        )
                      }
                      disabled={creating}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setRows((r) => [...r, emptyRow()])}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-swiss-accent hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add row
              </button>

              <button
                type="button"
                disabled={creating || !onBulkCreate || !rows.some((r) => r.title.trim())}
                onClick={handleBulk}
                className="w-full py-2.5 bg-swiss-accent hover:bg-swiss-accent-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold"
              >
                {creating ? 'Creating…' : 'Create skills'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
