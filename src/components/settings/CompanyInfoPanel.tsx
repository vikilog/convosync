import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2, Globe, Loader2, Mail, MapPin, Phone, Save } from 'lucide-react';
import { api, getUserEmail, getWorkspaceId } from '../../lib/api';
import {
  mapWorkspaceToForm,
  whatsappLinesFromSettings,
  type CompanyForm,
  type CompanySettingsResponse,
} from './companyFormUtils';

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
};

function payloadFromForm(form: CompanyForm) {
  return {
    ...form,
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
  };
}

export function CompanyInfoPanel() {
  const location = useLocation();
  const activeWorkspaceId = getWorkspaceId();
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [workspaceId, setWorkspaceId] = useState('');
  const [slug, setSlug] = useState('');
  const [whatsappLines, setWhatsappLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applySettings = useCallback((data: CompanySettingsResponse, fallbackEmail?: string) => {
    setForm(mapWorkspaceToForm(data, { email: fallbackEmail }));
    setWorkspaceId(data.id ?? '');
    setSlug(data.slug ?? '');
    setWhatsappLines(whatsappLinesFromSettings(data));
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [company, me] = await Promise.all([
        api.getCompanySettings() as Promise<CompanySettingsResponse>,
        api.getMe().catch(() => null) as Promise<{ email?: string } | null>,
      ]);
      const fallbackEmail = company.email ? undefined : me?.email ?? getUserEmail() ?? undefined;
      applySettings(company, fallbackEmail);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    if (!location.pathname.includes('/settings/company-info')) return;
    void loadSettings();
  }, [location.pathname, loadSettings, activeWorkspaceId]);

  const update = (field: keyof CompanyForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = (await api.updateCompanySettings(
        payloadFromForm(form)
      )) as CompanySettingsResponse;
      applySettings(saved);
      setMessage('Company info saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
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
    <form onSubmit={handleSave} className="max-w-3xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-primary" />
          Company profile
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          Details for the active company workspace. Switch company from the sidebar if you manage
          multiple.
        </p>

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
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Company email</span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-meta font-bold text-gray-500 uppercase">Phone</span>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </label>
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

        {error && <p className="mt-4 text-xs text-danger-red font-medium">{error}</p>}
        {message && <p className="mt-4 text-xs text-accent-green font-medium">{message}</p>}

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

      <div className="mt-4 bg-sky-50 rounded-2xl border border-sky-100 p-5">
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
    </form>
  );
}
