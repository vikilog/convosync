import { describe, expect, it } from 'vitest'

import type { TeamChatMessage, TeamChatPeer } from '@/services/realTeamChat.service'

import {
  appendTeamChatMessage,
  applyTeamChatMessageToPeers,
  applyTeamPresenceToPeers,
  peerIdForMessage,
  previewBody,
  sortTeamChatPeers,
} from './teamChatCache'

const msg = (over: Partial<TeamChatMessage> = {}): TeamChatMessage => ({
  id: 'm1',
  body: 'hello',
  createdAt: '2026-09-08T12:00:00.000Z',
  recipientUserId: 'me',
  sender: { id: 'peer-a', name: 'Ada', avatar: null },
  ...over,
})

const peer = (over: Partial<TeamChatPeer> = {}): TeamChatPeer => ({
  userId: 'peer-a',
  name: 'Ada',
  avatar: null,
  online: false,
  lastMessage: null,
  ...over,
})

describe('teamChatCache', () => {
  it('resolves the peer id from sender vs self', () => {
    expect(peerIdForMessage(msg(), 'me')).toBe('peer-a')
    expect(
      peerIdForMessage(msg({ sender: { id: 'me', name: 'Me', avatar: null }, recipientUserId: 'peer-a' }), 'me')
    ).toBe('peer-a')
  })

  it('updates preview, re-sorts, and presence dots', () => {
    const incoming = msg({ id: 'm2', createdAt: '2026-09-08T13:00:00.000Z', body: 'later' })
    const peers = applyTeamChatMessageToPeers(
      [
        peer({ userId: 'peer-b', name: 'Bea', lastMessage: { id: 'old', body: 'x', createdAt: '2026-09-08T10:00:00.000Z', senderUserId: 'peer-b' } }),
        peer(),
      ],
      incoming,
      'me'
    )
    expect(peers[0].userId).toBe('peer-a')
    expect(peers[0].lastMessage?.body).toBe('later')

    const withDots = applyTeamPresenceToPeers(peers, [{ userId: 'peer-b' }])
    expect(withDots.find((p) => p.userId === 'peer-b')?.online).toBe(true)
    expect(withDots.find((p) => p.userId === 'peer-a')?.online).toBe(false)
  })

  it('appends once and replaces matching optimistic rows', () => {
    const real = msg({ id: 'real-1', body: 'hi' })
    const optimistic = msg({ id: 'optimistic:1', body: 'hi', sender: real.sender })
    expect(appendTeamChatMessage([optimistic], real).map((m) => m.id)).toEqual(['real-1'])
    expect(appendTeamChatMessage([real], real)).toEqual([real])
  })

  it('sorts peers with no last message last, then by name', () => {
    const sorted = sortTeamChatPeers([
      peer({ userId: 'z', name: 'Zed' }),
      peer({ userId: 'a', name: 'Ann' }),
    ])
    expect(sorted.map((p) => p.name)).toEqual(['Ann', 'Zed'])
  })

  it('truncates preview text', () => {
    expect(previewBody('short')).toBe('short')
    expect(previewBody('x'.repeat(50)).endsWith('…')).toBe(true)
  })
})
