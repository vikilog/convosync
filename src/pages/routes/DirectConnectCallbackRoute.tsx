import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { httpClient, ApiError } from '@/lib/httpClient'
import {
  META_ADS_CONNECT_ERROR_KEY,
  recallRedirectUri,
  storeConnectError,
} from '@/lib/integrationsOAuth'

/** Callback for OAuth flows that connect directly with no page/account picker
 * (Google, Meta Ads) — exchange the code for a connection in one call. */
export function DirectConnectCallbackRoute({ channel }: { channel: 'google' | 'meta_ads' }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'working' | 'error' | 'done'>('working')
  const [error, setError] = useState<string | null>(null)

  const path = channel === 'google' ? '/google/connect' : '/meta-ads/connect'

  useEffect(() => {
    const code = searchParams.get('code')
    const oauthError = searchParams.get('error_description') || searchParams.get('error')
    if (oauthError) {
      setStatus('error')
      setError(oauthError)
      return
    }
    if (!code) {
      setStatus('error')
      setError('Missing authorization code.')
      return
    }

    httpClient
      .post(path, { code, redirectUri: recallRedirectUri(channel) ?? undefined })
      .then(() => {
        setStatus('done')
        setTimeout(() => navigate('/integrations', { replace: true }), 1200)
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : 'Connection failed.'
        if (channel === 'meta_ads') storeConnectError(META_ADS_CONNECT_ERROR_KEY, message)
        setStatus('error')
        setError(message)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        {status === 'working' ? (
          <>
            <Loader2 className="text-muted-foreground mx-auto size-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Connecting your account…</p>
          </>
        ) : null}

        {status === 'done' ? (
          <>
            <CheckCircle2 className="text-primary mx-auto size-8" />
            <p className="text-sm font-semibold">Connected — redirecting…</p>
          </>
        ) : null}

        {status === 'error' ? (
          <>
            <AlertCircle className="text-destructive mx-auto size-8" />
            <p className="text-sm font-semibold">Couldn't connect</p>
            <p className="text-muted-foreground text-xs">{error}</p>
            <Button size="sm" onClick={() => navigate('/integrations', { replace: true })}>
              Back to Integrations
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
