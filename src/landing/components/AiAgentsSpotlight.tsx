/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Bot,
  Headset,
  RefreshCw,
  Send,
  Settings,
  ShoppingBag,
  Target,
} from 'lucide-react';
import { AI_AGENTS_CONFIG } from '../data';
import { PRODUCT_NAME } from '../brand';
import { LandingCard, LandingPrimaryButton, LandingSection, LandingSectionHeader } from './landing-ui';

interface AiAgentsSpotlightProps {
  onStartAgentDemo: () => void;
}

function agentIcon(id: string) {
  switch (id) {
    case 'agent-max':
      return Target;
    case 'agent-sara':
      return Headset;
    case 'agent-aria':
      return ShoppingBag;
    default:
      return Settings;
  }
}

export default function AiAgentsSpotlight({ onStartAgentDemo }: AiAgentsSpotlightProps) {
  const [selectedAgentId, setSelectedAgentId] = useState('agent-sara');
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: 'user' | 'bot'; text: string }>
  >([
    {
      sender: 'bot',
      text: 'Hi! I am Sara, your support AI. Ask about billing, trials, or pricing.',
    },
  ]);
  const [customMsg, setCustomMsg] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const activeAgent = AI_AGENTS_CONFIG.find((a) => a.id === selectedAgentId) ?? AI_AGENTS_CONFIG[1];
  const ActiveIcon = agentIcon(activeAgent.id);

  useEffect(() => {
    const greetings: Record<string, string> = {
      'agent-max':
        'Hey! I am Max, your lead capture agent. Ask about WhatsApp, Instagram, or booking a demo.',
      'agent-sara':
        'Hi! I am Sara, your support AI. Ask about billing, trials, or pricing.',
      'agent-aria':
        'Hello! I am Aria, your sales assistant. Ask about plans, discounts, or checkout.',
      'agent-custom':
        'Hello! This is a custom agent sandbox. Upload docs to train specialized responses.',
    };
    setChatHistory([{ sender: 'bot', text: greetings[activeAgent.id] ?? greetings['agent-sara'] }]);
  }, [selectedAgentId, activeAgent.id]);

  const handleSendPrompt = (textToSend: string) => {
    if (!textToSend.trim() || isBotTyping) return;

    const updatedHistory = [...chatHistory, { sender: 'user' as const, text: textToSend }];
    setChatHistory(updatedHistory);
    setCustomMsg('');
    setIsBotTyping(true);

    window.setTimeout(() => {
      setIsBotTyping(false);
      const promptLower = textToSend.toLowerCase();
      let replyText = '';

      if (activeAgent.id === 'agent-sara') {
        if (promptLower.includes('trial') || promptLower.includes('free') || promptLower.includes('cancel')) {
          replyText = `${PRODUCT_NAME} includes a 14-day free trial. No credit card required, cancel anytime.`;
        } else if (promptLower.includes('cost') || promptLower.includes('price') || promptLower.includes('inr')) {
          replyText =
            'Starter is ₹1,999/month and Growth is ₹4,999/month. Zero per-message markup — you pay Meta directly.';
        } else if (promptLower.includes('agent') || promptLower.includes('seat')) {
          replyText = 'Starter includes 3 agent seats; Growth includes 10. Add more anytime from billing.';
        } else {
          replyText =
            'I can answer from your knowledge base. Complex queries escalate to a human automatically.';
        }
      } else if (activeAgent.id === 'agent-max') {
        if (promptLower.includes('whatsapp') || promptLower.includes('instagram')) {
          replyText = `${PRODUCT_NAME} connects WhatsApp and Instagram in one inbox for your whole team.`;
        } else if (promptLower.includes('demo') || promptLower.includes('email')) {
          replyText = "I'll tag you as a hot lead and our team can schedule a 10-minute demo.";
        } else {
          replyText = 'Share your email and I will route this to our sales team.';
        }
      } else if (activeAgent.id === 'agent-aria') {
        if (promptLower.includes('discount') || promptLower.includes('code')) {
          replyText = 'Use code CONVOSYNC10 for 10% off annual plans today.';
        } else if (promptLower.includes('checkout') || promptLower.includes('buy')) {
          replyText = 'I can share a secure checkout link for Starter or Growth — which do you prefer?';
        } else {
          replyText = 'I help with catalog, quantities, and UPI checkout over WhatsApp.';
        }
      } else {
        replyText = 'Upload your docs to configure this custom agent for your use case.';
      }

      setChatHistory([...updatedHistory, { sender: 'bot', text: replyText }]);
    }, 900);
  };

  return (
    <LandingSection id="ai-agents" tone="muted" className="relative overflow-hidden">
      <LandingSectionHeader
        badge="AI agents"
        title="Meet your AI team"
        titleAccent="always on, never tired."
        description="Pick an agent, try a question, and see how ConvoSync resolves conversations from your docs."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {AI_AGENTS_CONFIG.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          const Icon = agentIcon(agent.id);
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgentId(agent.id)}
              className={`text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white border-channel-green shadow-md shadow-emerald-600/10 ring-1 ring-channel-green/20'
                  : 'bg-white/80 border-gray-200/80 hover:border-emerald-200 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100">
                  <Icon className="w-5 h-5 text-emerald-700" aria-hidden />
                </span>
                {agent.isActive && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-950">{agent.role}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{agent.name}</p>
              <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">{agent.description}</p>
              <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="font-semibold text-emerald-700">{agent.stats.resolutionRate}</span> auto-resolve
              </p>
            </button>
          );
        })}
      </div>

      <LandingCard className="overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-channel-green text-white shrink-0">
              <ActiveIcon className="w-5 h-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-950 truncate">
                Chat with {activeAgent.name}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {activeAgent.kbDocs.length
                  ? `Trained on ${activeAgent.kbDocs.length} docs`
                  : 'Demo sandbox'}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Satisfaction</p>
            <p className="text-sm font-bold text-emerald-700">{activeAgent.stats.satisfaction}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[320px] lg:min-h-[360px]">
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-100 p-4 bg-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Try a question
            </p>
            <div className="space-y-2">
              {activeAgent.sampleQuestions.map((ques) => (
                <button
                  key={ques}
                  type="button"
                  onClick={() => handleSendPrompt(ques)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 text-xs text-gray-700 font-medium transition-colors duration-200 cursor-pointer"
                >
                  {ques}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-gray-400 leading-relaxed hidden lg:block">
              Click a question or type your own below.
            </p>
          </div>

          <div className="lg:col-span-8 flex flex-col bg-[#fafafa] min-h-[280px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.map((chat, idx) => (
                <div
                  key={`${idx}-${chat.text.slice(0, 12)}`}
                  className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      chat.sender === 'user'
                        ? 'bg-channel-green text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {chat.text}
                  </div>
                </div>
              ))}
              {isBotTyping && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-gray-200 text-xs text-gray-500">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden />
                    Thinking…
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(customMsg);
              }}
              className="p-3 border-t border-gray-200 bg-white flex gap-2"
            >
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder={`Message ${activeAgent.name}…`}
                className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="submit"
                disabled={isBotTyping}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-channel-green hover:bg-[#20bd5a] text-white shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </LandingCard>

      <div className="mt-10 text-center">
        <p className="text-sm text-gray-600">
          Train a custom AI agent on your docs in under 10 minutes. No developers required.
        </p>
        <LandingPrimaryButton id="spot-cta-btn" onClick={onStartAgentDemo} className="mt-4">
          Create your AI agent
          <ArrowRight className="w-4 h-4" aria-hidden />
        </LandingPrimaryButton>
      </div>
    </LandingSection>
  );
}
