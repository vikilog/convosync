import { Megaphone, Phone, PhoneCall, Sparkles, Target } from 'lucide-react'

import { FacebookIcon, TelegramIcon, GoogleIcon } from '@/components/brand-icons'
import { ChannelIcon } from '@/components/channel-icon'
import type { IntegrationChannel } from '@/services/realIntegrations.service'

type Visual = {
  icon: React.ComponentType<{ className?: string }>
  bg: string
  text: string
}

export const INTEGRATION_VISUAL: Record<IntegrationChannel, Visual> = {
  whatsapp: {
    icon: (p) => <ChannelIcon channel="whatsapp" {...p} />,
    bg: 'bg-[#e6f7ec]',
    text: 'text-channel-green',
  },
  whatsapp_coexistence: { icon: Phone, bg: 'bg-[#e6f7ec]', text: 'text-channel-green' },
  instagram: {
    icon: (p) => <ChannelIcon channel="instagram" {...p} />,
    bg: 'bg-[#fce8f0]',
    text: 'text-[#C13584]',
  },
  messenger: {
    icon: (p) => <ChannelIcon channel="messenger" {...p} />,
    bg: 'bg-[#e8f4ff]',
    text: 'text-[#1877F2]',
  },
  facebook: { icon: FacebookIcon, bg: 'bg-[#e8f4ff]', text: 'text-[#1877F2]' },
  telegram: { icon: TelegramIcon, bg: 'bg-[#e8f6fd]', text: 'text-[#229ED9]' },
  email: {
    icon: (p) => <ChannelIcon channel="email" {...p} />,
    bg: 'bg-[#e8f4ff]',
    text: 'text-channel-blue',
  },
  ai_provider: { icon: Sparkles, bg: 'bg-violet-50', text: 'text-violet-600' },
  whatsapp_flow: { icon: Target, bg: 'bg-[#e6f7ec]', text: 'text-channel-green' },
  meta_ads: { icon: Megaphone, bg: 'bg-[#e8f4ff]', text: 'text-[#1877F2]' },
  google: { icon: GoogleIcon, bg: 'bg-amber-50', text: 'text-amber-600' },
  virtual_number: { icon: PhoneCall, bg: 'bg-orange-50', text: 'text-orange-600' },
}

export const CHANNEL_LABEL: Record<IntegrationChannel, string> = {
  whatsapp: 'WhatsApp',
  whatsapp_coexistence: 'WhatsApp Coexistence',
  instagram: 'Instagram',
  messenger: 'Messenger',
  facebook: 'Facebook Page',
  telegram: 'Telegram',
  email: 'Email',
  ai_provider: 'AI Provider',
  whatsapp_flow: 'WhatsApp Flow',
  meta_ads: 'Meta Ads',
  google: 'Google',
  virtual_number: 'Virtual Number',
}
