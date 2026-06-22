import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Play } from 'lucide-react';
import type { AgentSkill } from '../types';
import { api } from '../../../lib/api';
import { pathForAgent } from '../../../routes';
import { ChatPreviewPanel } from '../ChatPreviewPanel';

type Props = {
  agentId: string;
  skillId: string;
  avatarUrl?: string | null;
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
    status: raw.status === 'live' ? 'live' : 'draft',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export const SkillEditor: React.FC<Props> = ({ agentId, skillId, avatarUrl }) => {
  const navigate = useNavigate();
  const [skill, setSkill] = useState<AgentSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const instructionsRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSkill = useCallback(async () => {
    setLoading(true);
    try {
      const skills = (await api.getAgentSkills(agentId)) as Record<string, unknown>[];
      const found = skills.find((s) => String(s.id) === skillId);
      if (found) setSkill(mapSkill(found));
    } finally {
      setLoading(false);
    }
  }, [agentId, skillId]);

  useEffect(() => {
    void loadSkill();
  }, [loadSkill]);

  const scheduleSave = (patch: Partial<AgentSkill>) => {
    if (!skill) return;
    const next = { ...skill, ...patch };
    setSkill(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void api.updateAgentSkill(agentId, skillId, {
        title: next.title,
        trigger: next.trigger,
        instructions: next.instructions,
      });
    }, 500);
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const updated = await api.publishAgentSkill(agentId, skillId);
      setSkill(mapSkill(updated as Record<string, unknown>));
    } finally {
      setSaving(false);
    }
  };

  const insertSlashCommand = (command: string) => {
    const el = instructionsRef.current;
    if (!el || !skill) return;
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
          className="mt-3 text-sm font-bold text-sky-600 hover:underline"
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

  return (
    <div className="flex gap-6 w-full">
      <div className="flex-1 min-w-0 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(pathForAgent(agentId, 'skills'))}
              className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F8FAFC]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-[#6B7280]">Skill</span>
            <span className="text-sm font-bold text-[#111827] truncate">{skill.title}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
              {skill.status}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="p-2 rounded-lg text-[#6B7280] hover:bg-[#F8FAFC]"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={saving || skill.status === 'live'}
              onClick={() => void handlePublish()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold"
            >
              <Play className="w-4 h-4" />
              Set live
            </button>
          </div>
        </div>

        <input
          type="text"
          value={skill.title}
          onChange={(e) => scheduleSave({ title: e.target.value })}
          placeholder="Enter title here"
          className="w-full text-2xl font-bold text-[#111827] placeholder:text-gray-300 bg-transparent outline-none mb-8"
        />

        <section className="mb-8 pb-8 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-bold text-[#111827] mb-1">Start trigger</h3>
          <p className="text-xs text-[#6B7280] mb-4">
            Set the conditions to trigger this skill. Tell AI when and when not to use.
          </p>
          <textarea
            value={skill.trigger}
            onChange={(e) => scheduleSave({ trigger: e.target.value })}
            placeholder="e.g. Use this skill when users inquire about..."
            rows={4}
            className="w-full border-0 bg-transparent text-sm text-[#111827] placeholder:text-[#6B7280] resize-none outline-none"
          />
        </section>

        <section className="relative">
          <h3 className="text-sm font-bold text-[#111827] mb-1">Step-by-Step instructions</h3>
          <p className="text-xs text-[#6B7280] mb-4">
            Provide structured instructions, ensuring each step smoothly guides the user
          </p>
          <textarea
            ref={instructionsRef}
            value={skill.instructions}
            onChange={(e) => handleInstructionsChange(e.target.value)}
            placeholder="Type '/' for commands"
            rows={12}
            className="w-full border border-[#E5E7EB] rounded-xl p-4 text-sm text-[#111827] placeholder:text-[#6B7280] resize-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
          />

          {showSlashMenu && filteredCommands.length > 0 && (
            <div className="absolute left-0 mt-1 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-10 overflow-hidden">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => insertSlashCommand(cmd.label)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F3F0FF] transition-colors"
                >
                  <p className="text-sm font-bold text-sky-600">{cmd.label}</p>
                  <p className="text-xs text-[#6B7280]">{cmd.description}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <ChatPreviewPanel agentId={agentId} avatarUrl={avatarUrl} />
    </div>
  );
};
