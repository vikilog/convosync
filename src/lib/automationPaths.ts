import type { AutomationChannel } from '@/services/realAutomations.service'

export function pathForAutomationList(): string {
  return '/automations'
}

export function pathForAutomationGallery(): string {
  return '/automations/whatsapp-automation/gallery'
}

export function pathForAutomation(id: string, channel: AutomationChannel): string {
  return channel === 'instagram'
    ? `/automations/instagram-automation/${id}`
    : `/automations/whatsapp-automation/${id}`
}

export function channelFromAutomationPath(pathname: string): AutomationChannel | null {
  if (pathname.includes('/instagram-automation/')) return 'instagram'
  if (pathname.includes('/whatsapp-automation/')) return 'whatsapp'
  return null
}

export function isAutomationGalleryPath(pathname: string): boolean {
  return pathname === pathForAutomationGallery() || pathname.endsWith('/whatsapp-automation/gallery')
}
