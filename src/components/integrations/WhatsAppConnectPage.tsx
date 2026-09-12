import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { WhatsAppEmbeddedSignup } from '@/components/integrations/WhatsAppEmbeddedSignup'
import { ChannelIcon } from '@/components/channel-icon'
import type { WhatsAppSignupMode } from '@/services/realIntegrations.service'

export function WhatsAppConnectPage({
  mode,
  onBack,
  onConnected,
}: {
  mode: WhatsAppSignupMode
  onBack: () => void
  onConnected: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const coexistence = mode === 'app_coexistence'

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to integrations
      </button>

      <div className="flex items-start gap-3 rounded-xl border p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#e6f7ec]">
          <ChannelIcon channel="whatsapp" className="text-channel-green size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {coexistence ? 'WhatsApp Coexistence' : 'Connect WhatsApp'}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {coexistence
              ? 'Keep using WhatsApp Business App on your phone while syncing the same number to ConvoSync.'
              : 'Connect WhatsApp Business API for inbox, templates, broadcasts, and customer support.'}
          </p>
        </div>
      </div>

      {coexistence ? (
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-xs">
          <li>Use a number already registered in the WhatsApp Business App</li>
          <li>You stay logged in on your phone after connecting</li>
          <li>Contacts and recent chat history sync after Meta finishes onboarding</li>
        </ul>
      ) : (
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-xs">
          <li>You need a Meta Business Portfolio and WhatsApp Business Account</li>
          <li>Embedded Signup opens a Facebook popup to link the number</li>
          <li>You can add more numbers later from Manage</li>
        </ul>
      )}

      {error ? (
        <p className="text-destructive rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <WhatsAppEmbeddedSignup
        mode={mode}
        onSuccess={onConnected}
        onError={(message) => setError(message)}
      />
    </div>
  )
}
