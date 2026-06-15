/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode } from 'react';
import { 
  Check, MessageSquare, Instagram, Send, Mail, MessageCircle, 
  Sparkles, ShieldCheck, RefreshCw, Unlink
} from 'lucide-react';

interface ChannelNode {
  id: string;
  name: string;
  color: string;
  hoverBg: string;
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
      color: 'text-channel-green bg-channel-green/10 border-channel-green/30',
      hoverBg: 'hover:bg-channel-green/20 hover:border-channel-green/40',
      borderColor: 'border-channel-green',
      desc: 'Official Meta WhatsApp Business Cloud API sync. Send templates, broadcasts, interactive quick reply buttons, list responses, and catalog nodes directly to customers.',
      apiType: 'Official Meta Cloud API',
      icon: <MessageSquare className="w-6 h-6" />
    },
    ig: {
      id: 'ig',
      name: 'Instagram DM Professional',
      color: 'text-channel-pink bg-[#E1306C]/10 border-[#E1306C]/30',
      hoverBg: 'hover:bg-[#E1306C]/20 hover:border-[#E1306C]/40',
      borderColor: 'border-[#E1306C]',
      desc: 'Connect Instagram Business messenger directly. Hook comments into DMs, resolve Story Mentions automatically with coupon codes, and run high-volume lead qualifying runs.',
      apiType: 'Meta Graph API Messenger-v2',
      icon: <Instagram className="w-6 h-6" />
    },
    fb: {
      id: 'fb',
      name: 'Facebook Messenger Node',
      color: 'text-channel-blue bg-channel-blue/10 border-channel-blue/30',
      hoverBg: 'hover:bg-channel-blue/20 hover:border-channel-blue/40',
      borderColor: 'border-channel-blue',
      desc: 'Capture Facebook page check-ins, direct messages, and comments in real-time. Distribute chats across regional desks and support queues systematically.',
      apiType: 'Meta Developer Suite API',
      icon: <span className="font-extrabold text-lg">N</span>
    },
    tg: {
      id: 'tg',
      name: 'Telegram Bot Hub API',
      color: 'text-channel-sky bg-channel-sky/10 border-channel-sky/30',
      hoverBg: 'hover:bg-channel-sky/20 hover:border-channel-sky/40',
      borderColor: 'border-channel-sky',
      desc: 'Supercharge corporate Telegram channels and customer group channels via custom Telegram bots. Train AI Sara or Max to moderate and answer community product FAQs in real time.',
      apiType: 'Telegram Bot API Wrapper-v4',
      icon: <Send className="w-6 h-6" />
    },
    em: {
      id: 'em',
      name: 'Unified Corporate Email',
      color: 'text-gray-500 bg-gray-500/10 border-gray-500/30',
      hoverBg: 'hover:bg-gray-500/20 hover:border-gray-500/40',
      borderColor: 'border-gray-500',
      desc: 'Map your contact/support Gmail and Outlook mail accounts via secure OAuth connections. Incoming customer mail sequences transition straight into your central chatbot workspace.',
      apiType: 'IMAP / secure OAuth API',
      icon: <Mail className="w-6 h-6" />
    },
    lc: {
      id: 'lc',
      name: 'Custom Live Chat widget',
      color: 'text-brand-indigo bg-brand-indigo/10 border-brand-indigo/30',
      hoverBg: 'hover:bg-brand-indigo/20 hover:border-brand-indigo/40',
      borderColor: 'border-brand-indigo',
      desc: 'Our interactive web widget loads elegantly directly on your promotional page or catalog checkout point. Allows client chats to transfer straight to WhatsApp if they go offline.',
      apiType: 'Embeddable JS Web SDK',
      icon: <MessageCircle className="w-6 h-6" />
    }
  };

  const selectedNode = nodes[activeNode];

  return (
    <section id="solution" className="bg-[#FAF9FF] border-b border-gray-100 py-24 relative overflow-hidden text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-extrabold text-brand-indigo tracking-widest font-mono">
            THE ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-gray-900 mt-2">
            WaBiz: The Central Unified Command Center
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 font-sans">
            Unify WhatsApp, Instagram, Telegram, Messenger, Email & Live Chat systems directly into a singular cloud interface backed by intelligent, autonomous agents.
          </p>
        </div>

        {/* Large Central visual platform Diagram container */}
        <div className="flex flex-col lg:flex-row items-center gap-12 justify-center mb-16">
          
          {/* Diagram Stage (Left side for desktop) */}
          <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center bg-white/40 rounded-full border border-gray-100 shadow-inner p-10 select-none">
            
            {/* Center Nucleus: WaBiz */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-brand-indigo border-4 border-white shadow-xl shadow-brand-indigo/40 flex flex-col items-center justify-center text-white z-20 hover:scale-105 transition-transform cursor-pointer relative group">
              <span className="absolute -inset-2 bg-brand-indigo/10 rounded-full animate-ping -z-10 group-hover:animate-none" />
              <div className="font-extrabold font-display text-lg sm:text-xl drop-shadow-md">WaBiz</div>
              <div className="text-[9px] uppercase font-mono tracking-wider opacity-90">Central</div>
            </div>

            {/* Orbit paths - SVGs */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none -rotate-90">
              <circle cx="50%" cy="50%" r="35%" stroke="#EAE8F7" strokeWidth="2" fill="none" />
              <circle cx="50%" cy="50%" r="35%" stroke="#0284c7" strokeWidth="2" fill="none" strokeDasharray="8,8" className="animate-spin [animation-duration:90s]" />
            </svg>

            {/* Node 1: WhatsApp (Positioned at Top-Center: 0 deg) */}
            <button
              onClick={() => setActiveNode('wa')}
              className={`absolute top-2 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 bg-white flex items-center justify-center transition-all cursor-pointer z-10 ${
                activeNode === 'wa' ? `${nodes.wa.borderColor} shadow-lg shadow-channel-green/20 scale-110` : 'border-gray-100 shadow-sm hover:scale-105'
              } text-channel-green`}
            >
              <MessageSquare className="w-6 h-6" />
            </button>

            {/* Node 2: Instagram (Positioned at Top-Right: 60 deg) */}
            <button
              onClick={() => setActiveNode('ig')}
              className={`absolute top-1/4 right-2 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 bg-white flex items-center justify-center transition-all cursor-pointer z-10 ${
                activeNode === 'ig' ? `${nodes.ig.borderColor} shadow-lg shadow-channel-pink/20 scale-110` : 'border-gray-100 shadow-sm hover:scale-105'
              } text-channel-pink`}
            >
              <Instagram className="w-6 h-6" />
            </button>

            {/* Node 3: Messenger (Positioned at Bottom-Right: 120 deg) */}
            <button
              onClick={() => setActiveNode('fb')}
              className={`absolute bottom-1/4 right-2 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 bg-white flex items-center justify-center transition-all cursor-pointer z-10 ${
                activeNode === 'fb' ? `${nodes.fb.borderColor} shadow-lg shadow-channel-blue/20 scale-110` : 'border-gray-100 shadow-sm hover:scale-105'
              } text-channel-blue`}
            >
              <span className="font-extrabold text-base">fb</span>
            </button>

            {/* Node 4: Telegram (Positioned at Bottom-Center: 180 deg) */}
            <button
              onClick={() => setActiveNode('tg')}
              className={`absolute bottom-2 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 bg-white flex items-center justify-center transition-all cursor-pointer z-10 ${
                activeNode === 'tg' ? `${nodes.tg.borderColor} shadow-lg shadow-channel-sky/20 scale-110` : 'border-gray-100 shadow-sm hover:scale-105'
              } text-channel-sky`}
            >
              <Send className="w-6 h-6" />
            </button>

            {/* Node 5: Email (Positioned at Bottom-Left: 240 deg) */}
            <button
              onClick={() => setActiveNode('em')}
              className={`absolute bottom-1/4 left-2 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 bg-white flex items-center justify-center transition-all cursor-pointer z-10 ${
                activeNode === 'em' ? `${nodes.em.borderColor} shadow-lg shadow-gray-400/20 scale-110` : 'border-gray-100 shadow-sm hover:scale-105'
              } text-gray-500`}
            >
              <Mail className="w-6 h-6" />
            </button>

            {/* Node 6: Live Chat Widget (Positioned at Top-Left: 300 deg) */}
            <button
              onClick={() => setActiveNode('lc')}
              className={`absolute top-1/4 left-2 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 bg-white flex items-center justify-center transition-all cursor-pointer z-10 ${
                activeNode === 'lc' ? `${nodes.lc.borderColor} shadow-lg shadow-brand-indigo/25 scale-110` : 'border-gray-100 shadow-sm hover:scale-105'
              } text-brand-indigo`}
            >
              <MessageCircle className="w-6 h-6" />
            </button>

          </div>

          {/* Connection Metadata / Detailed Node Preview Box */}
          <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
            <span className="text-[10px] bg-brand-indigo/10 text-brand-indigo font-bold px-2.5 py-1 rounded-md uppercase tracking-wide font-mono inline-block">
              Connected Channel Info
            </span>
            
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-4 flex items-center space-x-3 font-display">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${selectedNode.color}`}>
                {selectedNode.icon}
              </span>
              <span>{selectedNode.name}</span>
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 mt-4 leading-relaxed">
              {selectedNode.desc}
            </p>

            <div className="mt-6 pt-5 border-t border-gray-50 grid grid-cols-2 gap-4 text-xs font-mono text-gray-500">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="truncate">SSL Encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin [animation-duration:12s]" />
                <span className="truncate">Real-time sync</span>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-lg p-2.5 border border-gray-100 mt-2 flex justify-between items-center text-[10px]">
                <span className="text-gray-400">INTEGRATION API:</span>
                <span className="text-brand-indigo font-bold lowercase tracking-wider">{selectedNode.apiType}</span>
              </div>
            </div>
          </div>

        </div>

        {/* 3 Benefit Pills Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 max-w-4xl mx-auto border-t border-gray-100 pt-10">
          <div className="flex items-center space-x-2 bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-xs w-full sm:w-auto justify-center">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">✓</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">All messages in one inbox</span>
          </div>
          <div className="flex items-center space-x-2 bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-xs w-full sm:w-auto justify-center">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">✓</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">AI agents across every channel</span>
          </div>
          <div className="flex items-center space-x-2 bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-xs w-full sm:w-auto justify-center">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">✓</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">One team. Zero missed chats.</span>
          </div>
        </div>

      </div>
    </section>
  );
}
