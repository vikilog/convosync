import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Info, HelpCircle } from 'lucide-react';
import type { AgentSkill } from '../types';
import { api } from '../../../lib/api';
import { pathForAgentSkill } from '../../../routes';
import { NewSkillModal, type SkillDraft } from './NewSkillModal';
import { Input } from '../../ui/input';

type Props = {
  agentId: string;
};

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

export const SkillsList: React.FC<Props> = ({ agentId }) => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [modalMode, setModalMode] = useState<'single' | 'bulk'>('single');
  const [creating, setCreating] = useState(false);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await api.getAgentSkills(agentId);
      setSkills((raw as Record<string, unknown>[]).map(mapSkill));
    } catch {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const handleCreate = async (draft: SkillDraft) => {
    setCreating(true);
    setBulkErrors([]);
    try {
      const created = await api.createAgentSkill(agentId, {
        title: draft.title,
        trigger: draft.trigger,
        instructions: draft.instructions,
        description: draft.description ?? null,
        knowledgeItemIds: draft.knowledgeItemIds ?? [],
      });
      const skill = mapSkill(created as Record<string, unknown>);
      setShowNew(false);
      navigate(pathForAgentSkill(agentId, skill.id));
    } finally {
      setCreating(false);
    }
  };

  const handleBulkCreate = async (drafts: SkillDraft[]) => {
    setCreating(true);
    setBulkErrors([]);
    try {
      const res = (await api.bulkCreateAgentSkills(agentId, {
        skills: drafts.map((d) => ({
          title: d.title,
          trigger: d.trigger ?? '',
          instructions: d.instructions ?? '',
          description: d.description ?? null,
          knowledgeItemIds: d.knowledgeItemIds ?? [],
          status: d.status ?? 'draft',
        })),
      })) as {
        created: number;
        failed: number;
        results: Array<
          | { ok: true; index: number; skill: Record<string, unknown> }
          | { ok: false; index: number; error: string }
        >;
      };
      const errors = res.results
        .filter((r): r is { ok: false; index: number; error: string } => !r.ok)
        .map((r) => `Row ${r.index + 1}: ${r.error}`);
      setBulkErrors(errors);
      await loadSkills();
      if (res.failed === 0) {
        setShowNew(false);
      }
    } catch (err) {
      setBulkErrors([err instanceof Error ? err.message : 'Bulk create failed']);
    } finally {
      setCreating(false);
    }
  };

  const filtered = skills.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">Skills</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Break down the process into steps and help AI learn how to manage complex Tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setModalMode('bulk');
              setBulkErrors([]);
              setShowNew(true);
            }}
            className="px-4 py-2 border border-swiss-line text-[#111827] rounded-xl text-sm font-bold hover:bg-surface-muted"
          >
            Bulk add
          </button>
          <button
            type="button"
            onClick={() => {
              setModalMode('single');
              setBulkErrors([]);
              setShowNew(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold"
          >
            + New Skill
          </button>
        </div>
      </div>

      {bulkErrors.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold mb-1">Some rows failed</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {bulkErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="h-auto w-full pl-10 pr-3 py-2 border border-swiss-line rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-swiss-line rounded-xl text-sm font-medium text-[#6B7280] hover:bg-surface-muted"
        >
          Status
          <Info className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#6B7280] text-center py-12">Loading skills…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm font-medium text-[#6B7280]">No data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => navigate(pathForAgentSkill(agentId, skill.id))}
              className="w-full text-left bg-white border border-swiss-line p-4 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[#111827]">{skill.title}</p>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    skill.status === 'live'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-swiss-muted'
                  }`}
                >
                  {skill.status === 'live' ? 'Live' : 'Draft'}
                </span>
              </div>
              {skill.description ? (
                <p className="text-sm text-[#6B7280] mt-1.5 line-clamp-2">{skill.description}</p>
              ) : null}
              <p className="text-xs text-[#6B7280] mt-2">
                Created {new Date(skill.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      )}

      {showNew && (
        <NewSkillModal
          agentId={agentId}
          mode={modalMode}
          onClose={() => setShowNew(false)}
          onCreate={(draft) => void handleCreate(draft)}
          onBulkCreate={(drafts) => void handleBulkCreate(drafts)}
          creating={creating}
        />
      )}
    </div>
  );
};
