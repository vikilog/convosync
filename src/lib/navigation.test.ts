import { describe, expect, it } from 'vitest'

import {
  isContactsKeepAlivePath,
  isInboxPath,
  isSocialListeningPath,
  isTeamChatPath,
  labelForPath,
} from './navigation'

describe('keep-alive paths', () => {
  it('treats inbox and team chat as section roots', () => {
    expect(isInboxPath('/inbox')).toBe(true)
    expect(isInboxPath('/inbox/')).toBe(true)
    expect(isInboxPath('/dashboard')).toBe(false)
    expect(isTeamChatPath('/team-chat')).toBe(true)
    expect(isTeamChatPath('/team-chat/x')).toBe(true)
    expect(isTeamChatPath('/inbox')).toBe(false)
  })

  it('keeps contact detail on Outlet instead of the list slot', () => {
    expect(isContactsKeepAlivePath('/contacts')).toBe(true)
    expect(isContactsKeepAlivePath('/contacts/dashboard')).toBe(true)
    expect(isContactsKeepAlivePath('/contacts/list')).toBe(true)
    expect(isContactsKeepAlivePath('/contacts/abc')).toBe(false)
  })

  it('matches social listening list and media routes', () => {
    expect(isSocialListeningPath('/social-listening')).toBe(true)
    expect(isSocialListeningPath('/social-listening/media/1')).toBe(true)
    expect(isSocialListeningPath('/social-listening-x')).toBe(false)
  })

  it('labels standalone Instagram and Messenger routes', () => {
    expect(labelForPath('/instagram')).toBe('Instagram')
    expect(labelForPath('/messenger')).toBe('Messenger')
    expect(labelForPath('/integrations')).toBe('Integrations')
  })
})
