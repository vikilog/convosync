import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2,
  Layers,
  Loader2,
  MessageSquare,
  MousePointerClick,
  Plus,
  Settings,
} from 'lucide-react';
import { api } from '../../lib/api';
import { pathForIntegrationsChannel } from '../../routes';
import { AdAccount, AdCampaign, MetaAdAccountOption } from '../../types';
import { useKeepAliveActivation, useKeepAliveActive } from '../KeepAlive';
import { AdsIntegrationsPrompt } from './AdsIntegrationsPrompt';
import { AdsKpiGrid, buildAdsKpiStats } from './AdsKpiGrid';
import { CampaignCard, CampaignWithSource } from './CampaignCard';
import { CreateCTWAModal, CTWAFormData } from './CreateCTWAModal';
import { GoogleIcon } from './GoogleIcon';
import { PlatformScope } from './utils';

function MetaAdsAccountChip({
  account,
  adAccounts,
  switchingAccount,
  onSwitchAccount,
  manageHref,
}: {
  account: AdAccount;
  adAccounts: MetaAdAccountOption[];
  switchingAccount: boolean;
  onSwitchAccount: (adAccountId: string) => void;
  manageHref: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm min-w-0">
      <MousePointerClick className="w-4 h-4 text-[#1877F2] shrink-0" />
      <span className="font-bold text-gray-900 shrink-0">Meta Ads</span>
      {adAccounts.length > 0 ? (
        <select
          value={account.id}
          disabled={switchingAccount}
          onChange={(e) => onSwitchAccount(e.target.value)}
          aria-label="Select Meta ad account"
          className="max-w-[220px] px-2 py-1 bg-slate-50 border border-slate-200 text-sm font-medium text-gray-700 rounded-lg cursor-pointer disabled:opacity-50 truncate"
        >
          {adAccounts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.id} ({item.campaignCount} campaigns)
            </option>
          ))}
        </select>
      ) : (
        <span className="text-gray-500 truncate max-w-[180px]">
          {account.name} · {account.id}
        </span>
      )}
      <Link
        to={manageHref}
        className="ml-1 text-sky-600 hover:text-sky-700 cursor-pointer shrink-0"
        aria-label="Manage Meta Ads"
      >
        <Settings className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function ConnectedPlatformChip({
  label,
  accountName,
  manageHref,
  icon,
}: {
  label: string;
  accountName: string;
  manageHref: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm">
      {icon}
      <span className="font-bold text-gray-900">{label}</span>
      <span className="text-gray-500 truncate max-w-[140px]">{accountName}</span>
      <Link
        to={manageHref}
        className="ml-1 text-sky-600 hover:text-sky-700 cursor-pointer"
        aria-label={`Manage ${label}`}
      >
        <Settings className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

export const AdsView: React.FC = () => {
  const isActive = useKeepAliveActive();
  const [metaCampaigns, setMetaCampaigns] = useState<AdCampaign[]>([]);
  const [googleCampaigns, setGoogleCampaigns] = useState<AdCampaign[]>([]);
  const [metaAccount, setMetaAccount] = useState<AdAccount | null>(null);
  const [metaAdAccounts, setMetaAdAccounts] = useState<MetaAdAccountOption[]>([]);
  const [googleAccount, setGoogleAccount] = useState<AdAccount | null>(null);
  const [metaIsConnected, setMetaIsConnected] = useState(false);
  const [googleIsConnected, setGoogleIsConnected] = useState(false);

  const [platformScope, setPlatformScope] = useState<PlatformScope>('meta');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'CTWA' | 'OTHER'>('ALL');

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetaData = useCallback(async (options?: { silent?: boolean }) => {
    try {
      const accountRes = await api.getMetaAdsAccount();
      if (accountRes.connected && accountRes.account) {
        setMetaIsConnected(true);
        setMetaAccount(accountRes.account);
        try {
          let campaignsRes = await api.getMetaAdCampaigns();
          const accountsRes = await api.getMetaAdAccounts().catch(() => ({ accounts: [] }));
          setMetaAdAccounts(accountsRes.accounts);
          if (campaignsRes.campaigns.length === 0 && accountsRes.accounts.length > 0) {
            const betterAccount = accountsRes.accounts.find(
              (account) => !account.isSelected && account.campaignCount > 0
            );
            if (betterAccount) {
              await api.selectMetaAdAccount(betterAccount.id);
              const accountRes2 = await api.getMetaAdsAccount();
              if (accountRes2.connected && accountRes2.account) {
                setMetaAccount(accountRes2.account);
              }
              campaignsRes = await api.getMetaAdCampaigns();
            }
          }
          setMetaCampaigns(campaignsRes.campaigns);
        } catch (campaignErr) {
          setMetaCampaigns([]);
          if (!options?.silent) {
            setError(
              campaignErr instanceof Error ? campaignErr.message : 'Failed to load Meta campaigns'
            );
          }
        }
      } else {
        setMetaIsConnected(false);
        setMetaAccount(null);
        setMetaAdAccounts([]);
        setMetaCampaigns([]);
      }
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load Meta Ads');
      }
      setMetaIsConnected(false);
      setMetaAccount(null);
      setMetaAdAccounts([]);
      setMetaCampaigns([]);
    }
  }, []);

  const loadGoogleData = useCallback(async () => {
    try {
      const accountRes = await api.getGoogleAdsAccount();
      if (accountRes.connected && accountRes.account) {
        setGoogleIsConnected(true);
        setGoogleAccount(accountRes.account);
        try {
          const campaignsRes = await api.getGoogleAdCampaigns();
          setGoogleCampaigns(campaignsRes.campaigns);
        } catch {
          setGoogleCampaigns([]);
        }
      } else {
        setGoogleIsConnected(false);
        setGoogleAccount(null);
        setGoogleCampaigns([]);
      }
    } catch {
      setGoogleIsConnected(false);
      setGoogleAccount(null);
      setGoogleCampaigns([]);
    }
  }, []);

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
        setError(null);
      }
      await Promise.all([loadMetaData(options), loadGoogleData()]);
      if (!options?.silent) setLoading(false);
    },
    [loadMetaData, loadGoogleData]
  );

  useEffect(() => {
    if (!isActive) return;
    void loadData();
  }, [isActive, loadData]);

  useKeepAliveActivation(() => {
    void loadData({ silent: true });
  });

  useEffect(() => {
    if (metaIsConnected) {
      setPlatformScope((current) => (current === 'google' && !googleIsConnected ? 'meta' : current));
      return;
    }
    if (googleIsConnected) {
      setPlatformScope('google');
    }
  }, [metaIsConnected, googleIsConnected]);

  const anyConnected = metaIsConnected || googleIsConnected;

  const platformTabs = useMemo(() => {
    const tabs: { id: PlatformScope; label: string; icon?: typeof MousePointerClick }[] = [];
    if (metaIsConnected) tabs.push({ id: 'meta', label: 'Meta Ads', icon: MousePointerClick });
    if (googleIsConnected) tabs.push({ id: 'google', label: 'Google Ads' });
    return tabs;
  }, [metaIsConnected, googleIsConnected]);

  useEffect(() => {
    if (platformTabs.length === 0) return;
    if (!platformTabs.some((tab) => tab.id === platformScope)) {
      setPlatformScope(platformTabs[0].id);
    }
  }, [platformTabs, platformScope]);

  const allCampaigns: CampaignWithSource[] = useMemo(
    () => [
      ...metaCampaigns.map((c) => ({ ...c, source: 'meta' as const })),
      ...googleCampaigns.map((c) => ({ ...c, source: 'google' as const })),
    ],
    [metaCampaigns, googleCampaigns]
  );

  const scopedCampaigns = useMemo(() => {
    if (platformScope === 'meta') return allCampaigns.filter((c) => c.source === 'meta');
    return allCampaigns.filter((c) => c.source === 'google');
  }, [allCampaigns, platformScope]);

  const filtered = scopedCampaigns.filter(
    (a) =>
      (filterStatus === 'ALL' || a.status === filterStatus) &&
      (filterType === 'ALL' || (filterType === 'CTWA' ? a.isCTWA : !a.isCTWA))
  );

  const totalSpend = scopedCampaigns.reduce((s, a) => s + (a.insights?.spend ?? 0), 0);
  const totalClicks = scopedCampaigns.reduce((s, a) => s + (a.clicks ?? 0), 0);
  const totalConversations = scopedCampaigns.reduce((s, a) => s + (a.waConversationsStarted ?? 0), 0);
  const avgCTR = scopedCampaigns.length
    ? scopedCampaigns.reduce((s, a) => s + (a.insights?.ctr ?? 0), 0) / scopedCampaigns.length
    : 0;

  const platformLabel =
    platformScope === 'meta' ? 'Meta campaigns' : 'Google campaigns';

  const canCreateMetaAd = metaIsConnected && platformScope === 'meta';

  const handleSwitchMetaAccount = async (adAccountId: string) => {
    if (!metaAccount || metaAccount.id === adAccountId) return;
    setSwitchingAccount(true);
    setError(null);
    try {
      await api.selectMetaAdAccount(adAccountId);
      await loadMetaData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch ad account');
    } finally {
      setSwitchingAccount(false);
    }
  };

  const handleToggle = async (id: string) => {
    const campaign = metaCampaigns.find((a) => a.id === id);
    if (!campaign) return;
    setActionBusy(true);
    try {
      if (campaign.status === 'ACTIVE') {
        await api.pauseMetaAdCampaign(id);
      } else {
        await api.resumeMetaAdCampaign(id);
      }
      await loadMetaData();
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
      setMetaCampaigns((prev) => prev.filter((a) => a.id !== id));
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
      await loadMetaData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create CTWA ad');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto pb-12 flex items-center justify-center min-h-[240px]">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
          Loading Ads Manager…
        </div>
      </div>
    );
  }

  if (!anyConnected) {
    return <AdsIntegrationsPrompt />;
  }

  return (
    <div className="flex-1 space-y-6 max-w-7xl mx-auto pb-12 text-left">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans font-black text-gray-900 text-xl leading-tight">Ads Manager</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Campaign performance from your connected Meta and Google Ads integrations.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {metaIsConnected && metaAccount && (
              <MetaAdsAccountChip
                account={metaAccount}
                adAccounts={metaAdAccounts}
                switchingAccount={switchingAccount}
                onSwitchAccount={(id) => void handleSwitchMetaAccount(id)}
                manageHref={pathForIntegrationsChannel('meta-ads')}
              />
            )}
            {googleIsConnected && googleAccount && (
              <ConnectedPlatformChip
                label="Google Ads"
                accountName={googleAccount.name}
                manageHref={pathForIntegrationsChannel('google-ads')}
                icon={<GoogleIcon className="w-4 h-4" />}
              />
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={!canCreateMetaAd}
          title={canCreateMetaAd ? undefined : 'Connect Meta Ads in Integrations to create CTWA campaigns'}
          className="bg-channel-green hover:bg-[#20bd5a] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create CTWA Ad
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <section className="space-y-4" aria-label="Campaign analytics">
        {platformTabs.length > 1 && (
          <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            {platformTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPlatformScope(tab.id)}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  platformScope === tab.id ? 'bg-channel-green text-white' : 'text-gray-600 hover:bg-slate-50'
                }`}
              >
                {tab.id === 'google' && <GoogleIcon className="w-3.5 h-3.5" />}
                {tab.id === 'meta' && tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <AdsKpiGrid
          stats={buildAdsKpiStats({
            totalSpend,
            totalClicks,
            totalConversations,
            avgCTR,
            platformLabel,
          })}
        />
      </section>

      <section className="space-y-4" aria-label="Campaign list">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                  filterStatus === s ? 'bg-channel-green text-white' : 'text-gray-600 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {platformScope === 'meta' && metaIsConnected && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {(
                [
                  { id: 'ALL', label: 'All types', icon: Layers },
                  { id: 'CTWA', label: 'CTWA only', icon: MessageSquare },
                  { id: 'OTHER', label: 'Other', icon: BarChart2 },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterType(t.id)}
                  className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    filterType === t.id ? 'bg-channel-green text-white' : 'text-gray-600 hover:bg-slate-50'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <span className="text-xs text-gray-500 font-medium ml-auto">{filtered.length} campaigns</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((ad) => (
            <CampaignCard
              key={`${ad.source}-${ad.id}`}
              campaign={ad}
              onToggle={ad.source === 'meta' ? handleToggle : undefined}
              onDelete={ad.source === 'meta' ? handleDelete : undefined}
              busy={actionBusy}
              readOnly={ad.source === 'google'}
            />
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 rounded-2xl border border-dashed border-slate-200 bg-white">
              <Layers className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-sm text-gray-700">No campaigns found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Try changing filters or create a new CTWA ad on Meta.
              </p>
            </div>
          )}
        </div>
      </section>

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
