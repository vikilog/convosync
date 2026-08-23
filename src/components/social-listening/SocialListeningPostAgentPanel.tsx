import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Route } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { slKeys } from './hooks/useSocialListeningQueries';
import { useIgJourneys } from '../../modules/instagram-automation/hooks/useIgJourneys';
import {
  AGENT_SETTINGS_DEFAULTS,
  SocialListeningAgentSettingsForm,
  type SkillOption,
  type SocialListeningSettingsState,
} from './SocialListeningAgentSettingsForm';

function mapSettings(s: Record<string, unknown>): SocialListeningSettingsState {
  return {
    autoResponseEnabled: Boolean(s.autoResponseEnabled),
    leadFunnelId: (s.leadFunnelId as string | null) ?? null,
    interestedMode: (s.interestedMode as SocialListeningSettingsState['interestedMode']) || 'review',
    questionMode: (s.questionMode as SocialListeningSettingsState['questionMode']) || 'review',
    complaintMode: (s.complaintMode as SocialListeningSettingsState['complaintMode']) || 'review',
    spamMode: (s.spamMode as SocialListeningSettingsState['spamMode']) || 'review',
    confidenceThreshold: Number(s.confidenceThreshold ?? 80),
    publicReplyTone:
      (s.publicReplyTone as SocialListeningSettingsState['publicReplyTone']) || 'friendly',
    dmAgentSkillId: (s.dmAgentSkillId as string | null) ?? null,
    fallbackMessage: (s.fallbackMessage as string | null) ?? null,
    leadCreationRule:
      (s.leadCreationRule as SocialListeningSettingsState['leadCreationRule']) ||
      'interested_only',
    maxAutoDmsPerDay: Number(s.maxAutoDmsPerDay ?? 50),
    workingHoursOnly: Boolean(s.workingHoursOnly),
    workingHoursStart: (s.workingHoursStart as string | null) || '09:00',
    workingHoursEnd: (s.workingHoursEnd as string | null) || '18:00',
    autoDmsSentToday: Number(s.autoDmsSentToday ?? 0),
  };
}

export function SocialListeningPostAgentPanel({
  postId,
  platform = 'instagram',
  onSaved,
}: {
  postId: string;
  /** Instagram Automation (journey trigger) is Instagram-only — hidden for Facebook posts. */
  platform?: 'instagram' | 'facebook';
  onSaved?: (leadFunnelId: string | null) => void;
}) {
  const qc = useQueryClient();
  const igJourneys = useIgJourneys();
  const [draft, setDraft] = useState<SocialListeningSettingsState>(AGENT_SETTINGS_DEFAULTS);
  const [commentJourneyId, setCommentJourneyId] = useState<string>('');
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [funnels, setFunnels] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const publishedJourneys = useMemo(
    () => (igJourneys.data ?? []).filter((j) => j.status === 'published'),
    [igJourneys.data]
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [res, funnelRes] = await Promise.all([
          api.getSocialListeningPostSettings(postId),
          api.getLeadFunnels(),
        ]);
        if (cancelled) return;
        setDraft(mapSettings(res.settings as unknown as Record<string, unknown>));
        setCommentJourneyId(res.settings.commentAutomationJourneyId ?? '');
        setSkills(res.dmSkillOptions);
        setFunnels(funnelRes.funnels.map((f) => ({ id: f.id, name: f.name })));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load agent settings');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const save = async () => {
    // The Save button's disabled state lags a tick behind a fast
    // double-click — this ref rejects the second invocation synchronously,
    // before React has re-rendered, so two identical PATCHes don't race.
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateSocialListeningPostSettings(postId, {
        autoResponseEnabled: draft.autoResponseEnabled,
        leadFunnelId: draft.leadFunnelId,
        interestedMode: draft.interestedMode,
        questionMode: draft.questionMode,
        complaintMode: draft.complaintMode,
        spamMode: draft.spamMode,
        confidenceThreshold: draft.confidenceThreshold,
        publicReplyTone: draft.publicReplyTone,
        dmAgentSkillId: draft.dmAgentSkillId || null,
        fallbackMessage: draft.fallbackMessage?.trim() || null,
        leadCreationRule: draft.leadCreationRule,
        maxAutoDmsPerDay: draft.maxAutoDmsPerDay,
        workingHoursOnly: draft.workingHoursOnly,
        workingHoursStart: draft.workingHoursOnly ? draft.workingHoursStart : null,
        workingHoursEnd: draft.workingHoursOnly ? draft.workingHoursEnd : null,
        commentAutomationJourneyId: commentJourneyId || null,
      });
      setDraft(mapSettings(res.settings as unknown as Record<string, unknown>));
      setCommentJourneyId(
        (res.settings.commentAutomationJourneyId as string | null | undefined) ?? ''
      );
      setToast('Comment handling saved');
      onSaved?.(
        (res.settings.leadFunnelId as string | null | undefined) ?? null
      );
      void qc.invalidateQueries({ queryKey: [...slKeys.all, 'post-automation'] });
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Save failed';
      try {
        const parsed = JSON.parse(message) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        /* keep */
      }
      setError(message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/5 px-3.5 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            <Bot className="h-3.5 w-3.5" />
            This post
          </p>
          <h2 className="text-sm font-black text-gray-950">Comment handling</h2>
        </div>
        <button
          type="button"
          disabled={loading || saving}
          onClick={() => void save()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3.5">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {platform === 'instagram' && (
              <div className="rounded-xl bg-surface-muted/40 p-3">
                <div className="flex items-start gap-2">
                  <Route className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">Instagram Automation</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Start a published automation when someone comments on this post. Leave off to
                      use global Comment-on-post triggers (keyword match) instead.
                    </p>
                    <label className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                      Automation
                      <select
                        className="mt-1 w-full cursor-pointer rounded-lg bg-white ring-1 ring-slate-200/80 px-2.5 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-sky-200 focus:ring-2 focus:ring-sky-100"
                        value={commentJourneyId}
                        onChange={(e) => setCommentJourneyId(e.target.value)}
                      >
                        <option value="">Off — no post-specific automation</option>
                        {publishedJourneys.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {publishedJourneys.length === 0 && (
                      <p className="mt-1.5 text-xs text-amber-700">
                        Publish an Instagram Automation with a Comment on post trigger first.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                AI Agent (Social Listening)
              </p>
              <SocialListeningAgentSettingsForm
                draft={draft}
                setDraft={setDraft}
                skills={skills}
                funnels={funnels}
                error={error}
                onError={setError}
              />
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </section>
  );
}
