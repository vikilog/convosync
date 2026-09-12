import { describe, expect, it } from 'vitest'

import {
  DEFAULT_AGENT_PERMISSIONS,
  hasWorkspacePermission,
  settingsSectionPermission,
} from './workspacePermissions'

describe('hasWorkspacePermission', () => {
  it('grants admins every module', () => {
    expect(hasWorkspacePermission([], 'billing', 'admin')).toBe(true)
  })

  it('falls back to default agent modules', () => {
    expect(hasWorkspacePermission([], 'inbox', 'agent')).toBe(true)
    expect(hasWorkspacePermission([], 'billing', 'agent')).toBe(false)
    expect(DEFAULT_AGENT_PERMISSIONS).toEqual(['inbox', 'contacts'])
  })
})

describe('settingsSectionPermission', () => {
  it('leaves profile ungated and maps billing / users / AI', () => {
    expect(settingsSectionPermission('profile')).toBeNull()
    expect(settingsSectionPermission('users')).toBe('users')
    expect(settingsSectionPermission('wallet')).toBe('billing')
    expect(settingsSectionPermission('web-widget')).toBe('ai')
    expect(settingsSectionPermission('ai-provider')).toBe('ai')
    expect(settingsSectionPermission('canned-response')).toBe('inbox')
    expect(settingsSectionPermission('company-info')).toBe('settings')
  })
})
