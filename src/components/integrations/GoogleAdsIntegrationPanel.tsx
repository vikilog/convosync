import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Link2, Loader2, RotateCw } from 'lucide-react';
import { api } from '../../lib/api';
import {
  GOOGLE_OAUTH_RETURN_PATH_KEY,
  getGoogleOAuthRedirectUri,
  startGoogleOAuth,
} from '../../lib/googleOAuth';
import { AdAccount } from '../../types';
import { GoogleIcon } from '../ads/GoogleIcon';
import { fmtInr } from '../ads/utils';

type GoogleAdsIntegrationPanelProps = {
  enabled?: boolean;
  onStatusChange?: () => void;
};

export const GoogleAdsIntegrationPanel: React.FC<GoogleAdsIntegrationPanelProps> = ({
  enabled = true,
  onStatusChange,
}) => {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<AdAccount | null>(null);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const load = useCallback(async () => {
    if (!enabled) return;
    setSyncing(true);
    setError(null);
    try {
      const accountRes = await api.getGoogleAdsAccount();
      if (accountRes.connected && accountRes.account) {
        setConnected(true);
        setAccount(accountRes.account);
        setLinkedEmail(null);
      } else {
        setConnected(false);
        setAccount(null);
        const connRes = await api.getGoogleConnections();
        const active = (connRes.connections ?? []).find((c) => c.status === 'active');
        setLinkedEmail(active?.email ?? null);
      }
    } catch {
      setConnected(false);
      setAccount(null);
      try {
        const connRes = await api.getGoogleConnections();
        const active = (connRes.connections ?? []).find((c) => c.status === 'active');
        setLinkedEmail(active?.email ?? null);
      } catch {
        setLinkedEmail(null);
      }
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
    setConnecting(true);
    setError(null);
    try {
      sessionStorage.setItem(
        GOOGLE_OAUTH_RETURN_PATH_KEY,
        '/integrations?channel=google-ads&google_connected=1'
      );
      const redirectUri = getGoogleOAuthRedirectUri();
      const oauth = await api.getGoogleOAuthState(redirectUri);
      startGoogleOAuth(oauth.oauthUrl, redirectUri);
    } catch (err) {
      setConnecting(false);
      setError(err instanceof Error ? err.message : 'Failed to start Google OAuth');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Google Ads from this workspace?')) return;
    try {
      await api.disconnectGoogleAds();
      setConnected(false);
      setAccount(null);
      onStatusChangeRef.current?.();
    } catch {
      setLinkedEmail(null);
      onStatusChangeRef.current?.();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
        Loading Google Ads…
      </div>
    );
  }

  if (connected && account) {
    return (
      <div className="space-y-4 max-w-3xl">
        {error && (
          <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {error}
          </p>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl shrink-0">
                <GoogleIcon className="w-5 h-5" />
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
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 max-w-lg">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shrink-0">
          <GoogleIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-950">Connect Google Ads</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            Sign in with Google to link your Ads customer account. Search, Display, and lead campaigns will sync to the Ads Manager.
          </p>
        </div>
      </div>

      {linkedEmail && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          Google account <strong>{linkedEmail}</strong> is linked. Complete Google Ads authorization to sync campaigns.
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
        disabled={connecting}
        className="w-full px-4 py-2.5 bg-channel-green hover:bg-[#20bd5a] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
      >
        <Link2 className="w-4 h-4" />
        {connecting ? 'Redirecting…' : linkedEmail ? 'Authorize Google Ads' : 'Connect with Google'}
      </button>
    </div>
  );
};
