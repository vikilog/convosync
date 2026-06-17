import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { api } from '../lib/api';
import { INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY } from '../lib/metaOAuth';
import { pathForTab } from '../routes';
import {
  InstagramAccountPicker,
  type InstagramConnectCandidate,
} from './instagram/InstagramAccountPicker';

type CallbackPhase = 'loading' | 'selecting' | 'connecting' | 'success' | 'error';

function parseApiFailure(err: unknown): string {
  if (!(err instanceof Error)) return 'Instagram connection failed';
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
    return parts.join(' · ') || err.message;
  } catch {
    return err.message || 'Instagram connection failed';
  }
}

/**
 * Meta OAuth redirect landing for Instagram connect.
 * Add redirectUri from state API in Meta → Valid OAuth Redirect URIs.
 */
export function InstagramCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<CallbackPhase>('loading');
  const [message, setMessage] = useState('Completing Instagram connection…');
  const [candidates, setCandidates] = useState<InstagramConnectCandidate[]>([]);
  const [connectToken, setConnectToken] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const finishSuccess = useCallback(
    (data: { username?: string; displayName?: string }) => {
      sessionStorage.removeItem(INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY);
      const label = data.username ? `@${data.username}` : data.displayName || 'Instagram';
      setMessage(`Connected: ${label}`);
      setPhase('success');
      setTimeout(
        () => navigate(`${pathForTab('integrations')}?instagram_connected=1`),
        1500
      );
    },
    [navigate]
  );

  const finishError = useCallback(
    (text: string) => {
      sessionStorage.removeItem(INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY);
      setError(text);
      setMessage(text);
      setPhase('error');
      setTimeout(
        () => navigate(`${pathForTab('integrations')}?instagram_error=1`),
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
        const data = (await api.connectInstagram({ connectToken: token, pageId })) as {
          username?: string;
          displayName?: string;
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
    const redirectUri = sessionStorage.getItem(INSTAGRAM_OAUTH_REDIRECT_STORAGE_KEY) || undefined;

    if (errorParam) {
      finishError(errorDescription || errorParam);
      return;
    }

    if (!code) {
      finishError('No authorization code received from Meta.');
      return;
    }

    if (!redirectUri) {
      finishError('Missing OAuth redirect URI. Start connect again from Integrations.');
      return;
    }

    let cancelled = false;

    void api
      .previewInstagramConnect(code, { redirectUri })
      .then((preview) => {
        if (cancelled) return;

        const available = preview.candidates ?? [];
        if (available.length === 0) {
          finishError('No Instagram accounts found for this Meta login.');
          return;
        }

        setConnectToken(preview.connectToken);
        setCandidates(available);

        if (!preview.requiresSelection) {
          void connectSelected(preview.connectToken, available[0].pageId);
          return;
        }

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
  }, [connectSelected, finishError, searchParams]);

  if (phase === 'selecting' || phase === 'connecting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <InstagramAccountPicker
          candidates={candidates}
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

  return <AppLoadingScreen variant="card" title="Instagram Setup" message={message} />;
}
