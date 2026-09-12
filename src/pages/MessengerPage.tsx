import { useState } from 'react'
import { Link } from 'react-router-dom'

import { CHANNEL_ICON_CLASS, ChannelIcon } from '@/components/channel-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { messengerStandaloneMode } from '@/lib/channelConnectMode'
import { ApiError } from '@/lib/httpClient'
import { channelConnectBlockedReason } from '@/lib/planChannels'
import { realBillingService } from '@/services/realBilling.service'
import { realIntegrationsService } from '@/services/realIntegrations.service'

export function MessengerPage() {
  const instagram = realIntegrationsService.useInstagramAccounts()
  const messenger = realIntegrationsService.useMessengerAccounts()
  const connectMessenger = realIntegrationsService.useConnectMessenger()
  const { data: subscription } = realBillingService.useSubscription()
  const { data: billing } = realBillingService.useWorkspaceBilling()
  const blocked = channelConnectBlockedReason(
    subscription?.currentPlan?.features?.channels,
    billing?.usageSnapshot.channels ?? null,
    'messenger'
  )
  const igAccounts = instagram.data?.accounts ?? []
  const mgAccounts = messenger.data?.accounts ?? []
  const mode = messengerStandaloneMode(igAccounts.length > 0, mgAccounts.length)
  const [error, setError] = useState<string | null>(null)

  const enable = () => {
    if (blocked) {
      setError(blocked)
      return
    }
    setError(null)
    connectMessenger.mutate(undefined, {
      onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to enable Messenger'),
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div className="flex items-start gap-3 rounded-xl border p-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${CHANNEL_ICON_CLASS.messenger}`}>
          <ChannelIcon channel="messenger" className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Facebook Messenger</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Uses the same Meta Page token from your Instagram connection — no extra login required.
          </p>
        </div>
      </div>

      {instagram.isLoading || messenger.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading Messenger…</p>
      ) : null}
      {instagram.isError || messenger.isError ? (
        <p className="text-destructive text-sm">Could not load Messenger status.</p>
      ) : null}

      {mgAccounts.length > 0 ? (
        <ul className="space-y-2">
          {mgAccounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {account.displayName || account.pageName || 'Messenger'}
                </p>
                <p className="text-muted-foreground truncate text-xs">{account.pageName || account.label}</p>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {mode === 'connected' ? (
        <Button asChild>
          <Link to="/inbox">Open Inbox</Link>
        </Button>
      ) : null}

      {mode === 'need-instagram' ? (
        <div className="space-y-3 rounded-xl border p-4">
          <p className="text-sm font-medium text-amber-700">
            Connect Instagram first, then return here to enable Messenger.
          </p>
          <Button asChild>
            <Link to="/instagram">Connect Instagram</Link>
          </Button>
        </div>
      ) : null}

      {mode === 'enable' ? (
        <div className="space-y-4 rounded-xl border p-4">
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-xs">
            <li>Requires Instagram on the same Facebook Page</li>
            <li>Shows as a separate channel in your workspace</li>
            <li>Syncs Messenger inbox alongside Instagram DMs</li>
          </ul>
          {blocked ? <p className="text-sm font-medium text-amber-700">{blocked}</p> : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button disabled={Boolean(blocked) || connectMessenger.isPending} onClick={enable}>
            {connectMessenger.isPending ? 'Enabling Messenger…' : blocked ? 'Upgrade plan' : 'Enable Messenger'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
