import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { WhatsAppSignupMode } from './whatsapp/types';

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
  connectionMode?: WhatsAppSignupMode;
  webhookSubscribe?: {
    wabaSubscribed: boolean;
    overrideApplied: boolean;
    appFieldsConfigured: boolean;
    error?: string;
    details?: string;
  };
  coexistenceSync?: {
    contactsRequestId?: string;
    historyRequestId?: string;
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
  mode?: WhatsAppSignupMode;
  onSuccess: (data: ConnectSuccessData) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
};

const FB_ORIGIN = 'https://www.facebook.com';

function getEmbeddedSignupRedirectUri(): string {
  const fromEnv =
    import.meta.env.VITE_META_EMBEDDED_REDIRECT_URI ||
    import.meta.env.VITE_META_OAUTH_REDIRECT_URI;
  if (fromEnv) {
    return fromEnv.split('?')[0].replace(/\/$/, '') || fromEnv;
  }
  return `${window.location.origin}${window.location.pathname}`;
}

function getBusinessApiConfigId(): string | undefined {
  return (
    import.meta.env.VITE_META_CONFIG_ID ||
    import.meta.env.VITE_META_CONFIGURATION_ID ||
    undefined
  );
}

/** Match reference Embedded Signup launch extras (sessionInfoVersion 3). */
function buildEmbeddedSignupExtras(isCoexistence: boolean) {
  return {
    setup: {},
    featureType: isCoexistence ? 'whatsapp_business_app_onboarding' : '',
    sessionInfoVersion: '3',
  };
}

function isFacebookMessageOrigin(origin: string): boolean {
  return origin === FB_ORIGIN || origin.endsWith('.facebook.com');
}

type EmbeddedSignupMessageResult =
  | { kind: 'session'; session: EmbeddedSession }
  | { kind: 'fail'; message: string }
  | null;

function parseEmbeddedSignupMessage(event: MessageEvent): EmbeddedSignupMessageResult {
  if (!isFacebookMessageOrigin(event.origin)) return null;

  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data?.type !== 'WA_EMBEDDED_SIGNUP') return null;

    if (data.event === 'CANCEL') {
      if (data.data?.error_message || data.data?.error_code) {
        return {
          kind: 'fail',
          message: [data.data.error_message, data.data.error_code && `Code: ${data.data.error_code}`]
            .filter(Boolean)
            .join(' '),
        };
      }
      return { kind: 'fail', message: 'User cancelled the signup flow' };
    }

    if (data.event === 'ERROR') {
      return {
        kind: 'fail',
        message: data.data?.error_message || 'Signup failed',
      };
    }

    if (
      data.event === 'FINISH' ||
      data.event === 'FINISH_ONLY_WABA' ||
      data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
    ) {
      const { waba_id, phone_number_id, business_id } = data.data || {};
      return {
        kind: 'session',
        session: {
          wabaId: waba_id,
          phoneNumberId: phone_number_id,
          businessId: business_id,
        },
      };
    }
  } catch {
    // Non-FB messages or invalid JSON — ignore (reference pattern)
  }

  return null;
}

export default function WhatsAppEmbeddedSignup({
  mode = 'business_api',
  onSuccess,
  onError,
  autoStart = false,
  onAutoStartConsumed,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const autoStartTriggered = useRef(false);
  const embeddedSessionRef = useRef<EmbeddedSession | null>(null);
  const pendingCodeRef = useRef<string | null>(null);
  const redirectUriRef = useRef(getEmbeddedSignupRedirectUri());

  const metaAppId = import.meta.env.VITE_META_APP_ID;
  const metaConfigId = getBusinessApiConfigId();
  const metaWhatsappConfigId = import.meta.env.VITE_META_WHATSAPP_CONFIG;
  const isCoexistence = mode === 'app_coexistence';

  const reportError = useCallback(
    (message: string) => {
      setLoading(false);
      onError?.(message);
    },
    [onError]
  );

  const tryCompleteConnection = useCallback(
    async (code: string, session: EmbeddedSession | null) => {
      try {
        const data = await api.connectWhatsApp(code, {
          redirectUri: redirectUriRef.current,
          wabaId: session?.wabaId,
          phoneNumberId: session?.phoneNumberId,
          connectionMode: mode,
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
        reportError(message);
      } finally {
        setLoading(false);
      }
    },
    [mode, onSuccess, reportError]
  );

  const flushPendingConnection = useCallback(() => {
    const code = pendingCodeRef.current;
    const session = embeddedSessionRef.current;
    if (!code) {
      if (session?.wabaId) setLoading(true);
      return;
    }
    void tryCompleteConnection(code, session);
  }, [tryCompleteConnection]);

  // SDK + session listener — same structure as reference implementation
  useEffect(() => {
    if (!metaAppId) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: metaAppId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      });
      setSdkReady(true);
    };

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if (window.FB) {
      setSdkReady(true);
    }

    const messageHandler = (event: MessageEvent) => {
      const result = parseEmbeddedSignupMessage(event);
      if (!result) return;
      if (result.kind === 'fail') {
        pendingCodeRef.current = null;
        embeddedSessionRef.current = null;
        reportError(result.message);
        return;
      }
      embeddedSessionRef.current = result.session;
      flushPendingConnection();
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [flushPendingConnection, metaAppId, reportError]);

  const launchSignup = useCallback(async () => {
    if (!sdkReady || !window.FB) {
      reportError('Facebook SDK is still loading. Please try again in a moment.');
      return;
    }

    setLoading(true);
    pendingCodeRef.current = null;
    embeddedSessionRef.current = null;
    redirectUriRef.current = getEmbeddedSignupRedirectUri();

    let configId = metaConfigId;
    if (isCoexistence) {
      configId = metaWhatsappConfigId;
      try {
        const oauth = await api.getWhatsAppOAuthState();
        redirectUriRef.current =
          getEmbeddedSignupRedirectUri() || oauth.redirectUri || redirectUriRef.current;
        if (oauth.whatsappConfigId) {
          configId = oauth.whatsappConfigId;
        }
      } catch {
        // env fallback
      }
      if (!configId) {
        reportError(
          'META_WHATSAPP_CONFIG is missing. Set it in backend .env and restart, or VITE_META_WHATSAPP_CONFIG locally.'
        );
        return;
      }
    } else if (!configId) {
      reportError(
        'Meta Config ID is missing. Set VITE_META_CONFIG_ID or VITE_META_CONFIGURATION_ID.'
      );
      return;
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse?.code) {
          pendingCodeRef.current = response.authResponse.code;
          flushPendingConnection();
          return;
        }

        setLoading(false);
        if (response.status === 'not_authorized') {
          reportError('Permission denied. Please allow all required permissions.');
        } else {
          reportError('Login cancelled or failed.');
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: buildEmbeddedSignupExtras(isCoexistence),
      }
    );
  }, [
    flushPendingConnection,
    isCoexistence,
    metaConfigId,
    metaWhatsappConfigId,
    reportError,
    sdkReady,
  ]);

  useEffect(() => {
    if (!autoStart || !sdkReady || autoStartTriggered.current) return;
    autoStartTriggered.current = true;
    onAutoStartConsumed?.();
    void launchSignup();
  }, [autoStart, sdkReady, launchSignup, onAutoStartConsumed]);

  const canConnect = sdkReady && !loading;

  return (
    <div>
      <button
        type="button"
        onClick={() => void launchSignup()}
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
        OAuth redirect URI:
        <span className="block font-mono text-gray-500 mt-0.5">{redirectUriRef.current}</span>
      </p>
    </div>
  );
}
