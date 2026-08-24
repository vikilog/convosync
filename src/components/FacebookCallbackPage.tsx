import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { api } from '../lib/api';
import { FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY } from '../lib/metaOAuth';
import { pathForTab } from '../routes';
import { FacebookPagePicker, type FacebookPageConnectCandidate } from './FacebookPagePicker';

type CallbackPhase = 'loading' | 'selecting' | 'connecting' | 'success' | 'error';

function parseApiFailure(err: unknown): string {
  if (!(err instanceof Error)) return 'Facebook Page connection failed';
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
    return parts.join(' · ') || err.message;
  } catch {
    return err.message || 'Facebook Page connection failed';
  }
}

export function FacebookCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<CallbackPhase>('loading');
  const [message, setMessage] = useState('Completing Facebook Page connection…');
  const [pages, setPages] = useState<FacebookPageConnectCandidate[]>([]);
  const [connectToken, setConnectToken] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const finishSuccess = useCallback(
    (data: { pageName?: string; missingScopes?: string[] }) => {
      sessionStorage.removeItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY);
      const scopeNote =
        data.missingScopes && data.missingScopes.length > 0
          ? ` — missing permissions: ${data.missingScopes.join(', ')}`
          : '';
      setMessage(`Connected: ${data.pageName || 'Facebook Page'}${scopeNote}`);
      setPhase('success');
      setTimeout(
        () => navigate(`${pathForTab('integrations')}?facebook_connected=1`),
        data.missingScopes?.length ? 3500 : 1500
      );
    },
    [navigate]
  );

  const finishError = useCallback(
    (text: string) => {
      sessionStorage.removeItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY);
      setError(text);
      setMessage(text);
      setPhase('error');
      setTimeout(
        () => navigate(`${pathForTab('integrations')}?facebook_error=1`),
        3500
      );
    },
    [navigate]
  );

  const connectSelected = useCallback(
    async (token: string, pageId: string) => {
      setPhase('connecting');
      setError('');
      try {
        const data = (await api.connectFacebookPage({ connectToken: token, pageId })) as {
          pageName?: string;
          missingScopes?: string[];
        };
        finishSuccess(data);
      } catch (err) {
        const text = parseApiFailure(err);
        setError(text);
        setPhase('selecting');
      }
    },
    [finishSuccess]
  );

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const code = searchParams.get('code');
    const redirectUri = sessionStorage.getItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY) || undefined;

    if (errorParam) {
      finishError(errorDescription || errorParam);
      return;
    }

    if (!code) {
      finishError('No authorization code received from Meta.');
      return;
    }

    if (!redirectUri) {
      finishError('Missing OAuth redirect URI. Start connect again from Facebook Pages.');
      return;
    }

    let cancelled = false;

    void api
      .previewFacebookConnect(code, { redirectUri })
      .then((preview) => {
        if (cancelled) return;

        const available = preview.pages ?? [];
        if (available.length === 0) {
          finishError('No Facebook Pages found for this Meta login.');
          return;
        }

        // Always show the picker so the user explicitly confirms which Page to
        // connect (even with a single Page) — never silently pick one for them.
        setConnectToken(preview.connectToken);
        setPages(available);
        setSelectedPageId(available[0]?.pageId ?? null);
        setPhase('selecting');
      })
      .catch((err) => {
        if (cancelled) return;
        finishError(parseApiFailure(err));
      });

    return () => {
      cancelled = true;
    };
  }, [finishError, searchParams]);

  if (phase === 'selecting' || phase === 'connecting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <FacebookPagePicker
          pages={pages}
          selectedPageId={selectedPageId}
          onSelect={setSelectedPageId}
          confirming={phase === 'connecting'}
          error={error}
          onConfirm={() => {
            if (!connectToken || !selectedPageId) return;
            void connectSelected(connectToken, selectedPageId);
          }}
        />
      </div>
    );
  }

  return (
    <AppLoadingScreen variant="card" title="Facebook Page Setup" message={message} />
  );
}
