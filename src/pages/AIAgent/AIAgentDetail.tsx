import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, CloudCheck } from 'lucide-react';
import type { AgentBot } from '../../types';
import type { AgentProfileData } from '../../components/ai-agent/types';
import { api } from '../../lib/api';
import { mapAgentFromApi } from '../../lib/mappers';
import {
  agentSectionFromPath,
  agentSkillIdFromPath,
  pathForAgent,
  pathForTab,
} from '../../routes';
import { AgentProfile } from '../../components/ai-agent/profile/AgentProfile';
import { SkillsList } from '../../components/ai-agent/skills/SkillsList';
import { SkillEditor } from '../../components/ai-agent/skills/SkillEditor';
import { KnowledgeBase } from '../../components/ai-agent/knowledge/KnowledgeBase';
import {
  RuleBasedFlowBuilder,
  defaultAgentFlowDefinition,
} from '../../components/ai-agent/RuleBasedFlowBuilder';
import type { AgentFlowDefinition } from '../../types';

type Props = {
  agentId: string;
  pathname: string;
};

function toProfileData(agent: AgentBot): AgentProfileData {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    category: agent.category,
    isEnabled: agent.isEnabled,
    isPublished: agent.isPublished ?? false,
    publishedAt: agent.publishedAt ?? null,
    avatarUrl: agent.avatarUrl,
    toneOfVoice: agent.toneOfVoice ?? 'professional',
    fallbackLanguage: agent.fallbackLanguage ?? 'english',
    instructions: agent.instructions ?? '',
    brandBackground: agent.brandBackground ?? '',
    actions: agent.actions ?? [],
  };
}

function formatSavedTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const AIAgentDetail: React.FC<Props> = ({ agentId, pathname }) => {
  const navigate = useNavigate();
  const section = agentSectionFromPath(pathname);
  const skillId = agentSkillIdFromPath(pathname);
  const [agent, setAgent] = useState<AgentBot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(true);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);

  const loadAgent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await api.getAgent(agentId);
      setAgent(mapAgentFromApi(raw as Record<string, unknown>));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void loadAgent();
  }, [loadAgent]);

  const persist = async (patch: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateAgent(agentId, patch);
      setAgent(mapAgentFromApi(updated as Record<string, unknown>));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const buildProfilePayload = (patch: Partial<AgentProfileData>) => ({
    name: patch.name,
    description: patch.description,
    toneOfVoice: patch.toneOfVoice,
    fallbackLanguage: patch.fallbackLanguage,
    instructions: patch.instructions,
    brandBackground: patch.brandBackground,
    actions: patch.actions,
    isPublished: patch.isPublished,
  });

  const handleProfileUpdate = (patch: Partial<AgentProfileData>) => {
    if (!agent) return;
    const profilePatch = toProfileData(agent);
    const mergedProfile = { ...profilePatch, ...patch };
    setAgent({
      ...agent,
      ...patch,
      toneOfVoice: mergedProfile.toneOfVoice,
      fallbackLanguage: mergedProfile.fallbackLanguage,
      instructions: mergedProfile.instructions,
      brandBackground: mergedProfile.brandBackground,
      actions: mergedProfile.actions,
      isPublished: mergedProfile.isPublished,
    });
    void persist({
      name: mergedProfile.name,
      description: mergedProfile.description,
      toneOfVoice: mergedProfile.toneOfVoice,
      fallbackLanguage: mergedProfile.fallbackLanguage,
      instructions: mergedProfile.instructions,
      brandBackground: mergedProfile.brandBackground,
      actions: mergedProfile.actions,
      isPublished: mergedProfile.isPublished,
    }).then(() => {
      setLastAutoSavedAt(formatSavedTime(new Date()));
    });
  };

  const handlePublish = async (patch: Partial<AgentProfileData>) => {
    if (!agent) return;
    const merged = { ...agent, ...patch, isPublished: true };
    setAgent(merged);
    await persist({ ...buildProfilePayload(patch), isPublished: true, isEnabled: true });
    setLastAutoSavedAt(formatSavedTime(new Date()));
  };

  if (loading) {
    return <p className="text-sm text-[#6B7280] py-12 text-center">Loading agent…</p>;
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-500">{error || 'Agent not found'}</p>
        <button
          type="button"
          onClick={() => navigate(pathForTab('ai-agent'))}
          className="mt-4 text-sm font-bold text-sky-600 hover:underline"
        >
          Back to agents
        </button>
      </div>
    );
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-[#F3F0FF] text-sky-600 font-bold'
        : 'text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#111827]'
    }`;

  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block pl-8 pr-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-[#F3F0FF] text-sky-600 font-bold'
        : 'text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#111827]'
    }`;

  const mobileNavOptions = [
    { value: pathForAgent(agentId, 'profile'), label: 'Profile' },
    { value: pathForAgent(agentId, 'skills'), label: 'Skills' },
    { value: pathForAgent(agentId, 'knowledge'), label: 'Knowledge base' },
    ...(agent.category === 'rule_based'
      ? [{ value: pathForAgent(agentId, 'flows'), label: 'Flows' }]
      : []),
  ];

  const mobileNavValue = skillId
    ? pathForAgent(agentId, 'skills')
    : mobileNavOptions.find((opt) => pathname.startsWith(opt.value))?.value ??
      pathForAgent(agentId, 'profile');

  return (
    <div className="flex-1 w-full pb-12 text-left">
      <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-12rem)] gap-0">
        <div className="lg:hidden mb-4">
          <label htmlFor="agent-section-mobile" className="sr-only">
            Agent section
          </label>
          <select
            id="agent-section-mobile"
            value={mobileNavValue}
            onChange={(e) => navigate(e.target.value)}
            className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-semibold text-[#111827]"
          >
            {mobileNavOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <aside className="hidden lg:block w-[280px] shrink-0 border border-[#E5E7EB] rounded-xl bg-white p-4 h-fit sticky top-6">
          <button
            type="button"
            onClick={() => navigate(pathForTab('ai-agent'))}
            className="flex items-center gap-2 text-sm font-bold text-[#6B7280] hover:text-[#111827] mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="truncate" title={agent.name}>
              {agent.name}
            </span>
          </button>
          {lastAutoSavedAt && section === 'profile' && (
            <p className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-4 pl-6">
              <CloudCheck className="w-3.5 h-3.5 text-sky-600" />
              Auto Saved at {lastAutoSavedAt}
            </p>
          )}
          {!lastAutoSavedAt && <div className="mb-4" />}

          <nav className="space-y-1">
            <NavLink to={pathForAgent(agentId, 'profile')} className={navLinkClass}>
              Profile
            </NavLink>

            <button
              type="button"
              onClick={() => setCapabilitiesOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#6B7280] hover:text-[#111827]"
            >
              Capabilities
              {capabilitiesOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {capabilitiesOpen && (
              <>
                <NavLink to={pathForAgent(agentId, 'skills')} className={subNavLinkClass}>
                  Skills
                </NavLink>
                <NavLink to={pathForAgent(agentId, 'knowledge')} className={subNavLinkClass}>
                  Knowledge base
                </NavLink>
                {agent.category === 'rule_based' && (
                  <NavLink to={pathForAgent(agentId, 'flows')} className={subNavLinkClass}>
                    Flows
                  </NavLink>
                )}
              </>
            )}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 lg:pl-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {skillId ? (
            <SkillEditor agentId={agentId} skillId={skillId} avatarUrl={agent.avatarUrl} />
          ) : section === 'skills' ? (
            <SkillsList agentId={agentId} />
          ) : section === 'knowledge' ? (
            <KnowledgeBase agentId={agentId} />
          ) : section === 'flows' && agent.category === 'rule_based' ? (
            <div className="h-full min-h-[520px] w-full rounded-xl border border-[#E5E7EB] overflow-hidden bg-[#eef0f3]">
              <RuleBasedFlowBuilder
                flow={agent.flowDefinition ?? defaultAgentFlowDefinition()}
                saving={saving}
                onSave={(flow: AgentFlowDefinition) => void persist({ flowDefinition: flow })}
              />
            </div>
          ) : (
            <AgentProfile
              profile={toProfileData(agent)}
              onUpdate={handleProfileUpdate}
              onPublish={handlePublish}
              saving={saving}
              onSaved={() => setLastAutoSavedAt(formatSavedTime(new Date()))}
            />
          )}
        </div>
      </div>
    </div>
  );
};
