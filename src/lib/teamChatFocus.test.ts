import { describe, expect, it } from 'vitest'

import {
  getViewingTeamChatPeerId,
  isViewingTeamChatPeer,
  setActiveTeamChatPeerId,
  setTeamChatVisible,
} from './teamChatFocus'

describe('teamChatFocus', () => {
  it('only treats a peer as viewing when Team Chat is visible', () => {
    setTeamChatVisible(true)
    setActiveTeamChatPeerId('user-a')
    expect(getViewingTeamChatPeerId()).toBe('user-a')
    expect(isViewingTeamChatPeer('user-a')).toBe(true)
    expect(isViewingTeamChatPeer('user-b')).toBe(false)

    setTeamChatVisible(false)
    expect(getViewingTeamChatPeerId()).toBe('')
    expect(isViewingTeamChatPeer('user-a')).toBe(false)

    setTeamChatVisible(true)
    expect(isViewingTeamChatPeer('user-a')).toBe(true)
  })
})
