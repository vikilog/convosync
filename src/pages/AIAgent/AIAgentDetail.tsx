import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CloudCheck,
} from 'lucide-react';
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
import { RuleBasedFlowBuilder } from '../../components/ai-agent/RuleBasedFlowBuilder';
import { ChatPreviewPanel } from '../../components/ai-agent/ChatPreviewPanel';
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
    voiceAgentEnabled: Boolean(agent.voiceAgentEnabled),
    voiceSttProvider: agent.voiceSttProvider || 'cartesia',
    voiceTtsProvider: agent.voiceTtsProvider || 'cartesia',
    voiceTtsVoiceId: agent.voiceTtsVoiceId ?? null,
    similarityLowThreshold: agent.similarityLowThreshold ?? null,
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
  const [testOpen, setTestOpen] = useState(false);

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

  const persist = async (patch: Record<string, unknown>): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateAgent(agentId, patch);
      setAgent(mapAgentFromApi(updated as Record<string, unknown>));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const buildProfilePayload = (patch: Partial<AgentProfileData>) => {
    const payload: Record<string, unknown> = {
      name: patch.name,
      description: patch.description,
      avatarUrl: patch.avatarUrl,
      toneOfVoice: patch.toneOfVoice,
      fallbackLanguage: patch.fallbackLanguage,
      instructions: patch.instructions,
      brandBackground: patch.brandBackground,
      actions: patch.actions,
      voiceAgentEnabled: patch.voiceAgentEnabled,
      voiceSttProvider: patch.voiceSttProvider,
      voiceTtsProvider: patch.voiceTtsProvider,
      voiceTtsVoiceId: patch.voiceTtsVoiceId,
      isPublished: patch.isPublished,
      isEnabled: patch.isEnabled,
    };
    // Omit null so autosave of other fields does not clear a server/env default override.
    if (typeof patch.similarityLowThreshold === 'number') {
      payload.similarityLowThreshold = patch.similarityLowThreshold;
    }
    return payload;
  };

  // Single funnel for every profile change, including publish (which is just
  // a patch with isPublished/isEnabled set) — one save path means one place
  // that needs to get optimistic-update, rollback, and payload-shape right.
  const handleProfileUpdate = async (patch: Partial<AgentProfileData>): Promise<boolean> => {
    if (!agent) return false;
    const previousAgent = agent;
    const profilePatch = toProfileData(agent);
    const mergedProfile = { ...profilePatch, ...patch };
    setAgent({
      ...agent,
      ...patch,
      avatarUrl:
        patch.avatarUrl !== undefined ? patch.avatarUrl : agent.avatarUrl,
      toneOfVoice: mergedProfile.toneOfVoice,
      fallbackLanguage: mergedProfile.fallbackLanguage,
      instructions: mergedProfile.instructions,
      brandBackground: mergedProfile.brandBackground,
      actions: mergedProfile.actions,
      voiceAgentEnabled: mergedProfile.voiceAgentEnabled,
      voiceSttProvider: mergedProfile.voiceSttProvider,
      voiceTtsProvider: mergedProfile.voiceTtsProvider,
      voiceTtsVoiceId: mergedProfile.voiceTtsVoiceId,
      similarityLowThreshold: mergedProfile.similarityLowThreshold,
      isPublished: mergedProfile.isPublished,
      isEnabled: mergedProfile.isEnabled,
    });
    const ok = await persist(buildProfilePayload(mergedProfile));
    if (ok) {
      setLastAutoSavedAt(formatSavedTime(new Date()));
    } else {
      setAgent(previousAgent);
    }
    return ok;
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
          className="mt-4 text-sm font-bold text-primary hover:underline"
        >
          Back to agents
        </button>
      </div>
    );
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary font-bold'
        : 'text-[#6B7280] hover:bg-surface-muted hover:text-[#111827]'
    }`;

  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block pl-8 pr-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary font-bold'
        : 'text-[#6B7280] hover:bg-surface-muted hover:text-[#111827]'
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

  const openTest = () => setTestOpen(true);
  const closeTest = () => setTestOpen(false);

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
            className="w-full rounded-xl bg-white ring-1 ring-slate-200/80 px-3 py-2.5 text-sm font-semibold text-[#111827]"
          >
            {mobileNavOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <aside className="hidden lg:block w-[280px] shrink-0 border border-black/5 rounded-xl bg-white p-4 h-fit sticky top-6">
          <div className="flex items-start justify-between gap-2 mb-1">
            <button
              type="button"
              onClick={() => navigate(pathForTab('ai-agent'))}
              className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#6B7280] hover:text-[#111827]"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="truncate" title={agent.name}>
                {agent.name}
              </span>
            </button>
          </div>
          {lastAutoSavedAt && section === 'profile' ? (
            <p className="mb-4 flex items-center gap-1.5 text-xs text-[#6B7280] pl-6">
              <CloudCheck className="w-3.5 h-3.5 text-primary" />
              Auto Saved at {lastAutoSavedAt}
            </p>
          ) : null}

          <nav className={`space-y-1 ${lastAutoSavedAt && section === 'profile' ? '' : 'mt-3'}`}>
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
            <SkillEditor agentId={agentId} skillId={skillId} />
          ) : section === 'skills' ? (
            <SkillsList agentId={agentId} />
          ) : section === 'knowledge' ? (
            <KnowledgeBase agentId={agentId} />
          ) : section === 'flows' && agent.category === 'rule_based' ? (
            <div className="h-full min-h-[520px] w-full rounded-xl border border-black/5 overflow-hidden bg-[#eef0f3]">
              <RuleBasedFlowBuilder
                flow={agent.flowDefinition}
                saving={saving}
                onSave={(flow: AgentFlowDefinition) => void persist({ flowDefinition: flow })}
              />
            </div>
          ) : (
            <AgentProfile
              profile={toProfileData(agent)}
              onUpdate={handleProfileUpdate}
              onTestAgent={openTest}
              saving={saving}
            />
          )}
        </div>
      </div>

      {/* Keep panel mounted so mid-test chat survives open/close (Restart still clears). */}
      <div
        className={`fixed inset-0 z-50 flex justify-end ${
          testOpen ? '' : 'pointer-events-none invisible'
        }`}
        aria-hidden={!testOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-gray-900/40 transition-opacity ${
            testOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Close test conversation"
          tabIndex={testOpen ? 0 : -1}
          onClick={closeTest}
        />
        <aside
          className={`relative flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-200 ${
            testOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-label="Test conversation"
        >
          <ChatPreviewPanel
            agentId={agent.id}
            agentName={agent.name}
            avatarUrl={agent.avatarUrl}
            language={agent.fallbackLanguage ?? 'english'}
            onClose={closeTest}
          />
        </aside>
      </div>
    </div>
  );
};
