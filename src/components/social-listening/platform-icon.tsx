import { FacebookIcon } from '@/components/brand-icons'
import { ChannelIcon } from '@/components/channel-icon'
import type { Platform } from '@/lib/socialListening'

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
}

export const PLATFORM_COLOR_CLASS: Record<Platform, string> = {
  instagram: 'bg-[#fce8f0] text-[#C13584]',
  facebook: 'bg-[#e8f1fd] text-[#1877F2]',
}

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  if (platform === 'facebook') return <FacebookIcon className={className} />
  return <ChannelIcon channel="instagram" className={className} />
}
