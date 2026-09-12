import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { httpClient, ApiError } from '@/lib/httpClient'
import { recallRedirectUri } from '@/lib/integrationsOAuth'

export function InstagramBusinessLoginCallbackRoute() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'working' | 'error' | 'done'>('working')
  const [error, setError] = useState<string | null>(null)

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
      setError('Missing authorization code from Instagram.')
      return
    }

    httpClient
      .post('/instagram-business-login/connect', {
        code,
        redirectUri: recallRedirectUri('instagram_business_login') ?? undefined,
      })
      .then(() => {
        setStatus('done')
        setTimeout(() => navigate('/integrations?instagram_connected=1', { replace: true }), 1200)
      })
      .catch((err) => {
        setStatus('error')
        setError(err instanceof ApiError ? err.message : 'Instagram connection failed.')
      })
  }, [navigate, searchParams])

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        {status === 'working' ? (
          <>
            <Loader2 className="text-muted-foreground mx-auto size-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Connecting Instagram…</p>
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
            <p className="text-sm font-semibold">Couldn&apos;t connect</p>
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
