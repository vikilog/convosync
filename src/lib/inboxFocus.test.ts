import { beforeEach, describe, expect, it } from 'vitest'

import {
  getViewingInboxConversationId,
  isViewingInboxConversation,
  setActiveInboxConversationId,
  setInboxVisible,
} from './inboxFocus'

describe('inboxFocus', () => {
  beforeEach(() => {
    setInboxVisible(false)
    setActiveInboxConversationId('')
  })

  it('ignores selection when Inbox is hidden', () => {
    setInboxVisible(true)
    setActiveInboxConversationId('conv-a')
    expect(getViewingInboxConversationId()).toBe('conv-a')
    expect(isViewingInboxConversation('conv-a')).toBe(true)
    expect(isViewingInboxConversation('conv-b')).toBe(false)

    setInboxVisible(false)
    expect(getViewingInboxConversationId()).toBe('')
    expect(isViewingInboxConversation('conv-a')).toBe(false)

    setInboxVisible(true)
    expect(isViewingInboxConversation('conv-a')).toBe(true)
  })
})
