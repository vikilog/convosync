/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { api } from '../lib/api';
import { INSTAGRAM_BUSINESS_LOGIN_REDIRECT_STORAGE_KEY } from '../lib/metaOAuth';
import { pathForTab } from '../routes';

type Phase = 'loading' | 'success' | 'error';

/**
 * OAuth redirect landing for the "Instagram API with Instagram Login" connect flow — a
 * separate track from InstagramCallbackPage (Facebook Login). Add this path to the
 * Instagram app's Redirect URIs (not the main Meta app's Facebook Login redirect list).
 */
export function InstagramBusinessLoginCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState('Completing Instagram connection…');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const code = searchParams.get('code');
    const redirectUri =
      sessionStorage.getItem(INSTAGRAM_BUSINESS_LOGIN_REDIRECT_STORAGE_KEY) || undefined;

    if (errorParam) {
      setMessage(errorDescription || errorParam);
      setPhase('error');
      setTimeout(() => navigate(`${pathForTab('integrations')}?instagram_error=1`), 3500);
      return;
    }
    if (!code) {
      setMessage('No authorization code received from Instagram.');
      setPhase('error');
      setTimeout(() => navigate(`${pathForTab('integrations')}?instagram_error=1`), 3500);
      return;
    }

    let cancelled = false;
    void api
      .connectInstagramBusinessLogin({ code, redirectUri })
      .then((result) => {
        if (cancelled) return;
        sessionStorage.removeItem(INSTAGRAM_BUSINESS_LOGIN_REDIRECT_STORAGE_KEY);
        setMessage(`Connected: @${result.username || result.instagramUserId}`);
        setPhase('success');
        setTimeout(
          () => navigate(`${pathForTab('integrations')}?instagram_connected=1`),
          1500
        );
      })
      .catch((err) => {
        if (cancelled) return;
        sessionStorage.removeItem(INSTAGRAM_BUSINESS_LOGIN_REDIRECT_STORAGE_KEY);
        setMessage(err instanceof Error ? err.message : 'Instagram connection failed');
        setPhase('error');
        setTimeout(() => navigate(`${pathForTab('integrations')}?instagram_error=1`), 3500);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <AppLoadingScreen
      variant="card"
      title={phase === 'error' ? 'Instagram connection failed' : 'Instagram Setup'}
      message={message}
    />
  );
}
