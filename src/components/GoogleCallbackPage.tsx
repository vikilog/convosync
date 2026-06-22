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

    const finish = (path: string, delayMs = 1200) => {
      sessionStorage.removeItem(GOOGLE_OAUTH_RETURN_PATH_KEY);
      setTimeout(() => navigate(path, { replace: true }), delayMs);
    };

    if (error) {
      exchangedRef.current = true;
      clearOAuthStorage();
      setMessage(errorDescription || error);
      finish(`${pathForTab('integrations')}?channel=google&google_error=1`, 2500);
      return;
    }

    if (!code) {
      exchangedRef.current = true;
      clearOAuthStorage();
      setMessage('No authorization code received from Google.');
      finish(`${pathForTab('integrations')}?channel=google`, 2500);
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
        finish(`${pathForTab('integrations')}?channel=google&google_error=1`, 3500);
      });
  }, [navigate, searchParams]);

  return (
    <AppLoadingScreen variant="card" title="Google Setup" message={message} />
  );
}
