import { useState } from 'react'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  clearStoredConnectError,
  META_ADS_CONNECT_ERROR_KEY,
  readStoredConnectError,
  startMetaAdsConnect,
} from '@/lib/integrationsOAuth'
import { ApiError } from '@/lib/httpClient'
import { realIntegrationsService } from '@/services/realIntegrations.service'

function reportError(err: unknown, fallback: string) {
  window.alert(err instanceof ApiError ? err.message : fallback)
}

export function MetaAdsManagePage({ onBack }: { onBack: () => void }) {
  const confirm = useConfirm()
  const { data, isLoading, refetch, isFetching } = realIntegrationsService.useMetaAdsStatus()
  const connected = Boolean(data?.connected)
  const { data: accountsData, error: accountsError } = realIntegrationsService.useMetaAdAccounts(connected)
  const disconnect = realIntegrationsService.useDisconnectMetaAds()
  const selectAccount = realIntegrationsService.useSelectMetaAdAccount()
  const [connectError, setConnectError] = useState(() => readStoredConnectError(META_ADS_CONNECT_ERROR_KEY))
  const [connecting, setConnecting] = useState(false)

  const account = data?.connected ? data.account : null
  const adAccounts = accountsData?.accounts ?? []

  const handleConnect = async () => {
    setConnecting(true)
    clearStoredConnectError(META_ADS_CONNECT_ERROR_KEY)
    setConnectError(null)
    try {
      await startMetaAdsConnect()
    } catch (err) {
      setConnecting(false)
      reportError(err, 'Could not start Meta Ads connect.')
    }
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading Meta Ads…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to integrations
      </button>

      <div>
        <h2 className="text-lg font-semibold">Meta Ads</h2>
        <p className="text-muted-foreground text-sm">
          Link a Meta Business Ad Account to attribute click-to-WhatsApp campaigns.
        </p>
      </div>

      {connectError ? (
        <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-950">Meta Ads connection failed</p>
          <p className="text-xs text-red-800">{connectError}</p>
          <Button size="sm" disabled={connecting} onClick={() => void handleConnect()}>
            {connecting ? 'Redirecting…' : 'Try again'}
          </Button>
        </div>
      ) : null}

      {!account ? (
        <div className="space-y-4 rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">
            Connect your Meta Business Ad Account to sync performance into Ads Manager.
          </p>
          <Button disabled={connecting} onClick={() => void handleConnect()}>
            {connecting ? 'Redirecting…' : 'Connect Meta Account'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{account.name}</h3>
                <Badge className="text-[10px]">Connected</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                ID {account.id} · {account.currency}
                {account.balance != null ? ` · Balance ${account.balance}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                <RefreshCw className={isFetching ? 'animate-spin' : ''} />
                Sync
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={disconnect.isPending}
                onClick={() =>
                  void confirm({
                    title: 'Disconnect Meta Ads?',
                    description: 'This removes the connected ad account from ConvoSync.',
                    confirmLabel: 'Disconnect',
                    destructive: true,
                  }).then((ok) => {
                    if (ok)
                      disconnect.mutate(undefined, {
                        onError: (err) => reportError(err, 'Could not disconnect.'),
                      })
                  })
                }
              >
                Disconnect
              </Button>
            </div>
          </div>

          {accountsError ? (
            <p className="text-destructive text-xs">
              Couldn&apos;t load ad accounts: {accountsError instanceof ApiError ? accountsError.message : 'Unknown error'}
            </p>
          ) : null}

          {adAccounts.length > 1 ? (
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Ad account</p>
              <Select
                value={account.id}
                disabled={selectAccount.isPending}
                onValueChange={(id) => {
                  if (id === account.id) return
                  selectAccount.mutate(id, {
                    onError: (err) => reportError(err, 'Could not switch ad account.'),
                  })
                }}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {adAccounts.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.campaignCount} campaigns)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
