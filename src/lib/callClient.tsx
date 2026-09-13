import { useContext, type ReactNode } from 'react'

import { virtualNumberService } from '@/services/virtualNumber.service'
import { PlivoCallContext, PlivoCallProvider } from '@/lib/plivoCallClient'
import { TelnyxCallContext, TelnyxCallProvider } from '@/lib/telnyxCallClient'

export type { CallDirection, CallPhase, PlivoCallState as CallState } from '@/lib/plivoCallClient'

/** Mounts both providers — each only actually connects to its own SDK once
 * /browser-credentials confirms it's this workspace's active provider (see the guard
 * in plivoCallClient.tsx's and telnyxCallClient.tsx's login effects); the inactive one
 * just sits idle. Mount once at the app layout level, same as PlivoCallProvider was
 * mounted alone before Telnyx existed. */
export function CallProvider({ children }: { children: ReactNode }) {
  return (
    <PlivoCallProvider>
      <TelnyxCallProvider>{children}</TelnyxCallProvider>
    </PlivoCallProvider>
  )
}

/** Provider-agnostic call state/actions for PlivoCallWidget (and anything else that
 * doesn't need to know which carrier is underneath) — picks whichever of the two
 * contexts belongs to this workspace's active provider. Defaults to Plivo's context
 * while /browser-credentials is still loading, matching this app's original
 * Plivo-only behavior for the common (India) case. */
export function useCall() {
  const { data: numbersData } = virtualNumberService.useNumbers()
  const hasActiveNumber = Boolean(numbersData?.numbers.length)
  const { data: credentials } = virtualNumberService.useBrowserCredentials(hasActiveNumber)

  const plivo = useContext(PlivoCallContext)
  const telnyx = useContext(TelnyxCallContext)

  const ctx = credentials?.provider === 'telnyx' ? telnyx : plivo
  if (!ctx) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return ctx
}
