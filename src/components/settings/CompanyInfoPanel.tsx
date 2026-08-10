import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Building2,
  Camera,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
} from 'lucide-react';
import { api, getUserEmail, getUserPermissions, getUserRole, getWorkspaceId } from '../../lib/api';
import { dispatchCompanyUpdated } from '../../lib/companyEvents';
import { normalizeCompanySettingsResponse } from '../../lib/companySettings';
import { compressImageFile } from '../../lib/imageUpload';
import { hasWorkspacePermission } from '../../lib/workspacePermissions';
import { useKeepAliveActivation } from '../KeepAlive';
import {
  mapWorkspaceToForm,
  whatsappLinesFromSettings,
  type CompanyForm,
  type CompanySettingsResponse,
} from './companyFormUtils';

type CompanyVerifyTarget = 'company_email' | 'company_phone';

function otpSentMessage(target: CompanyVerifyTarget, destinationHint?: string): string {
  if (target === 'company_email') {
    return destinationHint
      ? `Check your email (${destinationHint}) for the OTP`
      : 'Check your email for the OTP';
  }
  return destinationHint
    ? `Check WhatsApp (${destinationHint}) for the OTP`
    : 'Check WhatsApp for the OTP';
}

type ContactVerifyState = {
  value: string | null;
  verified: boolean;
  verifiedAt: string | null;
};

type VerificationStatus = {
  companyEmail: ContactVerifyState;
  companyPhone: ContactVerifyState;
};

// ponytail: company verify UI off until re-enabled — flip to true to restore Verify/OTP controls
const showCompanyVerifyUi = false;

const emptyForm: CompanyForm = {
  name: '',
  legalName: '',
  industry: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: 'IN',
  postalCode: '',
  timezone: 'Asia/Kolkata',
  taxId: '',
  logoUrl: '',
};

function payloadFromForm(form: CompanyForm) {
  return {
    name: form.name.trim(),
    legalName: form.legalName || null,
    industry: form.industry || null,
    website: form.website || null,
    email: form.email || null,
    phone: form.phone || null,
    address: form.address || null,
    city: form.city || null,
    state: form.state || null,
    country: form.country || null,
    postalCode: form.postalCode || null,
    timezone: form.timezone || null,
    taxId: form.taxId || null,
    ...(form.logoUrl ? { logoUrl: form.logoUrl } : {}),
  };
}

export function CompanyInfoPanel() {
  const activeWorkspaceId = getWorkspaceId();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const canVerifyCompany = hasWorkspacePermission(getUserPermissions(), 'settings', getUserRole());
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [workspaceId, setWorkspaceId] = useState('');
  const [slug, setSlug] = useState('');
  const [whatsappLines, setWhatsappLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<VerificationStatus | null>(null);
  const [otpPending, setOtpPending] = useState<Partial<Record<CompanyVerifyTarget, boolean>>>({});
  const [otpCodes, setOtpCodes] = useState<Partial<Record<CompanyVerifyTarget, string>>>({});
  const [otpBusy, setOtpBusy] = useState<Partial<Record<CompanyVerifyTarget, 'send' | 'verify'>>>({});
  const [otpError, setOtpError] = useState<Partial<Record<CompanyVerifyTarget, string>>>({});
  const [otpSentHint, setOtpSentHint] = useState<Partial<Record<CompanyVerifyTarget, string>>>({});

  const applySettings = useCallback((data: CompanySettingsResponse, fallbackEmail?: string) => {
    setForm(mapWorkspaceToForm(data, { email: fallbackEmail }));
    setWorkspaceId(data.id ?? '');
    setSlug(data.slug ?? '');
    setWhatsappLines(whatsappLinesFromSettings(data));
  }, []);

  const loadVerification = useCallback(async () => {
    try {
      const status = (await api.getVerificationStatus()) as VerificationStatus;
      setVerifyStatus(status);
    } catch {
      // optional — company form still works
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [companyRaw, me] = await Promise.all([
        api.getCompanySettings(),
        api.getMe().catch(() => null) as Promise<{ email?: string } | null>,
      ]);
      const company = normalizeCompanySettingsResponse(companyRaw);
      const fallbackEmail = company.email ? undefined : me?.email ?? getUserEmail() ?? undefined;
      applySettings(company, fallbackEmail);
      await loadVerification();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  }, [applySettings, loadVerification]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings, activeWorkspaceId]);

  useKeepAliveActivation(() => {
    void loadSettings();
  });

  const update = (field: keyof CompanyForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setMessage(null);
    if (field === 'email') {
      setOtpPending((p) => ({ ...p, company_email: false }));
      setOtpCodes((c) => ({ ...c, company_email: '' }));
      setOtpSentHint((h) => ({ ...h, company_email: '' }));
      setOtpError((e) => ({ ...e, company_email: '' }));
    }
    if (field === 'phone') {
      setOtpPending((p) => ({ ...p, company_phone: false }));
      setOtpCodes((c) => ({ ...c, company_phone: '' }));
      setOtpSentHint((h) => ({ ...h, company_phone: '' }));
      setOtpError((e) => ({ ...e, company_phone: '' }));
    }
  };

  const sendOtp = async (target: CompanyVerifyTarget) => {
    if (!canVerifyCompany) return;
    setOtpError((e) => ({ ...e, [target]: '' }));
    setOtpSentHint((h) => ({ ...h, [target]: '' }));
    setOtpBusy((b) => ({ ...b, [target]: 'send' }));
    setError(null);
    setMessage(null);
    try {
      const res = (await api.sendVerificationOtp({
        target,
        ...(target === 'company_email' && form.email.trim() ? { email: form.email.trim() } : {}),
        ...(target === 'company_phone' && form.phone.trim() ? { phone: form.phone.trim() } : {}),
      })) as { sent?: boolean; alreadyVerified?: boolean; destinationHint?: string };
      if (res.alreadyVerified) {
        setMessage('Already verified.');
        setOtpPending((p) => ({ ...p, [target]: false }));
        await loadVerification();
      } else {
        setOtpPending((p) => ({ ...p, [target]: true }));
        setOtpSentHint((h) => ({ ...h, [target]: otpSentMessage(target, res.destinationHint) }));
        await loadVerification();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send OTP';
      setOtpPending((p) => ({ ...p, [target]: false }));
      setOtpError((prev) => ({ ...prev, [target]: msg }));
      setError(msg);
    } finally {
      setOtpBusy((b) => {
        const next = { ...b };
        delete next[target];
        return next;
      });
    }
  };

  const verifyOtp = async (target: CompanyVerifyTarget) => {
    const code = (otpCodes[target] || '').trim();
    if (code.length < 4) return;
    setOtpBusy((b) => ({ ...b, [target]: 'verify' }));
    setOtpError((e) => ({ ...e, [target]: '' }));
    setError(null);
    setMessage(null);
    try {
      const status = (await api.verifyVerificationOtp({ target, code })) as VerificationStatus;
      setVerifyStatus(status);
      setOtpPending((p) => ({ ...p, [target]: false }));
      setOtpCodes((c) => ({ ...c, [target]: '' }));
      if (target === 'company_email' && status.companyEmail.value) {
        setForm((f) => ({ ...f, email: status.companyEmail.value || f.email }));
      }
      if (target === 'company_phone' && status.companyPhone.value) {
        setForm((f) => ({ ...f, phone: status.companyPhone.value || f.phone }));
      }
      setMessage('Verified successfully.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to verify OTP';
      setOtpError((prev) => ({ ...prev, [target]: msg }));
      setError(msg);
    } finally {
      setOtpBusy((b) => {
        const next = { ...b };
        delete next[target];
        return next;
      });
    }
  };

  const renderVerifyControls = (
    target: CompanyVerifyTarget,
    opts: { disabledSend: boolean; verified: boolean }
  ) => {
    if (opts.verified) {
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verified
        </span>
      );
    }
    if (!canVerifyCompany || !showCompanyVerifyUi) return null;
    return (
      <button
        type="button"
        onClick={() => void sendOtp(target)}
        disabled={Boolean(otpBusy[target]) || opts.disabledSend}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
      >
        {otpBusy[target] === 'send' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {otpPending[target] ? 'Resend' : 'Verify'}
      </button>
    );
  };

  const renderOtpSendError = (target: CompanyVerifyTarget) => {
    if (otpPending[target] || !otpError[target]) return null;
    return <p className="mt-1 text-xs font-medium text-danger-red">{otpError[target]}</p>;
  };

  const renderOtpRow = (target: CompanyVerifyTarget) => {
    if (!showCompanyVerifyUi || !otpPending[target] || !canVerifyCompany) return null;
    return (
      <div className="mt-2 space-y-1.5">
        {otpSentHint[target] ? (
          <p className="text-xs font-medium text-accent-green">{otpSentHint[target]}</p>
        ) : null}
        <div className="flex gap-2">
          <input
            value={otpCodes[target] || ''}
            onChange={(e) => setOtpCodes((c) => ({ ...c, [target]: e.target.value }))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter OTP"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => void verifyOtp(target)}
            disabled={otpBusy[target] === 'verify' || (otpCodes[target] || '').trim().length < 4}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {otpBusy[target] === 'verify' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Confirm
          </button>
        </div>
        {otpError[target] ? (
          <p className="text-xs font-medium text-danger-red">{otpError[target]}</p>
        ) : null}
      </div>
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = normalizeCompanySettingsResponse(
        await api.updateCompanySettings(payloadFromForm(form))
      );
      applySettings(saved);
      dispatchCompanyUpdated({ name: saved.name, logoUrl: saved.logoUrl });
      setMessage('Company info saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingLogo(true);
    setError(null);
    setMessage(null);
    try {
      const compressed = await compressImageFile(file, 320, 0.88);
      const saved = normalizeCompanySettingsResponse(
        await api.updateCompanySettings({ logoUrl: compressed })
      );
      setForm((prev) => ({ ...prev, logoUrl: saved.logoUrl ?? compressed }));
      dispatchCompanyUpdated({ name: saved.name ?? form.name, logoUrl: saved.logoUrl ?? compressed });
      setMessage('Company logo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    setError(null);
    setMessage(null);
    try {
      const saved = normalizeCompanySettingsResponse(
        await api.updateCompanySettings({ logoUrl: null })
      );
      setForm((prev) => ({ ...prev, logoUrl: '' }));
      dispatchCompanyUpdated({ name: saved.name ?? form.name, logoUrl: null });
      setMessage('Company logo removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {error && <p className="text-xs text-danger-red font-medium">{error}</p>}
      {message && <p className="text-xs text-accent-green font-medium">{message}</p>}

      <form onSubmit={handleSave}>
      <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-primary" />
          Company profile
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          Details for the active company workspace. Switch company from the sidebar if you manage
          multiple.
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-6">
          <div className="relative">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt={form.name || 'Company logo'}
                className="h-20 w-20 rounded-xl border border-slate-200 bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <Building2 className="h-8 w-8" aria-hidden />
              </div>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void handleLogoPick(e)}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" aria-hidden />
              {form.logoUrl ? 'Change logo' : 'Upload logo'}
            </button>
            {form.logoUrl ? (
              <button
                type="button"
                onClick={() => void handleRemoveLogo()}
                disabled={uploadingLogo}
                className="ml-2 inline-flex items-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Remove
              </button>
            ) : null}
            <p className="text-xs text-slate-500">Square PNG or JPG works best. Max 512 KB after resize.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="text-meta font-bold text-gray-500 uppercase">Company name *</span>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-meta font-bold text-gray-500 uppercase">Legal name</span>
            <input
              value={form.legalName}
              onChange={(e) => update('legalName', e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Registered business name"
            />
          </label>
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Industry</span>
            <input
              value={form.industry}
              onChange={(e) => update('industry', e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Education, Retail, …"
            />
          </label>
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Tax ID / GSTIN</span>
            <input
              value={form.taxId}
              onChange={(e) => update('taxId', e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Website</span>
            <div className="relative mt-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={form.website}
                onChange={(e) => update('website', e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="https://example.com"
              />
            </div>
          </label>
          <div className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Company email</span>
            <div className="mt-1 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {renderVerifyControls('company_email', {
                disabledSend: !form.email.trim(),
                verified: Boolean(verifyStatus?.companyEmail.verified),
              })}
            </div>
            {renderOtpSendError('company_email')}
            {renderOtpRow('company_email')}
          </div>
          <div className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Phone</span>
            <div className="mt-1 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="+919876543210"
                />
              </div>
              {renderVerifyControls('company_phone', {
                disabledSend: !form.phone.trim(),
                verified: Boolean(verifyStatus?.companyPhone.verified),
              })}
            </div>
            {renderOtpSendError('company_phone')}
            {renderOtpRow('company_phone')}
          </div>
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Timezone</span>
            <select
              value={form.timezone}
              onChange={(e) => update('timezone', e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-meta font-bold text-gray-500 uppercase">Address</span>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                rows={2}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">City</span>
            <input
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">State</span>
            <input
              value={form.state}
              onChange={(e) => update('state', e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Country</span>
            <input
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Postal code</span>
            <input
              value={form.postalCode}
              onChange={(e) => update('postalCode', e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>
      </form>

      <div className="bg-sky-50 rounded-2xl border border-sky-100 p-5">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Workspace reference</h4>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-gray-400 font-medium">Workspace ID</dt>
            <dd className="font-mono text-gray-800 mt-0.5 break-all">{workspaceId}</dd>
          </div>
          <div>
            <dt className="text-gray-400 font-medium">Slug</dt>
            <dd className="text-gray-800 mt-0.5">{slug}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-400 font-medium">Connected WhatsApp</dt>
            <dd className="text-gray-800 mt-0.5">
              {whatsappLines.length > 0 ? whatsappLines.join(', ') : 'Not connected yet'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
