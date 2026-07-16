import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Facebook, Loader2, RotateCw } from 'lucide-react';
import { api } from '../../lib/api';
import {
  buildMetaOAuthDialogUrl,
  META_ADS_OAUTH_REDIRECT_STORAGE_KEY,
  META_ADS_OAUTH_RETURN_PATH_KEY,
  META_ADS_SCOPES,
} from '../../lib/metaOAuth';
import { pathForIntegrationsChannel } from '../../routes';
import {
  clearStoredConnectError,
  IntegrationConnectError,
  META_ADS_CONNECT_ERROR_KEY,
} from './IntegrationConnectError';
import { AdAccount, MetaAdAccountOption } from '../../types';
import { fmtInr } from '../ads/utils';

type MetaAdsIntegrationPanelProps = {
  enabled?: boolean;
  onStatusChange?: () => void;
  connectError?: string | null;
  onDismissConnectError?: () => void;
};

export const MetaAdsIntegrationPanel: React.FC<MetaAdsIntegrationPanelProps> = ({
  enabled = true,
  onStatusChange,
  connectError,
  onDismissConnectError,
}) => {
  const metaAppId = import.meta.env.VITE_META_APP_ID || '';
  const hasValidAppId = !!metaAppId && metaAppId !== 'your_meta_app_id_here';

  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<AdAccount | null>(null);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const load = useCallback(async () => {
    if (!enabled) return;
    setSyncing(true);
    setError(null);
    try {
      const accountRes = await api.getMetaAdsAccount();
      if (accountRes.connected && accountRes.account) {
        setConnected(true);
        setAccount(accountRes.account);
        try {
          const res = await api.getMetaAdAccounts();
          setAdAccounts(res.accounts);
        } catch {
          setAdAccounts([]);
        }
      } else {
        setConnected(false);
        setAccount(null);
        setAdAccounts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Meta Ads');
      setConnected(false);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  const handleConnect = async () => {
    if (!hasValidAppId) {
      setError('Meta App ID is missing. Set VITE_META_APP_ID in frontend/.env.');
      return;
    }
    setConnecting(true);
    setError(null);
    onDismissConnectError?.();
    try {
      sessionStorage.setItem(
        META_ADS_OAUTH_RETURN_PATH_KEY,
        `${pathForIntegrationsChannel('meta-ads')}&meta_ads_connected=1`
      );
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
    if (!window.confirm('Disconnect Meta Ads from this workspace?')) return;
    try {
      await api.disconnectMetaAds();
      setConnected(false);
      setAccount(null);
      setAdAccounts([]);
      onStatusChangeRef.current?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const handleSwitchAccount = async (adAccountId: string) => {
    if (!adAccountId || account?.id === adAccountId) return;
    setSwitchingAccount(true);
    try {
      await api.selectMetaAdAccount(adAccountId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch ad account');
    } finally {
      setSwitchingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
        Loading Meta Ads…
      </div>
    );
  }

  if (!connected || !account) {
    return (
      <div className="space-y-4 max-w-lg">
        {connectError ? (
          <IntegrationConnectError
            title="Meta Ads connection failed"
            message="We could not connect your Meta Business Ad Account. Check the details below and try again."
            detail={connectError}
            onRetry={() => void handleConnect()}
            retrying={connecting}
          />
        ) : null}

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[#1877F2]/10 rounded-xl shrink-0">
            <Facebook className="w-5 h-5 text-[#1877F2]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-950">Connect Meta Ads</h3>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              Link your Meta Business Ad Account to run Click-to-WhatsApp campaigns and sync performance to the Ads Manager.
            </p>
          </div>
        </div>

        {!hasValidAppId && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            Configure VITE_META_APP_ID before connecting.
          </p>
        )}

        {error && (
          <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleConnect()}
          disabled={connecting || !hasValidAppId}
          className="w-full px-4 py-2.5 bg-channel-green hover:bg-[#20bd5a] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Facebook className="w-4 h-4 fill-white" />
          {connecting ? 'Redirecting…' : 'Connect Meta Account'}
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {connectError ? (
        <IntegrationConnectError
          title="Meta Ads connection failed"
          message="Your last connection attempt did not complete."
          detail={connectError}
          onRetry={() => void handleConnect()}
          retrying={connecting}
        />
      ) : null}
      {error && (
        <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 bg-[#1877F2] text-white rounded-xl shrink-0">
              <Facebook className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900">{account.name}</h3>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ID {account.id} · {account.currency} · Balance {fmtInr(account.balance)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={syncing}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="px-3 py-2 border border-red-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        </div>

        {adAccounts.length > 1 && (
          <div>
            <label htmlFor="meta-integration-ad-account" className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
              Ad account
            </label>
            <select
              id="meta-integration-ad-account"
              value={account.id}
              disabled={switchingAccount}
              onChange={(e) => void handleSwitchAccount(e.target.value)}
              className="w-full max-w-md px-3 py-2 bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl cursor-pointer disabled:opacity-50"
            >
              {adAccounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.campaignCount} campaigns)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
