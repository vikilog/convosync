import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Info, HelpCircle } from 'lucide-react';
import type { AgentSkill } from '../types';
import { api } from '../../../lib/api';
import { pathForAgentSkill } from '../../../routes';
import { NewSkillModal } from './NewSkillModal';

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
  const [creating, setCreating] = useState(false);

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

  const handleCreate = async (title: string) => {
    setCreating(true);
    try {
      const created = await api.createAgentSkill(agentId, { title, trigger: '', instructions: '' });
      const skill = mapSkill(created as Record<string, unknown>);
      setShowNew(false);
      navigate(pathForAgentSkill(agentId, skill.id));
    } finally {
      setCreating(false);
    }
  };

  const filtered = skills.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

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
            onClick={() => setShowNew(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold"
          >
            + New Skill
          </button>
          <button
            type="button"
            className="px-4 py-2 border border-black/5 text-[#111827] rounded-xl text-sm font-bold hover:bg-surface-muted"
          >
            Learn more
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="w-full pl-10 pr-3 py-2 border border-black/5 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-black/5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-surface-muted"
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
              className="w-full text-left bg-surface border border-black/5 rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[#111827]">{skill.title}</p>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    skill.status === 'live'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {skill.status === 'live' ? 'Live' : 'Draft'}
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-2">
                Created {new Date(skill.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      )}

      {showNew && (
        <NewSkillModal
          onClose={() => setShowNew(false)}
          onCreate={(title) => void handleCreate(title)}
          creating={creating}
        />
      )}
    </div>
  );
};
