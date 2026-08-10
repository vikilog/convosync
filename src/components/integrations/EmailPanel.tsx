/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Copy,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import {
  SesProviderFormFields,
  computeSesSenderEmail,
  splitSenderAgainstIdentities,
  type VerifiedIdentity,
} from './SesProviderFormFields';

type EmailTab = 'setup' | 'logs';

type EmailProviderConfig = {
  id: string;
  provider: 'CONVOSYNC_MANAGED' | 'RESEND' | 'AWS_SES' | 'SENDGRID' | 'SMTP';
  isDefault: boolean;
  status: string;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
  region?: string | null;
  senderEmail?: string | null;
  accessKeyIdMasked?: string | null;
  verifiedIdentities?: VerifiedIdentity[];
  identitiesFetchedAt?: string | null;
  sesConsoleUrl?: string | null;
  trackingStatus?: 'enabled' | 'error' | 'disabled' | null;
  trackingError?: string | null;
  configurationSetName?: string | null;
};

type ProviderFormType = EmailProviderConfig['provider'];

const PROVIDER_LABELS: Record<ProviderFormType, string> = {
  CONVOSYNC_MANAGED: 'ConvoSync',
  RESEND: 'Resend',
  AWS_SES: 'AWS SES',
  SENDGRID: 'SendGrid',
  SMTP: 'SMTP',
};

/** BYOP only — platform default is auto-seeded and must not reveal the vendor. */
const BYOP_PROVIDER_TYPES: ProviderFormType[] = ['RESEND', 'AWS_SES', 'SENDGRID', 'SMTP'];

/**
 * Minimal IAM for SES event tracking setup.
 * Keep in sync with SES_TRACKING_IAM_ACTIONS in backend ses-tracking.service.ts.
 */
const SES_TRACKING_IAM_POLICY_JSON = JSON.stringify(
  {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'ses:CreateConfigurationSet',
          'ses:CreateConfigurationSetEventDestination',
          'ses:DescribeConfigurationSet',
          'sns:CreateTopic',
          'sns:Subscribe',
        ],
        Resource: '*',
      },
    ],
  },
  null,
  2
);

function logProviderLabel(log: { provider: string; providerName: string | null }): string {
  const name = log.providerName ?? log.provider;
  if (
    name === 'ConvoSync' ||
    name === 'CONVOSYNC_MANAGED' ||
    name === 'WABIZ_MANAGED' ||
    log.provider === 'platform'
  ) {
    return 'ConvoSync';
  }
  return name;
}

type EmailSender = {
  id: string;
  email: string;
  displayName: string | null;
  isDefault: boolean;
  isShared: boolean;
  domainId: string | null;
};

type EmailDeliveryEvent = {
  type: string;
  at: string;
  detail?: string;
};

type EmailLog = {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  provider: string;
  providerName: string | null;
  status: string;
  messageId: string | null;
  errorMessage: string | null;
  metadata?: {
    events?: EmailDeliveryEvent[];
    [key: string]: unknown;
  } | null;
  createdAt: string;
  updatedAt?: string;
};

const TRACKING_STEPS = ['sent', 'delivered', 'opened', 'clicked'] as const;

function eventTimeForStatus(log: EmailLog, status: string): string | null {
  const events = Array.isArray(log.metadata?.events) ? log.metadata!.events! : [];
  const hit = [...events].reverse().find((e) => e.type === status);
  if (hit?.at) return hit.at;
  if (status === 'sent') return log.createdAt;
  const rank: Record<string, number> = {
    queued: 0,
    sent: 1,
    delivered: 2,
    opened: 3,
    clicked: 4,
  };
  const cur = rank[log.status] ?? 0;
  const need = rank[status] ?? 99;
  if (cur >= need && status !== 'clicked') {
    // Status advanced without a discrete timestamp — show updatedAt as best effort.
    return log.updatedAt ?? null;
  }
  return null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    verified: 'bg-[#e6f7ec] text-[#006d2f] border-[#5dfd8a]/40',
    pending: 'bg-[#fff5e6] text-[#f2994a] border-[#f2994a]/30',
    failed: 'bg-red-50 text-red-700 border-red-200',
    sent: 'bg-[#e6f7ec] text-[#006d2f] border-[#5dfd8a]/40',
    queued: 'bg-gray-50 text-gray-600 border-gray-200',
    delivered: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    opened: 'bg-sky-50 text-sky-800 border-sky-200',
    clicked: 'bg-violet-50 text-violet-800 border-violet-200',
    bounced: 'bg-red-50 text-red-700 border-red-200',
    complained: 'bg-orange-50 text-orange-800 border-orange-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    active: 'bg-[#e6f7ec] text-[#006d2f] border-[#5dfd8a]/40',
    disabled: 'bg-gray-100 text-gray-500 border-gray-200',
    credentials_missing: 'bg-amber-50 text-amber-800 border-amber-200',
    connection_failed: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
}

function domainFromEmail(email: string | null | undefined): string | null {
  const e = (email ?? '').trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1 || at === e.length - 1) return null;
  return e.slice(at + 1);
}

export function EmailPanel() {
  const [tab, setTab] = useState<EmailTab>('setup');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedSenders, setSharedSenders] = useState<EmailSender[]>([]);
  const [defaultSenderEmail, setDefaultSenderEmail] = useState<string | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [providers, setProviders] = useState<EmailProviderConfig[]>([]);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providerTestResults, setProviderTestResults] = useState<
    Record<string, { ok: boolean; message: string }>
  >({});
  const [providerForm, setProviderForm] = useState({
    provider: 'RESEND' as ProviderFormType,
    isDefault: false,
    apiKey: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    host: '',
    port: '587',
    secure: false,
    username: '',
    password: '',
  });
  const [sesSelectedIdentity, setSesSelectedIdentity] = useState('');
  const [sesDomainLocalPart, setSesDomainLocalPart] = useState('');
  const [sesIdentities, setSesIdentities] = useState<VerifiedIdentity[]>([]);
  const [sesIdentitiesFetchedAt, setSesIdentitiesFetchedAt] = useState<string | null>(null);
  const [sesAccessKeyIdMasked, setSesAccessKeyIdMasked] = useState<string | null>(null);
  const [sesHasSecret, setSesHasSecret] = useState(false);
  const [sesConsoleUrl, setSesConsoleUrl] = useState<string | null>(null);
  const [sesRefreshing, setSesRefreshing] = useState(false);
  const [sesTesting, setSesTesting] = useState(false);
  const [sesNotice, setSesNotice] = useState<{ ok: boolean; message: string } | null>(null);

  const [testSend, setTestSend] = useState({
    to: '',
    subject: 'ConvoSync test email',
    text: 'Hello from ConvoSync Email Infrastructure.',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [senderRows, logRows, providerRows] = await Promise.all([
        api.getEmailSenders() as Promise<{
          shared: EmailSender[];
          custom: EmailSender[];
          defaultSenderEmail?: string | null;
        }>,
        api.getEmailLogs() as Promise<EmailLog[]>,
        api.getEmailProviders() as Promise<EmailProviderConfig[]>,
      ]);
      setSharedSenders(senderRows.shared ?? []);
      setDefaultSenderEmail(senderRows.defaultSenderEmail ?? null);
      setLogs(logRows);
      setProviders(providerRows ?? []);
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleTestSend = async () => {
    if (!testSend.to.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.sendEmail({
        to: testSend.to.trim(),
        subject: testSend.subject,
        text: testSend.text,
      });
      setTab('logs');
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };


  const usedProviderTypes = new Set(providers.map((p) => p.provider));
  const availableProviderTypes = BYOP_PROVIDER_TYPES.filter(
    (t) => !usedProviderTypes.has(t) || providerForm.provider === t
  );

  const resetSesFormState = () => {
    setSesSelectedIdentity('');
    setSesDomainLocalPart('');
    setSesIdentities([]);
    setSesIdentitiesFetchedAt(null);
    setSesAccessKeyIdMasked(null);
    setSesHasSecret(false);
    setSesConsoleUrl(null);
    setSesNotice(null);
  };

  const applySesFromProvider = (p: EmailProviderConfig) => {
    const identities = p.verifiedIdentities ?? [];
    setSesIdentities(identities);
    setSesIdentitiesFetchedAt(p.identitiesFetchedAt ?? null);
    setSesAccessKeyIdMasked(p.accessKeyIdMasked ?? null);
    setSesHasSecret(Boolean(p.hasCredentials));
    setSesConsoleUrl(p.sesConsoleUrl ?? null);
    if (p.region) {
      setProviderForm((f) => ({ ...f, region: p.region || f.region }));
    }
    const split = splitSenderAgainstIdentities(p.senderEmail || '', identities);
    setSesSelectedIdentity(split.selectedIdentity);
    setSesDomainLocalPart(split.localPart);
    setSesNotice(null);
  };

  const resetProviderForm = () => {
    setProviderForm({
      provider: availableProviderTypes[0] ?? 'RESEND',
      isDefault: false,
      apiKey: '',
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      host: '',
      port: '587',
      secure: false,
      username: '',
      password: '',
    });
    resetSesFormState();
    setEditingProviderId(null);
    setShowAddProvider(false);
  };

  const sesSenderEmail = computeSesSenderEmail(
    sesSelectedIdentity,
    sesDomainLocalPart,
    sesIdentities
  );

  const sesCredentialDraft = () => {
    const payload: Record<string, string> = {};
    if (providerForm.accessKeyId.trim()) payload.accessKeyId = providerForm.accessKeyId.trim();
    if (providerForm.secretAccessKey.trim()) {
      payload.secretAccessKey = providerForm.secretAccessKey.trim();
    }
    if (providerForm.region.trim()) payload.region = providerForm.region.trim();
    if (sesSenderEmail.trim()) payload.senderEmail = sesSenderEmail.trim();
    return payload;
  };

  const buildProviderConfigPayload = () => {
    switch (providerForm.provider) {
      case 'CONVOSYNC_MANAGED':
        return {};
      case 'RESEND':
        return { apiKey: providerForm.apiKey.trim() };
      case 'AWS_SES':
        return {
          accessKeyId: providerForm.accessKeyId.trim(),
          secretAccessKey: providerForm.secretAccessKey.trim(),
          region: providerForm.region.trim(),
          senderEmail: sesSenderEmail.trim(),
          verifiedIdentities: sesIdentities,
          identitiesFetchedAt: sesIdentitiesFetchedAt,
        };
      case 'SENDGRID':
        return { apiKey: providerForm.apiKey.trim() };
      case 'SMTP':
        return {
          host: providerForm.host.trim(),
          port: parseInt(providerForm.port, 10) || 587,
          secure: providerForm.secure,
          username: providerForm.username.trim(),
          password: providerForm.password,
        };
      default:
        return {};
    }
  };

  const handleRefreshSesIdentities = async (providerId?: string | null) => {
    setSesRefreshing(true);
    setSesNotice(null);
    setError(null);
    try {
      const draft = sesCredentialDraft();
      const res = (
        providerId
          ? await api.refreshEmailProviderIdentities(providerId, draft)
          : await api.previewSesIdentities(draft)
      ) as {
        ok: boolean;
        message: string;
        verifiedIdentities?: VerifiedIdentity[];
        identitiesFetchedAt?: string;
        provider?: EmailProviderConfig;
      };
      if (res.provider) {
        applySesFromProvider(res.provider);
        setProviders((prev) =>
          prev.map((p) => (p.id === res.provider!.id ? { ...p, ...res.provider! } : p))
        );
      } else if (res.verifiedIdentities) {
        setSesIdentities(res.verifiedIdentities);
        setSesIdentitiesFetchedAt(res.identitiesFetchedAt ?? new Date().toISOString());
        setSesSelectedIdentity((prev) =>
          res.verifiedIdentities!.some((i) => i.identity === prev) ? prev : ''
        );
      }
      if (!res.ok) {
        setSesNotice({ ok: false, message: res.message || 'Could not load SES identities.' });
        return;
      }
      if (res.verifiedIdentities?.length) {
        setSesNotice({ ok: true, message: res.message || 'Verified identities refreshed.' });
      } else {
        setSesNotice({
          ok: false,
          message:
            res.message ||
            `No verified domains or emails in region ${providerForm.region.trim() || 'this region'}.`,
        });
      }
      if (providerId) {
        setProviderForm((f) => ({ ...f, accessKeyId: '', secretAccessKey: '' }));
        setSesHasSecret(true);
      }
    } catch (err) {
      setSesNotice({ ok: false, message: formatCatchError(err) });
    } finally {
      setSesRefreshing(false);
    }
  };

  const handleSesTestSend = async (providerId?: string | null) => {
    setSesTesting(true);
    setSesNotice(null);
    setError(null);
    try {
      const draft = sesCredentialDraft();
      const res = (
        providerId
          ? await api.testEmailProviderSesSend(providerId, draft)
          : await api.testSesProviderSendPreview(draft)
      ) as {
        ok: boolean;
        message: string;
        verifiedIdentities?: VerifiedIdentity[];
        provider?: EmailProviderConfig;
      };
      if (res.provider) {
        applySesFromProvider(res.provider);
        setProviders((prev) =>
          prev.map((p) => (p.id === res.provider!.id ? { ...p, ...res.provider! } : p))
        );
      } else if (res.verifiedIdentities) {
        setSesIdentities(res.verifiedIdentities);
      }
      setSesNotice({
        ok: Boolean(res.ok),
        message: res.message || (res.ok ? 'Test email sent.' : 'Test email failed'),
      });
      if (providerId) {
        setProviderForm((f) => ({ ...f, accessKeyId: '', secretAccessKey: '' }));
        setSesHasSecret(true);
      }
    } catch (err) {
      setSesNotice({ ok: false, message: formatCatchError(err) });
    } finally {
      setSesTesting(false);
    }
  };

  const renderSesFields = (providerId?: string | null) => (
    <div className="space-y-2">
      {sesNotice && (
        <p className={`text-xs ${sesNotice.ok ? 'text-green-700' : 'text-red-600'}`}>
          {sesNotice.message}
        </p>
      )}
      <SesProviderFormFields
        accessKeyId={providerForm.accessKeyId}
        secretAccessKey={providerForm.secretAccessKey}
        region={providerForm.region}
        accessKeyIdMasked={sesAccessKeyIdMasked}
        hasSecretAccessKey={sesHasSecret}
        selectedIdentity={sesSelectedIdentity}
        domainLocalPart={sesDomainLocalPart}
        identities={sesIdentities}
        identitiesFetchedAt={sesIdentitiesFetchedAt}
        sesConsoleUrl={sesConsoleUrl}
        refreshing={sesRefreshing}
        testing={sesTesting}
        saving={saving}
        onAccessKeyIdChange={(value) =>
          setProviderForm((f) => ({ ...f, accessKeyId: value }))
        }
        onSecretAccessKeyChange={(value) =>
          setProviderForm((f) => ({ ...f, secretAccessKey: value }))
        }
        onRegionChange={(value) => setProviderForm((f) => ({ ...f, region: value }))}
        onSelectIdentity={(identity) => {
          if (identity === sesSelectedIdentity) return;
          setSesSelectedIdentity(identity);
          setSesDomainLocalPart('');
        }}
        onDomainLocalPartChange={setSesDomainLocalPart}
        onRefreshIdentities={() => void handleRefreshSesIdentities(providerId)}
        onTestSend={() => void handleSesTestSend(providerId)}
      />
    </div>
  );

  const handleCreateProvider = async () => {
    if (providerForm.provider === 'AWS_SES' && !sesSenderEmail.trim()) {
      setError('Refresh identities and select a verified From address before saving AWS SES.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createEmailProvider({
        provider: providerForm.provider,
        isDefault: providerForm.isDefault,
        config: buildProviderConfigPayload(),
      });
      resetProviderForm();
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProvider = async (id: string) => {
    if (providerForm.provider === 'AWS_SES' && !sesSenderEmail.trim()) {
      setError('Refresh identities and select a verified From address before saving AWS SES.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const config = buildProviderConfigPayload();
      const hasConfigUpdate = Object.values(config).some((v) =>
        typeof v === 'string'
          ? v.length > 0
          : Array.isArray(v)
            ? true
            : v !== undefined && v !== false && v !== null
      );
      await api.updateEmailProvider(id, {
        ...(hasConfigUpdate ? { config } : {}),
      });
      resetProviderForm();
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!window.confirm('Delete this email provider?')) return;
    setSaving(true);
    setError(null);
    try {
      await api.deleteEmailProvider(id);
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultProvider = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await api.setDefaultEmailProvider(id);
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTestProvider = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const result = (await api.testEmailProvider(id)) as { ok: boolean; message: string };
      setProviderTestResults((prev) => ({ ...prev, [id]: result }));
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProviderStatus = async (provider: EmailProviderConfig) => {
    setSaving(true);
    setError(null);
    try {
      await api.updateEmailProvider(provider.id, {
        status: provider.status === 'disabled' ? 'active' : 'disabled',
      });
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const defaultProvider =
    providers.find((p) => p.isDefault) ??
    providers.find((p) => p.status === 'active') ??
    null;
  // Provider From is source of truth; shared list is already synced by API.
  const activeFromEmail =
    (defaultProvider?.provider === 'AWS_SES' && defaultProvider.senderEmail?.trim()) ||
    defaultSenderEmail ||
    sharedSenders.find((s) => s.isDefault)?.email ||
    sharedSenders[0]?.email ||
    null;
  const activeDomain = domainFromEmail(activeFromEmail);
  const activeProviderLabel = defaultProvider
    ? PROVIDER_LABELS[defaultProvider.provider]
    : null;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Email settings">
        {(
          [
            ['setup', 'Setup'],
            ['logs', 'Email Logs'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold border cursor-pointer transition-colors duration-150 ${
              tab === id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-slate-200 hover:border-primary/30'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1.5 text-sm font-semibold text-gray-500 hover:text-primary cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          {error}
        </div>
      )}

      {tab === 'setup' && (
        <div className="space-y-4">
          {loading && providers.length === 0 ? (
            <div className="flex justify-center py-12 text-gray-400" aria-busy="true">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : null}

          {/* 1. Active sending identity — mirrors default provider From */}
          <section
            aria-labelledby="email-sending-as-heading"
            className="bg-surface rounded-2xl border border-black/5 p-4"
          >
            <h4
              id="email-sending-as-heading"
              className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-primary" aria-hidden />
              Sending as
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Set by your default provider
              {defaultProvider?.provider === 'AWS_SES'
                ? ' — choose a From address under AWS SES below.'
                : '.'}
            </p>
            {activeFromEmail ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">
                    {activeDomain ?? activeProviderLabel ?? 'Email'}
                  </p>
                  <p className="text-sm font-mono text-gray-600 mt-0.5 break-all">
                    {activeFromEmail}
                  </p>
                  {activeProviderLabel && (
                    <p className="text-xs text-gray-500 mt-1">
                      Provider · {activeProviderLabel}
                      {defaultProvider?.isDefault ? ' · Default' : ''}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-bold text-primary uppercase">
                  Active
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-2">
                Connect a provider and choose a From address to start sending.
              </p>
            )}
          </section>

          {/* 2. Providers */}
          <div className="bg-surface rounded-2xl border border-black/5 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" aria-hidden />
                Providers
              </h4>
              {!showAddProvider && availableProviderTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProviderId(null);
                    resetSesFormState();
                    setShowAddProvider(true);
                    setProviderForm((f) => ({
                      ...f,
                      provider: availableProviderTypes[0] ?? 'RESEND',
                      accessKeyId: '',
                      secretAccessKey: '',
                      apiKey: '',
                      region: 'us-east-1',
                      // BYO providers become default (backend also forces this)
                      isDefault: true,
                    }));
                  }}
                  className="px-3 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add provider
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Default provider chooses how mail is sent. ConvoSync platform email bills
              ConvoCoins only; your own SES/SMTP/etc. is not metered by ConvoSync. For AWS
              SES, pick a verified From — that sets both your sending email and domain.
            </p>

            {providers.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Loading providers…</p>
            ) : (
              <ul className="space-y-3">
                {providers.map((p) => (
                  <li
                    key={p.id}
                    className="border border-slate-200 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {PROVIDER_LABELS[p.provider]}
                        </p>
                        {p.provider === 'AWS_SES' && p.senderEmail ? (
                          <p className="text-xs font-mono text-gray-600 mt-0.5 break-all">
                            From · {p.senderEmail}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span
                            className={`text-sm font-bold uppercase px-2 py-0.5 rounded border ${statusBadge(p.status)}`}
                          >
                            {p.status.replace(/_/g, ' ')}
                          </span>
                          {p.isDefault && (
                            <span className="text-sm font-bold text-primary uppercase">
                              Default
                            </span>
                          )}
                          {!p.hasCredentials && p.provider !== 'CONVOSYNC_MANAGED' && (
                            <span className="text-xs text-amber-700">No credentials</span>
                          )}
                          {p.provider === 'AWS_SES' && p.trackingStatus === 'enabled' && (
                            <span className="text-sm font-bold uppercase px-2 py-0.5 rounded border bg-[#e6f7ec] text-[#006d2f] border-[#5dfd8a]/40">
                              Tracking on
                            </span>
                          )}
                          {p.provider === 'AWS_SES' && p.trackingStatus === 'error' && (
                            <span className="text-sm font-bold uppercase px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
                              Tracking off
                            </span>
                          )}
                        </div>
                        {p.provider === 'AWS_SES' && p.trackingStatus === 'error' && p.trackingError ? (
                          <div className="text-xs text-amber-800 mt-1.5 space-y-1.5">
                            <p className="flex gap-1.5 items-start">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{p.trackingError}</span>
                            </p>
                            {/missing IAM|Required:|access denied|not authorized/i.test(
                              p.trackingError
                            ) ? (
                              <div className="ml-5 rounded border border-amber-200 bg-amber-50/80 p-2 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-amber-900">
                                    Minimal IAM policy (attach to SES access key user)
                                  </span>
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-300 hover:bg-amber-100 text-amber-900"
                                    onClick={() => {
                                      void navigator.clipboard.writeText(SES_TRACKING_IAM_POLICY_JSON);
                                    }}
                                  >
                                    <Copy className="w-3 h-3" />
                                    Copy
                                  </button>
                                </div>
                                <pre className="overflow-x-auto text-[11px] leading-snug font-mono text-amber-950 whitespace-pre">
                                  {SES_TRACKING_IAM_POLICY_JSON}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {p.provider === 'AWS_SES' &&
                        p.trackingStatus === 'enabled' &&
                        p.configurationSetName ? (
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            Config set · {p.configurationSetName}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {!p.isDefault && p.status !== 'disabled' && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void handleSetDefaultProvider(p.id)}
                            className="px-2 py-1 text-sm font-bold rounded border border-slate-200 hover:border-primary/30"
                          >
                            Set default
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleTestProvider(p.id)}
                          className="px-2 py-1 text-sm font-bold rounded border border-slate-200 hover:border-primary/30 inline-flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Test
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleToggleProviderStatus(p)}
                          className="px-2 py-1 text-sm font-bold rounded border border-slate-200 hover:border-primary/30"
                        >
                          {p.status === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                        {p.provider !== 'CONVOSYNC_MANAGED' && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              setEditingProviderId(p.id);
                              setShowAddProvider(false);
                              setProviderForm((f) => ({
                                ...f,
                                provider: p.provider,
                                accessKeyId: '',
                                secretAccessKey: '',
                                apiKey: '',
                                region: p.region || f.region || 'us-east-1',
                              }));
                              if (p.provider === 'AWS_SES') {
                                applySesFromProvider(p);
                              } else {
                                resetSesFormState();
                              }
                            }}
                            className="px-2 py-1 text-sm font-bold rounded border border-slate-200 hover:border-primary/30"
                          >
                            Edit
                          </button>
                        )}
                        {providers.length > 1 && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void handleDeleteProvider(p.id)}
                            className="px-2 py-1 text-sm font-bold rounded border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {providerTestResults[p.id] && (
                      <p
                        className={`text-xs ${providerTestResults[p.id].ok ? 'text-green-700' : 'text-red-600'}`}
                      >
                        {providerTestResults[p.id].message}
                      </p>
                    )}
                    {editingProviderId === p.id && (
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        {p.provider === 'RESEND' || p.provider === 'SENDGRID' ? (
                          <input
                            type="password"
                            value={providerForm.apiKey}
                            onChange={(e) =>
                              setProviderForm((f) => ({ ...f, apiKey: e.target.value }))
                            }
                            placeholder="New API key (leave blank to keep current)"
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                          />
                        ) : null}
                        {p.provider === 'AWS_SES' ? renderSesFields(p.id) : null}
                        {p.provider === 'SMTP' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              value={providerForm.host}
                              onChange={(e) =>
                                setProviderForm((f) => ({ ...f, host: e.target.value }))
                              }
                              placeholder="SMTP host"
                              className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                            />
                            <input
                              value={providerForm.port}
                              onChange={(e) =>
                                setProviderForm((f) => ({ ...f, port: e.target.value }))
                              }
                              placeholder="Port"
                              className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                            />
                            <input
                              value={providerForm.username}
                              onChange={(e) =>
                                setProviderForm((f) => ({ ...f, username: e.target.value }))
                              }
                              placeholder="Username"
                              className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                            />
                            <input
                              type="password"
                              value={providerForm.password}
                              onChange={(e) =>
                                setProviderForm((f) => ({ ...f, password: e.target.value }))
                              }
                              placeholder="Password"
                              className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                            />
                            <label className="flex items-center gap-2 text-xs text-gray-600 sm:col-span-2">
                              <input
                                type="checkbox"
                                checked={providerForm.secure}
                                onChange={(e) =>
                                  setProviderForm((f) => ({ ...f, secure: e.target.checked }))
                                }
                              />
                              Use TLS (secure)
                            </label>
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={
                              saving ||
                              (p.provider === 'AWS_SES' && !sesSenderEmail.trim())
                            }
                            title={
                              p.provider === 'AWS_SES' && !sesSenderEmail.trim()
                                ? 'Choose a From address above before saving'
                                : undefined
                            }
                            onClick={() => void handleUpdateProvider(p.id)}
                            className="px-3 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={resetProviderForm}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showAddProvider && (
            <div className="bg-surface rounded-2xl border border-black/5 p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Add provider</h4>
              <select
                value={providerForm.provider}
                onChange={(e) => {
                  const next = e.target.value as ProviderFormType;
                  setProviderForm((f) => ({ ...f, provider: next }));
                  if (next !== 'AWS_SES') resetSesFormState();
                }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              >
                {availableProviderTypes.map((t) => (
                  <option key={t} value={t}>
                    {PROVIDER_LABELS[t]}
                  </option>
                ))}
              </select>

              {providerForm.provider === 'RESEND' || providerForm.provider === 'SENDGRID' ? (
                <input
                  type="password"
                  value={providerForm.apiKey}
                  onChange={(e) => setProviderForm((f) => ({ ...f, apiKey: e.target.value }))}
                  placeholder="API key"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
              ) : null}

              {providerForm.provider === 'AWS_SES' ? renderSesFields(null) : null}

              {providerForm.provider === 'SMTP' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={providerForm.host}
                    onChange={(e) => setProviderForm((f) => ({ ...f, host: e.target.value }))}
                    placeholder="SMTP host"
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                  <input
                    value={providerForm.port}
                    onChange={(e) => setProviderForm((f) => ({ ...f, port: e.target.value }))}
                    placeholder="Port"
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                  <input
                    value={providerForm.username}
                    onChange={(e) => setProviderForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="Username"
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                  <input
                    type="password"
                    value={providerForm.password}
                    onChange={(e) => setProviderForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Password"
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-600 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={providerForm.secure}
                      onChange={(e) =>
                        setProviderForm((f) => ({ ...f, secure: e.target.checked }))
                      }
                    />
                    Use TLS (secure)
                  </label>
                </div>
              ) : null}

              {providerForm.provider === 'CONVOSYNC_MANAGED' ? (
                <p className="text-xs text-gray-500">
                  Uses ConvoSync platform email. No API key required. Sends are billed from
                  your ConvoCoins wallet (1 CC per recipient) — not a monthly plan email quota.
                </p>
              ) : null}

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={providerForm.isDefault}
                  onChange={(e) =>
                    setProviderForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                />
                Set as default provider
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    saving ||
                    (providerForm.provider === 'AWS_SES' && !sesSenderEmail.trim())
                  }
                  title={
                    providerForm.provider === 'AWS_SES' && !sesSenderEmail.trim()
                      ? 'Choose a From address above before saving'
                      : undefined
                  }
                  onClick={() => void handleCreateProvider()}
                  className="px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold disabled:opacity-50"
                >
                  Add provider
                </button>
                <button
                  type="button"
                  onClick={resetProviderForm}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* 3. Test send */}
          <section
            aria-labelledby="email-test-send-heading"
            className="bg-surface rounded-2xl border border-black/5 p-4 space-y-3"
          >
            <h4
              id="email-test-send-heading"
              className="text-sm font-bold text-gray-900 flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-primary" aria-hidden />
              Send test email
            </h4>
            <p className="text-xs text-gray-500">
              Sends with your active From
              {activeFromEmail ? (
                <>
                  {' '}
                  (<span className="font-mono text-gray-700">{activeFromEmail}</span>)
                </>
              ) : null}
              .
              {defaultProvider?.provider === 'CONVOSYNC_MANAGED'
                ? ' Platform sends use ConvoCoins from your wallet.'
                : defaultProvider
                  ? ' Your own provider is not billed by ConvoSync.'
                  : ''}
            </p>
            <label htmlFor="email-test-to" className="sr-only">
              Recipient email
            </label>
            <input
              id="email-test-to"
              type="email"
              autoComplete="email"
              value={testSend.to}
              onChange={(e) => setTestSend((s) => ({ ...s, to: e.target.value }))}
              placeholder="recipient@example.com"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="button"
              disabled={saving || !testSend.to.trim()}
              onClick={() => void handleTestSend()}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              Send test
            </button>
          </section>
        </div>
      )}

      {tab === 'logs' && (
        <div className="w-full bg-surface rounded-2xl border border-black/5 overflow-hidden">
          {logs.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-10">No emails sent yet.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {/* ponytail: table-fixed + % cols so logs fill the pane; overflow-x only for narrow viewports */}
              <table className="w-full min-w-[960px] table-fixed text-xs text-left">
                <caption className="sr-only">Email delivery logs</caption>
                <colgroup>
                  <col className="w-[9%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col />
                  <col className="w-[7%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="bg-slate-50 text-gray-500 font-bold border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                      Time
                    </th>
                    <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                      From
                    </th>
                    <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                      To
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Subject
                    </th>
                    <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                      Provider
                    </th>
                    <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                      Status
                    </th>
                    {TRACKING_STEPS.map((step) => (
                      <th
                        key={step}
                        scope="col"
                        className="px-3 py-2.5 whitespace-nowrap capitalize"
                      >
                        {step}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap tabular-nums truncate">
                        {formatDate(log.createdAt)}
                      </td>
                      <td
                        className="px-3 py-2.5 font-mono text-meta whitespace-nowrap truncate"
                        title={log.sender}
                      >
                        {log.sender}
                      </td>
                      <td
                        className="px-3 py-2.5 font-mono text-meta whitespace-nowrap truncate"
                        title={log.recipient}
                      >
                        {log.recipient}
                      </td>
                      <td className="px-3 py-2.5 text-gray-800 truncate" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap truncate">
                        {logProviderLabel(log)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase border ${statusBadge(log.status)}`}
                        >
                          {log.status}
                        </span>
                        {log.errorMessage && (
                          <p className="text-[11px] text-red-600 mt-1 whitespace-normal leading-snug truncate">
                            {log.errorMessage}
                          </p>
                        )}
                      </td>
                      {TRACKING_STEPS.map((step) => {
                        const at = eventTimeForStatus(log, step);
                        return (
                          <td
                            key={step}
                            className={`px-3 py-2.5 whitespace-nowrap tabular-nums truncate ${
                              at ? 'text-gray-700' : 'text-gray-400'
                            }`}
                          >
                            {formatDate(at)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
