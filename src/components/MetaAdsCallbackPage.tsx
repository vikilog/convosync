import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { api } from '../lib/api';
import {
  storeConnectError,
  META_ADS_CONNECT_ERROR_KEY,
} from './integrations/IntegrationConnectError';
import {
  META_ADS_OAUTH_REDIRECT_STORAGE_KEY,
  META_ADS_OAUTH_RETURN_PATH_KEY,
} from '../lib/metaOAuth';

function integrationsMetaAdsErrorPath() {
  const params = new URLSearchParams({ channel: 'meta-ads', meta_ads_error: '1' });
  return `/integrations?${params.toString()}`;
}

export function MetaAdsCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing Meta Ads connection…');

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const code = searchParams.get('code');
    const redirectUri = sessionStorage.getItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY) || undefined;

    const successParams = new URLSearchParams({ channel: 'meta-ads', meta_ads_connected: '1' });
    const returnPath =
      sessionStorage.getItem(META_ADS_OAUTH_RETURN_PATH_KEY) ||
      `/integrations?${successParams.toString()}`;

    const finish = (path: string, delayMs = 1500) => {
      sessionStorage.removeItem(META_ADS_OAUTH_RETURN_PATH_KEY);
      setTimeout(() => navigate(path, { replace: true }), delayMs);
    };

    const fail = (detail: string, delayMs = 2500) => {
      storeConnectError(META_ADS_CONNECT_ERROR_KEY, detail);
      finish(integrationsMetaAdsErrorPath(), delayMs);
    };

    if (error) {
      sessionStorage.removeItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY);
      const detail = errorDescription || error;
      setMessage(detail);
      fail(detail);
      return;
    }

    if (!code) {
      sessionStorage.removeItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY);
      setMessage('No authorization code received from Meta.');
      fail('No authorization code received from Meta.');
      return;
    }

    if (!redirectUri) {
      setMessage('Missing OAuth redirect URI. Start connect again from Integrations.');
      fail('Missing OAuth redirect URI. Start connect again from Integrations.');
      return;
    }

    api
      .connectMetaAds(code, { redirectUri })
      .then((data: { adAccountName?: string }) => {
        sessionStorage.removeItem(META_ADS_OAUTH_REDIRECT_STORAGE_KEY);
        setMessage(`Connected: ${data.adAccountName || 'Meta Ad Account'}`);
        finish(returnPath);
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
        fail(text, 3500);
      });
  }, [navigate, searchParams]);

  return (
    <AppLoadingScreen variant="card" title="Meta Ads Setup" message={message} />
  );
}
