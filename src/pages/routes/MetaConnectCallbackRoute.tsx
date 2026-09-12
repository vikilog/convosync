import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { httpClient, ApiError } from '@/lib/httpClient'
import { recallRedirectUri } from '@/lib/integrationsOAuth'

type Candidate = { pageId: string; label: string }

type RawCandidate = {
  pageId?: string
  id?: string
  instagramUserId?: string
  username?: string
  name?: string
}

type PreviewResponse = {
  success: boolean
  connectToken: string
  requiresSelection: boolean
  candidates?: RawCandidate[]
  pages?: RawCandidate[]
}

/** Shared callback for OAuth flows that need a page/account picker before
 * finalizing (Instagram, Facebook). Meta grants access to potentially several
 * Pages — the backend returns candidates and a short-lived connectToken;
 * finalizing just needs the chosen pageId. */
export function MetaConnectCallbackRoute({ channel }: { channel: 'instagram' | 'facebook' }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'working' | 'select' | 'error' | 'done'>('working')
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [connectToken, setConnectToken] = useState<string | null>(null)

  const finalize = async (token: string, pageId: string) => {
    setStatus('working')
    try {
      await httpClient.post(`/${channel}/connect`, { connectToken: token, pageId })
      setStatus('done')
      setTimeout(() => navigate('/integrations', { replace: true }), 1200)
    } catch (err) {
      setStatus('error')
      setError(err instanceof ApiError ? err.message : 'Connection failed.')
    }
  }

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
      setError('Missing authorization code from Meta.')
      return
    }

    httpClient
      .post<PreviewResponse>(`/${channel}/connect/preview`, {
        code,
        redirectUri: recallRedirectUri(channel) ?? undefined,
      })
      .then((res) => {
        const rawCandidates = res.candidates ?? res.pages ?? []
        const list: Candidate[] = rawCandidates.map((c) => ({
          pageId: c.pageId ?? c.id ?? '',
          label: c.username ? `@${c.username}` : (c.name ?? c.pageId ?? c.id ?? 'Account'),
        }))
        setCandidates(list)
        setConnectToken(res.connectToken)

        if (!res.requiresSelection && list.length > 0) {
          void finalize(res.connectToken, list[0].pageId)
        } else {
          setStatus('select')
        }
      })
      .catch((err) => {
        setStatus('error')
        setError(err instanceof ApiError ? err.message : 'Connection failed.')
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

        {status === 'select' ? (
          <>
            <p className="text-sm font-semibold">Choose an account to connect</p>
            <div className="space-y-2">
              {candidates.map((c) => (
                <Button
                  key={c.pageId}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => connectToken && void finalize(connectToken, c.pageId)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
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
