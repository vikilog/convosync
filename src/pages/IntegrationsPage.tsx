import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AvailableIntegrationCard } from '@/components/integrations/AvailableIntegrationCard'
import { type ReconnectAlert } from '@/components/integrations/ChannelReconnectDialog'
import { ConnectedIntegrationCard } from '@/components/integrations/ConnectedIntegrationCard'
import { CHANNEL_LABEL } from '@/components/integrations/integration-visual'
import { IntegrationsHubOverlays, PlanGateBanner } from '@/components/integrations/IntegrationsHubOverlays'
import {
  IntegrationsManageView,
  type IntegrationsManageViewId,
} from '@/components/integrations/IntegrationsManageView'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { ApiError } from '@/lib/httpClient'
import { startFacebookConnect, startInstagramConnect } from '@/lib/integrationsOAuth'
import { channelConnectBlockedReason, pathForSettingsSection } from '@/lib/planChannels'
import { realBillingService } from '@/services/realBilling.service'
import {
  instagramHealth,
  realIntegrationsService,
  type AvailableIntegration,
  type ConnectedIntegration,
} from '@/services/realIntegrations.service'
import { virtualNumberService } from '@/services/virtualNumber.service'

type ConnectedEntry = {
  integration: ConnectedIntegration
  onSync?: () => void
  onManage?: () => void
  onDisconnect: () => void
}

function reportError(err: unknown, fallback: string) {
  window.alert(err instanceof ApiError ? err.message : fallback)
}
function gateLabel(blocked: string | null) {
  return { connectLabel: blocked ? 'Upgrade plan' : 'Connect', disabled: Boolean(blocked) }
}

export function IntegrationsPage() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [telegramSheetOpen, setTelegramSheetOpen] = useState(false)
  const [aiProviderSheetOpen, setAiProviderSheetOpen] = useState(false)
  const [instagramSheetOpen, setInstagramSheetOpen] = useState(false)
  const [manageView, setManageView] = useState<IntegrationsManageViewId | null>(null)
  const [reconnectDismissed, setReconnectDismissed] = useState(false)
  const snoozeRef = useRef<number | null>(null)

  useEffect(() => {
    const channel = searchParams.get('channel')
    if (channel === 'whatsapp') setManageView('whatsapp')
    else if (channel === 'whatsapp-coexistence') setManageView('whatsapp-coexistence')
    else if (channel === 'email') setManageView('email')
    else if (channel === 'google') setManageView('google')
    else if (channel === 'meta-ads') setManageView('meta-ads')
    else if (channel === 'telegram') setTelegramSheetOpen(true)
    else if (channel === 'instagram') setInstagramSheetOpen(true)
    else if (channel === 'virtual-number') navigate('/integrations/virtual-number')
  }, [searchParams, navigate])

  const { data: subscription } = realBillingService.useSubscription()
  const { data: billing } = realBillingService.useWorkspaceBilling()
  const planChannels = subscription?.currentPlan?.features?.channels
  const channelUsage = billing?.usageSnapshot.channels ?? null
  const whatsappBlocked = channelConnectBlockedReason(planChannels, channelUsage, 'whatsapp')
  const instagramBlocked = channelConnectBlockedReason(planChannels, channelUsage, 'instagram')
  const messengerBlocked = channelConnectBlockedReason(planChannels, channelUsage, 'messenger')
  const emailBlocked = channelConnectBlockedReason(planChannels, channelUsage, 'email')
  const planBanner = whatsappBlocked ?? instagramBlocked ?? messengerBlocked ?? emailBlocked

  const whatsapp = realIntegrationsService.useWhatsAppStatus()
  const instagram = realIntegrationsService.useInstagramAccounts()
  const messenger = realIntegrationsService.useMessengerAccounts()
  const facebook = realIntegrationsService.useFacebookPage()
  const telegram = realIntegrationsService.useTelegramAccounts()
  const email = realIntegrationsService.useEmailIntegration()
  const metaAds = realIntegrationsService.useMetaAdsStatus()
  const google = realIntegrationsService.useGoogleConnections()
  const whatsappFlow = realIntegrationsService.useWhatsAppFlowStatus()
  const { data: virtualNumber } = virtualNumberService.useStatus()
  const { data: virtualNumbers } = virtualNumberService.useNumbers()
  const ownedNumbers = virtualNumbers?.numbers ?? []

  const disconnectInstagram = realIntegrationsService.useDisconnectInstagram()
  const syncInstagram = realIntegrationsService.useSyncInstagram()
  const connectMessenger = realIntegrationsService.useConnectMessenger()
  const disconnectMessenger = realIntegrationsService.useDisconnectMessenger()
  const syncMessenger = realIntegrationsService.useSyncMessenger()
  const disconnectFacebook = realIntegrationsService.useDisconnectFacebook()
  const disconnectTelegram = realIntegrationsService.useDisconnectTelegram()
  const enableEmail = realIntegrationsService.useEnableEmail()
  const disableEmail = realIntegrationsService.useDisableEmail()
  const requestWhatsAppFlow = realIntegrationsService.useRequestWhatsAppFlow()
  const disconnectWhatsApp = realIntegrationsService.useDisconnectWhatsAppAccount()

  const waAccounts = whatsapp.data?.accounts ?? []
  const coexistenceConnected = waAccounts.some((a) => a.connectionMode === 'app_coexistence')
  const igAccounts = instagram.data?.accounts ?? []
  const mgAccounts = messenger.data?.accounts ?? []
  const tgAccounts = telegram.data?.accounts ?? []

  const reconnectAlerts: ReconnectAlert[] = useMemo(
    () =>
      igAccounts
        .filter((a) => a.statusLabel === 'expired' || a.statusLabel === 'revoked')
        .map((a) => ({
          id: `ig:${a.instagramUserId}`,
          channelLabel: 'Instagram',
          title: a.username ? `@${a.username}` : a.displayName || a.label || 'Instagram',
          reason: a.statusLabel as 'expired' | 'revoked',
        })),
    [igAccounts]
  )

  const snoozeReconnect = () => {
    setReconnectDismissed(true)
    if (snoozeRef.current) window.clearTimeout(snoozeRef.current)
    snoozeRef.current = window.setTimeout(() => setReconnectDismissed(false), 5 * 60 * 1000)
  }

  const connectedEntries: ConnectedEntry[] = []
  const available: AvailableIntegration[] = []

  if (whatsapp.data?.connected) {
    const primary = waAccounts[0]
    connectedEntries.push({
      integration: {
        id: 'whatsapp',
        channel: 'whatsapp',
        channelLabel: CHANNEL_LABEL.whatsapp,
        title: primary?.displayName || 'WhatsApp Business',
        subtitle: primary?.phoneNumber || whatsapp.data.phoneNumber || '—',
        detail: waAccounts.length > 1 ? `${waAccounts.length} numbers connected` : undefined,
        health: 'live',
      },
      onManage: () => setManageView('whatsapp'),
      onDisconnect: () =>
        disconnectWhatsApp.mutate(undefined, {
          onError: (err) => reportError(err, 'Could not disconnect WhatsApp.'),
        }),
    })
  } else {
    available.push({
      id: 'add_whatsapp',
      channel: 'whatsapp',
      title: 'WhatsApp',
      description: 'Connect WhatsApp Business API for inbox, templates, broadcasts, and customer support.',
      ...gateLabel(whatsappBlocked),
    })
  }

  if (!coexistenceConnected) {
    available.push({
      id: 'add_whatsapp_coexistence',
      channel: 'whatsapp_coexistence',
      title: 'WhatsApp Coexistence',
      description:
        'Keep using WhatsApp Business App on your phone while syncing the same number to ConvoSync.',
      ...gateLabel(whatsappBlocked),
    })
  }

  igAccounts.forEach((account) => {
    const health = instagramHealth(account.statusLabel)
    connectedEntries.push({
      integration: {
        id: `instagram_${account.id}`,
        channel: 'instagram',
        channelLabel: CHANNEL_LABEL.instagram,
        title: account.displayName || account.username || 'Instagram',
        subtitle: account.label,
        health,
      },
      onSync: () =>
        syncInstagram.mutate(undefined, {
          onError: (err) => reportError(err, 'Could not sync Instagram right now.'),
        }),
      onManage: health === 'expired' || health === 'revoked' ? () => setInstagramSheetOpen(true) : undefined,
      onDisconnect: () =>
        disconnectInstagram.mutate(account.instagramUserId, {
          onError: (err) => reportError(err, 'Could not disconnect Instagram.'),
        }),
    })
  })
  if (igAccounts.length === 0) {
    available.push({
      id: 'add_instagram',
      channel: 'instagram',
      title: 'Instagram',
      description: 'Connect Instagram for DM inbox, comment automation, and AI-powered replies.',
      ...gateLabel(instagramBlocked),
    })
  }

  mgAccounts.forEach((account) => {
    connectedEntries.push({
      integration: {
        id: `messenger_${account.id}`,
        channel: 'messenger',
        channelLabel: CHANNEL_LABEL.messenger,
        title: account.displayName || account.pageName || 'Messenger',
        subtitle: account.pageName || account.label,
        health: 'live',
      },
      onSync: () =>
        syncMessenger.mutate(undefined, {
          onError: (err) => reportError(err, 'Could not sync Messenger right now.'),
        }),
      onDisconnect: () =>
        disconnectMessenger.mutate(account.pageId, {
          onError: (err) => reportError(err, 'Could not disconnect Messenger.'),
        }),
    })
  })
  if (mgAccounts.length === 0) {
    available.push({
      id: 'add_messenger',
      channel: 'messenger',
      title: 'Messenger',
      description:
        'Connect Facebook Messenger for page inbox, automated replies, and unified customer conversations. Requires Instagram to be connected first.',
      ...gateLabel(messengerBlocked),
    })
  }

  if (facebook.data?.connected) {
    const fb = facebook.data
    connectedEntries.push({
      integration: {
        id: 'facebook',
        channel: 'facebook',
        channelLabel: CHANNEL_LABEL.facebook,
        title: fb.page.name,
        subtitle: fb.page.category || 'Facebook Page',
        health: fb.tokenValid === false ? 'error' : 'live',
      },
      onDisconnect: () =>
        disconnectFacebook.mutate(undefined, {
          onError: (err) => reportError(err, 'Could not disconnect Facebook Page.'),
        }),
    })
  } else {
    available.push({
      id: 'add_facebook',
      channel: 'facebook',
      title: 'Facebook Page',
      description: 'Connect a Facebook Page so Social Listening can triage and auto-reply to comments.',
    })
  }

  tgAccounts.forEach((account) => {
    connectedEntries.push({
      integration: {
        id: `telegram_${account.id}`,
        channel: 'telegram',
        channelLabel: CHANNEL_LABEL.telegram,
        title: account.botName || account.label,
        subtitle: account.botUsername ? `@${account.botUsername}` : account.label,
        health: 'live',
      },
      onDisconnect: () =>
        disconnectTelegram.mutate(account.botId, {
          onError: (err) => reportError(err, 'Could not disconnect this Telegram bot.'),
        }),
    })
  })
  if (tgAccounts.length === 0) {
    available.push({
      id: 'add_telegram',
      channel: 'telegram',
      title: 'Telegram',
      description: 'Connect a Telegram bot for inbox messaging, automated replies, and AI-powered support.',
    })
  }

  if (email.data?.enabled) {
    const em = email.data
    connectedEntries.push({
      integration: {
        id: 'email',
        channel: 'email',
        channelLabel: CHANNEL_LABEL.email,
        title: 'Email',
        subtitle: em.defaultSenderEmail || em.activeDomain || 'Configured',
        detail:
          em.verifiedDomainCount > 0
            ? `${em.verifiedDomainCount} verified domain${em.verifiedDomainCount === 1 ? '' : 's'}`
            : em.providerLabel
              ? `Via ${em.providerLabel.replace(/_/g, ' ')}`
              : undefined,
        health: 'live',
      },
      onManage: () => setManageView('email'),
      onDisconnect: () =>
        disableEmail.mutate(undefined, {
          onError: (err) => reportError(err, 'Could not disable email.'),
        }),
    })
  } else {
    available.push({
      id: 'add_email',
      channel: 'email',
      title: 'Email',
      description:
        'Send notifications and campaigns from your own domain, or use a shared ConvoSync sender to start.',
      ...gateLabel(emailBlocked),
    })
  }

  const calling: AvailableIntegration[] = []
  if (ownedNumbers.length > 0) {
    const primary = ownedNumbers[0]
    connectedEntries.push({
      integration: {
        id: 'virtual_number',
        channel: 'virtual_number',
        channelLabel: CHANNEL_LABEL.virtual_number,
        title: 'Virtual Number',
        subtitle: primary.label || primary.number || '',
        detail:
          ownedNumbers.length > 1
            ? `+${ownedNumbers.length - 1} more number${ownedNumbers.length > 2 ? 's' : ''}`
            : (primary.city ?? undefined),
        health: 'live',
      },
      onManage: () => navigate('/integrations/virtual-number'),
      onDisconnect: () =>
        window.alert('To release a number, open its Settings from the Calls tab — it stops billing on the carrier too.'),
    })
  } else if (virtualNumber) {
    calling.push({
      id: 'virtual_number',
      channel: 'virtual_number',
      title: 'Virtual Number',
      description:
        'Get a phone number for your team to call from — routed through an AI agent or Journey, with recordings and transcripts.',
      connectLabel:
        virtualNumber.stage === 'pending_approval'
          ? 'Requested'
          : virtualNumber.stage === 'rejected'
            ? 'Rejected'
            : virtualNumber.stage === 'not_requested'
              ? 'Request access'
              : 'Choose number',
    })
  }

  const aiAutomation: AvailableIntegration[] = [
    {
      id: 'ai_provider',
      channel: 'ai_provider',
      title: 'AI Provider',
      description: 'Use managed AI or connect your own API key for agents and automations.',
      connectLabel: 'Manage',
    },
    {
      id: 'whatsapp_flow',
      channel: 'whatsapp_flow',
      title: 'WhatsApp Flow',
      description: 'Send interactive multi-screen forms inside WhatsApp — booking, surveys, lead capture.',
      connectLabel: whatsappFlow.data?.enabled
        ? 'Enabled'
        : whatsappFlow.data?.requestedAt
          ? 'Requested'
          : 'Request access',
      disabled: whatsappFlow.data?.enabled || Boolean(whatsappFlow.data?.requestedAt),
    },
    {
      id: 'meta_ads',
      channel: 'meta_ads',
      title: metaAds.data?.connected ? metaAds.data.account.name : 'Meta Ads',
      description: metaAds.data?.connected
        ? `${metaAds.data.account.currency} · ${metaAds.data.account.status}`
        : 'Connect Meta Ads to track click-to-WhatsApp campaigns and attribute leads automatically.',
      connectLabel: metaAds.data?.connected ? 'Manage' : 'Connect',
    },
    {
      id: 'google',
      channel: 'google',
      title:
        google.data && google.data.connections.length > 0
          ? google.data.connections[0].displayName || google.data.connections[0].email
          : 'Google',
      description:
        google.data && google.data.connections.length > 0
          ? google.data.connections[0].email
          : 'Connect Google for Business Profile sync, Gmail, Calendar, Sheets, and Drive.',
      connectLabel: google.data && google.data.connections.length > 0 ? 'Manage' : 'Connect',
    },
  ]

  const handleAiAutomationConnect = (item: AvailableIntegration) => {
    if (item.channel === 'ai_provider') {
      setAiProviderSheetOpen(true)
      return
    }
    if (item.channel === 'whatsapp_flow') {
      if (item.disabled) return
      requestWhatsAppFlow.mutate(undefined, {
        onError: (err) => reportError(err, 'Could not request access.'),
      })
      return
    }
    if (item.channel === 'meta_ads') {
      setManageView('meta-ads')
      return
    }
    if (item.channel === 'google') setManageView('google')
  }

  const connectChannel = (item: AvailableIntegration) => {
    if (item.disabled) {
      window.location.assign(pathForSettingsSection('subscription'))
      return
    }
    if (item.channel === 'whatsapp') {
      setManageView('whatsapp')
      return
    }
    if (item.channel === 'whatsapp_coexistence') {
      setManageView('whatsapp-coexistence')
      return
    }
    if (item.channel === 'instagram') {
      setInstagramSheetOpen(true)
      return
    }
    if (item.channel === 'facebook') {
      startFacebookConnect().catch((err) => reportError(err, 'Could not start Facebook connect.'))
      return
    }
    if (item.channel === 'messenger') {
      connectMessenger.mutate(undefined, {
        onError: (err) => reportError(err, 'Could not connect Messenger.'),
      })
      return
    }
    if (item.channel === 'telegram') {
      setTelegramSheetOpen(true)
      return
    }
    if (item.channel === 'email') {
      enableEmail.mutate(undefined, {
        onError: (err) => reportError(err, 'Could not enable email.'),
      })
    }
  }

  const disconnectChannel = async (entry: ConnectedEntry) => {
    const ok = await confirm({
      title: `Disconnect ${entry.integration.title}?`,
      description: `This disconnects ${entry.integration.channelLabel} from ConvoSync.`,
      confirmLabel: 'Disconnect',
      destructive: true,
    })
    if (ok) entry.onDisconnect()
  }

  if (manageView) {
    return (
      <div className="p-6">
        <IntegrationsManageView
          view={manageView}
          whatsappConnected={Boolean(whatsapp.data?.connected)}
          coexistenceConnected={coexistenceConnected}
          onBack={() => setManageView(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <PlanGateBanner message={planBanner} />

      {connectedEntries.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold">Connected channels</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {connectedEntries.map((entry) => (
              <ConnectedIntegrationCard
                key={entry.integration.id}
                integration={entry.integration}
                onSync={entry.onSync}
                onManage={entry.onManage}
                onDisconnect={() => void disconnectChannel(entry)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {available.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold">Add a channel</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((item) => (
              <AvailableIntegrationCard
                key={item.id}
                integration={item}
                onConnect={() => connectChannel(item)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {calling.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold">Calling</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {calling.map((item) => (
              <AvailableIntegrationCard
                key={item.id}
                integration={item}
                onConnect={() => navigate('/integrations/virtual-number')}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="mb-3 text-sm font-semibold">AI &amp; automation</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiAutomation.map((item) => (
            <AvailableIntegrationCard
              key={item.id}
              integration={item}
              onConnect={() => handleAiAutomationConnect(item)}
            />
          ))}
        </div>
      </section>

      <IntegrationsHubOverlays
        telegramOpen={telegramSheetOpen}
        onTelegramOpenChange={setTelegramSheetOpen}
        aiOpen={aiProviderSheetOpen}
        onAiOpenChange={setAiProviderSheetOpen}
        instagramOpen={instagramSheetOpen}
        onInstagramOpenChange={setInstagramSheetOpen}
        instagramBlocked={instagramBlocked}
        reconnectOpen={!reconnectDismissed}
        reconnectAlerts={reconnectAlerts}
        onReconnect={(alert) => {
          setReconnectDismissed(true)
          if (snoozeRef.current) window.clearTimeout(snoozeRef.current)
          if (alert.channelLabel === 'Instagram') {
            startInstagramConnect().catch((err) => reportError(err, 'Could not start Instagram connect.'))
          }
        }}
        onDismissReconnect={snoozeReconnect}
      />
    </div>
  )
}
