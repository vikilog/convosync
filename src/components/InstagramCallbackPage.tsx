import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { api } from '../lib/api';
import { INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY } from '../lib/metaOAuth';
import { pathForTab } from '../routes';

/**
 * Meta OAuth redirect landing for Instagram connect.
 * Add redirectUri from state API in Meta → Valid OAuth Redirect URIs.
 */
export function InstagramCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing Instagram connection…');

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const code = searchParams.get('code');
    const redirectUri = sessionStorage.getItem(INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY) || undefined;

    if (error) {
      sessionStorage.removeItem(INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY);
      setMessage(errorDescription || error);
      const t = setTimeout(
        () => navigate(`${pathForTab('integrations')}?instagram_error=1`),
        2500
      );
      return () => clearTimeout(t);
    }

    if (!code) {
      sessionStorage.removeItem(INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY);
      setMessage('No authorization code received from Meta.');
      const t = setTimeout(() => navigate(pathForTab('integrations')), 2500);
      return () => clearTimeout(t);
    }

    if (!redirectUri) {
      setMessage('Missing OAuth redirect URI. Start connect again from Integrations.');
      const t = setTimeout(() => navigate(pathForTab('integrations')), 2500);
      return () => clearTimeout(t);
    }

    api
      .connectInstagram(code, { redirectUri })
      .then((data: { username?: string; displayName?: string }) => {
        sessionStorage.removeItem(INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY);
        const label = data.username ? `@${data.username}` : data.displayName || 'Instagram';
        setMessage(`Connected: ${label}`);
        setTimeout(
          () => navigate(`${pathForTab('integrations')}?instagram_connected=1`),
          1500
        );
      })
      .catch((err: Error) => {
        sessionStorage.removeItem(INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY);
        let text = 'Instagram connection failed';
        try {
          const parsed = JSON.parse(err.message) as {
            error?: string;
            details?: string;
            discovery?: { pagesFound?: number; pageNames?: string[] };
          };
          const parts = [parsed.error, parsed.details].filter(Boolean);
          if (parsed.discovery?.pagesFound === 0) {
            parts.push('No Facebook Pages on this login — use the profile that manages your Page.');
          } else if (
            parsed.discovery &&
            parsed.discovery.pagesFound > 0 &&
            parsed.discovery.pageNames?.length
          ) {
            parts.push(
              `Pages found: ${parsed.discovery.pageNames.join(', ')} — link Instagram Professional to one of them in Meta Business Suite.`
            );
          }
          text = parts.join(' · ') || text;
        } catch {
          if (err.message) text = err.message;
        }
        setMessage(text);
        setTimeout(
          () => navigate(`${pathForTab('integrations')}?instagram_error=1`),
          3500
        );
      });
  }, [navigate, searchParams]);

  return (
    <AppLoadingScreen variant="card" title="Instagram Setup" message={message} />
  );
}
