/** Mirrors backend/src/lib/channelContact.ts — channel is implied by how the
 * contact's `phone` identity column is encoded, not a stored field. */
export type RealContactChannel = 'whatsapp' | 'instagram' | 'messenger' | 'telegram'

export function resolveContactChannel(phone: string): RealContactChannel {
  if (phone.startsWith('ig:')) return 'instagram'
  if (phone.startsWith('fb:')) return 'messenger'
  if (phone.startsWith('tg:')) return 'telegram'
  return 'whatsapp'
}

/** IG / Messenger / Telegram identities live in the phone column as prefixes. */
export function isSyntheticChannelPhone(phone: string): boolean {
  return phone.startsWith('ig:') || phone.startsWith('fb:') || phone.startsWith('tg:')
}

export function contactHandleLabel(phone: string): string {
  const channel = resolveContactChannel(phone)
  if (channel === 'instagram') {
    const id = phone.replace(/^ig:/, '')
    return /^\d+$/.test(id) ? id : `@${id}`
  }
  if (channel === 'messenger') return phone.replace(/^fb:/, '')
  if (channel === 'telegram') return phone.replace(/^tg:/, '')
  return phone
}

/** Instagram rows often store the @handle as the name — prefix it when missing. */
export function displayNameForChannel(name: string, phone: string): string {
  if (resolveContactChannel(phone) !== 'instagram') return name
  const cleaned = name.replace(/^@+/, '').trim()
  if (cleaned && !/^\d+$/.test(cleaned)) return `@${cleaned}`
  const fromPhone = phone.replace(/^ig:/, '')
  if (fromPhone && !/^\d+$/.test(fromPhone) && !fromPhone.startsWith('lead:')) {
    return `@${fromPhone}`
  }
  return name
}
