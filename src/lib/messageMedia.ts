export type MessageMedia = {
  mimeType?: string
  fileName?: string
  caption?: string
  storageKey?: string
  mediaUrl?: string
  latitude?: number
  longitude?: number
  locationName?: string
  locationAddress?: string
  items?: Array<{ mimeType?: string; fileName?: string; storageKey?: string }>
}

const DELETED_COPY = 'This message was deleted'

export function messageMediaFromMetadata(metadata: unknown): MessageMedia | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined
  const m = metadata as Record<string, unknown>
  const mediaUrl = m.mediaUrl || m.mediaLink
  const items = Array.isArray(m.items) ? m.items : []
  const hasMedia =
    m.storageKey ||
    m.waMediaId ||
    mediaUrl ||
    m.mimeType ||
    m.fileName ||
    m.latitude != null ||
    m.longitude != null ||
    items.length > 0
  if (!hasMedia) return undefined
  return {
    mimeType: m.mimeType ? String(m.mimeType) : undefined,
    fileName: m.fileName ? String(m.fileName) : undefined,
    caption: m.caption ? String(m.caption) : undefined,
    storageKey: m.storageKey ? String(m.storageKey) : undefined,
    mediaUrl: mediaUrl ? String(mediaUrl) : undefined,
    latitude: typeof m.latitude === 'number' ? m.latitude : undefined,
    longitude: typeof m.longitude === 'number' ? m.longitude : undefined,
    locationName: m.locationName ? String(m.locationName) : undefined,
    locationAddress: m.locationAddress ? String(m.locationAddress) : undefined,
    items: items.map((item) => {
      const row = item as Record<string, unknown>
      return {
        mimeType: row.mimeType ? String(row.mimeType) : undefined,
        fileName: row.fileName ? String(row.fileName) : undefined,
        storageKey: row.storageKey ? String(row.storageKey) : undefined,
      }
    }),
  }
}

export function isDeletedMessage(message: {
  content: string
  metadata: unknown
}): boolean {
  if (message.content === DELETED_COPY) return true
  if (!message.metadata || typeof message.metadata !== 'object') return false
  return (message.metadata as Record<string, unknown>).revoked === true
}

export function isRichMediaType(type: string): boolean {
  return (
    type === 'image' ||
    type === 'video' ||
    type === 'audio' ||
    type === 'document' ||
    type === 'sticker' ||
    type === 'location' ||
    type === 'carousel'
  )
}

type StatusPatch = { clicked?: boolean; deliveryError?: string }

function withStatusPatch<T extends { clicked?: boolean; deliveryError?: string }>(
  message: T,
  status: string,
  patch: StatusPatch
): T {
  return {
    ...message,
    status,
    ...(patch.clicked || message.clicked ? { clicked: true } : {}),
    ...(patch.deliveryError ? { deliveryError: patch.deliveryError } : {}),
  }
}

export function applyMessageStatus<
  T extends { id: string; sender: string; status: string; createdAt: string; clicked?: boolean; deliveryError?: string },
>(
  messages: T[],
  payload: { messageId: string; status: string; clicked?: boolean; deliveryError?: string }
): T[] {
  const { messageId, status, clicked, deliveryError } = payload
  const patch = { clicked, deliveryError }
  const anchor = messages.find((m) => m.id === messageId)
  if (!anchor) return messages
  if (status === 'read') {
    const cutoff = new Date(anchor.createdAt).getTime()
    return messages.map((m) => {
      if (m.sender === 'contact') return m
      if (m.id === messageId) return withStatusPatch(m, 'read', patch)
      if (m.status === 'read') return m
      if (new Date(m.createdAt).getTime() <= cutoff) return { ...m, status: 'read' }
      return m
    })
  }
  return messages.map((m) => (m.id === messageId ? withStatusPatch(m, status, patch) : m))
}
