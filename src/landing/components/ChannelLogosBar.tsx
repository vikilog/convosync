/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageSquare, Instagram, Send, Mail, Zap, MessageCircle } from 'lucide-react';

export default function ChannelLogosBar() {
  const channels = [
    {
      name: 'WhatsApp Business API',
      icon: <MessageSquare className="w-5 h-5 text-white" />,
      color: 'bg-channel-green shadow-channel-green/20'
    },
    {
      name: 'Instagram DM Integration',
      icon: <Instagram className="w-5 h-5 text-white" />,
      color: 'bg-gradient-to-tr from-yellow-500 via-channel-pink to-purple-600 shadow-channel-pink/20'
    },
    {
      name: 'Facebook Messenger',
      icon: <span className="font-extrabold text-sm text-white">N</span>,
      color: 'bg-channel-blue shadow-channel-blue/20'
    },
    {
      name: 'Telegram Messenger',
      icon: <Send className="w-5 h-5 text-white" />,
      color: 'bg-channel-sky shadow-channel-sky/20'
    },
    {
      name: 'Unified Corporate Email',
      icon: <Mail className="w-5 h-5 text-white" />,
      color: 'bg-gray-500 shadow-gray-500/20'
    }
  ];

  return (
    <section id="channels" className="bg-white border-y border-gray-100 py-10 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
          Connect all the channels your customers love
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center justify-items-center">
          {channels.map((chan, idx) => (
            <div 
              key={idx} 
              className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100/80 px-4 py-3 rounded-2xl w-full max-w-[210px] justify-center border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer group"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${chan.color} transition-transform group-hover:scale-110`}>
                {chan.icon}
              </div>
              <span className="text-xs font-bold text-gray-700 truncate group-hover:text-brand-indigo transition-colors">{chan.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-gray-500 font-mono">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-indigo animate-ping" />
          <span>⚡ Live Chat widget Integration & SMS Channels coming very soon</span>
        </div>
      </div>
    </section>
  );
}
