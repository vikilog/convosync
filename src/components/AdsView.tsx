import React, { useCallback, useEffect, useState } from 'react';
import {
  Percent,
  MousePointerClick,
  MessageSquare,
  ExternalLink,
  Play,
  Pause,
  Plus,
  Layers,
  Facebook,
  RotateCw,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
  BarChart2,
  Eye,
  Target,
  ChevronDown,
  ChevronUp,
  Trash2,
  Zap,
  Check,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useKeepAliveActivation } from './KeepAlive';
import {
  buildMetaOAuthDialogUrl,
  META_ADS_OAUTH_REDIRECT_STORAGE_KEY,
  META_ADS_SCOPES,
} from '../lib/metaOAuth';
import { AdAccount, AdCampaign, AdInsights, MetaAdAccountOption } from '../types';

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString());
const fmtInr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  PAUSED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  DELETED: 'bg-red-50 text-red-600 border-red-200',
  IN_PROCESS: 'bg-blue-50 text-blue-700 border-blue-200',
  WITH_ISSUES: 'bg-red-50 text-red-600 border-red-200',
};

type CTWAFormData = {
  campaignName: string;
  dailyBudget: number;
  headline: string;
  description: string;
  ageMin: number;
  ageMax: number;
  locations: string;
  startDate: string;
};

const CreateCTWAModal: React.FC<{
  onClose: () => void;
  onCreate: (data: CTWAFormData) => void | Promise<void>;
  creating?: boolean;
}> = ({ onClose, onCreate, creating }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CTWAFormData>({
    campaignName: '',
    dailyBudget: 500,
    headline: '',
    description: '',
    ageMin: 18,
    ageMax: 45,
    locations: 'India',
    startDate: '',
  });

  const update = <K extends keyof CTWAFormData>(k: K, v: CTWAFormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600" />
              Create Click-to-WhatsApp Ad
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Step {step} of 3</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold text-lg">
            ×
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 pt-4">
          {['Campaign', 'Creative', 'Audience'].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-1.5 text-sm font-bold ${
                  step > i + 1 ? 'text-green-600' : step === i + 1 ? 'text-sky-600' : 'text-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-sm font-black ${
                    step > i + 1 ? 'bg-green-100' : step === i + 1 ? 'bg-sky-50' : 'bg-gray-100'
                  }`}
                >
                  {step > i + 1 ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {s}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 rounded ${step > i + 1 ? 'bg-green-200' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Campaign Name
                </label>
                <input
                  value={form.campaignName}
                  onChange={(e) => update('campaignName', e.target.value)}
                  placeholder="e.g. Diwali Sale — WhatsApp Leads"
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600"
                />
              </div>
              <div>
                <label className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Daily Budget (₹)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={form.dailyBudget}
                    onChange={(e) => update('dailyBudget', Number(e.target.value))}
                    className="flex-1 accent-[#0284c7]"
                  />
                  <span className="text-sm font-black text-sky-600 min-w-[60px] text-right">
                    {fmtInr(form.dailyBudget)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Est. reach: {fmt(form.dailyBudget * 40)}–{fmt(form.dailyBudget * 80)} people/day
                </p>
              </div>
              <div>
                <label className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Ad Headline
                </label>
                <input
                  value={form.headline}
                  onChange={(e) => update('headline', e.target.value)}
                  placeholder="e.g. Chat with us on WhatsApp!"
                  maxLength={40}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600"
                />
                <p className="text-xs text-gray-400 mt-1">{form.headline.length}/40 characters</p>
              </div>
              <div>
                <label className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="e.g. Get instant answers. Click to start a WhatsApp conversation with our team."
                  rows={3}
                  maxLength={125}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{form.description.length}/125 characters</p>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-600/40 hover:bg-[#fafafe] transition-all cursor-pointer">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-500">Upload Ad Image</p>
                <p className="text-xs text-gray-400 mt-0.5">Recommended: 1200×628px, JPG or PNG, max 30MB</p>
              </div>
              <div className="bg-[#fafaf9] border border-slate-200 rounded-xl p-4">
                <p className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Ad Preview</p>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="h-28 bg-gradient-to-br from-sky-50 to-sky-50 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-sky-600/30" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-black text-gray-900">{form.headline || 'Your headline here'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{form.description || 'Your description here'}</p>
                    <div className="mt-2 bg-[#25D366] text-white text-sm font-black py-1.5 px-3 rounded-lg text-center">
                      Send WhatsApp Message
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Target Locations
                </label>
                <input
                  value={form.locations}
                  onChange={(e) => update('locations', e.target.value)}
                  placeholder="India, Mumbai, Delhi..."
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600"
                />
              </div>
              <div>
                <label className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-3">
                  Age Range: {form.ageMin}–{form.ageMax} years
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8">Min</span>
                    <input
                      type="range"
                      min="18"
                      max="65"
                      value={form.ageMin}
                      onChange={(e) => update('ageMin', Number(e.target.value))}
                      className="flex-1 accent-[#0284c7]"
                    />
                    <span className="text-sm font-bold text-sky-600 w-8">{form.ageMin}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8">Max</span>
                    <input
                      type="range"
                      min="18"
                      max="65"
                      value={form.ageMax}
                      onChange={(e) => update('ageMax', Number(e.target.value))}
                      className="flex-1 accent-[#0284c7]"
                    />
                    <span className="text-sm font-bold text-sky-600 w-8">{form.ageMax}</span>
                  </div>
                </div>
              </div>
              <div className="bg-sky-50/50 border border-sky-600/10 rounded-xl p-4 space-y-2">
                <p className="text-sm font-black text-sky-600 uppercase tracking-wider">Campaign Summary</p>
                {[
                  ['Name', form.campaignName || '—'],
                  ['Daily Budget', fmtInr(form.dailyBudget)],
                  ['Headline', form.headline || '—'],
                  ['Audience', `${form.ageMin}–${form.ageMax} yrs • ${form.locations}`],
                  ['Objective', 'Click-to-WhatsApp (MESSAGES)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">{k}</span>
                    <span className="font-bold text-gray-900 text-right max-w-[200px] truncate">{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-slate-200">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            className="px-4 py-2 text-sm font-bold text-gray-600 border border-slate-200 rounded-xl hover:bg-gray-50"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button
            type="button"
            onClick={
              step === 3
                ? () => void onCreate(form)
                : () => setStep((s) => s + 1)
            }
            disabled={(step === 1 && !form.campaignName) || creating}
            className="px-5 py-2 bg-sky-600 hover:bg-[#4a3dd4] disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-md shadow-[#0284c7]/20"
          >
            {creating ? (
              'Launching…'
            ) : step === 3 ? (
              <>
                <Zap className="w-3.5 h-3.5" /> Launch Ad
              </>
            ) : (
              <>Next Step →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const InsightsRow: React.FC<{
  insights: AdInsights;
  isCTWA: boolean;
  waConversations?: number;
}> = ({ insights, isCTWA, waConversations }) => {
  const metrics = [
    { label: 'Spend', value: fmtInr(insights.spend), icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-purple-600 bg-purple-50' },
    { label: 'Impressions', value: fmt(insights.impressions), icon: <Eye className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Clicks', value: fmt(insights.clicks), icon: <MousePointerClick className="w-3.5 h-3.5" />, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'CTR', value: fmtPct(insights.ctr), icon: <Percent className="w-3.5 h-3.5" />, color: 'text-pink-600 bg-pink-50' },
    { label: 'CPC', value: fmtInr(insights.cpc), icon: <Target className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-50' },
    { label: 'CPM', value: fmtInr(insights.cpm), icon: <BarChart2 className="w-3.5 h-3.5" />, color: 'text-gray-600 bg-gray-100' },
    ...(isCTWA
      ? [{ label: 'WA Convos', value: fmt(waConversations || 0), icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'text-green-700 bg-green-50' }]
      : []),
    ...(insights.roas
      ? [{ label: 'ROAS', value: `${insights.roas}x`, icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50' }]
      : []),
  ];

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-3 pt-3 border-t border-slate-200">
      {metrics.map((m) => (
        <div key={m.label} className="text-center">
          <div className={`${m.color} w-6 h-6 rounded-lg flex items-center justify-center mx-auto mb-1`}>
            {m.icon}
          </div>
          <p className="text-sm font-black text-gray-900 font-mono">{m.value}</p>
          <p className="text-meta text-gray-400 font-medium">{m.label}</p>
        </div>
      ))}
    </div>
  );
};

const CampaignCard: React.FC<{
  campaign: AdCampaign;
  onToggle: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  busy?: boolean;
}> = ({ campaign, onToggle, onDelete, busy }) => {
  const [showInsights, setShowInsights] = useState(false);

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden flex flex-col hover:shadow-lg transition-all ${
        campaign.status === 'PAUSED' ? 'border-yellow-200 opacity-80' : 'border-slate-200 hover:border-sky-600/20'
      }`}
    >
      <div className="h-44 bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {campaign.previewUrl ? (
          <img src={campaign.previewUrl} alt={campaign.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <ImageIcon className="w-8 h-8" />
            <span className="text-sm font-bold uppercase tracking-wider">{campaign.platform}</span>
          </div>
        )}
        <span className="absolute bottom-3 left-3 bg-gray-950/80 backdrop-blur-xs text-white text-meta font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md">
          {campaign.platform}
        </span>
        <span
          className={`absolute top-3 right-3 text-meta font-black px-2.5 py-1 rounded-full border ${STATUS_STYLES[campaign.status] || STATUS_STYLES.PAUSED}`}
        >
          {campaign.status}
        </span>
        {campaign.isCTWA && (
          <span className="absolute top-3 left-3 bg-[#25D366] text-white text-meta font-black px-2 py-0.5 rounded-full flex items-center gap-1">
            <MessageSquare className="w-2.5 h-2.5" /> CTWA
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h5 className="font-bold text-gray-900 text-sm leading-tight">{campaign.name}</h5>
          <p className="text-xs text-gray-400 font-medium mb-3 mt-1">
            {campaign.objective} • {fmtInr(campaign.dailyBudget)}/day • Started {campaign.startTime}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-slate-50 p-2 rounded-xl border border-sky-100 text-center">
              <p className="text-meta text-gray-400 font-black uppercase">Clicks</p>
              <p className="text-sm font-black text-gray-900 font-mono mt-0.5">{fmt(campaign.clicks)}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-sky-100 text-center">
              <p className="text-meta text-sky-600 font-black uppercase">Conv%</p>
              <p className="text-sm font-black text-sky-600 font-mono mt-0.5">{campaign.conversionMultiplier}%</p>
            </div>
            <div
              className={`p-2 rounded-xl border text-center ${
                campaign.isCTWA ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <p
                className={`text-meta font-black uppercase ${
                  campaign.isCTWA ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {campaign.isCTWA ? 'WA Convos' : 'Reach'}
              </p>
              <p
                className={`text-sm font-black font-mono mt-0.5 ${
                  campaign.isCTWA ? 'text-green-700' : 'text-gray-900'
                }`}
              >
                {campaign.isCTWA
                  ? fmt(campaign.waConversationsStarted || 0)
                  : fmt(campaign.insights.reach)}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInsights(!showInsights)}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#fafaf9] border border-slate-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-600/20 transition-all mb-3"
        >
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> View Analytics
          </span>
          {showInsights ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showInsights && (
          <InsightsRow
            insights={campaign.insights}
            isCTWA={campaign.isCTWA}
            waConversations={campaign.waConversationsStarted}
          />
        )}

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onToggle(campaign.id)}
              className={`flex items-center gap-1.5 text-sm font-black px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50 ${
                campaign.status === 'ACTIVE'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              }`}
            >
              {campaign.status === 'ACTIVE' ? (
                <>
                  <Pause className="w-3 h-3" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" /> Resume
                </>
              )}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDelete(campaign.id)}
              className="flex items-center gap-1.5 text-sm font-black px-3 py-1.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
          <a
            href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${campaign.id.split('_')[0]}`}
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 hover:text-[#4a3dd4] p-1.5 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 text-meta font-black"
          >
            Meta Ads <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export const AdsView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const metaAppId = import.meta.env.VITE_META_APP_ID || '';
  const hasValidAppId = !!metaAppId && metaAppId !== 'your_meta_app_id_here';

  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [adAccount, setAdAccount] = useState<AdAccount | null>(null);
  const [metaIsConnected, setMetaIsConnected] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'CTWA' | 'OTHER'>('ALL');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthRedirectUri, setOauthRedirectUri] = useState<string | null>(null);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccountOption[]>([]);
  const [switchingAccount, setSwitchingAccount] = useState(false);

  const loadAdAccounts = useCallback(async () => {
    try {
      const res = await api.getMetaAdAccounts();
      setAdAccounts(res.accounts);
      return res.accounts;
    } catch {
      setAdAccounts([]);
      return [];
    }
  }, []);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setSyncing(true);
    if (!options?.silent) setError(null);
    try {
      const accountRes = await api.getMetaAdsAccount();
      if (accountRes.connected && accountRes.account) {
        setMetaIsConnected(true);
        setAdAccount(accountRes.account);
        const accounts = await loadAdAccounts();
        try {
          let campaignsRes = await api.getMetaAdCampaigns();
          if (campaignsRes.campaigns.length === 0 && accounts.length > 0) {
            const betterAccount = accounts.find(
              (account) => !account.isSelected && account.campaignCount > 0
            );
            if (betterAccount) {
              await api.selectMetaAdAccount(betterAccount.id);
              const accountRes2 = await api.getMetaAdsAccount();
              if (accountRes2.connected && accountRes2.account) {
                setAdAccount(accountRes2.account);
              }
              await loadAdAccounts();
              campaignsRes = await api.getMetaAdCampaigns();
            }
          }
          setAds(campaignsRes.campaigns);
          if (campaignsRes.campaigns.length === 0 && accounts.length > 1) {
            setError(
              'No campaigns in the selected ad account. Use "Switch Ad Account" to pick the account where your Page ads are running.'
            );
          }
        } catch (campaignErr) {
          setAds([]);
          if (!options?.silent) {
            setError(
              campaignErr instanceof Error ? campaignErr.message : 'Failed to load campaigns'
            );
          }
        }
      } else {
        setMetaIsConnected(false);
        setAdAccount(null);
        setAds([]);
        try {
          const oauth = await api.getMetaAdsOAuthState();
          setOauthRedirectUri(oauth.redirectUri);
        } catch {
          setOauthRedirectUri(import.meta.env.VITE_META_ADS_REDIRECT_URI || null);
        }
      }
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load Meta Ads');
        setMetaIsConnected(false);
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
        setSyncing(false);
      }
    }
  }, [loadAdAccounts]);

  const handleSwitchAccount = async (adAccountId: string) => {
    if (!adAccountId || adAccount?.id === adAccountId) return;
    setSwitchingAccount(true);
    setError(null);
    try {
      await api.selectMetaAdAccount(adAccountId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch ad account');
    } finally {
      setSwitchingAccount(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useKeepAliveActivation(() => {
    void loadData({ silent: true });
  });

  useEffect(() => {
    if (searchParams.get('meta_ads_connected') === '1') {
      void loadData();
    }
    if (searchParams.get('meta_ads_error') === '1') {
      setError('Meta Ads connection failed. Please try again.');
    }
  }, [searchParams, loadData]);

  const filtered = ads.filter(
    (a) =>
      (filterStatus === 'ALL' || a.status === filterStatus) &&
      (filterType === 'ALL' || (filterType === 'CTWA' ? a.isCTWA : !a.isCTWA))
  );

  const totalSpend = ads.reduce((s, a) => s + a.insights.spend, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalConversations = ads.reduce((s, a) => s + (a.waConversationsStarted || 0), 0);
  const avgCTR = ads.length ? ads.reduce((s, a) => s + a.insights.ctr, 0) / ads.length : 0;

  const handleConnect = async () => {
    if (!hasValidAppId) {
      setError('Meta App ID is missing. Set VITE_META_APP_ID in frontend/.env.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const oauth = await api.getMetaAdsOAuthState();
      sessionStorage.setItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY, oauth.redirectUri);
      const authUrl = buildMetaOAuthDialogUrl({
        clientId: metaAppId,
        redirectUri: oauth.redirectUri,
        state: oauth.state,
        scope: META_ADS_SCOPES,
      });
      window.location.assign(authUrl);
    } catch (err) {
      setConnecting(false);
      setError(err instanceof Error ? err.message : 'Failed to start Meta OAuth');
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectMetaAds();
      setMetaIsConnected(false);
      setAdAccount(null);
      setAds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const handleToggle = async (id: string) => {
    const campaign = ads.find((a) => a.id === id);
    if (!campaign) return;
    setActionBusy(true);
    try {
      if (campaign.status === 'ACTIVE') {
        await api.pauseMetaAdCampaign(id);
      } else {
        await api.resumeMetaAdCampaign(id);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionBusy(true);
    try {
      await api.deleteMetaAdCampaign(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
    } finally {
      setActionBusy(false);
    }
  };

  const handleCreate = async (data: CTWAFormData) => {
    setCreating(true);
    setError(null);
    try {
      await api.createMetaCTWAAd({
        campaignName: data.campaignName,
        dailyBudget: data.dailyBudget,
        startDate: data.startDate || new Date().toISOString().slice(0, 10),
        headline: data.headline,
        description: data.description,
        targeting: {
          ageMin: data.ageMin,
          ageMax: data.ageMax,
          locations: data.locations.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create CTWA ad');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto pb-12 flex items-center justify-center min-h-[240px]">
        <p className="text-sm text-gray-400 font-medium">Loading Meta Ads Manager…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 max-w-7xl mx-auto pb-12 text-left selection:bg-sky-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-sans font-black text-gray-900 text-lg leading-none">Meta Ads Manager</h3>
          <p className="text-xs text-gray-400 mt-1.5 font-medium">
            Manage Click-to-WhatsApp ads, track campaign performance, and create new CTWA ad units.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={!metaIsConnected}
          className="bg-sky-600 hover:bg-[#4a3dd4] disabled:bg-gray-200 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-bold transition-all active:scale-95 shadow-md shadow-[#0284c7]/20"
        >
          <Plus className="w-3.5 h-3.5" /> Create CTWA Ad
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {metaIsConnected && adAccount ? (
        <div className="bg-gradient-to-r from-[#0284c7]/10 via-sky-50 to-slate-50 border border-sky-600/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="flex items-start gap-3.5 z-10">
            <div className="p-3 bg-sky-600 text-white rounded-xl shadow-lg shadow-[#0284c7]/20 shrink-0">
              <Facebook className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-950 text-sm leading-none flex items-center gap-2">
                {adAccount.name}
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
                <span className="text-xs text-green-600 font-black bg-green-50 px-2 rounded-full">
                  Connected
                </span>
              </h4>
              <p className="text-xs text-gray-500 font-medium mt-1.5 flex items-center gap-3 flex-wrap">
                <span>
                  Account ID: <strong className="text-gray-700 font-mono">{adAccount.id}</strong>
                </span>
                <span>•</span>
                <span>
                  Currency: <strong className="text-gray-700">{adAccount.currency}</strong>
                </span>
                <span>•</span>
                <span>
                  Balance: <strong className="text-sky-600">{fmtInr(adAccount.balance)}</strong>
                </span>
                <span>•</span>
                <span>
                  Timezone: <strong className="text-gray-700">{adAccount.timezone}</strong>
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 z-10 flex-wrap justify-end">
            {adAccounts.length > 1 && (
              <div className="flex flex-col items-end gap-1">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                  Ad Account
                </label>
                <select
                  value={adAccount.id}
                  disabled={switchingAccount}
                  onChange={(e) => void handleSwitchAccount(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-sm font-bold text-gray-700 rounded-xl hover:bg-gray-50 min-w-[220px] max-w-[320px] disabled:opacity-50"
                >
                  {adAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.campaignCount} campaigns
                      {account.source === 'page_business' ? ', Page Business' : ''})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={syncing}
              className="px-3 py-1.5 bg-white border border-slate-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} /> Sync
            </button>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="px-3 py-1.5 bg-white border border-slate-200 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 hover:border-red-200"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#fff5e6]/40 border border-[#f2994a]/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#fff5e6] rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">Meta Ads Account Not Connected</p>
              <p className="text-meta text-gray-400 font-medium leading-normal mt-1">
                Connect your Meta Business Ad Account to manage campaigns and track CTWA performance.
              </p>
              {oauthRedirectUri && (
                <p className="text-xs text-gray-500 mt-2 font-mono bg-white/60 border border-orange-100 rounded-lg px-2 py-1.5 break-all">
                  Meta App → Valid OAuth Redirect URI: {oauthRedirectUri}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="px-4 py-2 bg-sky-600 hover:bg-[#4a3dd4] disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md transition-all whitespace-nowrap flex items-center gap-2"
          >
            <Facebook className="w-4 h-4" />
            {connecting ? 'Redirecting…' : 'Connect Meta Account'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Spend',
            value: fmtInr(totalSpend),
            delta: 'All campaigns',
            icon: <DollarSign className="w-4 h-4" />,
            color: 'text-sky-600 bg-sky-50',
          },
          {
            label: 'Total Clicks',
            value: fmt(totalClicks),
            delta: 'Live from Meta',
            icon: <MousePointerClick className="w-4 h-4" />,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'WA Conversations',
            value: fmt(totalConversations),
            delta: 'CTWA campaigns',
            icon: <MessageSquare className="w-4 h-4" />,
            color: 'text-green-700 bg-green-50',
          },
          {
            label: 'Avg CTR',
            value: fmtPct(avgCTR),
            delta: 'Industry avg 1.2%',
            icon: <TrendingUp className="w-4 h-4" />,
            color: 'text-pink-600 bg-pink-50',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all"
          >
            <div className={`${stat.color} w-8 h-8 rounded-xl flex items-center justify-center mb-2`}>
              {stat.icon}
            </div>
            <p className="text-sm font-extrabold text-gray-400 uppercase tracking-widest leading-none mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-gray-900 font-mono">{stat.value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-green-500" />
              {stat.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-sm font-black rounded-lg transition-all ${
                filterStatus === s ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {(['ALL', 'CTWA', 'OTHER'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-sm font-black rounded-lg transition-all ${
                filterType === t ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t === 'CTWA' ? '📱 CTWA Only' : t === 'OTHER' ? '📊 Non-CTWA' : 'All Types'}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 font-medium ml-auto">{filtered.length} campaigns</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((ad) => (
          <CampaignCard
            key={ad.id}
            campaign={ad}
            onToggle={handleToggle}
            onDelete={handleDelete}
            busy={actionBusy}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">No campaigns found</p>
            <p className="text-xs mt-1">
              {metaIsConnected
                ? 'Try changing filters or create a new CTWA ad'
                : 'Connect your Meta Ad Account to load campaigns'}
            </p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateCTWAModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          creating={creating}
        />
      )}
    </div>
  );
};
