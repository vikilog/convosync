import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { WhatsAppEmbeddedSignup } from '@/components/integrations/WhatsAppEmbeddedSignup'
import { WhatsAppManageSheet } from '@/components/integrations/WhatsAppManageSheet'
import { WhatsAppPaymentModeSection } from '@/components/integrations/WhatsAppPaymentModeSection'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { ChannelIcon } from '@/components/channel-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/httpClient'
import {
  realIntegrationsService,
  type WhatsAppFullAccount,
  type WhatsAppSignupMode,
} from '@/services/realIntegrations.service'

function reportError(err: unknown, fallback: string) {
  window.alert(err instanceof ApiError ? err.message : fallback)
}

export function WhatsAppManagePage({
  onBack,
  mode,
}: {
  onBack: () => void
  mode?: WhatsAppSignupMode
}) {
  const confirm = useConfirm()
  const { data } = realIntegrationsService.useWhatsAppAccounts()
  const disconnectAccount = realIntegrationsService.useDisconnectWhatsAppAccount()
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const accounts = (data?.accounts ?? []).filter((account) =>
    mode ? account.connectionMode === mode : true
  )
  const verifiedCount = accounts.filter((a) => a.verified).length

  const handleDisconnect = async (account: WhatsAppFullAccount) => {
    const ok = await confirm({
      title: `Disconnect ${account.phoneNumber ?? account.label}?`,
      description: 'This removes the number from ConvoSync. You can reconnect it later.',
      confirmLabel: 'Disconnect',
      destructive: true,
    })
    if (ok) {
      disconnectAccount.mutate(account.phoneNumberId, {
        onError: (err) => reportError(err, 'Could not disconnect this number.'),
      })
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

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#e6f7ec]">
            <ChannelIcon channel="whatsapp" className="text-channel-green size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {mode === 'app_coexistence' ? 'WhatsApp Coexistence' : 'WhatsApp Business'}
            </h2>
            <p className="text-muted-foreground text-sm">
              Manage connected numbers, Meta verification, and business profile (About, category, websites).
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <div className="rounded-lg border px-4 py-2 text-center">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
              Connected
            </p>
            <p className="text-lg font-semibold tabular-nums">{accounts.length}</p>
          </div>
          <div className="rounded-lg border px-4 py-2 text-center">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
              Verified
            </p>
            <p className="text-lg font-semibold tabular-nums">{verifiedCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Active phone accounts</h3>
            <p className="text-muted-foreground text-xs">
              {mode === 'app_coexistence'
                ? 'Numbers linked via WhatsApp Business App coexistence.'
                : 'Numbers linked to this workspace via Meta Business API.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAdding((open) => !open)}>
            {adding ? 'Cancel' : 'Add number'}
          </Button>
        </div>

        {adding ? (
          <div className="space-y-2 rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">
              Embedded Signup opens a Facebook popup to link another number.
            </p>
            {addError ? <p className="text-destructive text-sm">{addError}</p> : null}
            <WhatsAppEmbeddedSignup
              mode={mode ?? 'business_api'}
              onSuccess={() => {
                setAdding(false)
                setAddError(null)
              }}
              onError={setAddError}
            />
          </div>
        ) : null}

        {accounts.map((account) => (
          <div key={account.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f7ec]">
                  <ChannelIcon channel="whatsapp" className="text-channel-green size-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold">{account.label}</p>
                    {account.verified ? (
                      <Badge variant="outline" className="text-[10px]">
                        Meta verified
                      </Badge>
                    ) : null}
                    <Badge className="text-[10px]">{account.status}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{account.phoneNumberId}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingAccount(account.phoneNumberId)}>
                  Edit profile
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={disconnectAccount.isPending}
                  onClick={() => void handleDisconnect(account)}
                >
                  Disconnect
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                  Daily limit
                </p>
                <p className="text-sm font-semibold">Meta managed</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                  QoS rating
                </p>
                <p className="text-sm font-semibold">Synced</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                  Phone ID
                </p>
                <p className="truncate text-sm font-semibold">{account.phoneNumberId}</p>
              </div>
            </div>

            <WhatsAppPaymentModeSection phoneNumberId={account.phoneNumberId} />
          </div>
        ))}

        {accounts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No WhatsApp numbers connected.</p>
        ) : null}
      </div>

      <WhatsAppManageSheet
        phoneNumberId={editingAccount}
        open={editingAccount != null}
        onOpenChange={(open) => {
          if (!open) setEditingAccount(null)
        }}
      />
    </div>
  )
}
