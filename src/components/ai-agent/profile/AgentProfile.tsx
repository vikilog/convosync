import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot,
  Briefcase,
  ChevronDown,
  Coffee,
  Handshake,
  Pencil,
  Smile,
} from 'lucide-react';
import type { AgentActionConfig, AgentProfileData, ToneOfVoice } from '../types';
import { LANGUAGE_LABELS } from '../types';
import { ChatPreviewPanel } from '../ChatPreviewPanel';
import { EditProfileModal } from './EditProfileModal';
import { InfoTooltip } from './InfoTooltip';
import { InstructionToolbar } from './InstructionToolbar';
import { ActionCard } from './ActionCard';
import { PromptTemplatesModal } from './PromptTemplatesModal';
import { WritingGuideDrawer } from './WritingGuideDrawer';
import { INSTRUCTIONS_PLACEHOLDER, TONE_OPTIONS } from './constants';
import { defaultAgentActions } from './constants';

type Props = {
  profile: AgentProfileData;
  onUpdate: (patch: Partial<AgentProfileData>) => void;
  onPublish: (patch: Partial<AgentProfileData>) => Promise<void>;
  saving?: boolean;
  onSaved?: () => void;
};

const TONE_ICONS: Record<ToneOfVoice, React.ReactNode> = {
  professional: <Briefcase className="w-4 h-4" />,
  humorous: <Smile className="w-4 h-4" />,
  casual: <Coffee className="w-4 h-4" />,
  friendly: <Handshake className="w-4 h-4" />,
};

function profilesEqual(a: AgentProfileData, b: AgentProfileData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const AgentProfile: React.FC<Props> = ({
  profile,
  onUpdate,
  onPublish,
  saving,
  onSaved,
}) => {
  const [local, setLocal] = useState(profile);
  const [showEdit, setShowEdit] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateTarget, setTemplateTarget] = useState<'instructions' | AgentActionConfig['type']>(
    'instructions'
  );
  const [showGuide, setShowGuide] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const instructionsRef = useRef<HTMLTextAreaElement>(null);
  const dirtyRef = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!dirtyRef.current) {
      setLocal(profile);
    }
  }, [profile]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const flushSave = useCallback(() => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    onUpdate({ ...local });
    onSaved?.();
  }, [local, onUpdate, onSaved]);

  const patchLocal = useCallback((patch: Partial<AgentProfileData>) => {
    setLocal((prev) => {
      const next = { ...prev, ...patch };
      dirtyRef.current = !profilesEqual(next, profile);
      return next;
    });
  }, [profile]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!dirtyRef.current) return;
    debounceRef.current = window.setTimeout(() => {
      flushSave();
    }, 2000);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [local, flushSave]);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      if (dirtyRef.current) flushSave();
    }, 30000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [flushSave]);

  const updateAction = (type: AgentActionConfig['type'], patch: Partial<AgentActionConfig>) => {
    patchLocal({
      actions: local.actions.map((a) => (a.type === type ? { ...a, ...patch } : a)),
    });
  };

  const applyTemplate = (content: string) => {
    if (templateTarget === 'instructions') {
      patchLocal({ instructions: content });
      return;
    }
    updateAction(templateTarget, { instruction: content });
  };

  const handlePublish = async () => {
    setShowPublishConfirm(false);
    await onPublish({ isPublished: true });
    patchLocal({ isPublished: true });
    setToast('Agent published successfully!');
  };

  const actions =
    local.actions.length > 0 ? local.actions : defaultAgentActions();

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-6 w-full pb-24">
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Profile</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Setup the personality and the conversation rules of AI Agent
            </p>
          </div>

          <section className="bg-white border border-[#E5E7EB] rounded-xl p-5 relative">
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#6B7280] hover:text-sky-600 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <div className="flex items-start gap-4">
              {local.avatarUrl ? (
                <img
                  src={local.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border border-[#E5E7EB]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#F3F0FF] text-sky-600 flex items-center justify-center">
                  <Bot className="w-8 h-8" />
                </div>
              )}
              <div className="pr-16">
                <h3 className="text-lg font-bold text-[#111827]">{local.name}</h3>
                <p className="text-sm text-[#6B7280] mt-1">{local.description}</p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <p className="text-sm font-medium text-[#111827] mb-3">Tone of voice</p>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((opt) => {
                const selected = local.toneOfVoice === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patchLocal({ toneOfVoice: opt.id })}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                      selected
                        ? 'border-[#0284c7] bg-[#F3F0FF] text-sky-600'
                        : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                    }`}
                  >
                    {TONE_ICONS[opt.id]}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-[#111827]">Fallback language</label>
              <InfoTooltip text="Language used when AI cannot detect user's language" />
            </div>
            <div className="relative w-[200px]">
              <select
                value={local.fallbackLanguage}
                onChange={(e) =>
                  patchLocal({
                    fallbackLanguage: e.target.value as AgentProfileData['fallbackLanguage'],
                  })
                }
                className="w-full appearance-none border border-[#E5E7EB] rounded-lg py-2.5 pl-3 pr-9 text-sm text-[#111827] focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none bg-white"
              >
                {(Object.keys(LANGUAGE_LABELS) as Array<keyof typeof LANGUAGE_LABELS>).map(
                  (key) => (
                    <option key={key} value={key}>
                      {LANGUAGE_LABELS[key]}
                    </option>
                  )
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
            </div>
          </section>

          <section className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-[#111827]">Instructions</label>
              <InfoTooltip text="Main instructions that define how your AI Agent behaves in all conversations" />
            </div>
            <div className="relative">
              <textarea
                ref={instructionsRef}
                value={local.instructions}
                onChange={(e) => patchLocal({ instructions: e.target.value.slice(0, 5000) })}
                placeholder={INSTRUCTIONS_PLACEHOLDER}
                rows={10}
                className="w-full border border-[#E5E7EB] rounded-lg py-3 px-3 text-sm resize-y min-h-[200px] max-h-[400px] focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
              />
              <span className="absolute bottom-3 right-3 text-xs text-[#6B7280]">
                {local.instructions.length}/5000
              </span>
            </div>
            <InstructionToolbar
              textareaRef={instructionsRef}
              value={local.instructions}
              onChange={(v) => patchLocal({ instructions: v })}
              showHandoff
              showAddTags
              onOpenTemplates={() => {
                setTemplateTarget('instructions');
                setShowTemplates(true);
              }}
              onOpenGuide={() => setShowGuide(true)}
            />
          </section>

          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setActionsOpen((o) => !o)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Actions</h3>
                <p className="text-xs text-[#6B7280] mt-1 max-w-2xl">
                  Defines how to independently trigger Actions outside of Instructions. Actions can
                  only be independently triggered when enabled. Use the text box to define when the
                  agent should perform the action and what it should do.
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-[#6B7280] shrink-0 transition-transform ${
                  actionsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {actionsOpen && (
              <div className="space-y-4">
                {actions.map((action) => (
                  <ActionCard
                    key={action.type}
                    action={action}
                    onChange={(patch) => updateAction(action.type, patch)}
                    onOpenTemplates={(type) => {
                      setTemplateTarget(type);
                      setShowTemplates(true);
                    }}
                    onOpenGuide={() => setShowGuide(true)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <label className="block text-sm font-medium text-[#111827] mb-2">
              Brand&apos;s background <span className="text-[#6B7280] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                value={local.brandBackground}
                onChange={(e) => patchLocal({ brandBackground: e.target.value.slice(0, 1200) })}
                placeholder="Enter brand information"
                rows={5}
                className="w-full border border-[#E5E7EB] rounded-xl py-3 px-3 text-sm resize-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
              />
              <span className="absolute bottom-3 right-3 text-xs text-[#6B7280]">
                {local.brandBackground.length}/1200
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">
              Helps the AI Agent understand your industry, products, and services
            </p>
          </section>
        </div>

        <ChatPreviewPanel agentId={local.id} avatarUrl={local.avatarUrl} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E7EB] bg-white px-4 md:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => setShowPublishConfirm(true)}
          className="px-5 py-2.5 bg-[#111827] hover:bg-[#1f2937] disabled:opacity-60 text-white rounded-xl text-sm font-bold"
        >
          Publish
        </button>
        <span
          className={`text-sm font-semibold ${
            local.isPublished ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          {local.isPublished ? 'Published · Live' : 'Draft · Unpublished'}
        </span>
      </div>

      {toast && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#111827] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {showPublishConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#E5E7EB] shadow-2xl p-6">
            <h3 className="text-base font-bold text-[#111827]">Publish agent?</h3>
            <p className="text-sm text-[#6B7280] mt-2">
              Are you sure you want to publish this agent? It will start responding to real
              conversations.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                className="px-4 py-2 text-sm font-bold text-[#6B7280] hover:text-[#111827]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handlePublish()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <EditProfileModal
          profile={local}
          saving={saving}
          onClose={() => setShowEdit(false)}
          onSave={(patch) => {
            patchLocal(patch);
            setShowEdit(false);
          }}
        />
      )}

      {showTemplates && (
        <PromptTemplatesModal onClose={() => setShowTemplates(false)} onSelect={applyTemplate} />
      )}

      {showGuide && <WritingGuideDrawer onClose={() => setShowGuide(false)} />}
    </>
  );
};
