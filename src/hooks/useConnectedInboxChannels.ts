import type { NamedInboxAccount, WhatsAppLineAccount } from '@/lib/inboxLineLabels'
import { allowedAccountIds, FULL_INBOX_SCOPE, type InboxScope } from '@/lib/inboxScope'
import type { InboxChannel } from '@/services/realInbox.service'
import { realIntegrationsService } from '@/services/realIntegrations.service'

const CHANNEL_ORDER: InboxChannel[] = ['whatsapp', 'instagram', 'messenger', 'telegram', 'email']

export function useConnectedInboxChannels(scope: InboxScope = FULL_INBOX_SCOPE) {
  const whatsapp = realIntegrationsService.useWhatsAppStatus()
  const instagram = realIntegrationsService.useInstagramAccounts()
  const messenger = realIntegrationsService.useMessengerAccounts()
  const telegram = realIntegrationsService.useTelegramAccounts()
  const email = realIntegrationsService.useEmailIntegration()

  const waAllowed = allowedAccountIds('whatsapp', scope)
  const igAllowed = allowedAccountIds('instagram', scope)
  const msAllowed = allowedAccountIds('messenger', scope)
  const tgAllowed = allowedAccountIds('telegram', scope)

  const whatsappAccounts: WhatsAppLineAccount[] = (whatsapp.data?.accounts ?? [])
    .filter((a) => waAllowed === 'all' || (waAllowed && waAllowed.includes(a.phoneNumberId)))
    .map((a) => ({
      phoneNumberId: a.phoneNumberId,
      phoneNumber: a.phoneNumber,
      displayName: a.displayName,
      label: a.label,
    }))

  const instagramAccounts: NamedInboxAccount[] = (instagram.data?.accounts ?? [])
    .filter((a) => igAllowed === 'all' || (igAllowed && igAllowed.includes(a.instagramUserId)))
    .map((a) => ({
      id: a.instagramUserId,
      matchIds: [a.instagramUserId, a.id],
      label: a.label || (a.username ? `@${a.username}` : a.displayName || 'Instagram'),
    }))

  const messengerAccounts: NamedInboxAccount[] = (messenger.data?.accounts ?? [])
    .filter((a) => msAllowed === 'all' || (msAllowed && msAllowed.includes(a.pageId)))
    .map((a) => ({
      id: a.pageId,
      matchIds: [a.pageId, a.id],
      label: a.label || a.displayName || a.pageName || 'Messenger',
    }))

  const telegramAccounts: NamedInboxAccount[] = (telegram.data?.accounts ?? [])
    .filter((a) => tgAllowed === 'all' || (tgAllowed && tgAllowed.includes(a.botId)))
    .map((a) => ({
      id: a.botId,
      matchIds: [a.botId, a.id],
      label: a.label || (a.botUsername ? `@${a.botUsername}` : a.botName || 'Telegram'),
    }))

  const emailReady = Boolean(
    email.data?.enabled && (email.data.verifiedDomainCount > 0 || email.data.defaultSenderEmail)
  )

  const connected: InboxChannel[] = []
  if (whatsappAccounts.length > 0 || (whatsapp.data?.connected && waAllowed === 'all')) {
    connected.push('whatsapp')
  }
  if (instagramAccounts.length > 0) connected.push('instagram')
  if (messengerAccounts.length > 0) connected.push('messenger')
  if (telegramAccounts.length > 0) connected.push('telegram')
  if (emailReady && (scope.mode === 'all' || allowedAccountIds('email', scope))) {
    connected.push('email')
  }

  const isLoading =
    whatsapp.isLoading || instagram.isLoading || messenger.isLoading || telegram.isLoading || email.isLoading

  return {
    connected: CHANNEL_ORDER.filter((ch) => connected.includes(ch)),
    isLoading,
    emailReady,
    instagramConnected: instagramAccounts.length > 0,
    messengerConnected: messengerAccounts.length > 0,
    whatsappAccounts,
    instagramAccounts,
    messengerAccounts,
    telegramAccounts,
  }
}
