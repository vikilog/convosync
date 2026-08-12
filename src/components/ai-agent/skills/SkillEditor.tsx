import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, MoreHorizontal, Pencil, Play } from 'lucide-react';
import type { AgentSkill, KnowledgeItem } from '../types';
import { api } from '../../../lib/api';
import { pathForAgent } from '../../../routes';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type Props = {
  agentId: string;
  skillId: string;
};

const SLASH_COMMANDS = [
  { id: 'text', label: '/text', description: 'Add text block' },
  { id: 'condition', label: '/condition', description: 'Add condition' },
  { id: 'api', label: '/api', description: 'Call external API' },
  { id: 'transfer', label: '/transfer', description: 'Transfer to human' },
];

function mapSkill(raw: Record<string, unknown>): AgentSkill {
  return {
    id: String(raw.id),
    agentId: String(raw.agentId),
    title: String(raw.title),
    trigger: String(raw.trigger ?? ''),
    instructions: String(raw.instructions ?? ''),
    description: (raw.description as string | null) ?? null,
    knowledgeItemIds: Array.isArray(raw.knowledgeItemIds)
      ? raw.knowledgeItemIds.map(String)
      : [],
    status: raw.status === 'live' ? 'live' : 'draft',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function mapKnowledge(raw: Record<string, unknown>): KnowledgeItem {
  return {
    id: String(raw.id),
    agentId: String(raw.agentId),
    type: (raw.type as KnowledgeItem['type']) || 'document',
    title: String(raw.title),
    content: (raw.content as string | null) ?? null,
    url: (raw.url as string | null) ?? null,
    fileUrl: (raw.fileUrl as string | null) ?? null,
    status: (raw.status as KnowledgeItem['status']) || 'ready',
    createdAt: String(raw.createdAt ?? ''),
  };
}

export const SkillEditor: React.FC<Props> = ({ agentId, skillId }) => {
  const navigate = useNavigate();
  const [skill, setSkill] = useState<AgentSkill | null>(null);
  const [kbItems, setKbItems] = useState<KnowledgeItem[]>([]);
  const [previews, setPreviews] = useState<Record<string, KnowledgeItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [menuOpen, setMenuOpen] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const instructionsRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSkill = useCallback(async () => {
    setLoading(true);
    try {
      const [skills, knowledge] = await Promise.all([
        api.getAgentSkills(agentId) as Promise<Record<string, unknown>[]>,
        api.getAgentKnowledge(agentId) as Promise<Record<string, unknown>[]>,
      ]);
      const found = skills.find((s) => String(s.id) === skillId);
      if (found) setSkill(mapSkill(found));
      setKbItems(knowledge.map(mapKnowledge));
    } finally {
      setLoading(false);
    }
  }, [agentId, skillId]);

  useEffect(() => {
    void loadSkill();
  }, [loadSkill]);

  const linkedKbKey = (skill?.knowledgeItemIds ?? []).join(',');

  // Load document content for linked KB (GET single item — actual content, not just filename)
  useEffect(() => {
    const ids = linkedKbKey ? linkedKbKey.split(',') : [];
    if (ids.length === 0) return;
    let cancelled = false;
    void (async () => {
      const fetched: Record<string, KnowledgeItem> = {};
      for (const id of ids) {
        const fromList = kbItems.find((k) => k.id === id);
        if (fromList?.content != null) {
          fetched[id] = fromList;
          continue;
        }
        try {
          const raw = (await api.getAgentKnowledgeItem(agentId, id)) as Record<string, unknown>;
          fetched[id] = mapKnowledge(raw);
        } catch {
          /* ignore missing */
        }
      }
      if (!cancelled) setPreviews((prev) => ({ ...prev, ...fetched }));
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId, linkedKbKey, kbItems]);

  const scheduleSave = (patch: Partial<AgentSkill>) => {
    if (!skill || readOnly) return;
    const next = { ...skill, ...patch };
    setSkill(next);
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void api
        .updateAgentSkill(agentId, skillId, {
          title: next.title,
          trigger: next.trigger,
          instructions: next.instructions,
          description: next.description ?? null,
          knowledgeItemIds: next.knowledgeItemIds ?? [],
        })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'));
    }, 500);
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const updated = await api.publishAgentSkill(agentId, skillId);
      setSkill(mapSkill(updated as Record<string, unknown>));
      setSaveState('saved');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDraft = async () => {
    setMenuOpen(false);
    setSaving(true);
    try {
      const updated = await api.updateAgentSkill(agentId, skillId, { status: 'draft' });
      setSkill(mapSkill(updated as Record<string, unknown>));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this skill? This cannot be undone.')) return;
    setMenuOpen(false);
    setSaving(true);
    try {
      await api.deleteAgentSkill(agentId, skillId);
      navigate(pathForAgent(agentId, 'skills'));
    } finally {
      setSaving(false);
    }
  };

  const insertSlashCommand = (command: string) => {
    const el = instructionsRef.current;
    if (!el || !skill || readOnly) return;
    const insertion = `\n${command} `;
    const start = el.selectionStart;
    const text = skill.instructions;
    const before = text.slice(0, start);
    const after = text.slice(start);
    const instructions = before + insertion + after;
    scheduleSave({ instructions });
    setShowSlashMenu(false);
    setSlashFilter('');
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insertion.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleInstructionsChange = (value: string) => {
    scheduleSave({ instructions: value });
    const lastLine = value.split('\n').pop() ?? '';
    if (lastLine.startsWith('/')) {
      setSlashFilter(lastLine.slice(1).toLowerCase());
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
      setSlashFilter('');
    }
  };

  const toggleKnowledge = (id: string) => {
    if (!skill || readOnly) return;
    const current = skill.knowledgeItemIds ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    scheduleSave({ knowledgeItemIds: next });
  };

  if (loading) {
    return <p className="text-sm text-[#6B7280] py-12 text-center">Loading skill…</p>;
  }

  if (!skill) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-500">Skill not found</p>
        <button
          type="button"
          onClick={() => navigate(pathForAgent(agentId, 'skills'))}
          className="mt-3 text-sm font-bold text-primary hover:underline"
        >
          Back to skills
        </button>
      </div>
    );
  }

  const filteredCommands = SLASH_COMMANDS.filter(
    (c) =>
      c.id.includes(slashFilter) ||
      c.description.toLowerCase().includes(slashFilter)
  );

  const linkedIds = skill.knowledgeItemIds ?? [];
  const activePreview = previewId ? previews[previewId] : null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(pathForAgent(agentId, 'skills'))}
            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-surface-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-[#6B7280]">Skill</span>
          <span className="text-sm font-bold text-[#111827] truncate">{skill.title}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
            {skill.status}
          </span>
          {readOnly && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              View
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#6B7280] min-w-[4.5rem] text-right">
            {readOnly
              ? ''
              : saveState === 'saving'
                ? 'Saving…'
                : saveState === 'saved'
                  ? 'Saved'
                  : saveState === 'error'
                    ? 'Save failed'
                    : ''}
          </span>
          <button
            type="button"
            onClick={() => setReadOnly((v) => !v)}
            className="p-2 rounded-lg text-[#6B7280] hover:bg-surface-muted"
            aria-label={readOnly ? 'Edit skill' : 'View skill'}
            title={readOnly ? 'Edit' : 'View'}
          >
            {readOnly ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 rounded-lg text-[#6B7280] hover:bg-surface-muted"
              aria-label="Skill actions"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white ring-1 ring-slate-200/80 rounded-xl shadow-lg z-20 overflow-hidden">
                {skill.status === 'live' && (
                  <button
                    type="button"
                    onClick={() => void handleSetDraft()}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#111827] hover:bg-surface-muted"
                  >
                    Revert to draft
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete skill
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={saving || skill.status === 'live'}
            onClick={() => void handlePublish()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold"
          >
            <Play className="w-4 h-4" />
            Set live
          </button>
        </div>
      </div>

      {readOnly ? (
        <h1 className="text-2xl font-bold text-[#111827] mb-4">{skill.title}</h1>
      ) : (
        <input
          type="text"
          value={skill.title}
          onChange={(e) => scheduleSave({ title: e.target.value })}
          placeholder="Enter name here"
          className="w-full text-2xl font-bold text-[#111827] placeholder:text-gray-300 bg-transparent outline-none mb-4"
        />
      )}

      <section className="mb-6">
        <h3 className="text-sm font-bold text-[#111827] mb-1">Description</h3>
        {readOnly ? (
          <p className="text-sm text-[#6B7280] whitespace-pre-wrap">
            {skill.description?.trim() || '—'}
          </p>
        ) : (
          <textarea
            value={skill.description ?? ''}
            onChange={(e) => scheduleSave({ description: e.target.value.slice(0, 500) })}
            placeholder="Optional short blurb"
            rows={2}
            className="w-full border border-black/5 rounded-xl p-3 text-sm text-[#111827] placeholder:text-[#6B7280] resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        )}
      </section>

      <section className="mb-8 pb-8 border-b border-black/5">
        <h3 className="text-sm font-bold text-[#111827] mb-1">Start trigger</h3>
        <p className="text-xs text-[#6B7280] mb-4">
          Set the conditions to trigger this skill. Empty trigger is allowed.
        </p>
        {readOnly ? (
          <p className="text-sm text-[#111827] whitespace-pre-wrap">
            {skill.trigger.trim() || '—'}
          </p>
        ) : (
          <textarea
            value={skill.trigger}
            onChange={(e) => scheduleSave({ trigger: e.target.value })}
            placeholder="e.g. Use this skill when users inquire about..."
            rows={4}
            className="w-full border-0 bg-transparent text-sm text-[#111827] placeholder:text-[#6B7280] resize-none outline-none"
          />
        )}
      </section>

      <section className="mb-8 pb-8 border-b border-black/5">
        <h3 className="text-sm font-bold text-[#111827] mb-1">Linked knowledge</h3>
        <p className="text-xs text-[#6B7280] mb-4">
          When this skill matches, retrieval prefers these knowledge items.
        </p>
        {kbItems.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No knowledge items on this agent.</p>
        ) : (
          <div className="space-y-2">
            {kbItems.map((item) => {
              const checked = linkedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-black/5 px-3 py-2"
                >
                  {!readOnly && (
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={() => toggleKnowledge(item.id)}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#111827]">{item.title}</p>
                    <p className="text-xs text-[#6B7280] capitalize">{item.type}</p>
                  </div>
                  {checked && (
                    <button
                      type="button"
                      onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                      className="text-xs font-medium text-primary hover:underline shrink-0"
                    >
                      {previewId === item.id ? 'Hide' : 'Preview'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {activePreview && (
          <div className="mt-4 rounded-xl bg-surface-muted/60 border border-black/5 p-4">
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2">
              {activePreview.title}
            </p>
            <pre className="text-sm text-[#111827] whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
              {activePreview.content?.trim() ||
                activePreview.url ||
                activePreview.fileUrl ||
                'No content stored for this item.'}
            </pre>
          </div>
        )}
      </section>

      <section className="relative">
        <h3 className="text-sm font-bold text-[#111827] mb-1">Step-by-Step instructions</h3>
        <p className="text-xs text-[#6B7280] mb-4">
          Provide structured instructions, ensuring each step smoothly guides the user
        </p>
        {readOnly ? (
          <pre className="w-full border border-black/5 rounded-xl p-4 text-sm text-[#111827] whitespace-pre-wrap font-sans">
            {skill.instructions.trim() || '—'}
          </pre>
        ) : (
          <>
            <textarea
              ref={instructionsRef}
              value={skill.instructions}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              placeholder="Type '/' for commands"
              rows={12}
              className="w-full border border-black/5 rounded-xl p-4 text-sm text-[#111827] placeholder:text-[#6B7280] resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            {showSlashMenu && filteredCommands.length > 0 && (
              <div className="absolute left-0 mt-1 w-64 bg-white ring-1 ring-slate-200/80 rounded-xl shadow-lg z-10 overflow-hidden">
                {filteredCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => insertSlashCommand(cmd.label)}
                    className="w-full text-left px-4 py-2.5 hover:bg-primary/10 transition-colors"
                  >
                    <p className="text-sm font-bold text-primary">{cmd.label}</p>
                    <p className="text-xs text-[#6B7280]">{cmd.description}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
