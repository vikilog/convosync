import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { api } from '../lib/api';
import {
  GOOGLE_OAUTH_REDIRECT_STORAGE_KEY,
  GOOGLE_OAUTH_RETURN_PATH_KEY,
  readStoredGoogleOAuthRedirectUri,
} from '../lib/googleOAuth';
import { pathForTab } from '../routes';
import {
  GOOGLE_ADS_CONNECT_ERROR_KEY,
  storeConnectError,
} from './integrations/IntegrationConnectError';

/**
 * Google OAuth redirect landing for workspace-level Google account connect.
 */
export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing Google connection…');
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;

    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const code = searchParams.get('code');
    const redirectUri = readStoredGoogleOAuthRedirectUri();

    const clearOAuthStorage = () => {
      sessionStorage.removeItem(GOOGLE_OAUTH_REDIRECT_STORAGE_KEY);
      localStorage.removeItem(GOOGLE_OAUTH_REDIRECT_STORAGE_KEY);
    };

    const returnPath =
      sessionStorage.getItem(GOOGLE_OAUTH_RETURN_PATH_KEY) ||
      `${pathForTab('integrations')}?channel=google&google_connected=1`;

    // Failed attempts must land back on whichever panel started the flow (Google
    // Ads vs. the generic Google Workspace connect) instead of always bouncing
    // to the generic screen — derive that target from the same returnPath the
    // success branch already uses.
    const isAdsReturn = (() => {
      try {
        return new URL(returnPath, window.location.origin).searchParams.get('channel') === 'google-ads';
      } catch {
        return false;
      }
    })();
    const failPath = isAdsReturn
      ? `${pathForTab('integrations')}?channel=google-ads&google_ads_error=1`
      : `${pathForTab('integrations')}?channel=google&google_error=1`;

    const finish = (path: string, delayMs = 1200) => {
      sessionStorage.removeItem(GOOGLE_OAUTH_RETURN_PATH_KEY);
      setTimeout(() => navigate(path, { replace: true }), delayMs);
    };

    const fail = (detail: string, delayMs = 2500) => {
      if (isAdsReturn) storeConnectError(GOOGLE_ADS_CONNECT_ERROR_KEY, detail);
      finish(failPath, delayMs);
    };

    if (error) {
      exchangedRef.current = true;
      clearOAuthStorage();
      const detail = errorDescription || error;
      setMessage(detail);
      fail(detail);
      return;
    }

    if (!code) {
      exchangedRef.current = true;
      clearOAuthStorage();
      const detail = 'No authorization code received from Google.';
      setMessage(detail);
      fail(detail);
      return;
    }

    exchangedRef.current = true;
    api
      .connectGoogleAccount(code, redirectUri)
      .then((data: { account?: { email?: string } }) => {
        clearOAuthStorage();
        const label = data.account?.email || 'Google account';
        setMessage(`Connected: ${label}`);
        finish(returnPath);
      })
      .catch((err: Error) => {
        clearOAuthStorage();
        let text = 'Google connection failed';
        try {
          const parsed = JSON.parse(err.message) as { error?: string; details?: string };
          text = [parsed.error, parsed.details].filter(Boolean).join(' · ') || text;
        } catch {
          if (err.message) text = err.message;
        }
        setMessage(text);
        fail(text, 3500);
      });
  }, [navigate, searchParams]);

  return (
    <AppLoadingScreen variant="card" title="Google Setup" message={message} />
  );
}
