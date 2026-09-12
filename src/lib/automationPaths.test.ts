import { describe, expect, it } from 'vitest'

import {
  channelFromAutomationPath,
  isAutomationGalleryPath,
  pathForAutomation,
  pathForAutomationGallery,
  pathForAutomationList,
} from './automationPaths'

describe('automationPaths', () => {
  it('builds deep WA / IG / gallery routes', () => {
    expect(pathForAutomationList()).toBe('/automations')
    expect(pathForAutomationGallery()).toBe('/automations/whatsapp-automation/gallery')
    expect(pathForAutomation('j1', 'whatsapp')).toBe('/automations/whatsapp-automation/j1')
    expect(pathForAutomation('j2', 'instagram')).toBe('/automations/instagram-automation/j2')
  })

  it('reads channel and gallery from the pathname', () => {
    expect(channelFromAutomationPath('/automations/whatsapp-automation/abc')).toBe('whatsapp')
    expect(channelFromAutomationPath('/automations/instagram-automation/abc')).toBe('instagram')
    expect(channelFromAutomationPath('/automations/abc')).toBeNull()
    expect(isAutomationGalleryPath('/automations/whatsapp-automation/gallery')).toBe(true)
    expect(isAutomationGalleryPath('/automations/j1')).toBe(false)
  })
})
