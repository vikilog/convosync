/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Plus, Sparkles, MessageSquare, ArrowRight, UserCheck, Bot, ShieldAlert,
  Target, Headset, ShoppingBag, Settings, RefreshCw, Send
} from 'lucide-react';
import { AI_AGENTS_CONFIG } from '../data';
import { AiAgentConfig } from '../types';

interface AiAgentsSpotlightProps {
  onStartAgentDemo: () => void;
}

export default function AiAgentsSpotlight({ onStartAgentDemo }: AiAgentsSpotlightProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-sara');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    { sender: 'bot', text: 'Hi there! 🎧 I am Sara, your customer support AI. How can I help you today? Ask me about billing, trials, or per-message costs!', time: '12:00 PM' }
  ]);
  const [customMsg, setCustomMsg] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const activeAgent = AI_AGENTS_CONFIG.find(a => a.id === selectedAgentId) || AI_AGENTS_CONFIG[1];

  // When selected agent changes, reset and greet
  useEffect(() => {
    let greeting = '';
    if (activeAgent.id === 'agent-max') {
      greeting = "Hey! 🎯 I am Max, the Lead Capture specialist. Tell me about your business. Are you looking to scale WhatsApp or Instagram support first?";
    } else if (activeAgent.id === 'agent-sara') {
      greeting = "Hi there! 🎧 I am Sara, your customer support AI. How can I help you today? Ask me about billing, trials, or per-message costs!";
    } else if (activeAgent.id === 'agent-aria') {
      greeting = "Hello! 🛍️ Aria here! Let’s find the perfect setup for your business. Type a checkout query or ask about our plans!";
    } else {
      greeting = "Hello developer! 🔧 Create a completely custom system agent. Input custom parameters to train me in under 10 minutes!";
    }

    setChatHistory([
      { sender: 'bot', text: greeting, time: 'Just now' }
    ]);
  }, [selectedAgentId]);

  const handleSendPrompt = (textToSend: string) => {
    if (!textToSend.trim() || isBotTyping) return;

    // Add user message
    const updatedHistory = [...chatHistory, { sender: 'user', text: textToSend, time: 'Just now' }];
    setChatHistory(updatedHistory);
    setCustomMsg('');
    setIsBotTyping(true);

    // AI thinking transition simulation
    setTimeout(() => {
      setIsBotTyping(false);
      let replyText = '';
      const promptLower = textToSend.toLowerCase();

      // Sara response rules
      if (activeAgent.id === 'agent-sara') {
        if (promptLower.includes('trial') || promptLower.includes('free') || promptLower.includes('cancel')) {
          replyText = "Yes! WaBiz comes with a 14-day fully featured free trial. There is absolutely no credit card required to start, and you can cancel anytime with single click! 💳";
        } else if (promptLower.includes('cost') || promptLower.includes('price') || promptLower.includes('charge') || promptLower.includes('markup') || promptLower.includes('inr')) {
          replyText = "Our pricing is 100% transparent: Starter is ₹1,999/month and Growth is ₹4,999/month. We charge ZERO per-message markup. You pay your Meta API costs directly! 🇮🇳";
        } else if (promptLower.includes('agent') || promptLower.includes('seat')) {
          replyText = "The Starter plan includes 3 human agent seats, and Growth includes 10 fully synced agent seats! You can add extra seats anytime in your billing panel. 👥";
        } else {
          replyText = "Great question! That is handled seamlessly by my custom trained knowledge database. If a query is too complex, I immediately page a human representative to take over! 🤝";
        }
      }
      // Max responses rules
      else if (activeAgent.id === 'agent-max') {
        if (promptLower.includes('whatsapp') || promptLower.includes('instagram') || promptLower.includes('channel')) {
          replyText = "Awesome! WaBiz lets you connect WhatsApp and Instagram official business profiles simultanously. This lets your single team view and respond to mixed source messages effortlessly! 🌐";
        } else if (promptLower.includes('budget') || promptLower.includes('email') || promptLower.includes('demo') || promptLower.includes('@')) {
          replyText = "Brilliant! I can tag your contact details as 'Hot Enterprise Lead' and have our sales director email you standard guides. Let's schedule a 10-minute demo! 🎯";
        } else {
          replyText = "Understood. I've captured those requirements for our sales team. Let me know your corporate email address so we can schedule an official demo session! 📝";
        }
      }
      // Aria response rules
      else if (activeAgent.id === 'agent-aria') {
        if (promptLower.includes('discount') || promptLower.includes('code') || promptLower.includes('coupon')) {
          replyText = "✨ VIP Offer! Use coupon code WABIZ10 at checkout to secure an extra 10% discount on any annual subscription tier today! 🎁";
        } else if (promptLower.includes('checkout') || promptLower.includes('link') || promptLower.includes('buy') || promptLower.includes('pay')) {
          replyText = "🛒 Let's generate a secured checkout link for you. Would you like to proceed with the highly recommended WaBiz Growth Tier (₹4,999/month) or Starter (₹1,999/month)?";
        } else {
          replyText = "Welcome to our WhatsApp checkout workspace! Aria can list catalogs, calculate quantities, and collect secure UPI orders perfectly. Ask about our discount codes! 🛍️";
        }
      }
      else {
        replyText = "This is a custom sandbox agent simulation. Upload document structures to configure specialized real-world responses effortlessly! ⚙️";
      }

      setChatHistory([...updatedHistory, { sender: 'bot', text: replyText, time: 'Just now' }]);
    }, 1000);
  };

  const handleCardIcon = (id: string) => {
    switch (id) {
      case 'agent-max': return <Target className="w-5 h-5 text-indigo-400" />;
      case 'agent-sara': return <Headset className="w-5 h-5 text-sky-400" />;
      case 'agent-aria': return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
      default: return <Settings className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <section id="ai-agents" className="bg-[#0F0F1A] text-white py-24 relative overflow-hidden border-b border-white/5">
      
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-10 w-[300px] h-[300px] rounded-full bg-brand-indigo/10 blur-[120px] -translate-y-1/2" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] rounded-full bg-channel-pink/10 blur-[135px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-brand-indigo tracking-widest uppercase font-mono bg-brand-indigo/10 px-3 py-1.5 rounded-full border border-brand-indigo/20 inline-block mb-3">
            Digital Employees
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display leading-tight tracking-tight text-white mt-1">
            Meet Your AI Team — Always On, Never Tired
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-4 leading-relaxed font-sans max-w-2xl mx-auto">
            Deploy specialized, custom-trained AI workers for every business use case. Train them on your own literature databases and let them settle customer questions while your team focuses on actual growth.
          </p>
        </div>

        {/* 4 Agent Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {AI_AGENTS_CONFIG.map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`text-left p-6 rounded-2xl transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-[230px] ${
                  isSelected 
                    ? 'bg-[#151525] border-2 border-brand-indigo/60 shadow-xl shadow-brand-indigo/10' 
                    : 'bg-[#11111E]/85 border border-white/5 hover:border-white/10 hover:bg-[#131322]'
                }`}
              >
                {/* Border effect */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0284c7]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                      {handleCardIcon(agent.id)}
                    </div>
                    {agent.isActive && (
                      <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                        Active 🤖
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white font-display group-hover:text-brand-indigo transition-colors">{agent.role}</h3>
                  <span className="text-[11px] text-gray-400 font-bold block mt-0.5">"{agent.name}"</span>
                  <p className="text-[11.5px] text-gray-400 leading-relaxed font-sans mt-2.5 line-clamp-3">
                    {agent.description}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] font-mono mt-4">
                  <span className="text-gray-500">EFFICIENCY KPI:</span>
                  <span className="text-brand-indigo font-extrabold">{agent.stats.resolutionRate} resolve</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Chat Playground Sandbox at bottom */}
        <div className="bg-[#121222] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="p-4 sm:px-6 bg-[#16162A] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-indigo flex items-center justify-center text-lg shadow-inner">
                {activeAgent.icon}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center">
                  <span>Chat Sandbox: testing AI "{activeAgent.name}"</span>
                  <span className="ml-2.5 px-2 py-0.5 text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono">PERSONA SIMULATION</span>
                </h4>
                <p className="text-[10px] text-gray-400">Knowledge: {activeAgent.kbDocs.length ? activeAgent.kbDocs.join(', ') : 'none uploaded'}</p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[9px] font-mono text-gray-400 uppercase">SATISFACTION SCORE</span>
              <p className="text-xs font-extrabold text-[#22C55E]">{activeAgent.stats.satisfaction} Rating</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 h-[340px]">
            {/* Left suggested questions links */}
            <div className="md:col-span-4 border-r border-white/5 bg-[#0E0E1B] p-4 flex flex-col justify-between">
              <div>
                <p className="text-[9.5px] text-gray-400 uppercase tracking-widest font-extrabold mb-3 font-mono">Suggested Questions</p>
                <div className="space-y-2">
                  {activeAgent.sampleQuestions.map((ques, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSendPrompt(ques)}
                      className="w-full text-left p-2.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/5 text-[10.5px] text-gray-300 font-semibold truncate hover:border-brand-indigo/30 transition-all cursor-pointer"
                    >
                      {ques}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-gray-500 font-mono hidden md:block">
                💡 Click any question above to test Sara or Max's real-time custom training rules!
              </div>
            </div>

            {/* Right conversations feed */}
            <div className="md:col-span-8 bg-[#0C0C16] flex flex-col justify-between h-full relative">
              <div className="flex-grow overflow-y-auto p-4 space-y-3.5">
                {chatHistory.map((chat, cIdx) => (
                  <div
                    key={cIdx}
                    className={`flex flex-col relative max-w-[85%] ${chat.sender === 'user' ? 'ml-auto items-end animate-slice-in' : 'mr-auto items-start animate-fade-in'}`}
                  >
                    <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                      chat.sender === 'user' 
                        ? 'bg-brand-indigo text-white rounded-tr-none' 
                        : 'bg-white/5 border border-white/5 text-gray-100 rounded-tl-none'
                    }`}>
                      {chat.text}
                    </div>
                  </div>
                ))}

                {isBotTyping && (
                  <div className="mr-auto items-start max-w-[85%]">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-400 flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-[10px] font-mono text-gray-400">Analyzing knowledge base...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Msg input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPrompt(customMsg);
                }}
                className="p-3 bg-[#131326] border-t border-white/5 flex gap-2"
              >
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder={`Write customized prompt for ${activeAgent.name} (e.g. Can I cancel? or What are the prices?)...`}
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
                <button
                  type="submit"
                  className="bg-brand-indigo hover:bg-brand-indigo/90 text-white p-2.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom promo CTA links */}
        <div className="mt-14 text-center">
          <p className="text-xs sm:text-sm text-gray-400">
            Train any customized AI representative in under 10 minutes. Zero developers required.
          </p>
          <button
            id="spot-cta-btn"
            onClick={onStartAgentDemo}
            className="mt-4 inline-flex items-center space-x-2 bg-brand-indigo hover:bg-brand-indigo/90 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-brand-indigo/25 transition-all cursor-pointer"
          >
            <span>Create Your AI Agent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
}
