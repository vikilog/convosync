import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BellRing,
  Check,
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  Save,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

type EmailRecipients = {
  workspaceEmail: boolean;
  userIds: string[];
  extraEmails: string[];
};

type WhatsAppConfig = {
  enabled: boolean;
  phoneNumbers: string[];
  userIds: string[];
  templateId: string | null;
  variableMap: Record<string, string>;
};

type HumanHandoffChannels = {
  email: {
    enabled: boolean;
    recipients: EmailRecipients;
    subjectTemplate: string;
    bodyTemplate: string;
  };
  whatsapp: WhatsAppConfig;
  inApp: { enabled: boolean };
};

type Preference = {
  eventType: string;
  enabled: boolean;
  channels: HumanHandoffChannels;
};

type Member = { id: string; userId: string; name: string; email: string; phone?: string | null };

type WaTemplate = {
  id: string;
  name: string;
  status: string;
  language?: string;
  variables?: string[];
  bodyPattern?: string;
};

const EVENT_VAR_OPTIONS = [
  { key: 'customer_name', label: 'Customer name', sample: 'Priya Sharma' },
  { key: 'customer_phone', label: 'Customer phone', sample: '+91 98765 43210' },
  { key: 'reason', label: 'Escalation reason', sample: 'Customer asked for a human' },
  { key: 'conversation_id', label: 'Conversation ID', sample: 'conv_8f2a…' },
  { key: 'agent_name', label: 'AI agent name', sample: 'Sara' },
  { key: 'intent', label: 'Detected intent', sample: 'human_request' },
] as const;

const DEFAULT_SUBJECT = 'Human handoff needed — {{customer_name}}';
const DEFAULT_BODY =
  'AI agent escalated a conversation.\n\n' +
  'Reason: {{reason}}\n' +
  'Customer: {{customer_name}} ({{customer_phone}})\n' +
  'Conversation ID: {{conversation_id}}';

const SAMPLE_VARS: Record<string, string> = Object.fromEntries(
  EVENT_VAR_OPTIONS.map((v) => [v.key, v.sample])
);

function defaultChannels(): HumanHandoffChannels {
  return {
    email: {
      enabled: true,
      recipients: { workspaceEmail: true, userIds: [], extraEmails: [] },
      subjectTemplate: DEFAULT_SUBJECT,
      bodyTemplate: DEFAULT_BODY,
    },
    whatsapp: {
      enabled: false,
      phoneNumbers: [],
      userIds: [],
      templateId: null,
      variableMap: {},
    },
    inApp: { enabled: true },
  };
}

function isApproved(status: string) {
  return status === 'Approved' || status === 'approved';
}

function applyPreview(template: string): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => SAMPLE_VARS[key] ?? `{{${key}}}`);
}

function Switch({
  checked,
  onChange,
  id,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  id: string;
  label: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swiss-accent ${
        checked ? 'bg-swiss-accent' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-sm text-dark-navy placeholder:text-slate-400 transition-colors duration-200 focus:border-swiss-accent/40 focus:outline-none focus:ring-2 focus:ring-swiss-accent/15';

export function NotificationsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [workspaceEmail, setWorkspaceEmail] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [channels, setChannels] = useState<HumanHandoffChannels>(defaultChannels);
  const [extraEmailsText, setExtraEmailsText] = useState('');
  const [waPhonesText, setWaPhonesText] = useState('');
  const [focusField, setFocusField] = useState<'subject' | 'body'>('body');
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const approvedTemplates = useMemo(
    () => templates.filter((t) => t.id && isApproved(t.status)),
    [templates]
  );

  const selectedTemplate = useMemo(
    () => approvedTemplates.find((t) => t.id === channels.whatsapp.templateId) ?? null,
    [approvedTemplates, channels.whatsapp.templateId]
  );

  const emailPreviewSubject = useMemo(
    () => applyPreview(channels.email.subjectTemplate || DEFAULT_SUBJECT),
    [channels.email.subjectTemplate]
  );
  const emailPreviewBody = useMemo(
    () => applyPreview(channels.email.bodyTemplate || DEFAULT_BODY),
    [channels.email.bodyTemplate]
  );

  const activeChannelCount = useMemo(() => {
    let n = 0;
    if (channels.email.enabled) n += 1;
    if (channels.whatsapp.enabled) n += 1;
    return n;
  }, [channels.email.enabled, channels.whatsapp.enabled]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notif, memberList, company, tmplRes] = await Promise.all([
        api.getNotificationPreferences() as Promise<{ preferences: Preference[] }>,
        api.getWorkspaceMembers() as Promise<Member[]>,
        api.getCompanySettings() as Promise<{ email?: string | null }>,
        api.getTemplates().catch(() => []) as Promise<WaTemplate[] | { templates?: WaTemplate[] }>,
      ]);
      const handoff =
        notif.preferences.find((p) => p.eventType === 'human_handoff') ??
        ({ eventType: 'human_handoff', enabled: true, channels: defaultChannels() } as Preference);
      const ch = handoff.channels ?? defaultChannels();
      setEnabled(handoff.enabled);
      setChannels({
        email: {
          enabled: ch.email?.enabled !== false,
          recipients: {
            workspaceEmail: ch.email?.recipients?.workspaceEmail !== false,
            userIds: ch.email?.recipients?.userIds ?? [],
            extraEmails: ch.email?.recipients?.extraEmails ?? [],
          },
          subjectTemplate: ch.email?.subjectTemplate?.trim() || DEFAULT_SUBJECT,
          bodyTemplate: ch.email?.bodyTemplate?.trim() || DEFAULT_BODY,
        },
        whatsapp: {
          enabled: ch.whatsapp?.enabled === true,
          phoneNumbers: ch.whatsapp?.phoneNumbers ?? [],
          userIds: ch.whatsapp?.userIds ?? [],
          templateId: ch.whatsapp?.templateId ?? null,
          variableMap: ch.whatsapp?.variableMap ?? {},
        },
        inApp: { enabled: ch.inApp?.enabled !== false },
      });
      setExtraEmailsText((ch.email?.recipients?.extraEmails ?? []).join(', '));
      setWaPhonesText((ch.whatsapp?.phoneNumbers ?? []).join(', '));
      setMembers(memberList);
      setWorkspaceEmail(company.email?.trim() || null);
      const list = Array.isArray(tmplRes)
        ? tmplRes
        : Array.isArray((tmplRes as { templates?: WaTemplate[] }).templates)
          ? (tmplRes as { templates: WaTemplate[] }).templates
          : [];
      setTemplates(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    if (focusField === 'subject') {
      const el = subjectRef.current;
      const value = channels.email.subjectTemplate;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? value.length;
      const next = value.slice(0, start) + token + value.slice(end);
      setChannels((c) => ({ ...c, email: { ...c.email, subjectTemplate: next } }));
      requestAnimationFrame(() => {
        el?.focus();
        const pos = start + token.length;
        el?.setSelectionRange(pos, pos);
      });
    } else {
      const el = bodyRef.current;
      const value = channels.email.bodyTemplate;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? value.length;
      const next = value.slice(0, start) + token + value.slice(end);
      setChannels((c) => ({ ...c, email: { ...c.email, bodyTemplate: next } }));
      requestAnimationFrame(() => {
        el?.focus();
        const pos = start + token.length;
        el?.setSelectionRange(pos, pos);
      });
    }
  };

  const toggleEmailUser = (userId: string) => {
    setChannels((prev) => {
      const ids = prev.email.recipients.userIds;
      const next = ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId];
      return {
        ...prev,
        email: { ...prev.email, recipients: { ...prev.email.recipients, userIds: next } },
      };
    });
  };

  const toggleWaUser = (userId: string) => {
    setChannels((prev) => {
      const ids = prev.whatsapp.userIds;
      const next = ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId];
      return { ...prev, whatsapp: { ...prev.whatsapp, userIds: next } };
    });
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const extraEmails = extraEmailsText
        .split(/[,;\s]+/)
        .map((em) => em.trim().toLowerCase())
        .filter(Boolean);
      const phoneNumbers = waPhonesText
        .split(/[,;\s]+/)
        .map((p) => p.trim())
        .filter((p) => p.replace(/\D/g, '').length >= 8);
      const payload = {
        eventType: 'human_handoff',
        enabled,
        channels: {
          email: {
            enabled: channels.email.enabled,
            recipients: {
              workspaceEmail: channels.email.recipients.workspaceEmail,
              userIds: channels.email.recipients.userIds,
              extraEmails,
            },
            subjectTemplate: channels.email.subjectTemplate.trim() || DEFAULT_SUBJECT,
            bodyTemplate: channels.email.bodyTemplate.trim() || DEFAULT_BODY,
          },
          whatsapp: {
            enabled: channels.whatsapp.enabled,
            phoneNumbers,
            userIds: channels.whatsapp.userIds,
            templateId: channels.whatsapp.templateId,
            variableMap: channels.whatsapp.variableMap,
          },
          inApp: { enabled: channels.inApp.enabled },
        },
      };
      const res = (await api.updateNotificationPreferences(payload)) as {
        preference: Preference;
      };
      setEnabled(res.preference.enabled);
      setChannels(res.preference.channels);
      setExtraEmailsText(res.preference.channels.email.recipients.extraEmails.join(', '));
      setWaPhonesText(res.preference.channels.whatsapp.phoneNumbers.join(', '));
      setMessage('Notification settings saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading notification settings…
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void save(e)} className="w-full space-y-4">
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
      {message ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{message}</span>
        </div>
      ) : null}

      {/* Event hero */}
      <section className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-green-bg text-swiss-accent">
              <BellRing className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-dark-navy">
                  Human handoff
                </h2>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  escalate_to_human
                </span>
              </div>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
                Alert your team when an AI agent escalates a conversation. In-app inbox updates
                always fire for online agents.
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {enabled
                  ? `${activeChannelCount} channel${activeChannelCount === 1 ? '' : 's'} active`
                  : 'Alerts paused for this event'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="text-sm font-medium text-slate-600">
              {enabled ? 'On' : 'Off'}
            </span>
            <Switch
              id="handoff-enabled"
              label="Enable human handoff notifications"
              checked={enabled}
              onChange={setEnabled}
            />
          </div>
        </div>
      </section>

      <div
        className={`grid gap-3 lg:grid-cols-2 ${enabled ? '' : 'pointer-events-none opacity-45'}`}
        aria-disabled={!enabled}
      >
        {/* Email channel */}
        <section
          className={`flex flex-col rounded-2xl border bg-white transition-colors duration-200 ${
            channels.email.enabled
              ? 'border-swiss-accent/25 ring-1 ring-swiss-accent/10'
              : 'border-border-subtle'
          }`}
        >
          <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  channels.email.enabled
                    ? 'bg-swiss-accent text-white'
                    : 'bg-white text-slate-500'
                }`}
              >
                <Mail className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-bold text-dark-navy">Email</h3>
                <p className="text-xs text-slate-500">Subject, body & recipients</p>
              </div>
            </div>
            <Switch
              id="email-channel"
              label="Enable email notifications"
              checked={channels.email.enabled}
              onChange={(next) =>
                setChannels((c) => ({ ...c, email: { ...c.email, enabled: next } }))
              }
            />
          </header>

          <div
            className={`flex flex-1 flex-col gap-5 p-5 ${
              channels.email.enabled ? '' : 'pointer-events-none opacity-40'
            }`}
          >
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                Insert variable
              </p>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_VAR_OPTIONS.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="cursor-pointer rounded-lg border border-border-subtle bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 transition-colors duration-200 hover:border-swiss-accent/30 hover:bg-accent-green-bg hover:text-swiss-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swiss-accent"
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="email-subject">Subject</FieldLabel>
              <Input
                ref={subjectRef}
                id="email-subject"
                type="text"
                value={channels.email.subjectTemplate}
                onFocus={() => setFocusField('subject')}
                onChange={(e) =>
                  setChannels((c) => ({
                    ...c,
                    email: { ...c.email, subjectTemplate: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel htmlFor="email-body">Body</FieldLabel>
              <Textarea
                ref={bodyRef}
                id="email-body"
                rows={6}
                value={channels.email.bodyTemplate}
                onFocus={() => setFocusField('body')}
                onChange={(e) =>
                  setChannels((c) => ({
                    ...c,
                    email: { ...c.email, bodyTemplate: e.target.value },
                  }))
                }
                className={`min-h-0 ${inputClass} resize-y font-mono text-[13px] leading-relaxed`}
              />
            </div>

            <div className="rounded-xl border border-dashed border-border-strong/60 bg-white px-4 py-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Preview
              </div>
              <p className="text-sm font-semibold text-dark-navy">{emailPreviewSubject}</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-600">
                {emailPreviewBody}
              </pre>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                <Users className="h-3.5 w-3.5" aria-hidden />
                Recipients
              </div>

              <button
                type="button"
                onClick={() =>
                  setChannels((c) => ({
                    ...c,
                    email: {
                      ...c.email,
                      recipients: {
                        ...c.email.recipients,
                        workspaceEmail: !c.email.recipients.workspaceEmail,
                      },
                    },
                  }))
                }
                className={`mb-2 flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swiss-accent ${
                  channels.email.recipients.workspaceEmail
                    ? 'border-swiss-accent/30 bg-accent-green-bg'
                    : 'border-border-subtle bg-white hover:bg-surface'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    channels.email.recipients.workspaceEmail
                      ? 'border-swiss-accent bg-swiss-accent text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {channels.email.recipients.workspaceEmail ? (
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-dark-navy">Company email</span>
                  <span className="block truncate text-xs text-slate-500">
                    {workspaceEmail || 'Not set — add under Company info'}
                  </span>
                </span>
              </button>

              {members.length > 0 ? (
                <ul className="mb-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border-subtle bg-white p-1.5">
                  {members.map((m) => {
                    const on = channels.email.recipients.userIds.includes(m.userId);
                    return (
                      <li key={`em-${m.userId}`}>
                        <button
                          type="button"
                          onClick={() => toggleEmailUser(m.userId)}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 ${
                            on ? 'bg-white ring-1 ring-swiss-accent/20' : 'hover:bg-white/70'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              on ? 'border-swiss-accent bg-swiss-accent text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {on ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-dark-navy">{m.name}</span>
                            <span className="block truncate text-xs text-slate-500">{m.email}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <FieldLabel htmlFor="extra-emails">Extra emails</FieldLabel>
              <Input
                id="extra-emails"
                type="text"
                value={extraEmailsText}
                onChange={(e) => setExtraEmailsText(e.target.value)}
                placeholder="oncall@brand.com, ops@brand.com"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* WhatsApp channel */}
        <section
          className={`flex flex-col rounded-2xl border bg-white transition-colors duration-200 ${
            channels.whatsapp.enabled
              ? 'border-channel-green/40 ring-1 ring-channel-green/15'
              : 'border-border-subtle'
          }`}
        >
          <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  channels.whatsapp.enabled
                    ? 'bg-channel-green text-white'
                    : 'bg-white text-slate-500'
                }`}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-bold text-dark-navy">WhatsApp</h3>
                <p className="text-xs text-slate-500">Page on-call via Meta template</p>
              </div>
            </div>
            <Switch
              id="wa-channel"
              label="Enable WhatsApp notifications"
              checked={channels.whatsapp.enabled}
              onChange={(next) =>
                setChannels((c) => ({
                  ...c,
                  whatsapp: { ...c.whatsapp, enabled: next },
                }))
              }
            />
          </header>

          <div
            className={`flex flex-1 flex-col gap-5 p-5 ${
              channels.whatsapp.enabled ? '' : 'pointer-events-none opacity-40'
            }`}
          >
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3 text-xs leading-relaxed text-amber-950">
              Uses your business WABA. Free-form text cannot page staff — pick an approved{' '}
              <strong className="font-semibold">UTILITY</strong> template with placeholders for
              the alert.
            </div>

            <div>
              <FieldLabel htmlFor="wa-phones">On-call phone numbers</FieldLabel>
              <Input
                id="wa-phones"
                type="text"
                value={waPhonesText}
                onChange={(e) => setWaPhonesText(e.target.value)}
                placeholder="+919876543210, +918888777666"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-slate-500">Comma-separated E.164 numbers.</p>
            </div>

            {members.some((m) => m.phone) ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                  Team phones
                </p>
                <ul className="max-h-28 space-y-1 overflow-y-auto rounded-xl border border-border-subtle bg-white p-1.5">
                  {members
                    .filter((m) => m.phone)
                    .map((m) => {
                      const on = channels.whatsapp.userIds.includes(m.userId);
                      return (
                        <li key={`wa-${m.userId}`}>
                          <button
                            type="button"
                            onClick={() => toggleWaUser(m.userId)}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 ${
                              on ? 'bg-white ring-1 ring-channel-green/25' : 'hover:bg-white/70'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                on
                                  ? 'border-channel-green bg-channel-green text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {on ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-dark-navy">
                                {m.name}
                              </span>
                              <span className="block truncate text-xs text-slate-500">{m.phone}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No team phones on file — enter numbers above, or set phone on member profiles.
              </p>
            )}

            <div>
              <FieldLabel htmlFor="wa-template">Approved Meta template</FieldLabel>
              <select
                id="wa-template"
                value={channels.whatsapp.templateId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const tmpl = approvedTemplates.find((t) => t.id === id);
                  const variableMap: Record<string, string> = {};
                  const vars = tmpl?.variables ?? [];
                  const defaults = [
                    'customer_name',
                    'reason',
                    'customer_phone',
                    'conversation_id',
                  ];
                  vars.forEach((v, i) => {
                    variableMap[v] = defaults[i] ?? 'reason';
                  });
                  setChannels((c) => ({
                    ...c,
                    whatsapp: { ...c.whatsapp, templateId: id, variableMap },
                  }));
                }}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Select template…</option>
                {approvedTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.language ? ` (${t.language})` : ''}
                  </option>
                ))}
              </select>
              {approvedTemplates.length === 0 ? (
                <p className="mt-1.5 text-xs font-medium text-amber-800">
                  No approved templates yet. Create or sync one under Templates.
                </p>
              ) : null}
            </div>

            {selectedTemplate && (selectedTemplate.variables?.length ?? 0) > 0 ? (
              <div className="space-y-3 rounded-xl border border-border-subtle bg-white p-3.5">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                  Map template variables
                </p>
                {(selectedTemplate.variables ?? []).map((tv) => (
                  <div key={tv} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2">
                    <code className="truncate rounded-lg bg-white px-2 py-1.5 font-mono text-xs text-slate-700 ring-1 ring-border-subtle">
                      {tv}
                    </code>
                    <select
                      aria-label={`Map ${tv}`}
                      value={channels.whatsapp.variableMap[tv] ?? ''}
                      onChange={(e) =>
                        setChannels((c) => ({
                          ...c,
                          whatsapp: {
                            ...c.whatsapp,
                            variableMap: {
                              ...c.whatsapp.variableMap,
                              [tv]: e.target.value,
                            },
                          },
                        }))
                      }
                      className={`${inputClass} cursor-pointer py-1.5`}
                    >
                      <option value="">—</option>
                      {EVENT_VAR_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {selectedTemplate.bodyPattern ? (
                  <p className="border-t border-border-subtle pt-3 text-[11px] leading-relaxed text-slate-500">
                    Template body: {selectedTemplate.bodyPattern}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.2)] backdrop-blur-sm">
        <p className="text-xs text-slate-500">
          Applies on the next <span className="font-medium text-slate-700">escalate_to_human</span>
        </p>
        <button type="submit" disabled={saving} className="btn-swiss-accent min-h-11 px-5">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          Save changes
        </button>
      </div>
    </form>
  );
}
