import { AiProviderSheet } from '@/components/integrations/AiProviderSheet'
import { ChannelReconnectDialog, type ReconnectAlert } from '@/components/integrations/ChannelReconnectDialog'
import { InstagramConnectSheet } from '@/components/integrations/InstagramConnectSheet'
import { TelegramConnectSheet } from '@/components/integrations/TelegramConnectSheet'
import { pathForSettingsSection } from '@/lib/planChannels'

export function PlanGateBanner({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {message}{' '}
      <a className="font-semibold underline" href={pathForSettingsSection('subscription')}>
        Upgrade plan
      </a>
    </div>
  )
}

export function IntegrationsHubOverlays({
  telegramOpen,
  onTelegramOpenChange,
  aiOpen,
  onAiOpenChange,
  instagramOpen,
  onInstagramOpenChange,
  instagramBlocked,
  reconnectOpen,
  reconnectAlerts,
  onReconnect,
  onDismissReconnect,
}: {
  telegramOpen: boolean
  onTelegramOpenChange: (open: boolean) => void
  aiOpen: boolean
  onAiOpenChange: (open: boolean) => void
  instagramOpen: boolean
  onInstagramOpenChange: (open: boolean) => void
  instagramBlocked: string | null
  reconnectOpen: boolean
  reconnectAlerts: ReconnectAlert[]
  onReconnect: (alert: ReconnectAlert) => void
  onDismissReconnect: () => void
}) {
  return (
    <>
      <TelegramConnectSheet open={telegramOpen} onOpenChange={onTelegramOpenChange} />
      <AiProviderSheet open={aiOpen} onOpenChange={onAiOpenChange} />
      <InstagramConnectSheet
        open={instagramOpen}
        onOpenChange={onInstagramOpenChange}
        connectDisabled={Boolean(instagramBlocked)}
        connectDisabledMessage={instagramBlocked ?? undefined}
      />
      <ChannelReconnectDialog
        open={reconnectOpen}
        alerts={reconnectAlerts}
        onReconnect={onReconnect}
        onDismiss={onDismissReconnect}
      />
    </>
  )
}
