import { FileText, Image as ImageIcon, Music, Video } from 'lucide-react'

import type { MediaType } from '@/services/realMediaGallery.service'

type Visual = {
  icon: React.ComponentType<{ className?: string }>
  bg: string
  text: string
}

export const MEDIA_VISUAL: Record<MediaType, Visual> = {
  image: { icon: ImageIcon, bg: 'bg-[#e6f7ec]', text: 'text-channel-green' },
  pdf: { icon: FileText, bg: 'bg-[#fdeceb]', text: 'text-[#e05d4c]' },
  video: { icon: Video, bg: 'bg-[#e8f4ff]', text: 'text-channel-blue' },
  audio: { icon: Music, bg: 'bg-violet-50', text: 'text-violet-600' },
  document: { icon: FileText, bg: 'bg-amber-50', text: 'text-amber-600' },
}

export function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exp
  return `${exp === 0 ? value : value.toFixed(1)} ${units[exp]}`
}
