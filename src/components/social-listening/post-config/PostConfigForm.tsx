import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  MOCK_FUNNELS,
  MOCK_SKILLS,
  TONE_OPTIONS,
  type PostConfigValues,
  type ReplyToneOption,
} from './mockPostConfig';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-swiss-faint">
      {children}
    </span>
  );
}

export function PostConfigForm({
  values,
  onChange,
  onSave,
  saving,
}: {
  values: PostConfigValues;
  onChange: (next: PostConfigValues) => void;
  onSave: () => void;
  saving?: boolean;
}) {
  const patch = <K extends keyof PostConfigValues>(key: K, value: PostConfigValues[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <section className="bg-white border border-swiss-line p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-semibold text-gray-950">Manual configuration</h3>
      <p className="mt-0.5 text-xs text-swiss-muted">
        Funnel, agent skill, and reply tone for this post.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block">
          <FieldLabel>Lead funnel</FieldLabel>
          <select
            value={values.funnelId || ''}
            onChange={(e) => patch('funnelId', e.target.value || null)}
            className="mt-1.5 w-full cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-swiss-ink outline-none focus:ring-2 focus:ring-swiss-accent/20"
          >
            <option value="">Select funnel…</option>
            {MOCK_FUNNELS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <FieldLabel>Agent skill</FieldLabel>
          <select
            value={values.skillId || ''}
            onChange={(e) => patch('skillId', e.target.value || null)}
            className="mt-1.5 w-full cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-swiss-ink outline-none focus:ring-2 focus:ring-swiss-accent/20"
          >
            <option value="">None (default prompts)</option>
            {MOCK_SKILLS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} · {s.agentName}
              </option>
            ))}
          </select>
        </label>

        <div>
          <FieldLabel>Reply tone</FieldLabel>
          <div className="mt-1.5 inline-flex w-full rounded-xl bg-white p-0.5">
            {TONE_OPTIONS.map((t) => {
              const active = values.tone === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => patch('tone', t.value as ReplyToneOption)}
                  className={`flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? 'bg-white text-swiss-ink '
                      : 'text-swiss-muted hover:text-swiss-ink'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={saving || !values.funnelId}
        onClick={onSave}
        className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-swiss-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-swiss-accent-hover disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          'Save Configuration'
        )}
      </button>
      {!values.funnelId && (
        <p className="mt-2 text-center text-[11px] font-medium text-swiss-faint">
          Select a funnel to save.
        </p>
      )}
    </section>
  );
}
