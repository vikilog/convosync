import { useState } from 'react'
import { Link } from 'react-router-dom'

import { CHANNEL_ICON_CLASS, ChannelIcon } from '@/components/channel-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { instagramShowsConnect } from '@/lib/channelConnectMode'
import { ApiError } from '@/lib/httpClient'
import { startInstagramBusinessLogin, startInstagramConnect } from '@/lib/integrationsOAuth'
import { channelConnectBlockedReason } from '@/lib/planChannels'
import { realBillingService } from '@/services/realBilling.service'
import { instagramHealth, realIntegrationsService } from '@/services/realIntegrations.service'

export function InstagramPage() {
  const { data, isLoading, isError } = realIntegrationsService.useInstagramAccounts()
  const { data: subscription } = realBillingService.useSubscription()
  const { data: billing } = realBillingService.useWorkspaceBilling()
  const blocked = channelConnectBlockedReason(
    subscription?.currentPlan?.features?.channels,
    billing?.usageSnapshot.channels ?? null,
    'instagram'
  )
  const accounts = data?.accounts ?? []
  const showConnect = instagramShowsConnect(accounts.map((a) => a.statusLabel))
  const [busy, setBusy] = useState<'facebook' | 'instagram' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (kind: 'facebook' | 'instagram', start: () => Promise<void>) => {
    if (blocked) {
      setError(blocked)
      return
    }
    setBusy(kind)
    setError(null)
    try {
      await start()
    } catch (err) {
      setBusy(null)
      setError(err instanceof ApiError ? err.message : 'Could not start Instagram connect.')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div className="flex items-start gap-3 rounded-xl border p-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${CHANNEL_ICON_CLASS.instagram}`}>
          <ChannelIcon channel="instagram" className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Instagram Business</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Authorize via Facebook Login to link an Instagram Professional account for inbox DMs and
            Social Listening.
          </p>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Loading Instagram…</p> : null}
      {isError ? <p className="text-destructive text-sm">Could not load Instagram accounts.</p> : null}

      {accounts.length > 0 ? (
        <ul className="space-y-2">
          {accounts.map((account) => {
            const health = instagramHealth(account.statusLabel)
            return (
              <li key={account.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {account.displayName || account.username || 'Instagram'}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{account.label}</p>
                </div>
                <Badge variant={health === 'live' ? 'secondary' : 'destructive'}>
                  {health === 'live' ? 'Connected' : account.statusLabel.replace('_', ' ')}
                </Badge>
              </li>
            )
          })}
        </ul>
      ) : null}

      {accounts.length > 0 ? (
        <Button asChild>
          <Link to="/inbox">Open Inbox</Link>
        </Button>
      ) : null}

      {showConnect ? (
        <div className="space-y-4 rounded-xl border p-4">
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-xs">
            <li>Instagram must be a Professional account (Business or Creator)</li>
            <li>Instagram must be linked to a Facebook Page you admin</li>
            <li>Log in with the Facebook profile that manages that Page</li>
          </ul>
          {blocked ? <p className="text-sm font-medium text-amber-700">{blocked}</p> : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button
            disabled={Boolean(blocked) || busy != null}
            onClick={() => void run('facebook', startInstagramConnect)}
          >
            {busy === 'facebook' ? 'Redirecting…' : blocked ? 'Upgrade plan' : 'Continue with Facebook'}
          </Button>
          <div className="border-t pt-4">
            <p className="text-muted-foreground text-xs font-medium">
              Prefer logging in with Instagram directly (no Facebook Page required)?
            </p>
            <Button
              variant="outline"
              className="mt-2"
              disabled={busy != null}
              onClick={() => void run('instagram', startInstagramBusinessLogin)}
            >
              {busy === 'instagram' ? 'Redirecting…' : 'Continue with Instagram Login'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
