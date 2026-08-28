import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export type SocialListeningSettingsState = {
  autoResponseEnabled: boolean;
  leadFunnelId: string | null;
  interestedMode: 'auto' | 'review' | 'off';
  questionMode: 'auto' | 'review' | 'off';
  complaintMode: 'review' | 'escalate_only';
  spamMode: 'auto_ignore' | 'review';
  confidenceThreshold: number;
  publicReplyTone: 'friendly' | 'professional' | 'playful';
  dmAgentSkillId: string | null;
  fallbackMessage: string | null;
  leadCreationRule: 'interested_only' | 'interested_and_questions' | 'never';
  maxAutoDmsPerDay: number;
  workingHoursOnly: boolean;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  autoDmsSentToday: number;
};

export type SkillOption = {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
};

export const AGENT_SETTINGS_DEFAULTS: SocialListeningSettingsState = {
  autoResponseEnabled: false,
  leadFunnelId: null,
  interestedMode: 'review',
  questionMode: 'review',
  complaintMode: 'review',
  spamMode: 'review',
  confidenceThreshold: 80,
  publicReplyTone: 'friendly',
  dmAgentSkillId: null,
  fallbackMessage: null,
  leadCreationRule: 'interested_only',
  maxAutoDmsPerDay: 50,
  workingHoursOnly: false,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  autoDmsSentToday: 0,
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-swiss-faint">
      {children}
    </span>
  );
}

export function SocialListeningAgentSettingsForm({
  draft,
  setDraft,
  skills,
  funnels,
  error,
  onError,
}: {
  draft: SocialListeningSettingsState;
  setDraft: React.Dispatch<React.SetStateAction<SocialListeningSettingsState>>;
  skills: SkillOption[];
  funnels: Array<{ id: string; name: string }>;
  error: string | null;
  onError: (msg: string | null) => void;
}) {
  const patch = <K extends keyof SocialListeningSettingsState>(
    key: K,
    value: SocialListeningSettingsState[K]
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const autoWarning = useMemo(() => {
    if (!draft.autoResponseEnabled) return false;
    return draft.interestedMode === 'auto' || draft.questionMode === 'auto';
  }, [draft]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-surface-muted/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-swiss-ink">Agent</h3>
            <p className="mt-1 text-xs leading-relaxed text-swiss-muted">
              {draft.autoResponseEnabled
                ? 'On: matching comments on this post can be handled automatically.'
                : 'Off (safe): every comment on this post stays in the review queue.'}
            </p>
          </div>
          <Toggle
            checked={draft.autoResponseEnabled}
            onChange={(v) => {
              if (v && !draft.leadFunnelId) {
                onError(
                  'Select a lead funnel below before enabling the agent (create one under Leads first).'
                );
                return;
              }
              onError(null);
              patch('autoResponseEnabled', v);
            }}
            label="Enable agent"
          />
        </div>
      </section>

      <section>
        <FieldLabel>Lead funnel (required for agent)</FieldLabel>
        <p className="mt-1 text-xs text-swiss-muted">
          Leads from this post go into the selected funnel.
        </p>
        {funnels.length === 0 ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900">
            No funnels yet. Create one under <strong>Leads</strong> before enabling the agent.
          </p>
        ) : (
          <select
            value={draft.leadFunnelId || ''}
            onChange={(e) => {
              const id = e.target.value || null;
              onError(null);
              setDraft((d) => ({
                ...d,
                leadFunnelId: id,
                autoResponseEnabled: id ? d.autoResponseEnabled : false,
              }));
            }}
            className="mt-2 w-full cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-swiss-ink outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select funnel…</option>
            {funnels.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
      </section>

      {autoWarning && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Comments matching these rules will be handled without human review (public reply + DM).
          </span>
        </div>
      )}

      <section>
        <FieldLabel>Automation by intent</FieldLabel>
        <div className="mt-2 overflow-hidden rounded-xl border border-swiss-line">
          {(
            [
              {
                key: 'interestedMode' as const,
                label: 'Interested',
                options: [
                  { value: 'auto', label: 'Auto' },
                  { value: 'review', label: 'Review' },
                  { value: 'off', label: 'Off' },
                ],
              },
              {
                key: 'questionMode' as const,
                label: 'Question',
                options: [
                  { value: 'auto', label: 'Auto' },
                  { value: 'review', label: 'Review' },
                  { value: 'off', label: 'Off' },
                ],
              },
              {
                key: 'complaintMode' as const,
                label: 'Complaint',
                options: [
                  { value: 'review', label: 'Review' },
                  { value: 'escalate_only', label: 'Escalate' },
                ],
              },
              {
                key: 'spamMode' as const,
                label: 'Spam',
                options: [
                  { value: 'auto_ignore', label: 'Auto-ignore' },
                  { value: 'review', label: 'Review' },
                ],
              },
            ] as const
          ).map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 border-b border-swiss-line bg-white px-3 py-2.5 last:border-b-0"
            >
              <span className="text-sm font-semibold text-swiss-ink">{row.label}</span>
              <select
                value={draft[row.key]}
                onChange={(e) =>
                  patch(row.key, e.target.value as SocialListeningSettingsState[typeof row.key])
                }
                className="rounded-lg border border-swiss-line bg-slate-50 px-2 py-1.5 text-xs font-semibold text-swiss-ink outline-none"
              >
                {row.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-swiss-faint">
          Complaints never auto-DM — only Review or Escalate.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Confidence threshold</FieldLabel>
          <span className="text-xs font-bold text-swiss-ink">{draft.confidenceThreshold}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={draft.confidenceThreshold}
          onChange={(e) => patch('confidenceThreshold', Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-primary,#4f46e5)]"
        />
        <p className="mt-1 text-xs text-swiss-muted">
          Auto-respond only above {draft.confidenceThreshold}% confidence.
        </p>
      </section>

      <section className="space-y-3">
        <FieldLabel>Message settings</FieldLabel>
        <label className="block">
          <span className="text-xs font-semibold text-swiss-muted">Public reply tone</span>
          <select
            value={draft.publicReplyTone}
            onChange={(e) =>
              patch(
                'publicReplyTone',
                e.target.value as SocialListeningSettingsState['publicReplyTone']
              )
            }
            className="mt-1 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="playful">Playful</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-swiss-muted">DM Agent Skill</span>
          <select
            value={draft.dmAgentSkillId || ''}
            onChange={(e) => patch('dmAgentSkillId', e.target.value || null)}
            className="mt-1 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">None (default prompts)</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} · {s.agentName}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-swiss-muted">Fallback message</span>
          <Textarea
            value={draft.fallbackMessage || ''}
            onChange={(e) => patch('fallbackMessage', e.target.value || null)}
            rows={3}
            placeholder="Used for DM if AI generation fails"
            className="min-h-0 mt-1 w-full resize-none rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </section>

      <section>
        <FieldLabel>Lead creation</FieldLabel>
        <select
          value={draft.leadCreationRule}
          onChange={(e) =>
            patch(
              'leadCreationRule',
              e.target.value as SocialListeningSettingsState['leadCreationRule']
            )
          }
          className="mt-2 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="interested_only">Interested comments only</option>
          <option value="interested_and_questions">Interested + Questions</option>
          <option value="never">Never create leads</option>
        </select>
      </section>

      <section className="space-y-3">
        <FieldLabel>Safety limits</FieldLabel>
        <label className="block">
          <span className="text-xs font-semibold text-swiss-muted">Max auto-DMs per day (this post)</span>
          <Input
            type="number"
            min={0}
            max={10000}
            value={draft.maxAutoDmsPerDay}
            onChange={(e) => patch('maxAutoDmsPerDay', Math.max(0, Number(e.target.value) || 0))}
            className="h-auto mt-1 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-[11px] text-swiss-faint">
            Sent today: {draft.autoDmsSentToday} / {draft.maxAutoDmsPerDay}
          </p>
        </label>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted/50 px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold text-swiss-ink">Working hours only</p>
            <p className="text-[11px] text-swiss-faint">
              Outside the window, auto-eligible comments go to review.
            </p>
          </div>
          <Toggle
            checked={draft.workingHoursOnly}
            onChange={(v) => patch('workingHoursOnly', v)}
            label="Working hours only"
          />
        </div>
        {draft.workingHoursOnly && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-semibold text-swiss-muted">Start</span>
              <Input
                type="time"
                value={draft.workingHoursStart || '09:00'}
                onChange={(e) => patch('workingHoursStart', e.target.value)}
                className="h-auto mt-1 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-swiss-muted">End</span>
              <Input
                type="time"
                value={draft.workingHoursEnd || '18:00'}
                onChange={(e) => patch('workingHoursEnd', e.target.value)}
                className="h-auto mt-1 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
