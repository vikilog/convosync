import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bot, ChevronLeft } from 'lucide-react';
import { AgentBot, AgentFlowDefinition, AgentIntentFallback } from '../../types';
import { api } from '../../lib/api';
import { mapAgentFromApi } from '../../lib/mappers';
import { agentSectionFromPath, pathForAgent, pathForTab } from '../../routes';
import {
  RuleBasedFlowBuilder,
  defaultAgentFlowDefinition,
} from './RuleBasedFlowBuilder';

const FALLBACK_OPTIONS: { id: AgentIntentFallback; label: string }[] = [
  { id: 'silent', label: 'Remain without responding' },
  { id: 'automated_response', label: 'Automated response' },
  { id: 'transfer_human', label: 'Transfer to a human agent' },
];

type Props = {
  agentId: string;
  pathname: string;
};

export const AiAgentEditorView: React.FC<Props> = ({ agentId, pathname }) => {
  const navigate = useNavigate();
  const section = agentSectionFromPath(pathname);
  const [agent, setAgent] = useState<AgentBot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const persist = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await api.updateAgent(agentId, patch);
        setAgent(mapAgentFromApi(updated as Record<string, unknown>));
        setSavedHint(true);
        window.setTimeout(() => setSavedHint(false), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setSaving(false);
      }
    },
    [agentId]
  );

  const scheduleSave = (patch: Record<string, unknown>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persist(patch), 450);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl = typeof reader.result === 'string' ? reader.result : null;
      setAgent((prev) => (prev ? { ...prev, avatarUrl } : prev));
      void persist({ avatarUrl });
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex-1 w-full py-12 text-center text-sm text-gray-400">
        Loading agent…
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex-1 w-full py-12 text-center">
        <p className="text-sm text-red-500 font-medium">{error || 'Agent not found'}</p>
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

  const showFlowBuilder = section === 'flows' && agent.category === 'rule_based';

  return (
    <div className="flex-1 w-full pb-12 text-left">
      <button
        type="button"
        onClick={() => navigate(pathForTab('ai-agent'))}
        className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        AI Agent
      </button>

      <div className="flex w-full min-h-[calc(100vh-12rem)] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <aside className="w-[148px] shrink-0 border-r border-slate-200 bg-slate-50 py-3">
          <p className="px-3 text-sm font-bold text-gray-900 truncate mb-3" title={agent.name}>
            {agent.name}
          </p>
          <p className="px-3 text-meta font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            General
          </p>
          <nav className="px-1.5 space-y-0.5">
            <NavLink
              to={pathForAgent(agentId, 'profile')}
              className={({ isActive }) =>
                `block px-2.5 py-1.5 rounded-md text-meta transition-all ${
                  isActive
                    ? 'bg-white text-sky-600 font-bold shadow-sm border border-sky-100'
                    : 'text-gray-600 hover:bg-white/80'
                }`
              }
            >
              Profile
            </NavLink>
            <NavLink
              to={pathForAgent(agentId, 'flows')}
              className={({ isActive }) =>
                `block px-2.5 py-1.5 rounded-md text-meta transition-all ${
                  isActive
                    ? 'bg-white text-sky-600 font-bold shadow-sm border border-sky-100'
                    : 'text-gray-600 hover:bg-white/80'
                }`
              }
            >
              Flows
            </NavLink>
          </nav>
        </aside>

        <div className="flex-1 min-w-0 w-full flex flex-col bg-slate-50 min-h-0 relative">
          {(saving || savedHint) && (
            <span className="absolute top-4 right-6 z-10 text-meta font-bold text-gray-400">
              {saving ? 'Saving…' : 'Saved'}
            </span>
          )}

          {error && (
            <div className="mx-6 mt-6 mb-0 shrink-0 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div
            className={`flex-1 min-h-0 w-full ${
              showFlowBuilder ? 'px-6 pb-6 pt-0' : 'px-6 py-6'
            }`}
          >
            {section === 'flows' ? (
              showFlowBuilder ? (
                <div className="h-full min-h-[520px] w-full rounded-xl border border-slate-200 overflow-hidden bg-[#eef0f3]">
                  <RuleBasedFlowBuilder
                    flow={agent.flowDefinition ?? defaultAgentFlowDefinition()}
                    saving={saving}
                    onSave={(flow: AgentFlowDefinition) => void persist({ flowDefinition: flow })}
                  />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-sm font-bold text-gray-800">Flow builder</p>
                  <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
                    Flow builder is available for rule-based agents.
                  </p>
                </div>
              )
            ) : (
              <div className="w-full space-y-4 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
                <section className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-900">Basic</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-5">
                    Customize your AI Agent experience by setting up the Avatar and AI Agent Name.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-6 items-start">
                    <div>
                      <label className="block w-[120px] h-[120px] border-2 border-dashed border-slate-200 rounded-xl bg-gray-50 cursor-pointer overflow-hidden hover:border-channel-green/40 transition-colors">
                        {agent.avatarUrl ? (
                          <img src={agent.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-500 bg-blue-50">
                            <Bot className="w-12 h-12" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </label>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        Recommend size of 640 × 640 px, &lt;5MB
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Chatbot name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={250}
                          value={agent.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setAgent((prev) => (prev ? { ...prev, name } : prev));
                            scheduleSave({ name });
                          }}
                          className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-channel-green outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                          {agent.name.length}/250
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Welcome Message</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-lg">
                      Automatically send a welcome message when your customer opens the conversation.
                    </p>
                    {agent.welcomeMessageEnabled && (
                      <textarea
                        value={agent.welcomeMessageText ?? ''}
                        onChange={(e) => {
                          const welcomeMessageText = e.target.value;
                          setAgent((prev) => (prev ? { ...prev, welcomeMessageText } : prev));
                          scheduleSave({ welcomeMessageText });
                        }}
                        placeholder="Hi! How can we help you today?"
                        className="mt-3 w-full max-w-lg border border-slate-200 rounded-lg py-2 px-3 text-sm min-h-[72px] resize-none focus:ring-2 focus:ring-[#0284c7]/20 outline-none"
                      />
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={agent.welcomeMessageEnabled}
                      onChange={(e) => {
                        const welcomeMessageEnabled = e.target.checked;
                        setAgent((prev) => (prev ? { ...prev, welcomeMessageEnabled } : prev));
                        void persist({ welcomeMessageEnabled });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-channel-green after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-900">Intent Fallback Behavior</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-1">
                    What should the AI Agent do when it doesn&apos;t understand the user&apos;s intent?
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Defines the AI Agent&apos;s action when it fails to understand the user&apos;s intent.
                  </p>
                  <div className="space-y-3">
                    {FALLBACK_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 cursor-pointer text-sm text-gray-800"
                      >
                        <input
                          type="radio"
                          name="intentFallback"
                          checked={agent.intentFallback === option.id}
                          onChange={() => {
                            setAgent((prev) => (prev ? { ...prev, intentFallback: option.id } : prev));
                            void persist({ intentFallback: option.id });
                          }}
                          className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-[#0284c7]"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-900">
                    AI Agent Conversation Closing Wait Time
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 mb-4">
                    Defines how long should the AI Agent wait before closing the conversation (1 to 10
                    minutes)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={agent.conversationCloseWaitMins}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const conversationCloseWaitMins = Math.min(10, Math.max(1, raw || 1));
                        setAgent((prev) => (prev ? { ...prev, conversationCloseWaitMins } : prev));
                        scheduleSave({ conversationCloseWaitMins });
                      }}
                      className="w-20 border border-slate-200 rounded-lg py-2 px-3 text-sm text-center focus:ring-2 focus:ring-[#0284c7]/20 outline-none"
                    />
                    <span className="text-sm text-gray-600 font-medium">mins</span>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
