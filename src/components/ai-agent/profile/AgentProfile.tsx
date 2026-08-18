import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot,
  Briefcase,
  ChevronDown,
  Coffee,
  Handshake,
  MessageSquare,
  Pencil,
  Smile,
} from 'lucide-react';
import type { AgentActionConfig, AgentProfileData, ToneOfVoice } from '../types';
import { LANGUAGE_LABELS } from '../types';
import { EditProfileModal } from './EditProfileModal';
import { InfoTooltip } from './InfoTooltip';
import { InstructionToolbar } from './InstructionToolbar';
import { ActionCard } from './ActionCard';
import { PromptTemplatesModal } from './PromptTemplatesModal';
import { WritingGuideDrawer } from './WritingGuideDrawer';
import { INSTRUCTIONS_PLACEHOLDER, TONE_OPTIONS } from './constants';
import { defaultAgentActions } from './constants';

/** Matches backend SIMILARITY_LOW_THRESHOLD default when agent has no override. */
const DEFAULT_SIMILARITY_LOW_THRESHOLD = 0.7;

type Props = {
  profile: AgentProfileData;
  /** Resolves to whether the save actually succeeded, so callers can react to failure. */
  onUpdate: (patch: Partial<AgentProfileData>) => Promise<boolean>;
  onTestAgent?: () => void;
  saving?: boolean;
};

const TONE_ICONS: Record<ToneOfVoice, React.ReactNode> = {
  professional: <Briefcase className="w-4 h-4" />,
  humorous: <Smile className="w-4 h-4" />,
  casual: <Coffee className="w-4 h-4" />,
  friendly: <Handshake className="w-4 h-4" />,
};

/** Add providers here later — dropdown maps this list. */
const VOICE_STT_PROVIDERS: { value: string; label: string }[] = [
  { value: 'cartesia', label: 'Cartesia' },
  { value: 'deepgram', label: 'Deepgram' },
];

const VOICE_TTS_PROVIDERS: { value: string; label: string }[] = [
  { value: 'cartesia', label: 'Cartesia' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepgram', label: 'Deepgram' },
];

/** Curated Cartesia voice IDs (play.cartesia.ai / public docs). API list later. */
const CARTESIA_TTS_VOICES: { value: string; label: string }[] = [
  { value: 'db6b0ed5-d5d3-463d-ae85-518a07d3c2b4', label: 'Default (Cartesia)' },
  { value: 'a0e99841-438c-4a64-b679-ae501e7d6091', label: 'Katie' },
  { value: '79a125e8-cd45-465c-985b-b9dfbfdb32fe', label: 'British Lady' },
  { value: 'a167e0f3-df7e-4d52-a9c3-f949145efdab', label: 'Customer Support Man' },
  { value: '3b554273-4299-48b9-9aaf-eefd438e3941', label: 'Indian Lady' },
  { value: 'e00d0e4c-a5c8-443f-a8a3-473eb9a62355', label: 'Friendly Sidekick' },
];

/** OpenAI built-in TTS voices (tts-1 / tts-1-hd subset; gpt-4o-mini-tts adds more). */
const OPENAI_TTS_VOICES: { value: string; label: string }[] = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'ash', label: 'Ash' },
  { value: 'ballad', label: 'Ballad' },
  { value: 'coral', label: 'Coral' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'sage', label: 'Sage' },
  { value: 'shimmer', label: 'Shimmer' },
];

/** Deepgram Aura-2 voices (model id = aura-2-{name}-en). Curated subset; see Deepgram TTS docs. */
const DEEPGRAM_TTS_VOICES: { value: string; label: string }[] = [
  { value: 'aura-2-helena-en', label: 'Helena (US, caring)' },
  { value: 'aura-2-thalia-en', label: 'Thalia (US, energetic)' },
  { value: 'aura-2-andromeda-en', label: 'Andromeda (US, expressive)' },
  { value: 'aura-2-apollo-en', label: 'Apollo (US, casual)' },
  { value: 'aura-2-arcas-en', label: 'Arcas (US, smooth)' },
  { value: 'aura-2-aries-en', label: 'Aries (US, warm)' },
  { value: 'aura-2-harmonia-en', label: 'Harmonia (US, customer service)' },
  { value: 'aura-2-orpheus-en', label: 'Orpheus (US, professional)' },
  { value: 'aura-2-luna-en', label: 'Luna (US, friendly)' },
  { value: 'aura-2-electra-en', label: 'Electra (US, engaging)' },
  { value: 'aura-2-draco-en', label: 'Draco (British)' },
  { value: 'aura-2-hyperion-en', label: 'Hyperion (Australian)' },
];

function defaultVoiceForTtsProvider(provider: string): string | null {
  if (provider === 'openai') return OPENAI_TTS_VOICES[0]?.value || null;
  if (provider === 'deepgram') return DEEPGRAM_TTS_VOICES[0]?.value || null;
  return CARTESIA_TTS_VOICES[0]?.value || null;
}

function profilesEqual(a: AgentProfileData, b: AgentProfileData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Seed real default actions into state instead of deriving them only for
 * display — a display-only fallback can't be the target of `updateAction`'s
 * edits, which is what silently discarded toggles on a fresh agent before. */
function withDefaultActions(p: AgentProfileData): AgentProfileData {
  return p.actions.length > 0 ? p : { ...p, actions: defaultAgentActions() };
}

export const AgentProfile: React.FC<Props> = ({
  profile,
  onUpdate,
  onTestAgent,
  saving,
}) => {
  const [local, setLocal] = useState(() => withDefaultActions(profile));
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
      setLocal(withDefaultActions(profile));
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
    void onUpdate({ ...local }).then((ok) => {
      // Save failed — keep the edit marked dirty so the next debounce/interval retries it,
      // instead of silently treating an unsaved edit as clean.
      if (!ok) dirtyRef.current = true;
    });
  }, [local, onUpdate]);

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
    // Flush the current draft (not just {isPublished: true}) through the same
    // save path as autosave, so an edit still sitting in the debounce window
    // isn't excluded from what goes live.
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    dirtyRef.current = false;
    const ok = await onUpdate({ ...local, isPublished: true, isEnabled: true });
    if (ok) {
      setToast('Agent published successfully!');
    } else {
      dirtyRef.current = true;
      setToast('Failed to publish. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full max-w-4xl space-y-6 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Profile</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Setup the personality and the conversation rules of AI Agent
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {onTestAgent ? (
              <button
                type="button"
                onClick={onTestAgent}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/5 bg-white px-3 py-2 text-sm font-bold text-[#111827] hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Test Agent
              </button>
            ) : null}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                local.isPublished
                  ? 'bg-primary/10 text-primary'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {local.isPublished ? 'Published · Live' : 'Draft · Unpublished'}
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowPublishConfirm(true)}
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {local.isPublished ? 'Republish' : 'Publish'}
            </button>
          </div>
        </div>

        <section className="bg-white ring-1 ring-slate-200/80 rounded-xl p-5 relative">
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#6B7280] hover:text-primary transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="group relative shrink-0"
                aria-label="Change bot image"
              >
                {local.avatarUrl ? (
                  <img
                    src={local.avatarUrl}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover border border-black/5"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-black/5">
                    <Bot className="w-8 h-8" />
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-primary-hover/40 group-hover:opacity-100 text-[10px] font-bold">
                  Edit
                </span>
              </button>
              <div className="pr-16">
                <h3 className="text-lg font-bold text-[#111827]">{local.name}</h3>
                <p className="text-sm text-[#6B7280] mt-1">{local.description}</p>
              </div>
            </div>
          </section>

          <section className="bg-white ring-1 ring-slate-200/80 rounded-xl p-5">
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
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-black/5 bg-white text-[#6B7280] hover:border-black/10'
                    }`}
                  >
                    {TONE_ICONS[opt.id]}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white ring-1 ring-slate-200/80 rounded-xl p-5">
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
                className="w-full appearance-none border border-black/5 rounded-lg py-2.5 pl-3 pr-9 text-sm text-[#111827] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
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

          <section className="bg-white ring-1 ring-slate-200/80 rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="knowledge-match-threshold"
                  className="text-sm font-medium text-[#111827]"
                >
                  Knowledge match threshold
                </label>
                <InfoTooltip text="Minimum embedding similarity to use Knowledge Base. Below this, the agent escalates instead of guessing." />
              </div>
              <span className="text-xs font-bold text-[#374151] tabular-nums">
                {Math.round(
                  (local.similarityLowThreshold ?? DEFAULT_SIMILARITY_LOW_THRESHOLD) * 100
                )}
                %
              </span>
            </div>
            <input
              id="knowledge-match-threshold"
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(
                (local.similarityLowThreshold ?? DEFAULT_SIMILARITY_LOW_THRESHOLD) * 100
              )}
              onChange={(e) =>
                patchLocal({ similarityLowThreshold: Number(e.target.value) / 100 })
              }
              className="mt-2 w-full accent-[var(--color-primary,#4f46e5)]"
            />
            <p className="mt-1.5 text-xs text-[#6B7280]">
              Default 70%. Higher = stricter KB matches; lower = more answers from weaker matches.
            </p>
          </section>

          <section className="bg-white ring-1 ring-slate-200/80 rounded-xl p-5 space-y-3">
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
                className="w-full border border-black/5 rounded-lg py-3 px-3 text-sm resize-y min-h-[200px] max-h-[400px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
                {/* ponytail: voice/call agent UI parked — set true to show again */}
                {false && (
                <div className="bg-white ring-1 ring-slate-200/80 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#111827]">Answer calls with AI Agent</h4>
                      <p className="text-xs text-[#6B7280] mt-1">
                        When a call link is sent on a conversation assigned to this agent, join the
                        LiveKit room and talk to the customer using this agent&apos;s Skills and
                        Knowledge Base.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={local.voiceAgentEnabled}
                      onClick={() =>
                        patchLocal({ voiceAgentEnabled: !local.voiceAgentEnabled })
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                        local.voiceAgentEnabled ? 'bg-primary' : 'bg-[#D1D5DB]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          local.voiceAgentEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {local.voiceAgentEnabled && (
                    <div className="mt-4 pt-4 border-t border-black/5 space-y-4">
                      <div>
                        <label
                          htmlFor="voice-stt-provider"
                          className="block text-sm font-medium text-[#111827] mb-1.5"
                        >
                          Speech-to-Text provider
                        </label>
                        <select
                          id="voice-stt-provider"
                          value={local.voiceSttProvider || VOICE_STT_PROVIDERS[0]?.value}
                          onChange={(e) => patchLocal({ voiceSttProvider: e.target.value })}
                          className="w-full max-w-xs rounded-lg bg-white ring-1 ring-slate-200/80 px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {VOICE_STT_PROVIDERS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="voice-tts-provider"
                          className="block text-sm font-medium text-[#111827] mb-1.5"
                        >
                          Text-to-Speech provider
                        </label>
                        <select
                          id="voice-tts-provider"
                          value={local.voiceTtsProvider || VOICE_TTS_PROVIDERS[0]?.value}
                          onChange={(e) => {
                            const provider = e.target.value;
                            patchLocal({
                              voiceTtsProvider: provider,
                              voiceTtsVoiceId: defaultVoiceForTtsProvider(provider),
                            });
                          }}
                          className="w-full max-w-xs rounded-lg bg-white ring-1 ring-slate-200/80 px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {VOICE_TTS_PROVIDERS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {(local.voiceTtsProvider || 'cartesia') === 'cartesia' && (
                        <div>
                          <label
                            htmlFor="voice-tts-voice-id"
                            className="block text-sm font-medium text-[#111827] mb-1.5"
                          >
                            Cartesia voice
                          </label>
                          <select
                            id="voice-tts-voice-id"
                            value={
                              local.voiceTtsVoiceId || CARTESIA_TTS_VOICES[0]?.value || ''
                            }
                            onChange={(e) =>
                              patchLocal({ voiceTtsVoiceId: e.target.value || null })
                            }
                            className="w-full max-w-xs rounded-lg bg-white ring-1 ring-slate-200/80 px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {CARTESIA_TTS_VOICES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {(local.voiceTtsProvider || 'cartesia') === 'openai' && (
                        <div>
                          <label
                            htmlFor="voice-tts-voice-id-openai"
                            className="block text-sm font-medium text-[#111827] mb-1.5"
                          >
                            OpenAI voice
                          </label>
                          <select
                            id="voice-tts-voice-id-openai"
                            value={
                              local.voiceTtsVoiceId || OPENAI_TTS_VOICES[0]?.value || ''
                            }
                            onChange={(e) =>
                              patchLocal({ voiceTtsVoiceId: e.target.value || null })
                            }
                            className="w-full max-w-xs rounded-lg bg-white ring-1 ring-slate-200/80 px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {OPENAI_TTS_VOICES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {(local.voiceTtsProvider || 'cartesia') === 'deepgram' && (
                        <div>
                          <label
                            htmlFor="voice-tts-voice-id-deepgram"
                            className="block text-sm font-medium text-[#111827] mb-1.5"
                          >
                            Deepgram Aura voice
                          </label>
                          <select
                            id="voice-tts-voice-id-deepgram"
                            value={
                              local.voiceTtsVoiceId || DEEPGRAM_TTS_VOICES[0]?.value || ''
                            }
                            onChange={(e) =>
                              patchLocal({ voiceTtsVoiceId: e.target.value || null })
                            }
                            className="w-full max-w-xs rounded-lg bg-white ring-1 ring-slate-200/80 px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {DEEPGRAM_TTS_VOICES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}
                {local.actions.map((action) => (
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
            )}          </section>

          <section className="bg-white ring-1 ring-slate-200/80 rounded-xl p-5">
            <label className="block text-sm font-medium text-[#111827] mb-2">
              Brand&apos;s background <span className="text-[#6B7280] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                value={local.brandBackground}
                onChange={(e) => patchLocal({ brandBackground: e.target.value.slice(0, 1200) })}
                placeholder="Enter brand information"
                rows={5}
                className="w-full border border-black/5 rounded-xl py-3 px-3 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {showPublishConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-black/5 shadow-2xl p-6">
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
                className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold"
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
