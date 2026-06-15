import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { api } from '../lib/api';
import { FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY } from '../lib/metaOAuth';
import { pathForTab } from '../routes';

export function FacebookCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing Facebook Page connection…');

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const code = searchParams.get('code');
    const redirectUri = sessionStorage.getItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY) || undefined;

    if (error) {
      sessionStorage.removeItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY);
      setMessage(errorDescription || error);
      const t = setTimeout(
        () => navigate(`${pathForTab('facebook')}?facebook_error=1`),
        2500
      );
      return () => clearTimeout(t);
    }

    if (!code) {
      sessionStorage.removeItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY);
      setMessage('No authorization code received from Meta.');
      const t = setTimeout(() => navigate(pathForTab('facebook')), 2500);
      return () => clearTimeout(t);
    }

    if (!redirectUri) {
      setMessage('Missing OAuth redirect URI. Start connect again from Facebook Pages.');
      const t = setTimeout(() => navigate(pathForTab('facebook')), 2500);
      return () => clearTimeout(t);
    }

    api
      .connectFacebookPage(code, { redirectUri })
      .then((data: { pageName?: string; missingScopes?: string[] }) => {
        sessionStorage.removeItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY);
        const scopeNote =
          data.missingScopes && data.missingScopes.length > 0
            ? ` — missing permissions: ${data.missingScopes.join(', ')}`
            : '';
        setMessage(`Connected: ${data.pageName || 'Facebook Page'}${scopeNote}`);
        setTimeout(
          () => navigate(`${pathForTab('facebook')}?facebook_connected=1`),
          data.missingScopes?.length ? 3500 : 1500
        );
      })
      .catch((err: Error) => {
        sessionStorage.removeItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY);
        let text = 'Facebook Page connection failed';
        try {
          const parsed = JSON.parse(err.message) as {
            error?: string;
            missingScopes?: string[];
            discovery?: { pagesFound?: number; pageNames?: string[] };
          };
          const parts = [parsed.error].filter(Boolean);
          if (parsed.missingScopes?.length) {
            parts.push(`Missing: ${parsed.missingScopes.join(', ')}`);
          }
          if (parsed.discovery?.pagesFound === 0) {
            parts.push('No Facebook Pages on this login — use the profile that manages your Page.');
          } else if (parsed.discovery?.pageNames?.length) {
            parts.push(`Pages found: ${parsed.discovery.pageNames.join(', ')}`);
          }
          text = parts.join(' · ') || text;
        } catch {
          if (err.message) text = err.message;
        }
        setMessage(text);
        setTimeout(
          () => navigate(`${pathForTab('facebook')}?facebook_error=1`),
          3500
        );
      });
  }, [navigate, searchParams]);

  return (
    <AppLoadingScreen variant="card" title="Facebook Page Setup" message={message} />
  );
}
