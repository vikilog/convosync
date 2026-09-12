export type WhatsAppLineAccount = {
  phoneNumberId: string
  phoneNumber?: string | null
  displayName?: string | null
  label?: string | null
}

export type NamedInboxAccount = {
  id: string
  matchIds?: string[]
  label: string
}

export function whatsappAccountLabel(acc: WhatsAppLineAccount): string {
  return acc.label || acc.displayName || acc.phoneNumber || acc.phoneNumberId
}

export function whatsappLineLabel(
  channel: string,
  channelAccountId: string | null | undefined,
  accounts: WhatsAppLineAccount[]
): string | null {
  if (channel !== 'whatsapp' || !channelAccountId) return null
  const account = accounts.find((a) => a.phoneNumberId === channelAccountId)
  return account ? whatsappAccountLabel(account) : null
}

export function namedAccountLabel(
  channelAccountId: string | null | undefined,
  accounts: NamedInboxAccount[]
): string | null {
  if (accounts.length === 0) return null
  if (channelAccountId) {
    const match = accounts.find(
      (a) => a.id === channelAccountId || a.matchIds?.includes(channelAccountId)
    )
    if (match) return match.label
  }
  return accounts.length === 1 ? accounts[0].label : null
}

export function inboxChannelLineLabel(input: {
  channel: string
  channelAccountId?: string | null
  handle?: string | null
  email?: string | null
  whatsappAccounts: WhatsAppLineAccount[]
  instagramAccounts: NamedInboxAccount[]
  messengerAccounts: NamedInboxAccount[]
  telegramAccounts: NamedInboxAccount[]
}): string | null {
  const { channel, channelAccountId } = input
  if (channel === 'whatsapp') {
    return (
      whatsappLineLabel(channel, channelAccountId, input.whatsappAccounts) ||
      (input.whatsappAccounts.length === 1 ? whatsappAccountLabel(input.whatsappAccounts[0]) : null)
    )
  }
  if (channel === 'instagram') {
    return namedAccountLabel(channelAccountId, input.instagramAccounts) || input.handle || null
  }
  if (channel === 'messenger') {
    return namedAccountLabel(channelAccountId, input.messengerAccounts)
  }
  if (channel === 'telegram') {
    return namedAccountLabel(channelAccountId, input.telegramAccounts) || input.handle || null
  }
  if (channel === 'email') {
    return input.email || input.handle || null
  }
  return null
}

export function shouldShowWhatsAppLine(accounts: WhatsAppLineAccount[]): boolean {
  return accounts.length > 1
}

export function windowAccountLabel(input: {
  channel: string
  channelAccountId?: string | null
  instagramAccounts: NamedInboxAccount[]
  messengerAccounts: NamedInboxAccount[]
}): string | null {
  if (input.channel === 'instagram' && input.instagramAccounts.length > 1) {
    return namedAccountLabel(input.channelAccountId, input.instagramAccounts)
  }
  if (input.channel === 'messenger' && input.messengerAccounts.length > 1) {
    return namedAccountLabel(input.channelAccountId, input.messengerAccounts)
  }
  return null
}
