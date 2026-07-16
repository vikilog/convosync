/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type ReactNode } from 'react';
import {
  Check,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../brand';
import { LandingCard, LandingSection, LandingSectionHeader } from './landing-ui';

interface ChannelNode {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  icon: ReactNode;
  desc: string;
  apiType: string;
}

export default function SolutionDiagram() {
  const [activeNode, setActiveNode] = useState<string>('wa');

  const nodes: Record<string, ChannelNode> = {
    wa: {
      id: 'wa',
      name: 'WhatsApp Business API',
      color: 'text-channel-green bg-emerald-50 border-emerald-200',
      borderColor: 'border-channel-green',
      desc: 'Official Meta Cloud API — templates, broadcasts, interactive buttons, and catalog nodes.',
      apiType: 'Meta Cloud API',
      icon: <MessageSquare className="w-6 h-6" />,
    },
    ig: {
      id: 'ig',
      name: 'Instagram DM',
      color: 'text-channel-pink bg-pink-50 border-pink-200',
      borderColor: 'border-channel-pink',
      desc: 'Connect Instagram Business inbox — story mentions, comment-to-DM, and lead flows.',
      apiType: 'Meta Graph API',
      icon: <Instagram className="w-6 h-6" />,
    },
    fb: {
      id: 'fb',
      name: 'Facebook Messenger',
      color: 'text-channel-blue bg-blue-50 border-blue-200',
      borderColor: 'border-channel-blue',
      desc: 'Page messages and comments routed to your team queues in real time.',
      apiType: 'Meta Messenger API',
      icon: <span className="font-extrabold text-lg">M</span>,
    },
    tg: {
      id: 'tg',
      name: 'Telegram',
      color: 'text-channel-sky bg-sky-50 border-sky-200',
      borderColor: 'border-channel-sky',
      desc: 'Bot-powered community and support channels with AI moderation.',
      apiType: 'Telegram Bot API',
      icon: <Send className="w-6 h-6" />,
    },
    em: {
      id: 'em',
      name: 'Corporate Email',
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      borderColor: 'border-gray-400',
      desc: 'Gmail and Outlook via OAuth — customer emails land in the same inbox.',
      apiType: 'OAuth / IMAP',
      icon: <Mail className="w-6 h-6" />,
    },
    lc: {
      id: 'lc',
      name: 'Live chat widget',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      borderColor: 'border-emerald-400',
      desc: 'Embeddable web widget — hand off to WhatsApp when visitors go offline.',
      apiType: 'Web SDK',
      icon: <MessageCircle className="w-6 h-6" />,
    },
  };

  const selectedNode = nodes[activeNode];
  const orbitNodes = ['wa', 'ig', 'fb', 'tg', 'em', 'lc'] as const;
  const positions = [
    'top-2 left-1/2 -translate-x-1/2',
    'top-1/4 right-2',
    'bottom-1/4 right-2',
    'bottom-2 left-1/2 -translate-x-1/2',
    'bottom-1/4 left-2',
    'top-1/4 left-2',
  ];

  return (
    <LandingSection id="solution" tone="grid">
      <LandingSectionHeader
        badge="The architecture"
        title="One command center"
        titleAccent={`for every channel.`}
        description={`${PRODUCT_NAME} unifies WhatsApp, Instagram, Telegram, Messenger, email, and live chat — backed by AI agents.`}
      />

      <div className="flex flex-col lg:flex-row items-center gap-12 justify-center mb-14">
        <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] flex items-center justify-center rounded-full border border-dashed border-emerald-300/50 bg-white/60 p-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-emerald-200 shadow-lg shadow-emerald-600/10 flex items-center justify-center z-20">
            <img src={PRODUCT_LOGO} alt={PRODUCT_NAME} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            <circle cx="50%" cy="50%" r="38%" stroke="#d1fae5" strokeWidth="1.5" fill="none" strokeDasharray="6,6" />
          </svg>

          {orbitNodes.map((id, i) => {
            const node = nodes[id];
            const active = activeNode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveNode(id)}
                className={`absolute ${positions[i]} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 bg-white flex items-center justify-center transition-all cursor-pointer z-10 ${
                  active ? `${node.borderColor} shadow-md scale-110` : 'border-gray-200 hover:border-emerald-200'
                } ${node.color.split(' ')[0]}`}
              >
                {node.icon}
              </button>
            );
          })}
        </div>

        <LandingCard className="w-full max-w-md p-6 sm:p-8">
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wide inline-block border border-emerald-100">
            Connected channel
          </span>
          <h3 className="text-xl font-bold text-gray-950 mt-4 flex items-center gap-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${selectedNode.color}`}>
              {selectedNode.icon}
            </span>
            {selectedNode.name}
          </h3>
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">{selectedNode.desc}</p>
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-channel-green" aria-hidden />
              SSL encrypted
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin [animation-duration:12s]" aria-hidden />
              Real-time sync
            </div>
            <div className="col-span-2 bg-gray-50 rounded-lg p-2.5 border border-gray-100 flex justify-between items-center">
              <span>Integration</span>
              <span className="font-semibold text-emerald-700">{selectedNode.apiType}</span>
            </div>
          </div>
        </LandingCard>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto border-t border-gray-200/80 pt-10">
        {['All messages in one inbox', 'AI agents on every channel', 'One team. Zero missed chats.'].map(
          (label) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-white px-5 py-3 rounded-full border border-gray-200/80 text-sm font-medium text-gray-700"
            >
              <Check className="w-4 h-4 text-channel-green" aria-hidden />
              {label}
            </div>
          )
        )}
      </div>
    </LandingSection>
  );
}
