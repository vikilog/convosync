import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { api } from '../lib/api';
import { META_ADS_OAUTH_REDIRECT_STORAGE_KEY } from '../lib/metaOAuth';
import { pathForTab } from '../routes';

export function MetaAdsCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing Meta Ads connection…');

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const code = searchParams.get('code');
    const redirectUri = sessionStorage.getItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY) || undefined;

    if (error) {
      sessionStorage.removeItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY);
      setMessage(errorDescription || error);
      const t = setTimeout(() => navigate(`${pathForTab('ctwa')}?meta_ads_error=1`), 2500);
      return () => clearTimeout(t);
    }

    if (!code) {
      sessionStorage.removeItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY);
      setMessage('No authorization code received from Meta.');
      const t = setTimeout(() => navigate(pathForTab('ctwa')), 2500);
      return () => clearTimeout(t);
    }

    if (!redirectUri) {
      setMessage('Missing OAuth redirect URI. Start connect again from Meta Ads Manager.');
      const t = setTimeout(() => navigate(pathForTab('ctwa')), 2500);
      return () => clearTimeout(t);
    }

    api
      .connectMetaAds(code, { redirectUri })
      .then((data: { adAccountName?: string }) => {
        sessionStorage.removeItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY);
        setMessage(`Connected: ${data.adAccountName || 'Meta Ad Account'}`);
        setTimeout(() => navigate(`${pathForTab('ctwa')}?meta_ads_connected=1`), 1500);
      })
      .catch((err: Error) => {
        sessionStorage.removeItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY);
        let text = 'Meta Ads connection failed';
        try {
          const parsed = JSON.parse(err.message) as { error?: string };
          text = parsed.error || text;
        } catch {
          if (err.message) text = err.message;
        }
        setMessage(text);
        setTimeout(() => navigate(`${pathForTab('ctwa')}?meta_ads_error=1`), 3500);
      });
  }, [navigate, searchParams]);

  return (
    <AppLoadingScreen variant="card" title="Meta Ads Setup" message={message} />
  );
}
