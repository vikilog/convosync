import { beforeEach, describe, expect, it } from 'vitest'

import { getNavUnread } from './navUnread'
import {
  clearTeamChatUnread,
  consumePendingOpenTeamChatPeer,
  dispatchOpenTeamChatPeer,
  getTeamChatUnreadForPeer,
  getTeamChatUnreadTotal,
  incrementTeamChatUnread,
} from './teamChatEvents'

describe('teamChatEvents', () => {
  beforeEach(() => {
    clearTeamChatUnread('p1')
    clearTeamChatUnread('p2')
  })

  it('increments, totals, and clears per peer', () => {
    incrementTeamChatUnread('')
    incrementTeamChatUnread('p1')
    incrementTeamChatUnread('p1')
    incrementTeamChatUnread('p2')
    expect(getTeamChatUnreadForPeer('p1')).toBe(2)
    expect(getTeamChatUnreadForPeer('p2')).toBe(1)
    expect(getTeamChatUnreadTotal()).toBe(3)
    expect(getNavUnread('teamChatUnread')).toBe(3)
    clearTeamChatUnread('p1')
    expect(getTeamChatUnreadForPeer('p1')).toBe(0)
    expect(getTeamChatUnreadTotal()).toBe(1)
    expect(getNavUnread('teamChatUnread')).toBe(1)
  })

  it('keeps a pending open peer across lazy mount', () => {
    dispatchOpenTeamChatPeer('peer-z')
    expect(consumePendingOpenTeamChatPeer()).toBe('peer-z')
    expect(consumePendingOpenTeamChatPeer()).toBe('')
  })
})
