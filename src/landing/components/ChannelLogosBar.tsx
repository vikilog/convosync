/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageSquare, Instagram, Send, Mail } from 'lucide-react';
import { LandingSection, LandingSectionHeader } from './landing-ui';

export default function ChannelLogosBar() {
  const channels = [
    {
      name: 'WhatsApp',
      icon: <MessageSquare className="w-5 h-5 text-white" />,
      color: 'bg-channel-green',
    },
    {
      name: 'Instagram',
      icon: <Instagram className="w-5 h-5 text-white" />,
      color: 'bg-gradient-to-tr from-yellow-500 via-channel-pink to-purple-600',
    },
    {
      name: 'Messenger',
      icon: <span className="font-extrabold text-sm text-white">M</span>,
      color: 'bg-channel-blue',
    },
    {
      name: 'Telegram',
      icon: <Send className="w-5 h-5 text-white" />,
      color: 'bg-channel-sky',
    },
    {
      name: 'Email',
      icon: <Mail className="w-5 h-5 text-white" />,
      color: 'bg-gray-500',
    },
  ];

  return (
    <LandingSection id="channels" tone="white" className="py-14 sm:py-16">
      <LandingSectionHeader
        badge="Connected channels"
        title="Every channel your customers use"
        align="center"
        className="mb-10"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
        {channels.map((chan) => (
          <div
            key={chan.name}
            className="flex items-center gap-3 bg-white hover:bg-emerald-50/50 px-4 py-3 rounded-2xl w-full border border-gray-200/80 transition-colors duration-200 cursor-default group"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${chan.color}`}
            >
              {chan.icon}
            </div>
            <span className="text-sm font-semibold text-gray-800">{chan.name}</span>
          </div>
        ))}
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
        <span className="w-2 h-2 rounded-full bg-channel-green animate-pulse" aria-hidden />
        Live chat widget & SMS channels coming soon
      </p>
    </LandingSection>
  );
}
