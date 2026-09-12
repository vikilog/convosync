import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialogProvider } from '@/components/common/ConfirmDialogProvider'
import { ConversationList } from '@/components/inbox/ConversationList'
import type { Conversation } from '@/services/realInbox.service'

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

vi.mock('@/services/realInbox.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/realInbox.service')>()
  return {
    ...actual,
    realInboxService: {
      ...actual.realInboxService,
      useSetFavorite: () => ({ mutate: vi.fn() }),
    },
  }
})

function conv(i: number): Conversation {
  return {
    id: `c${i}`,
    status: 'open',
    channel: 'whatsapp',
    channelAccountId: null,
    contactId: `p${i}`,
    contact: {
      id: `p${i}`,
      name: `Contact ${i}`,
      phone: `90000000${String(i).padStart(2, '0')}`,
      email: null,
      avatar: null,
      tags: [],
      automationsPaused: false,
    },
    assignedTo: null,
    assigneeType: null,
    assigneeId: null,
    agent: null,
    lastMessage: `msg ${i}`,
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    isFavorite: false,
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const listProps = {
  selectedId: null as string | null,
  onSelect: () => {},
  connectedChannels: ['whatsapp' as const],
  channelFilter: 'whatsapp' as const,
  onChannelFilterChange: () => {},
  instagramConnected: false,
  messengerConnected: false,
  instagramSyncing: false,
  instagramSyncHint: '',
  instagramHasMore: false,
  onSyncInstagram: () => {},
  messengerSyncing: false,
  onSyncMessenger: () => {},
}

describe('ConversationList virtualization', () => {
  it('renders visible rows without mounting every conversation', async () => {
    const conversations = Array.from({ length: 80 }, (_, i) => conv(i))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <ConfirmDialogProvider>
          <div className="flex h-[400px] flex-col">
            <ConversationList conversations={conversations} {...listProps} />
          </div>
        </ConfirmDialogProvider>
      </QueryClientProvider>
    )

    expect(await screen.findByText('Contact 0')).toBeInTheDocument()
    expect(screen.queryByText('Contact 79')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-index]').length).toBeLessThan(80)
  })
})
