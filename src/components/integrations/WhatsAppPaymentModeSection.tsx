import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { realIntegrationsService } from '@/services/realIntegrations.service'

export function WhatsAppPaymentModeSection({ phoneNumberId }: { phoneNumberId: string }) {
  const { data: status } = realIntegrationsService.useWhatsAppPaymentMode(phoneNumberId)
  const setMode = realIntegrationsService.useSetWhatsAppPaymentMode(phoneNumberId)
  const refresh = realIntegrationsService.useRefreshWhatsAppPaymentMode(phoneNumberId)
  const acknowledge = realIntegrationsService.useAcknowledgeWhatsAppPaymentMode(phoneNumberId)

  if (!status) return null

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <h4 className="text-sm font-semibold">Payment mode</h4>
        <p className="text-muted-foreground text-xs">
          Meta conversation billing for this WhatsApp Business Account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode.mutate('self_pay')}
          className={`space-y-1 rounded-lg border p-3 text-left transition-colors ${
            status.paymentMode === 'self_pay' ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
          }`}
        >
          <p className="text-sm font-medium">Self Pay</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            You add a payment method in Meta Business Manager. Meta bills your business directly.
          </p>
          {status.paymentMode === 'self_pay' ? (
            <span className="text-primary text-xs font-medium">Selected</span>
          ) : null}
        </button>

        <div className="text-muted-foreground space-y-1 rounded-lg border p-3 opacity-60">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            Platform
            <Badge variant="outline" className="text-[10px]">
              Coming soon
            </Badge>
          </p>
          <p className="text-xs leading-relaxed">
            ConvoSync covers Meta billing via credit line. Not available yet.
          </p>
        </div>
      </div>

      {status.billingCheckStatus !== 'confirmed' ? (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-sm font-medium">Add a payment method in Meta</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Automatic billing check needs Solution Partner access. Open Meta to add a payment method, then
            continue.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm">
              <a href={status.metaPaymentSetupUrl} target="_blank" rel="noreferrer">
                Open Meta payment methods
                <ExternalLink />
              </a>
            </Button>
            <Button variant="outline" size="sm" disabled={refresh.isPending} onClick={() => refresh.mutate()}>
              Refresh status
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={acknowledge.isPending}
              onClick={() => acknowledge.mutate()}
            >
              I've added a payment method
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
