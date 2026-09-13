import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'

import { API_BASE_URL } from '@/lib/apiConfig'
import { writeStoredSession } from '@/lib/authSession'
import type { AuthUser } from '@/services/authApi'

/**
 * Landing page for the super-admin "Login as" button (apps/super-admin's
 * openOrganizationLogin) — opened in a fresh tab as
 * `${appUrl}/auth/impersonate?token=...&workspaceId=...`. The impersonation token is
 * already a valid session JWT (see createWorkspaceImpersonationSession on the backend);
 * this page just needs to resolve it into a full user profile via GET /auth/me, store
 * it the same way a normal login does, then hard-reload into the app so AuthProvider
 * picks up the freshly written session from scratch.
 */
export function ImpersonateRoute() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Missing impersonation token.')
      return
    }

    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Could not verify impersonation session (${res.status}).`)
        const body = (await res.json()) as AuthUser & Record<string, unknown>
        const user: AuthUser = { id: body.id, name: body.name, email: body.email, avatar: body.avatar, role: body.role }
        writeStoredSession({ token, user })
        // Full reload (not client-side navigate) so AuthProvider re-reads localStorage fresh.
        window.location.href = '/'
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Impersonation failed.'))
  }, [searchParams])

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        {error ? (
          <>
            <AlertCircle className="text-destructive mx-auto size-8" />
            <p className="text-sm font-semibold">Couldn&apos;t log in</p>
            <p className="text-muted-foreground text-xs">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="text-muted-foreground mx-auto size-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Logging you in…</p>
          </>
        )}
      </div>
    </div>
  )
}
