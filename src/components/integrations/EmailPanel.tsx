/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Copy,
  Globe,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';

type EmailTab = 'domains' | 'senders' | 'providers' | 'logs';

type EmailProviderConfig = {
  id: string;
  provider: 'CONVOSYNC_MANAGED' | 'RESEND' | 'AWS_SES' | 'SENDGRID' | 'SMTP';
  isDefault: boolean;
  status: string;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProviderFormType = EmailProviderConfig['provider'];

const PROVIDER_LABELS: Record<ProviderFormType, string> = {
  CONVOSYNC_MANAGED: 'ConvoSync Managed (Resend)',
  RESEND: 'Resend (BYOP)',
  AWS_SES: 'AWS SES',
  SENDGRID: 'SendGrid',
  SMTP: 'SMTP',
};

type EmailDomain = {
  id: string;
  domain: string;
  provider: string;
  status: string;
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;
  dnsRecords?: Array<{ type: string; name: string; value: string; status?: string }>;
  verifiedAt: string | null;
  createdAt: string;
};

type EmailSender = {
  id: string;
  email: string;
  displayName: string | null;
  isDefault: boolean;
  isShared: boolean;
  domainId: string | null;
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
  createdAt: string;
};

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
    active: 'bg-[#e6f7ec] text-[#006d2f] border-[#5dfd8a]/40',
    disabled: 'bg-gray-100 text-gray-500 border-gray-200',
    credentials_missing: 'bg-amber-50 text-amber-800 border-amber-200',
    connection_failed: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

export function EmailPanel() {
  const [tab, setTab] = useState<EmailTab>('domains');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [sharedSenders, setSharedSenders] = useState<EmailSender[]>([]);
  const [customSenders, setCustomSenders] = useState<EmailSender[]>([]);
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

  const [newDomain, setNewDomain] = useState('');
  const [newSender, setNewSender] = useState({
    email: '',
    displayName: '',
    isDefault: false,
    useSharedDomain: true,
    domainId: '',
  });
  const [testSend, setTestSend] = useState({
    to: '',
    subject: 'ConvoSync test email',
    text: 'Hello from ConvoSync Email Infrastructure.',
  });
  const [expandedDomainIds, setExpandedDomainIds] = useState<Set<string>>(new Set());

  const isDomainExpanded = (domain: EmailDomain) =>
    domain.status !== 'verified' || expandedDomainIds.has(domain.id);

  const toggleDomainExpanded = (domainId: string) => {
    setExpandedDomainIds((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [domainRows, senderRows, logRows, providerRows] = await Promise.all([
        api.getEmailDomains() as Promise<EmailDomain[]>,
        api.getEmailSenders() as Promise<{ shared: EmailSender[]; custom: EmailSender[] }>,
        api.getEmailLogs() as Promise<EmailLog[]>,
        api.getEmailProviders() as Promise<EmailProviderConfig[]>,
      ]);
      setDomains(domainRows);
      setSharedSenders(senderRows.shared ?? []);
      setCustomSenders(senderRows.custom ?? []);
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

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createEmailDomain({ domain: newDomain.trim().toLowerCase() });
      setNewDomain('');
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setSaving(true);
    setError(null);
    try {
      await api.verifyEmailDomain(domainId);
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshDomain = async (domainId: string) => {
    setSaving(true);
    try {
      await api.refreshEmailDomain(domainId);
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddSender = async () => {
    const raw = newSender.email.trim().toLowerCase();
    if (!raw) return;

    let email = raw;
    if (!raw.includes('@')) {
      if (newSender.useSharedDomain) {
        const sharedDomain = sharedSenders[0]?.email.split('@')[1];
        if (!sharedDomain) {
          setError('Enter a full email address (e.g. noreply@mail.convosync.io)');
          return;
        }
        email = `${raw}@${sharedDomain}`;
      } else {
        const domain = verifiedDomains.find((d) => d.id === newSender.domainId);
        if (!domain) {
          setError('Select a verified domain or enter a full email like support@yourdomain.com');
          return;
        }
        email = `${raw}@${domain.domain}`;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await api.createEmailSender({
        email,
        displayName: newSender.displayName.trim() || undefined,
        isDefault: newSender.isDefault,
        useSharedDomain: newSender.useSharedDomain,
        domainId: newSender.domainId || undefined,
      });
      setNewSender({
        email: '',
        displayName: '',
        isDefault: false,
        useSharedDomain: true,
        domainId: '',
      });
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

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

  const verifiedDomains = domains.filter((d) => d.status === 'verified');

  const usedProviderTypes = new Set(providers.map((p) => p.provider));
  const availableProviderTypes = (
    ['CONVOSYNC_MANAGED', 'RESEND', 'AWS_SES', 'SENDGRID', 'SMTP'] as ProviderFormType[]
  ).filter((t) => !usedProviderTypes.has(t) || providerForm.provider === t);

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
    setEditingProviderId(null);
    setShowAddProvider(false);
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

  const handleCreateProvider = async () => {
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
    setSaving(true);
    setError(null);
    try {
      const config = buildProviderConfigPayload();
      const hasConfigUpdate = Object.values(config).some((v) =>
        typeof v === 'string' ? v.length > 0 : v !== undefined && v !== false
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['domains', 'Domains'],
            ['senders', 'Sender Addresses'],
            ['providers', 'Providers'],
            ['logs', 'Email Logs'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
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
          className="ml-auto inline-flex items-center gap-1 px-2 py-1.5 text-sm font-semibold text-gray-500 hover:text-primary"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading && tab === 'domains' && domains.length === 0 ? (
        <div className="flex justify-center py-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : null}

      {tab === 'domains' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Add custom domain
            </h4>
            <div className="flex gap-2">
              <input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="yourcompany.com"
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                disabled={saving || !newDomain.trim()}
                onClick={() => void handleAddDomain()}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-1"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              DNS records (SPF, DKIM, DMARC) will appear after adding. Verify once records propagate.
            </p>
          </div>

          {domains.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">
              No custom domains yet. Use shared senders below to send immediately.
            </p>
          ) : (
            domains.map((d) => {
              const isVerified = d.status === 'verified';
              const expanded = isDomainExpanded(d);

              return (
              <div
                key={d.id}
                className={`bg-white rounded-2xl border p-4 space-y-3 transition-colors ${
                  isVerified
                    ? 'border-[#5dfd8a]/30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                    : 'border-slate-200'
                }`}
              >
                {isVerified ? (
                  <button
                    type="button"
                    onClick={() => toggleDomainExpanded(d.id)}
                    className="w-full flex items-start justify-between gap-3 text-left group"
                    aria-expanded={expanded}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-gray-400 mt-0.5 transition-transform duration-200 ${
                          expanded ? 'rotate-180' : ''
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{d.domain}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {expanded
                            ? `Provider: ${d.provider} · Added ${formatDate(d.createdAt)}`
                            : 'Verified · SPF & DKIM ready · Click to expand DNS records'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-sm font-bold uppercase border ${statusBadge(d.status)}`}
                    >
                      {d.status}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{d.domain}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Provider: {d.provider} · Added {formatDate(d.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-sm font-bold uppercase border ${statusBadge(d.status)}`}
                    >
                      {d.status}
                    </span>
                  </div>
                )}

                {(!isVerified || expanded) && (
                  <>
                <div className="flex flex-wrap gap-2 text-sm font-bold">
                  <span className={`px-2 py-1 rounded-md border ${d.spfVerified ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    SPF {d.spfVerified ? '✓' : '○'}
                  </span>
                  <span className={`px-2 py-1 rounded-md border ${d.dkimVerified ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    DKIM {d.dkimVerified ? '✓' : '○'}
                  </span>
                  <span className={`px-2 py-1 rounded-md border ${d.dmarcVerified ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    DMARC {d.dmarcVerified ? '✓' : '○'}
                  </span>
                </div>

                {Array.isArray(d.dnsRecords) && d.dnsRecords.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-meta">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-100">
                          <th className="py-1 pr-2">Type</th>
                          <th className="py-1 pr-2">Name</th>
                          <th className="py-1">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.dnsRecords.map((r, i) => (
                          <tr key={i} className="border-b border-gray-50 align-top">
                            <td className="py-1.5 pr-2 font-bold text-gray-700">{r.type}</td>
                            <td className="py-1.5 pr-2 font-mono text-gray-600 max-w-[120px] truncate" title={r.name}>
                              {r.name}
                            </td>
                            <td className="py-1.5">
                              <div className="flex items-start gap-1">
                                <code className="text-xs text-gray-600 break-all">{r.value}</code>
                                <button
                                  type="button"
                                  onClick={() => void copyText(r.value)}
                                  className="shrink-0 text-gray-400 hover:text-primary"
                                  aria-label="Copy DNS value"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap items-center">
                  {d.status !== 'verified' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleVerifyDomain(d.id)}
                      className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-bold disabled:opacity-50"
                    >
                      {saving ? 'Checking…' : 'Verify domain'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleRefreshDomain(d.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-gray-700 disabled:opacity-50"
                  >
                    Refresh status
                  </button>
                  {d.status === 'verified' && expanded && (
                    <span className="text-xs text-gray-400 font-medium">
                      Domain verified — use Refresh to sync DNS changes.
                    </span>
                  )}
                </div>
                  </>
                )}

                {isVerified && !expanded && (
                  <div className="flex flex-wrap items-center gap-2 pl-6">
                    <span
                      className={`text-sm font-bold px-2 py-1 rounded-md border ${
                        d.spfVerified ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      SPF {d.spfVerified ? '✓' : '○'}
                    </span>
                    <span
                      className={`text-sm font-bold px-2 py-1 rounded-md border ${
                        d.dkimVerified ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      DKIM {d.dkimVerified ? '✓' : '○'}
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRefreshDomain(d.id);
                      }}
                      className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold text-gray-600 border border-slate-200 hover:border-primary/30 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${saving ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            );
            })
          )}
        </div>
      )}

      {tab === 'senders' && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-primary/15 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Shared domain (instant send)</h4>
            <p className="text-xs text-gray-500 mb-3">
              Send without custom domain setup using platform fallback addresses.
            </p>
            <ul className="space-y-2">
              {sharedSenders.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-slate-200"
                >
                  <span>
                    <span className="font-bold text-gray-900">{s.displayName ?? 'ConvoSync'}</span>
                    <span className="text-gray-500 ml-2 font-mono">{s.email}</span>
                  </span>
                  {s.isDefault && (
                    <span className="text-sm font-bold text-primary uppercase">Default</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Register sender address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={newSender.email}
                onChange={(e) => setNewSender((s) => ({ ...s, email: e.target.value }))}
                placeholder={
                  newSender.useSharedDomain
                    ? 'noreply or noreply@mail.convosync.io'
                    : newSender.domainId
                      ? `support or support@${verifiedDomains.find((d) => d.id === newSender.domainId)?.domain ?? 'yourdomain.com'}`
                      : 'support@yourdomain.com'
                }
                className="text-sm border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                value={newSender.displayName}
                onChange={(e) => setNewSender((s) => ({ ...s, displayName: e.target.value }))}
                placeholder="Display name"
                className="text-sm border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={newSender.useSharedDomain}
                onChange={(e) =>
                  setNewSender((s) => ({ ...s, useSharedDomain: e.target.checked }))
                }
              />
              Use shared ConvoSync domain
            </label>
            {!newSender.useSharedDomain && (
              <select
                value={newSender.domainId}
                onChange={(e) => setNewSender((s) => ({ ...s, domainId: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              >
                <option value="">Select verified domain</option>
                {verifiedDomains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.domain}
                  </option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={newSender.isDefault}
                onChange={(e) => setNewSender((s) => ({ ...s, isDefault: e.target.checked }))}
              />
              Set as default sender
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleAddSender()}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"
            >
              Add sender
            </button>
          </div>

          {customSenders.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Your senders</h4>
              <ul className="space-y-2">
                {customSenders.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between text-xs border-b border-gray-50 py-2 last:border-0"
                  >
                    <span>
                      <span className="font-bold">{s.displayName ?? s.email}</span>
                      <span className="text-gray-400 ml-2 font-mono">{s.email}</span>
                    </span>
                    <div className="flex gap-2">
                      {s.isShared && (
                        <span className="text-xs text-gray-400 uppercase">Shared</span>
                      )}
                      {s.isDefault && (
                        <span className="text-sm font-bold text-primary">Default</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Send test email
            </h4>
            <input
              value={testSend.to}
              onChange={(e) => setTestSend((s) => ({ ...s, to: e.target.value }))}
              placeholder="recipient@example.com"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
            />
            <button
              type="button"
              disabled={saving || !testSend.to.trim()}
              onClick={() => void handleTestSend()}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold disabled:opacity-50"
            >
              Send test
            </button>
          </div>
        </div>
      )}

      {tab === 'providers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Email providers
              </h4>
              {!showAddProvider && availableProviderTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProvider(true);
                    setProviderForm((f) => ({
                      ...f,
                      provider: availableProviderTypes[0] ?? 'RESEND',
                    }));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add provider
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Bring your own provider or use ConvoSync Managed Resend. Credentials are encrypted at rest.
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
                        </div>
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
                              setProviderForm((f) => ({ ...f, provider: p.provider }));
                              setShowAddProvider(false);
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
                        {p.provider === 'AWS_SES' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              value={providerForm.accessKeyId}
                              onChange={(e) =>
                                setProviderForm((f) => ({ ...f, accessKeyId: e.target.value }))
                              }
                              placeholder="Access key ID"
                              className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                            />
                            <input
                              type="password"
                              value={providerForm.secretAccessKey}
                              onChange={(e) =>
                                setProviderForm((f) => ({ ...f, secretAccessKey: e.target.value }))
                              }
                              placeholder="Secret access key"
                              className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                            />
                            <input
                              value={providerForm.region}
                              onChange={(e) =>
                                setProviderForm((f) => ({ ...f, region: e.target.value }))
                              }
                              placeholder="Region (e.g. us-east-1)"
                              className="text-sm border border-slate-200 rounded-lg px-3 py-2 sm:col-span-2"
                            />
                          </div>
                        ) : null}
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
                            disabled={saving}
                            onClick={() => void handleUpdateProvider(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"
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
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Add provider</h4>
              <select
                value={providerForm.provider}
                onChange={(e) =>
                  setProviderForm((f) => ({
                    ...f,
                    provider: e.target.value as ProviderFormType,
                  }))
                }
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

              {providerForm.provider === 'AWS_SES' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={providerForm.accessKeyId}
                    onChange={(e) =>
                      setProviderForm((f) => ({ ...f, accessKeyId: e.target.value }))
                    }
                    placeholder="Access key ID"
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                  <input
                    type="password"
                    value={providerForm.secretAccessKey}
                    onChange={(e) =>
                      setProviderForm((f) => ({ ...f, secretAccessKey: e.target.value }))
                    }
                    placeholder="Secret access key"
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                  <input
                    value={providerForm.region}
                    onChange={(e) => setProviderForm((f) => ({ ...f, region: e.target.value }))}
                    placeholder="Region (e.g. us-east-1)"
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 sm:col-span-2"
                  />
                </div>
              ) : null}

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
                  Uses platform Resend credentials. No API key required from your workspace.
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
                  disabled={saving}
                  onClick={() => void handleCreateProvider()}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"
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
        </div>
      )}

      {tab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {logs.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-10">No emails sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-gray-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2">Time</th>
                    <th className="text-left px-4 py-2">From</th>
                    <th className="text-left px-4 py-2">To</th>
                    <th className="text-left px-4 py-2">Subject</th>
                    <th className="text-left px-4 py-2">Provider</th>
                    <th className="text-left px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-2 font-mono text-meta">{log.sender}</td>
                      <td className="px-4 py-2 font-mono text-meta">{log.recipient}</td>
                      <td className="px-4 py-2 max-w-[160px] truncate" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                        {log.providerName ?? log.provider}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold uppercase border ${statusBadge(log.status)}`}
                        >
                          {log.status === 'sent' && <CheckCircle2 className="w-3 h-3" />}
                          {log.status}
                        </span>
                        {log.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                        )}
                      </td>
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
