/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Instagram } from 'lucide-react';
import { api } from '../../lib/api';
import {
  buildMetaOAuthDialogUrl,
  INSTAGRAM_BUSINESS_LOGIN_REDIRECT_STORAGE_KEY,
  INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY,
  INSTAGRAM_SCOPES,
} from '../../lib/metaOAuth';

type ConnectSuccessData = {
  instagramUserId: string;
  pageId: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
};

type Props = {
  onSuccess: (data: ConnectSuccessData) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
  connectDisabled?: boolean;
  connectDisabledMessage?: string;
};

export function InstagramConnectPanel({
  onSuccess,
  onError,
  autoStart = false,
  onAutoStartConsumed,
  connectDisabled = false,
  connectDisabledMessage,
}: Props) {
  const [loading, setLoading] = useState(false);
  const autoStartTriggered = useRef(false);

  const metaAppId = import.meta.env.VITE_META_APP_ID;
  const hasValidAppId = !!metaAppId && metaAppId !== 'your_meta_app_id_here';

  const handleConnect = useCallback(async () => {
    if (connectDisabled) {
      onError?.(
        connectDisabledMessage ||
          'Instagram is not available on your current plan. Upgrade in Settings → Plans.'
      );
      return;
    }
    if (!hasValidAppId) {
      onError?.('Meta App ID is missing. Set VITE_META_APP_ID in frontend/.env.');
      return;
    }

    setLoading(true);

    try {
      const oauth = await api.getInstagramOAuthState();
      const activeRedirectUri = oauth.redirectUri;
      if (!activeRedirectUri) {
        throw new Error('Missing redirect URI from server');
      }

      sessionStorage.setItem(INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY, activeRedirectUri);

      const authUrl = buildMetaOAuthDialogUrl({
        clientId: metaAppId,
        redirectUri: activeRedirectUri,
        state: oauth.state,
        scope: INSTAGRAM_SCOPES,
      });

      window.location.assign(authUrl);
    } catch (err) {
      setLoading(false);
      onError?.(err instanceof Error ? err.message : 'Failed to start Instagram login');
    }
  }, [connectDisabled, connectDisabledMessage, hasValidAppId, metaAppId, onError]);

  const [businessLoginLoading, setBusinessLoginLoading] = useState(false);

  const handleBusinessLoginConnect = useCallback(async () => {
    setBusinessLoginLoading(true);
    try {
      const oauth = await api.getInstagramBusinessLoginConnectUrl();
      sessionStorage.setItem(INSTAGRAM_BUSINESS_LOGIN_REDIRECT_STORAGE_KEY, oauth.redirectUri);
      window.location.assign(oauth.oauthDialogUrl);
    } catch (err) {
      setBusinessLoginLoading(false);
      onError?.(err instanceof Error ? err.message : 'Failed to start Instagram login');
    }
  }, [onError]);

  useEffect(() => {
    if (!autoStart || autoStartTriggered.current || connectDisabled) return;
    autoStartTriggered.current = true;
    onAutoStartConsumed?.();
    void handleConnect();
  }, [autoStart, connectDisabled, handleConnect, onAutoStartConsumed]);

  const canConnect = hasValidAppId && !loading && !connectDisabled;

  return (
    <div className="bg-surface border-2 border-[#E1306C]/25 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(225,48,108,0.1)]">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider bg-[#fce8f0] text-[#C13584] border border-[#E1306C]/20 mb-4">
        <Instagram className="w-3 h-3" />
        Instagram Business
      </span>
      <h4 className="text-xl font-semibold text-gray-950">Connect Instagram Business</h4>
      <p className="mt-2 text-sm text-swiss-muted font-medium max-w-xl">
        Authorize via Facebook Login to link your Instagram Professional account. This powers
        inbox DMs and Social Listening (comment triage).
      </p>

      <ul className="mt-4 space-y-2 text-xs text-swiss-muted font-medium">
        <li>• Instagram must be a Professional account (Business or Creator)</li>
        <li>• Instagram must be linked to a Facebook Page you admin</li>
        <li>• Log in with the same Facebook profile that manages that Page</li>
        <li>• Meta app needs Instagram Messaging + Comments permissions</li>
      </ul>

      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={!canConnect}
        className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black transition-all"
      >
        {loading ? 'Redirecting to Meta…' : connectDisabled ? 'Upgrade plan' : 'Continue with Facebook'}
      </button>
      {connectDisabled && connectDisabledMessage ? (
        <p className="mt-4 text-sm font-bold text-amber-700">{connectDisabledMessage}</p>
      ) : null}

      <div className="mt-6 pt-6 border-t border-swiss-line">
        <p className="text-xs font-bold text-swiss-muted">
          Prefer logging in with Instagram directly (no Facebook Page required)?
        </p>
        <button
          type="button"
          onClick={() => void handleBusinessLoginConnect()}
          disabled={businessLoginLoading}
          className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-[#E1306C]/25 hover:bg-[#fce8f0] disabled:opacity-60 text-[#C13584] rounded-xl text-sm font-black transition-all"
        >
          {businessLoginLoading ? 'Redirecting to Instagram…' : 'Continue with Instagram Login'}
        </button>
      </div>
    </div>
  );
}
