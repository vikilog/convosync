import { beforeEach, describe, expect, it } from 'vitest'

import { getNavUnread, getNavUnreadSnapshot, setNavUnread, sumUnreadForNav } from './navUnread'

describe('navUnread', () => {
  beforeEach(() => {
    setNavUnread('inboxUnread', 0)
    setNavUnread('teamChatUnread', 0)
  })

  it('tracks inbox and team chat totals independently', () => {
    setNavUnread('inboxUnread', 4)
    setNavUnread('teamChatUnread', 2)
    expect(getNavUnread('inboxUnread')).toBe(4)
    expect(getNavUnread('teamChatUnread')).toBe(2)
    expect(getNavUnreadSnapshot()).toEqual({ inboxUnread: 4, teamChatUnread: 2 })
  })

  it('floors negatives to zero', () => {
    setNavUnread('teamChatUnread', -3)
    expect(getNavUnread('teamChatUnread')).toBe(0)
  })

  it('sums unread excluding the open conversation', () => {
    expect(
      sumUnreadForNav(
        [
          { id: 'a', unreadCount: 2 },
          { id: 'b', unreadCount: 3 },
        ],
        'a'
      )
    ).toBe(3)
  })
})
