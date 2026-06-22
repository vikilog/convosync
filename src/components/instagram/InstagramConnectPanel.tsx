/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Instagram } from 'lucide-react';
import { api } from '../../lib/api';
import {
  buildMetaOAuthDialogUrl,
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
};

export function InstagramConnectPanel({
  onSuccess,
  onError,
  autoStart = false,
  onAutoStartConsumed,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const autoStartTriggered = useRef(false);

  const metaAppId = import.meta.env.VITE_META_APP_ID;
  const hasValidAppId = !!metaAppId && metaAppId !== 'your_meta_app_id_here';

  const handleConnect = useCallback(async () => {
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

      setRedirectUri(activeRedirectUri);
      if (oauth.webhookUrl) {
        setWebhookUrl(oauth.webhookUrl);
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
  }, [hasValidAppId, metaAppId, onError]);

  useEffect(() => {
    if (!autoStart || autoStartTriggered.current) return;
    autoStartTriggered.current = true;
    onAutoStartConsumed?.();
    void handleConnect();
  }, [autoStart, handleConnect, onAutoStartConsumed]);

  const canConnect = hasValidAppId && !loading;

  return (
    <div className="bg-white border-2 border-[#E1306C]/25 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(225,48,108,0.1)]">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider bg-[#fce8f0] text-[#C13584] border border-[#E1306C]/20 mb-4">
        <Instagram className="w-3 h-3" />
        Instagram Business
      </span>
      <h4 className="text-xl font-black text-gray-950">Connect Instagram DMs</h4>
      <p className="mt-2 text-sm text-gray-600 font-medium max-w-xl">
        You will be redirected to Meta to authorize Instagram messaging. After approval, you return
        here automatically and DMs flow into your ConvoSync inbox.
      </p>

      <ul className="mt-4 space-y-2 text-xs text-gray-500 font-medium">
        <li>• Instagram must be a Professional account (Business or Creator)</li>
        <li>• Instagram must be linked to a Facebook Page you admin</li>
        <li>• Log in with the same Facebook profile that manages that Page</li>
        <li>• Meta app needs Instagram Messaging permissions enabled</li>
      </ul>

      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={!canConnect}
        className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black shadow-md transition-all"
      >
        {loading ? 'Redirecting to Meta…' : 'Continue with Facebook'}
      </button>

      {redirectUri && (
        <p className="mt-2 text-sm font-bold text-gray-400">
          Meta → Facebook Login → Valid OAuth Redirect URIs (exact match):
          <span className="block font-mono text-gray-500 mt-0.5 break-all">{redirectUri}</span>
        </p>
      )}

      {webhookUrl && (
        <p className="mt-2 text-sm font-bold text-gray-400">
          Meta webhook callback (Page object, fields: messages):
          <span className="block font-mono text-gray-500 mt-0.5 break-all">{webhookUrl}</span>
        </p>
      )}
    </div>
  );
}
