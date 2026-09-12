import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  consumePendingOpenInboxConversation,
  dispatchInboxMessageNotification,
  dispatchOpenInboxConversation,
  fetchInboxUnreadTotal,
  INBOX_MESSAGE_NOTIFICATION_EVENT,
} from './inboxEvents'

vi.mock('@/lib/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
  },
}))

import { httpClient } from '@/lib/httpClient'

describe('inboxEvents', () => {
  beforeEach(() => {
    consumePendingOpenInboxConversation()
    vi.mocked(httpClient.get).mockReset()
  })

  it('keeps a pending open conversation across lazy mount', () => {
    dispatchOpenInboxConversation('')
    expect(consumePendingOpenInboxConversation()).toBe('')
    dispatchOpenInboxConversation('conv-z')
    expect(consumePendingOpenInboxConversation()).toBe('conv-z')
    expect(consumePendingOpenInboxConversation()).toBe('')
  })

  it('dispatches an external toast payload', () => {
    const seen: unknown[] = []
    const onToast = (event: Event) => seen.push((event as CustomEvent).detail)
    window.addEventListener(INBOX_MESSAGE_NOTIFICATION_EVENT, onToast)
    dispatchInboxMessageNotification({
      conversationId: 'c1',
      contactName: 'Ada',
      preview: 'Hello',
    })
    window.removeEventListener(INBOX_MESSAGE_NOTIFICATION_EVENT, onToast)
    expect(seen).toEqual([{ conversationId: 'c1', contactName: 'Ada', preview: 'Hello' }])
  })

  it('sums scoped unread and excludes the open conversation', async () => {
    vi.mocked(httpClient.get).mockResolvedValue([
      { id: 'a', unreadCount: 2, channel: 'whatsapp', channelAccountId: 'pn1' },
      { id: 'b', unreadCount: 3, channel: 'instagram', channelAccountId: 'ig1' },
    ])
    await expect(
      fetchInboxUnreadTotal('a', { mode: 'restricted', channels: ['whatsapp'] })
    ).resolves.toBe(0)
    await expect(fetchInboxUnreadTotal(null, { mode: 'all' })).resolves.toBe(5)
  })
})
