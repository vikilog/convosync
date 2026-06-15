import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

type ConnectSuccessData = {
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  displayName?: string;
  webhookSubscribe?: {
    wabaSubscribed: boolean;
    overrideApplied: boolean;
    appFieldsConfigured: boolean;
    error?: string;
    details?: string;
  };
};

type EmbeddedSession = {
  wabaId?: string;
  phoneNumberId?: string;
  businessId?: string;
};

type Props = {
  onSuccess: (data: ConnectSuccessData) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
};

/** Must match Meta OAuth dialog exactly — set in frontend/.env */
function getEmbeddedSignupRedirectUri(): string {
  return (
    import.meta.env.VITE_META_EMBEDDED_REDIRECT_URI ||
    import.meta.env.VITE_META_OAUTH_REDIRECT_URI ||
    `${window.location.origin}${window.location.pathname}`
  );
}

function parseEmbeddedSignupMessage(event: MessageEvent): EmbeddedSession | null {
  if (!event.origin.endsWith('facebook.com')) return null;

  try {
    const raw = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (raw?.type !== 'WA_EMBEDDED_SIGNUP') return null;

    if (raw.event === 'CANCEL') {
      return { wabaId: '__CANCEL__' };
    }

    if (raw.event === 'FINISH' || raw.event === 'FINISH_ONLY_WABA') {
      const payload = raw.data || {};
      return {
        wabaId: payload.waba_id,
        phoneNumberId: payload.phone_number_id,
        businessId: payload.business_id,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export default function WhatsAppEmbeddedSignup({
  onSuccess,
  onError,
  autoStart = false,
  onAutoStartConsumed,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState('');
  const autoStartTriggered = useRef(false);
  const embeddedSessionRef = useRef<EmbeddedSession | null>(null);
  const pendingCodeRef = useRef<string | null>(null);
  const oauthStateRef = useRef<string | null>(null);
  const redirectUriRef = useRef<string>(getEmbeddedSignupRedirectUri());

  const metaAppId = import.meta.env.VITE_META_APP_ID;
  const metaConfigId = import.meta.env.VITE_META_CONFIG_ID;
  const hasValidAppId = !!metaAppId && metaAppId !== 'your_meta_app_id_here';
  const hasValidConfigId = !!metaConfigId && metaConfigId !== 'your_config_id_here';

  const tryCompleteConnection = useCallback(
    async (code: string, session: EmbeddedSession | null) => {
      try {
        const data = await api.connectWhatsApp(code, {
          redirectUri: redirectUriRef.current,
          wabaId: session?.wabaId,
          phoneNumberId: session?.phoneNumberId,
        });
        pendingCodeRef.current = null;
        embeddedSessionRef.current = null;
        onSuccess(data);
      } catch (err: any) {
        let message = 'Failed to connect WhatsApp';
        try {
          const parsed = JSON.parse(err.message);
          message = [parsed.error, parsed.details].filter(Boolean).join(': ') || message;
        } catch {
          if (err.message) message = err.message;
        }
        onError?.(message);
      } finally {
        setLoading(false);
      }
    },
    [onError, onSuccess]
  );

  const flushPendingConnection = useCallback(() => {
    const code = pendingCodeRef.current;
    const session = embeddedSessionRef.current;
    if (!code) {
      if (session?.wabaId && session.wabaId !== '__CANCEL__') {
        setLoading(true);
      }
      return;
    }

    if (session?.wabaId === '__CANCEL__') {
      pendingCodeRef.current = null;
      embeddedSessionRef.current = null;
      setLoading(false);
      onError?.('Signup cancelled.');
      return;
    }

    void tryCompleteConnection(code, session);
  }, [onError, tryCompleteConnection]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const session = parseEmbeddedSignupMessage(event);
      if (!session) return;

      if (session.wabaId === '__CANCEL__') {
        embeddedSessionRef.current = session;
        if (pendingCodeRef.current) flushPendingConnection();
        else {
          setLoading(false);
          onError?.('Signup cancelled.');
        }
        return;
      }

      embeddedSessionRef.current = session;
      flushPendingConnection();
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [flushPendingConnection, onError]);

  const handleConnect = useCallback(async () => {
    if (!hasValidConfigId) {
      onError?.('Meta Config ID is missing. Set VITE_META_CONFIG_ID in frontend/.env.');
      return;
    }

    if (!sdkReady || !window.FB) {
      onError?.(sdkError || 'Facebook SDK is still loading. Please try again in a moment.');
      return;
    }

    setLoading(true);
    pendingCodeRef.current = null;
    embeddedSessionRef.current = null;
    redirectUriRef.current = getEmbeddedSignupRedirectUri();

    try {
      const oauth = await api.getWhatsAppOAuthState();
      oauthStateRef.current = oauth.state;
      if (oauth.redirectUri) {
        redirectUriRef.current = oauth.redirectUri;
      }
    } catch {
      oauthStateRef.current = null;
    }

    // Embedded Signup popup: omit redirect_uri on FB.login so Meta binds the code
    // without a path; backend tries no-redirect_uri exchange first, then /manager.
    window.FB.login(
      (response: any) => {
        if (response.authResponse?.code) {
          pendingCodeRef.current = response.authResponse.code;
          flushPendingConnection();
          return;
        }

        setLoading(false);
        if (response.status === 'not_authorized') {
          onError?.('Permission denied. Please allow all required permissions.');
        } else {
          onError?.('Login cancelled or failed.');
        }
      },
      {
        config_id: metaConfigId,
        response_type: 'code',
        override_default_response_type: true,
        state: oauthStateRef.current || undefined,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      }
    );
  }, [
    flushPendingConnection,
    hasValidConfigId,
    metaConfigId,
    onError,
    sdkError,
    sdkReady,
  ]);

  useEffect(() => {
    if (!hasValidAppId) {
      setSdkError('Meta App ID is missing. Set VITE_META_APP_ID in frontend/.env.');
      return;
    }

    if (!document.getElementById('fb-root')) {
      const fbRoot = document.createElement('div');
      fbRoot.id = 'fb-root';
      document.body.appendChild(fbRoot);
    }

    if (window.FB) {
      setSdkReady(true);
      return;
    }

    if (document.getElementById('facebook-jssdk')) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: metaAppId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v19.0',
      });
      setSdkReady(true);
      setSdkError('');
    };

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setSdkError('Facebook SDK failed to load. Check network access and browser blockers.');
    };
    document.body.appendChild(script);
  }, [hasValidAppId, metaAppId]);

  useEffect(() => {
    if (!autoStart || !sdkReady || autoStartTriggered.current) return;
    autoStartTriggered.current = true;
    onAutoStartConsumed?.();
    void handleConnect();
  }, [autoStart, sdkReady, handleConnect, onAutoStartConsumed]);

  const canConnect = sdkReady && hasValidConfigId && !loading;

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={!canConnect}
        className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black shadow-md transition-all"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Connecting...
          </>
        ) : (
          'Continue with Facebook'
        )}
      </button>
      <p className="mt-2 text-sm font-bold text-gray-400">
        Add this OAuth redirect URI in Meta:
        <span className="block font-mono text-gray-500 mt-0.5">{redirectUriRef.current}</span>
      </p>
      {(sdkError || !hasValidConfigId) && (
        <p className="mt-2 text-sm font-bold text-amber-600">
          {sdkError || 'Set VITE_META_CONFIG_ID in frontend/.env to enable Meta signup.'}
        </p>
      )}
    </div>
  );
}
