/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  ArrowRight, Play, MessageSquare, Instagram, Send, Mail, Check, 
  Sparkles, Bot, PhoneCall, Zap, Smile, Compass
} from 'lucide-react';
import { INITIAL_CONVERSATIONS } from '../data';
import { Conversation, Message } from '../types';

interface HeroProps {
  onStartFree: () => void;
  onWatchDemo: () => void;
}

export default function Hero({ onStartFree, onWatchDemo }: HeroProps) {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [inputText, setInputText] = useState('');
  const [aiAutoRespond, setAiAutoRespond] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    // Mark as read
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-white" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-white" />;
      case 'telegram':
        return <Send className="w-4 h-4 text-white" />;
      case 'messenger':
        return <MessageSquare className="w-4 h-4 text-white" />;
      case 'email':
        return <Mail className="w-4 h-4 text-white" />;
      default:
        return <MessageSquare className="w-4 h-4 text-white" />;
    }
  };

  const getChannelColors = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return 'bg-channel-green shadow-channel-green/20';
      case 'instagram': return 'bg-gradient-to-tr from-yellow-500 via-channel-pink to-purple-600 shadow-channel-pink/20';
      case 'telegram': return 'bg-channel-sky shadow-channel-sky/20';
      case 'messenger': return 'bg-channel-blue shadow-channel-blue/20';
      case 'email': return 'bg-gray-500 shadow-gray-500/20';
      default: return 'bg-brand-indigo';
    }
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `m-custom-${Date.now()}`,
      sender: 'agent',
      text: inputText,
      timestamp: 'Just now',
      status: 'read'
    };

    const updatedMsgs = [...activeConv.messages, newMsg];
    
    // Update local state
    setConversations(prev => prev.map(c => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          lastMessage: inputText,
          messages: updatedMsgs,
          unreadCount: 0
        };
      }
      return c;
    }));

    setInputText('');

    // Trigger Simulated AI Agent if toggled
    if (aiAutoRespond) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const aiRepliesMap: Record<string, string> = {
          'conv-1': '🤖 AI Agent Max (WaBiz): Course registration for the next Full Stack cohort is open until Sunday evening. Here is the link to complete payment immediately: wabiz.ai/pay. Do you need any help during check-out?',
          'conv-2': '🤖 AI Agent Sara (WaBiz): Order #7731 is currently transit-cleared via India Post. Estimated delivery to Bengaluru is Friday afternoon! I will auto-send a WhatsApp text the second it lands.',
          'conv-3': '🤖 AI Agent Sara (WaBiz): Our official prices are ₹1,999/month for Starter and ₹4,999/month for Growth, with zero hidden setup surcharges. All cards and UPI are supported directly in Indian Rupees!',
          'conv-4': '🤖 AI Agent Sara (WaBiz): Yes! We provide a complete 100% money-back guarantee if you cancel your subscription within 3 days. No questions asked.',
          'conv-5': '🤖 AI Agent Sara (WaBiz): Invoice for April 2026 has been compiled and emailed directly to finance@company.com with receipt copies attached automatically. Check your spam if it fails to arrive!'
        };

        const aiMsgText = aiRepliesMap[activeConv.id] || "🤖 WaBiz Agent: I am auto-processing your inquiry right now. An agent is notified!";
        
        const aiMsg: Message = {
          id: `m-ai-${Date.now()}`,
          sender: 'ai',
          text: aiMsgText,
          timestamp: 'Just now',
          status: 'replied'
        };

        setConversations(prev => prev.map(c => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              lastMessage: aiMsgText,
              messages: [...updatedMsgs, aiMsg],
              assignedTo: 'ai'
            };
          }
          return c;
        }));
      }, 1200);
    }
  };

  return (
    <section 
      id="hero" 
      className="relative min-h-screen bg-dark-navy text-white pt-28 pb-20 overflow-hidden flex flex-col justify-between"
    >
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-indigo/20 blur-[130px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-channel-pink/15 blur-[140px] translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-10 right-1/3 w-[300px] h-[300px] rounded-full bg-channel-green/10 blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-grow flex flex-col justify-center items-center">
        
        {/* Top badge pill */}
        <div className="animate-fade-in inline-flex items-center space-x-2 bg-white/5 border border-white/10 hover:border-brand-indigo/30 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold text-gray-200 transition-all shadow-md backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-brand-indigo animate-pulse" />
          <span>✨ New — AI Agents now support WhatsApp + Instagram + Telegram simultaneously</span>
        </div>

        {/* H1 Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold font-display text-center tracking-tight leading-none max-w-4xl mb-6">
          One Inbox for <span className="bg-gradient-to-r from-brand-indigo via-indigo-400 to-[#9B92FF] bg-clip-text text-transparent">Every</span> Customer Conversation
        </h1>

        {/* Subtext */}
        <p className="text-base sm:text-lg md:text-xl text-gray-300 text-center max-w-2xl px-2 leading-relaxed mb-10">
          Your customers are on WhatsApp, Instagram, Messenger, Telegram, and Email. WaBiz unifies them all into one AI-powered inbox — so your team never misses a message, and your AI handles the rest.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 w-full">
          <button
            id="hero-start-btn"
            onClick={onStartFree}
            className="w-full sm:w-auto bg-brand-indigo hover:bg-brand-indigo/90 text-white font-semibold text-md px-8 py-4 rounded-xl shadow-xl shadow-brand-indigo/30 hover:shadow-brand-indigo/50 transition-all flex items-center justify-center space-x-2 border border-brand-indigo/20 cursor-pointer"
          >
            <span>Start Free — No Credit Card</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            id="hero-demo-btn"
            onClick={onWatchDemo}
            className="w-full sm:w-auto hover:bg-white/10 text-white font-medium text-md px-6 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 border border-white/10 cursor-pointer"
          >
            <Play className="w-4 h-4 text-brand-indigo fill-brand-indigo" />
            <span>Watch 2-min Demo</span>
          </button>
        </div>

        {/* Channel icons row */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-channel-green shadow-lg shadow-channel-green/30 flex items-center justify-center hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="w-2.5 h-1 bg-gradient-to-r from-channel-green to-channel-pink rounded-full" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 via-[#E1306C] to-purple-600 shadow-lg shadow-channel-pink/30 flex items-center justify-center hover:scale-110 transition-transform">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div className="w-2.5 h-1 bg-gradient-to-r from-channel-pink to-channel-blue rounded-full" />
            <div className="w-10 h-10 rounded-full bg-channel-blue shadow-lg shadow-channel-blue/30 flex items-center justify-center hover:scale-110 transition-transform">
              <span className="font-extrabold text-sm font-sans tracking-tight text-white">N</span>
            </div>
            <div className="w-2.5 h-1 bg-gradient-to-r from-channel-blue to-channel-sky rounded-full" />
            <div className="w-10 h-10 rounded-full bg-channel-sky shadow-lg shadow-channel-sky/30 flex items-center justify-center hover:scale-110 transition-transform">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div className="w-2.5 h-1 bg-gradient-to-r from-channel-sky to-gray-500 rounded-full" />
            <div className="w-10 h-10 rounded-full bg-gray-500 shadow-lg shadow-gray-500/30 flex items-center justify-center hover:scale-110 transition-transform">
              <Mail className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-xs text-gray-400 font-mono tracking-wider mt-4">ALL CHANNELS. ONE PLATFORM.</span>
        </div>

        {/* Hero visual — Complete Interactive WaBiz Dashboard Mockup */}
        <div className="w-full max-w-5xl rounded-2xl bg-[#0B0B13]/90 border border-white/10 shadow-2xl overflow-hidden relative">
          
          {/* Mockup Header bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#141422] border-b border-white/5">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444]" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B]" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#10B981]" />
              <p className="text-xs text-gray-400 ml-4 font-mono font-medium hidden sm:inline">WaBiz Inbox (Live Demonstration Sandbox)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span id="conn-channels-ind" className="flex items-center space-x-1.5 px-3 py-1 bg-channel-green/10 text-channel-green hover:bg-channel-green/20 rounded-md border border-channel-green/20 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>5 Connected Channels</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 h-[500px]">
            {/* Column 1 — List of Conversations */}
            <div className="md:col-span-4 border-r border-white/5 bg-[#0D0D18] flex flex-col justify-between h-full">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                  <span>Conversations ({conversations.length})</span>
                  <span className="text-[10px] text-brand-indigo lowercase font-mono">live-updates</span>
                </div>
              </div>
              
              <div className="overflow-y-auto flex-grow divide-y divide-white/5">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start space-x-3 transition-colors cursor-pointer ${
                      conv.id === activeConvId ? 'bg-white/5 border-l-3 border-brand-indigo' : 'hover:bg-white/2'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-900/40 border border-white/10 flex items-center justify-center font-bold text-gray-300">
                        {conv.customerName.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-[#0D0D18] ${getChannelColors(conv.channel)}`}>
                        {getChannelIcon(conv.channel)}
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-200 truncate">{conv.customerName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{conv.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-1">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-brand-indigo flex-shrink-0 mt-2" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-[#11111E] border-t border-white/5">
                <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer justify-center select-none">
                  <input 
                    type="checkbox" 
                    checked={aiAutoRespond} 
                    onChange={() => setAiAutoRespond(!aiAutoRespond)}
                    className="accent-brand-indigo rounded focus:ring-0"
                  />
                  <span>🤖 Enable AI Auto-Resolve</span>
                </label>
              </div>
            </div>

            {/* Column 2 — Active Chat Window */}
            <div className="md:col-span-8 bg-[#0B0B13] flex flex-col justify-between h-full relative">
              {/* Active Conversation Header */}
              <div className="px-5 py-3.5 border-b border-white/5 bg-[#10101C] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-brand-indigo">
                    {activeConv.customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white flex items-center">
                      <span>{activeConv.customerName}</span>
                      <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded-full capitalize font-mono text-white ${getChannelColors(activeConv.channel)}`}>
                        {activeConv.channel}
                      </span>
                    </h3>
                    <p className="text-[10px] text-gray-400">Assigned: {activeConv.assignedTo === 'ai' ? '🤖 WaBiz AI' : '👤 Support Rep'}</p>
                  </div>
                </div>
              </div>

              {/* Chat Message History */}
              <div className="flex-grow overflow-y-auto p-5 space-y-4">
                {activeConv.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[80%] ${
                      m.sender === 'customer' 
                        ? 'mr-auto items-start' 
                        : m.sender === 'ai' 
                        ? 'ml-auto items-end bg-[#0B2535]/30' 
                        : 'ml-auto items-end'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'customer' 
                        ? 'bg-white/5 border border-white/10 text-gray-100 rounded-tl-none' 
                        : m.sender === 'ai'
                        ? 'bg-[#102C1B] text-gray-100 border border-channel-green/20 rounded-tr-none'
                        : 'bg-brand-indigo text-white rounded-tr-none'
                    }`}>
                      {m.text}
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono mt-1 px-1 flex items-center space-x-1">
                      <span>{m.sender === 'ai' ? '🤖 AI Agent' : m.sender === 'agent' ? '👤 Rep' : 'Customer'}</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </span>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="mr-auto items-start max-w-[80%]">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none text-xs text-gray-400 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[10px]">AI Agent composing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Message Input form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-[#10101C] border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Reply to ${activeConv.customerName} (e.g. Try typing: "Will my order track?" or custom responses)...`}
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-indigo/50"
                />
                <button
                  type="submit"
                  className="bg-brand-indigo hover:bg-brand-indigo/90 text-white p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-md shadow-brand-indigo/20 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Floating stat cards around the dashboard */}
        <div className="relative w-full max-w-5xl h-0 pointer-events-none hidden lg:block">
          
          {/* Card 1 — WhatsApp Priya */}
          <div className="absolute -top-[535px] -left-20 bg-[#121222]/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl flex items-center space-x-3 animate-bounce [animation-duration:8s] backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-channel-green flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-channel-green font-bold">🟢 WhatsApp</span>
                <span className="text-[9px] text-gray-500">• Priya Mehta</span>
              </div>
              <span className="text-[10px] text-gray-300 font-mono tracking-tight leading-none block mt-0.5 max-w-[180px] truncate">"Is the course still open?"</span>
            </div>
          </div>

          {/* Card 2 — AI stats */}
          <div className="absolute -top-[120px] -right-16 bg-[#121222]/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl flex items-center space-x-3 animate-bounce [animation-duration:10s] [animation-delay:2s] backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-purple-950/40 border border-brand-indigo/30 flex items-center justify-center text-brand-indigo">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AI Autonomous Resolves</p>
              <p className="text-xs font-extrabold text-white">847 Chats this week</p>
              <p className="text-[9px] text-[#22C55E]">🎉 94% customer happiness rate</p>
            </div>
          </div>

          {/* Card 3 — Instagram DM Rahul */}
          <div className="absolute -top-[110px] -left-12 bg-[#121222]/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl flex items-center space-x-3 animate-bounce [animation-duration:12s] [animation-delay:4s] backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-channel-pink to-purple-600 flex items-center justify-center">
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-channel-pink font-bold">📸 Instagram DM</span>
                <span className="text-[9px] text-gray-500">• Rahul • 2m ago</span>
              </div>
              <span className="text-[10px] text-gray-300 font-mono leading-none block mt-0.5">Checked order #7731</span>
            </div>
          </div>

          {/* Card 4 — Avg response time */}
          <div className="absolute -top-[525px] -right-24 bg-[#121222]/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl flex items-center space-x-3 animate-bounce [animation-duration:9s] [animation-delay:1s] backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center text-amber-500">
              <Zap className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 tracking-wider">⚡ AVG RESPONSE SPEEDS</p>
              <p className="text-sm font-extrabold text-white">43 Seconds</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
