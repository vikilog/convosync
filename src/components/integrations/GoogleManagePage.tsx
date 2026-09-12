import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { startGoogleConnect } from '@/lib/integrationsOAuth'
import { ApiError } from '@/lib/httpClient'
import {
  HUB_GOOGLE_PRODUCTS,
  realIntegrationsService,
  type GoogleProductKey,
  type GoogleProductSummary,
} from '@/services/realIntegrations.service'

function reportError(err: unknown, fallback: string) {
  window.alert(err instanceof ApiError ? err.message : fallback)
}

function ProductCard({
  product,
  connectionIds,
  emails,
  busy,
  onConnect,
  onDisconnect,
  onSync,
}: {
  product: GoogleProductSummary
  connectionIds: { id: string; email: string }[]
  emails: Record<string, string>
  busy: boolean
  onConnect: (connectionId: string) => void
  onDisconnect: () => void
  onSync: () => void
}) {
  const connected = product.status === 'connected'
  const [selected, setSelected] = useState(product.connectionId || connectionIds[0]?.id || '')

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{product.label}</h3>
          <p className="text-muted-foreground mt-1 text-xs">{product.description}</p>
        </div>
        <Badge variant={connected ? 'default' : 'outline'} className="shrink-0 text-[10px]">
          {connected ? 'Connected' : product.status === 'error' ? 'Error' : 'Not connected'}
        </Badge>
      </div>
      {product.connectionEmail ? (
        <p className="text-muted-foreground text-xs">Account: {product.connectionEmail}</p>
      ) : null}
      {product.lastError ? <p className="text-destructive truncate text-xs">{product.lastError}</p> : null}

      {!connected && connectionIds.length > 0 ? (
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Google account" />
          </SelectTrigger>
          <SelectContent>
            {connectionIds.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {emails[c.id] ?? c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!connected ? (
          <Button
            size="sm"
            disabled={busy || !selected}
            onClick={() => selected && onConnect(selected)}
          >
            Connect
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" disabled={busy} onClick={onSync}>
              Sync
            </Button>
            <Button variant="destructive" size="sm" disabled={busy} onClick={onDisconnect}>
              Disconnect
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function GoogleManagePage({ onBack }: { onBack: () => void }) {
  const confirm = useConfirm()
  const { data: connectionsData, isLoading: loadingConnections } =
    realIntegrationsService.useGoogleConnections()
  const { data: productsData, isLoading: loadingProducts } = realIntegrationsService.useGoogleProducts()
  const disconnectAccount = realIntegrationsService.useDisconnectGoogleConnection()
  const connectProduct = realIntegrationsService.useConnectGoogleProduct()
  const disconnectProduct = realIntegrationsService.useDisconnectGoogleProduct()
  const syncProduct = realIntegrationsService.useSyncGoogleProduct()
  const [busyProduct, setBusyProduct] = useState<GoogleProductKey | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const connections = connectionsData?.connections ?? []
  const products = (productsData?.products ?? []).filter((p) => HUB_GOOGLE_PRODUCTS.includes(p.product))
  const emails = Object.fromEntries(connections.map((c) => [c.id, c.email]))

  const runProduct = async (product: GoogleProductKey, fn: () => Promise<unknown>, ok?: string) => {
    setBusyProduct(product)
    setMessage(null)
    try {
      await fn()
      if (ok) setMessage(ok)
    } catch (err) {
      reportError(err, 'Google product action failed.')
    } finally {
      setBusyProduct(null)
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to integrations
      </button>

      <div>
        <h2 className="text-lg font-semibold">Google</h2>
        <p className="text-muted-foreground text-sm">
          Connect a Google account, then enable Business Profile, Gmail, Calendar, Sheets, or Drive.
        </p>
      </div>

      {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}

      <section className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Google accounts</h3>
          <Button
            size="sm"
            onClick={() => startGoogleConnect().catch((err) => reportError(err, 'Could not start Google connect.'))}
          >
            Connect Google account
          </Button>
        </div>
        {loadingConnections ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        ) : connections.length === 0 ? (
          <p className="text-muted-foreground text-xs">No Google accounts connected yet.</p>
        ) : (
          <ul className="space-y-2">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.email}</p>
                  {c.displayName ? <p className="text-muted-foreground truncate text-xs">{c.displayName}</p> : null}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() =>
                    void confirm({
                      title: `Remove ${c.email}?`,
                      description: 'Products using this account will disconnect.',
                      confirmLabel: 'Remove',
                      destructive: true,
                    }).then((ok) => {
                      if (ok)
                        disconnectAccount.mutate(c.id, {
                          onError: (err) => reportError(err, 'Could not disconnect.'),
                        })
                    })
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Google products</h3>
        {loadingProducts ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <ProductCard
                key={product.product}
                product={product}
                connectionIds={connections}
                emails={emails}
                busy={busyProduct === product.product}
                onConnect={(connectionId) =>
                  void runProduct(product.product, () =>
                    connectProduct.mutateAsync({ product: product.product, connectionId })
                  )
                }
                onDisconnect={() => {
                  if (!product.connectionId) return
                  void runProduct(product.product, () =>
                    disconnectProduct.mutateAsync({
                      product: product.product,
                      connectionId: product.connectionId as string,
                    })
                  )
                }}
                onSync={() => {
                  if (!product.connectionId) return
                  void runProduct(
                    product.product,
                    () =>
                      syncProduct.mutateAsync({
                        product: product.product,
                        connectionId: product.connectionId as string,
                      }),
                    product.product === 'business_profile' ? 'Business Profile sync queued.' : undefined
                  )
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
