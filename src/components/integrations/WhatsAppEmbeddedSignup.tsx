import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/httpClient'
import {
  buildEmbeddedSignupExtras,
  getBusinessApiConfigId,
  getEmbeddedSignupRedirectUri,
  parseEmbeddedSignupMessage,
  type EmbeddedSession,
} from '@/lib/whatsappEmbeddedSignup'
import {
  realIntegrationsService,
  type WhatsAppConnectResult,
  type WhatsAppSignupMode,
} from '@/services/realIntegrations.service'

declare global {
  interface Window {
    FB?: {
      init: (opts: Record<string, unknown>) => void
      login: (cb: (response: { authResponse?: { code?: string }; status?: string }) => void, opts: Record<string, unknown>) => void
    }
    fbAsyncInit?: () => void
  }
}

export function WhatsAppEmbeddedSignup({
  mode = 'business_api',
  onSuccess,
  onError,
}: {
  mode?: WhatsAppSignupMode
  onSuccess: (data: WhatsAppConnectResult) => void
  onError?: (error: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const embeddedSessionRef = useRef<EmbeddedSession | null>(null)
  const pendingCodeRef = useRef<string | null>(null)
  const redirectUriRef = useRef(getEmbeddedSignupRedirectUri())
  const connectWhatsApp = realIntegrationsService.useConnectWhatsApp()
  const oauthState = realIntegrationsService.useWhatsAppOAuthState()

  const metaAppId = import.meta.env.VITE_META_APP_ID as string | undefined
  const metaConfigId = getBusinessApiConfigId()
  const metaWhatsappConfigId = import.meta.env.VITE_META_WHATSAPP_CONFIG as string | undefined
  const isCoexistence = mode === 'app_coexistence'

  const reportError = useCallback(
    (message: string) => {
      setLoading(false)
      onError?.(message)
    },
    [onError]
  )

  const tryCompleteConnection = useCallback(
    async (code: string, session: EmbeddedSession | null) => {
      try {
        const data = await connectWhatsApp.mutateAsync({
          code,
          redirectUri: redirectUriRef.current,
          wabaId: session?.wabaId,
          phoneNumberId: session?.phoneNumberId,
          businessId: session?.businessId,
          connectionMode: mode,
        })
        pendingCodeRef.current = null
        embeddedSessionRef.current = null
        onSuccess(data)
      } catch (err) {
        reportError(err instanceof ApiError ? err.message : 'Failed to connect WhatsApp')
      } finally {
        setLoading(false)
      }
    },
    [connectWhatsApp, mode, onSuccess, reportError]
  )

  const flushPendingConnection = useCallback(() => {
    const code = pendingCodeRef.current
    const session = embeddedSessionRef.current
    if (!code) {
      if (session?.wabaId) setLoading(true)
      return
    }
    void tryCompleteConnection(code, session)
  }, [tryCompleteConnection])

  useEffect(() => {
    if (!metaAppId) return

    window.fbAsyncInit = function () {
      window.FB?.init({
        appId: metaAppId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      })
      setSdkReady(true)
    }

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    } else if (window.FB) {
      setSdkReady(true)
    }

    const messageHandler = (event: MessageEvent) => {
      const result = parseEmbeddedSignupMessage(event)
      if (!result) return
      if (result.kind === 'fail') {
        pendingCodeRef.current = null
        embeddedSessionRef.current = null
        reportError(result.message)
        return
      }
      embeddedSessionRef.current = result.session
      flushPendingConnection()
    }

    window.addEventListener('message', messageHandler)
    return () => window.removeEventListener('message', messageHandler)
  }, [flushPendingConnection, metaAppId, reportError])

  const launchSignup = useCallback(async () => {
    if (!sdkReady || !window.FB) {
      reportError('Facebook SDK is still loading. Please try again in a moment.')
      return
    }

    setLoading(true)
    pendingCodeRef.current = null
    embeddedSessionRef.current = null
    redirectUriRef.current = getEmbeddedSignupRedirectUri()

    let configId = metaConfigId
    if (isCoexistence) {
      configId = metaWhatsappConfigId
      try {
        const oauth = await oauthState.mutateAsync()
        redirectUriRef.current = getEmbeddedSignupRedirectUri() || oauth.redirectUri || redirectUriRef.current
        if (oauth.whatsappConfigId) configId = oauth.whatsappConfigId
      } catch {
        // env fallback
      }
      if (!configId) {
        reportError(
          'META_WHATSAPP_CONFIG is missing. Set it in backend .env, or VITE_META_WHATSAPP_CONFIG locally.'
        )
        return
      }
    } else if (!configId) {
      reportError('Meta Config ID is missing. Set VITE_META_CONFIG_ID or VITE_META_CONFIGURATION_ID.')
      return
    }

    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          pendingCodeRef.current = response.authResponse.code
          flushPendingConnection()
          return
        }
        setLoading(false)
        if (response.status === 'not_authorized') {
          reportError('Permission denied. Please allow all required permissions.')
        } else {
          reportError('Login cancelled or failed.')
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: buildEmbeddedSignupExtras(isCoexistence),
      }
    )
  }, [
    flushPendingConnection,
    isCoexistence,
    metaConfigId,
    metaWhatsappConfigId,
    oauthState,
    reportError,
    sdkReady,
  ])

  if (!metaAppId) {
    return (
      <p className="text-muted-foreground text-sm">
        Meta App ID is not configured (VITE_META_APP_ID). Embedded Signup needs a real Meta App.
      </p>
    )
  }

  return (
    <Button onClick={() => void launchSignup()} disabled={!sdkReady || loading}>
      {loading ? <Loader2 className="animate-spin" /> : null}
      {loading ? 'Connecting…' : sdkReady ? 'Continue with Facebook' : 'Loading Facebook…'}
    </Button>
  )
}
