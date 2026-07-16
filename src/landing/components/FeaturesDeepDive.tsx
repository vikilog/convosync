/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { 
  Inbox, Bot, Send, GitFork, BarChart3, MessageSquare, Instagram, 
  Check, ChevronRight, FileText, Plus, Calendar, Sparkles, Trophy, Mail
} from 'lucide-react';
import { CAMPAIGN_TEMPLATES, INITIAL_CAMPAIGNS } from '../data';
import { PRODUCT_NAME } from '../brand';
import { LandingSection, LandingSectionHeader, landingTabActive, landingTabIdle } from './landing-ui';

export default function FeaturesDeepDive() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'agents' | 'campaigns' | 'journeys' | 'analytics'>('inbox');

  // Interactive Tab 2 (AI Agent Docs list simulation)
  const [mockDocs, setMockDocs] = useState<string[]>([
    'convosync-pricing-plans.pdf',
    'product-faq-sheet-q2.docx',
    'shipping-return-standards.txt'
  ]);
  const [newUrlText, setNewUrlText] = useState('');
  
  // Interactive Tab 3 (Campaign Wizard simple Step switch)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  const handleAddDoc = (e: FormEvent) => {
    e.preventDefault();
    if (!newUrlText.trim()) return;
    setMockDocs([...mockDocs, newUrlText.trim()]);
    setNewUrlText('');
  };

  return (
    <LandingSection id="features" tone="white">
      <LandingSectionHeader
        badge="Platform capabilities"
        title="A complete omnichannel suite"
        titleAccent="not just another inbox."
        description={`${PRODUCT_NAME} powers unified routing, AI resolution, campaigns, and automation journeys from one tab.`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:overflow-x-auto pb-3 gap-2 mb-14 scrollbar-none lg:flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`flex w-full lg:w-auto lg:shrink-0 items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-3 rounded-full text-xs sm:text-sm font-semibold lg:whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'inbox' ? landingTabActive : landingTabIdle
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Omnichannel Inbox</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('agents')}
            className={`flex w-full lg:w-auto lg:shrink-0 items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-3 rounded-full text-xs sm:text-sm font-semibold lg:whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'agents' ? landingTabActive : landingTabIdle
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Agents</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`flex w-full lg:w-auto lg:shrink-0 items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-3 rounded-full text-xs sm:text-sm font-semibold lg:whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'campaigns' ? landingTabActive : landingTabIdle
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Campaigns</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('journeys')}
            className={`flex w-full lg:w-auto lg:shrink-0 items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-3 rounded-full text-xs sm:text-sm font-semibold lg:whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'journeys' ? landingTabActive : landingTabIdle
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>Journeys</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex w-full lg:w-auto lg:shrink-0 items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-3 rounded-full text-xs sm:text-sm font-semibold lg:whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'analytics' ? landingTabActive : landingTabIdle
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>

        {/* Dynamic Inner Tab View grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* TAB 1 — OMNICHANNEL INBOX */}
          {activeTab === 'inbox' && (
            <>
              <div className="lg:col-span-5 space-y-6">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full uppercase font-mono">
                  Module 01
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-display">
                  Every channel. One Inbox. Zero chaos.
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                  WhatsApp business API threads, Instagram DM chats, Facebook Messenger conversations, Telegram bot threads, and customer emails flow dynamically into a unified chat window. Your team triage staff monitors, assigns, tags, and answers from a single interface.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm font-semibold text-gray-700">
                  <li className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs">✓</span>
                    <span>Real-time consolidated threads across 5 global networks</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs">✓</span>
                    <span>Consolidated social icon badges visible on every chat card</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs">✓</span>
                    <span>Expert agent delegation and internal tag notes system</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs">✓</span>
                    <span>Aggregated client profile highlighting full contact history</span>
                  </li>
                </ul>
              </div>

              {/* Mockup 3 column inbox */}
              <div className="lg:col-span-7 landing-mock-panel bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 text-gray-900 h-[420px] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-gray-400">Team Workspace Workspace</span>
                  <span className="text-[10px] text-green-400 flex items-center space-x-1.5 font-mono">
                    <Check className="w-3.5 h-3.5" />
                    <span>Real-time syncing</span>
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-3 text-xs flex-grow h-[310px] overflow-hidden mt-3">
                  {/* Left Mock queue list */}
                  <div className="col-span-4 border-r border-gray-100 pr-2 space-y-2 py-1 overflow-y-auto">
                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="font-bold truncate">Priya Mehta</span>
                        <span className="w-4 h-4 rounded-full bg-channel-green text-[9px] flex items-center justify-center">W</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-1">"Is the course..."</p>
                    </div>
                    <div className="p-2 rounded-lg bg-transparent hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-bold truncate text-gray-400">Rahul Verma</span>
                        <span className="w-4 h-4 rounded-full bg-channel-pink text-[9px] flex items-center justify-center">I</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-1">"Can I track..."</p>
                    </div>
                  </div>

                  {/* Center Chat View with chat-bubbles */}
                  <div className="col-span-5 flex flex-col justify-between border-r border-gray-100 px-2">
                    <div className="space-y-3 flex-grow overflow-y-auto py-1">
                      <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl rounded-tl-none max-w-[90%] text-[10px]">
                        Hello support! Need to enroll Priya in the full cohort stack courses for Mumbai regional operations.
                      </div>
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200/20 rounded-xl rounded-tr-none max-w-[90%] ml-auto text-[10px] text-emerald-100">
                        Hey there! Course admissions remain active. I am auto-transferring your documents now!
                      </div>
                    </div>
                  </div>

                  {/* Right Detail Pane */}
                  <div className="col-span-3 pl-2 flex flex-col gap-3 py-1 text-[10px]">
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1.5">CLIENT DIRECTORY</p>
                      <p className="font-extrabold text-gray-900">Rahul Sharma</p>
                      <p className="text-gray-500 font-mono text-[9px] mt-0.5">mumb-executive@gmail.com</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-2.5 space-y-1.5">
                      <p className="text-[9px] text-gray-400 font-bold">CROSS-CHANNEL TRACKS</p>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-channel-pink">Instagram</span>
                        <span className="text-gray-900 font-bold">3x</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-channel-green">WhatsApp</span>
                        <span className="text-gray-900 font-bold">12x</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>Contact Segment: Prime Lead</span>
                  <span>CRM ID: #WA-99214</span>
                </div>
              </div>
            </>
          )}

          {/* TAB 2 — AI AGENTS CONFIG */}
          {activeTab === 'agents' && (
            <>
              <div className="lg:col-span-5 space-y-6">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full uppercase font-mono">
                  Module 02
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-display">
                  Autonomous AI Agents — Resolving conversations 24/7
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                  Train dedicated LLM-backed digital employees on your proprietary brochures, returns logs, URL sheets, or system policies in minutes. They actively handle and close customer checkouts or troubleshooting runs.
                </p>
                <div className="p-4 bg-brand-indigo/5 rounded-xl border border-emerald-200/10 flex items-center space-x-3 text-xs text-emerald-700">
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">AI handled and resolved 89% of 1,380 conversations this week automatically!</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px]">✓</span>
                    <span>Supports WhatsApp, Instagram, Telegram & Messenger</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px]">✓</span>
                    <span>Hindi, English, Tamil, and 12+ Indian regional dialects supported</span>
                  </div>
                </div>
              </div>

              {/* Simulated Agents Setup Workspace */}
              <div className="lg:col-span-7 landing-mock-panel bg-white rounded-2xl border border-gray-100 p-5 text-gray-900 h-[420px] shadow-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                  <span className="text-xs font-bold text-gray-400">Agent Training Laboratory / Workspace</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/20 font-mono font-bold">SARA-PORTAL</span>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-grow my-4 overflow-hidden">
                  
                  {/* Left section: togglable agent grid */}
                  <div className="space-y-2.5 overflow-y-auto">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">DIGITAL STAFF</p>
                    <div className="p-3 bg-gray-50 rounded-xl border border-emerald-200/40 relative">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center space-x-1.5">
                          <span>🎧</span>
                          <span>Sara (Customer Support)</span>
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[9.5px] text-gray-400 mt-1 max-w-[170px] truncate">Active: Shipping FAQ</p>
                    </div>

                    <div className="p-3 bg-transparent hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-400 flex items-center space-x-1.5">
                          <span>🎯</span>
                          <span>Max (Inbound Lead Qualification)</span>
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                      </div>
                    </div>
                  </div>

                  {/* Right knowledge base builder */}
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-between overflow-hidden">
                    <div className="space-y-3">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">🏢 Sara's Knowledge Base</p>
                      
                      <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
                        {mockDocs.map((doc, dIdx) => (
                          <div key={dIdx} className="flex items-center justify-between p-1.5 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-300">
                            <span className="truncate max-w-[130px]">{doc}</span>
                            <span className="text-[9px] text-[#22C55E]">ready ✓</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Doc / Link form */}
                    <form onSubmit={handleAddDoc} className="flex gap-2.5 mt-3">
                      <input 
                        type="text" 
                        value={newUrlText}
                        onChange={(e) => setNewUrlText(e.target.value)}
                        placeholder="Add FAQ file or link..."
                        className="bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-[10px] text-gray-900 flex-grow focus:outline-none focus:border-emerald-200/50"
                      />
                      <button 
                        type="submit"
                        className="bg-channel-green hover:bg-channel-green-hover text-white px-2.5 py-1 text-xs font-semibold rounded shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                </div>

                <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-500 font-mono flex justify-between items-center">
                  <span>Smart Escalation triggers: Frustrated intent detected</span>
                  <span className="text-amber-400">Escalate-to-human: true</span>
                </div>
              </div>
            </>
          )}

          {/* TAB 3 — CAMPAIGNS WIZARD */}
          {activeTab === 'campaigns' && (
            <>
              <div className="lg:col-span-5 space-y-6">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full uppercase font-mono">
                  Module 03
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-display">
                  Mass Campaign Broadcasts. High Conversions.
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                  Initiate optimized outbound marketing lists, scheduled payment reminders, and seasonal offer broadcasts across WhatsApp and Instagram simultaneously. Zero per-message markup costs.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-lg font-bold text-emerald-700">97.9%</p>
                    <p className="text-[11px] text-gray-500 font-medium">WhatsApp Delivery Rate</p>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-lg font-bold text-emerald-700">68.2%</p>
                    <p className="text-[11px] text-gray-500 font-medium">Average Open Rate</p>
                  </div>
                </div>
              </div>

              {/* 3 Step Campaign wizard preview mockup */}
              <div className="lg:col-span-7 landing-mock-panel bg-white rounded-2xl border border-gray-100 p-5 text-gray-900 h-[420px] shadow-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                  <span className="text-xs font-bold text-gray-400">Outbound Blast Wizard</span>
                  
                  {/* Step indicators */}
                  <div className="flex items-center space-x-1.5 text-[9px] font-mono text-gray-400">
                    <button onClick={() => setWizardStep(1)} className={`px-2 py-0.5 rounded cursor-pointer ${wizardStep === 1 ? 'bg-channel-green text-white font-bold' : 'bg-gray-50'}`}>1. Segment</button>
                    <ChevronRight className="w-2.5 h-2.5" />
                    <button onClick={() => setWizardStep(2)} className={`px-2 py-0.5 rounded cursor-pointer ${wizardStep === 2 ? 'bg-channel-green text-white font-bold' : 'bg-gray-50'}`}>2. Craft</button>
                    <ChevronRight className="w-2.5 h-2.5" />
                    <button onClick={() => setWizardStep(3)} className={`px-2 py-0.5 rounded cursor-pointer ${wizardStep === 3 ? 'bg-channel-green text-white font-bold' : 'bg-gray-50'}`}>3. Blast</button>
                  </div>
                </div>

                <div className="flex-grow flex items-center justify-center py-4 overflow-hidden">
                  
                  {wizardStep === 1 && (
                    <div className="text-center space-y-3 max-w-sm animate-fade-in w-full">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Select Audience Target Segment</p>
                      <div className="grid grid-cols-2 gap-2.5 mt-2 text-left">
                        <div className="p-3 bg-gray-50 border border-emerald-200/40 rounded-xl">
                          <p className="font-bold text-xs">Festive Incomplete Signups</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">Contact count: 4,280</p>
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
                          <p className="font-bold text-xs text-gray-400">E-comm VIP Mumbai</p>
                          <p className="text-[10px] text-gray-600 font-mono mt-0.5">Contact count: 1,532</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="text-center space-y-3 max-w-xs animate-fade-in w-full">
                      <span className="text-[10px] uppercase font-bold text-channel-green">Selected Channel: WhatsApp API</span>
                      
                      {/* Mobile mockup display */}
                      <div className="bg-gray-100 border border-gray-200 rounded-2xl p-3.5 text-left text-[11px] space-y-1.5 shadow-xl">
                        <p className="text-gray-300 font-mono leading-relaxed bg-emerald-50 p-2 rounded border-l-2 border-channel-green">
                          🌟 Festive Special! Hey Priya Mehta, get flat 15% off all premium plans this weekend with code FESTIVE15! Click below to buy now.
                        </p>
                        <div className="bg-gray-50 text-gray-400 p-2.5 rounded text-center font-bold tracking-tight border border-gray-100">
                          🛒 Buy directly from Whatsapp
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 3 && (
                    <div className="text-center space-y-3 animate-fade-in w-full">
                      <p className="text-xs uppercase font-extrabold text-[#22C55E]">READY FOR TRANSMISSION</p>
                      <p className="text-md font-bold text-gray-200">Scheduled: Launch immediately after approval</p>
                      
                      <div className="flex items-center justify-center space-x-12 mt-4 max-w-xs mx-auto border-t border-b border-gray-100 py-4">
                        <div>
                          <p className="text-xl font-bold">4,280</p>
                          <p className="text-[9px] text-gray-500 font-mono">RECIPIENTS</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-emerald-700">₩0.00</p>
                          <p className="text-[9px] text-gray-500 font-mono">CONVOSYNC FEE</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-400 flex justify-between items-center font-mono">
                  <span>Template Status: APPROVED BY META</span>
                  <button 
                    onClick={() => setWizardStep(wizardStep === 3 ? 1 : (wizardStep + 1) as 1 | 2 | 3)} 
                    className="p-1 px-3 bg-channel-green hover:bg-channel-green-hover text-white rounded text-xs font-semibold cursor-pointer shrink-0"
                  >
                    Next Wizard Step
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 4 — JOURNEY AUTOMATION */}
          {activeTab === 'journeys' && (
            <>
              <div className="lg:col-span-5 space-y-6">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full uppercase font-mono">
                  Module 04
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-display">
                  Visual Journeys — Grow, engage, & schedule automated flows
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                  Assemble elegant customer retention lines with our drag-and-drop workflow visualizer. Trigger customized dispatches on new signups, wait to detect reads, branching logically into human assignments or AI Agent resolutions.
                </p>
                <div className="space-y-3 text-xs sm:text-sm font-semibold text-gray-700">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs">✓</span>
                    <span>Trigger on tags, integrations, CRM events, or raw webhooks</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs">✓</span>
                    <span>Action blocks check read status and delay intervals</span>
                  </div>
                </div>
              </div>

              {/* Journey Nodes Canvas Mockup */}
              <div className="lg:col-span-7 landing-mock-panel bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 text-gray-900 h-[420px] shadow-2xl flex flex-col justify-between overflow-hidden relative">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                  <span className="text-xs font-bold text-gray-400">Visual Journey Canvas Builder</span>
                  <span className="text-[9.5px] text-green-400 flex items-center space-x-1 font-mono">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                    <span>Live flow execution active</span>
                  </span>
                </div>

                {/* Vertical connected node lines */}
                <div className="flex-grow overflow-y-auto space-y-4 py-4 px-2 items-center flex flex-col scrollbar-none">
                  
                  {/* Trigger Node */}
                  <div className="flex items-center space-x-3 p-3.5 bg-purple-950/20 border border-purple-500/30 rounded-xl max-w-xs w-full">
                    <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white shrink-0">1</div>
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-purple-300">Trigger: Contact Created</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Fired on WA/IG connect</p>
                    </div>
                  </div>

                  {/* Connect arrow line widget */}
                  <div className="w-0.5 h-6 bg-brand-indigo/30" />

                  {/* Template Action Node */}
                  <div className="flex items-center space-x-3 p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-xl max-w-xs w-full">
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white shrink-0">2</div>
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-blue-300">Action: Welcome Template</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Send custom greeting</p>
                    </div>
                  </div>

                  <div className="w-0.5 h-6 bg-brand-indigo/30" />

                  {/* Decision/Branch Node */}
                  <div className="flex items-center space-x-3 p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl max-w-xs w-full">
                    <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-xs text-white shrink-0">3</div>
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-amber-300">Condition: Replied within 1hr?</p>
                      <div className="flex space-x-2 mt-1">
                        <span className="text-[9px] bg-[#22C55E]/15 border border-[#22C55E]/20 text-[#22C55E] px-1.5 rounded uppercase font-bold font-mono">YES: Chat with human reps</span>
                        <span className="text-[9px] bg-sky-500/15 border border-sky-500/20 text-sky-400 px-1.5 rounded uppercase font-bold font-mono">NO: Deploy bot Sara</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="border-t border-gray-100 pt-3.5 text-[10px] text-gray-500 font-mono flex justify-between">
                  <span>Exit Rule: Transaction settled</span>
                  <span>Exit completion rate: 64.2%</span>
                </div>
              </div>
            </>
          )}

          {/* TAB 5 — ANALYTICS */}
          {activeTab === 'analytics' && (
            <>
              <div className="lg:col-span-5 space-y-6">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full uppercase font-mono">
                  Module 05
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-display">
                  Productivity reports & AI resolution funnels
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                  Deep analytics highlight channel volumes, mass campaigns delivery, active customer resolution counts, and human staff CSAT metrics effortlessly. Gain immediate clarity over team queues.
                </p>
                <div className="space-y-2 text-xs font-semibold text-gray-700">
                  <div className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Real-time dashboard syncing every 30 seconds</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Detailed conversion and open funnels exports with CSV files</span>
                  </div>
                </div>
              </div>

              {/* Reports Dashboard Mockup containing beautiful visual metrics */}
              <div className="lg:col-span-7 landing-mock-panel bg-white rounded-2xl border border-gray-100 p-5 text-gray-900 h-[420px] shadow-2xl flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-gray-400">Aggregated Performance Ledger</span>
                  <span className="text-[10px] text-emerald-700 font-mono">Updated: June 2026</span>
                </div>

                <div className="grid grid-cols-4 gap-3 my-3">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold">TOTAL CHATS</p>
                    <p className="text-sm font-semibold text-white mt-1">8,240</p>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold">AI SOLVED</p>
                    <p className="text-sm font-semibold text-emerald-400 mt-1">89%</p>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold">AVG RESPONSE</p>
                    <p className="text-sm font-semibold text-white mt-1">43s</p>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold">STAFF CSAT</p>
                    <p className="text-sm font-semibold text-emerald-700 mt-1">4.8/5</p>
                  </div>
                </div>

                {/* Simulated Channel Volume Bar Graph */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex-grow flex flex-col justify-between overflow-hidden">
                  <span className="text-[9px] text-gray-400 uppercase font-mono font-bold block mb-2">Conversations split by platform channels</span>
                  
                  <div className="space-y-2 mt-1">
                    {/* WhatsApp */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-0.5">
                        <span className="text-channel-green">WhatsApp</span>
                        <span>4,851 (59%)</span>
                      </div>
                      <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden">
                        <div className="h-full bg-channel-green rounded-full transition-all" style={{ width: '59%' }} />
                      </div>
                    </div>

                    {/* Instagram */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-0.5">
                        <span className="text-channel-pink">Instagram</span>
                        <span>1,940 (23%)</span>
                      </div>
                      <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-500 to-channel-pink rounded-full transition-all" style={{ width: '23%' }} />
                      </div>
                    </div>

                    {/* Telegram & rest */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-0.5">
                        <span className="text-channel-sky">Telegram / Messenger / Email</span>
                        <span>1,449 (18%)</span>
                      </div>
                      <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-indigo rounded-full transition-all" style={{ width: '18%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3.5 text-[10px] text-gray-500 flex justify-between items-center font-mono">
                  <span>Export options available: CSV, Excel, Google Sheets</span>
                  <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
                </div>
              </div>
            </>
          )}

        </div>
    </LandingSection>
  );
}
