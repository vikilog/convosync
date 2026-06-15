/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ArrowRight, Sparkles, MessageSquare, Instagram, Send, Mail, CheckCircle2 
} from 'lucide-react';

interface FinalCtaProps {
  onStartFree: () => void;
}

export default function FinalCta({ onStartFree }: FinalCtaProps) {
  return (
    <section id="final-cta" className="bg-[#0A0A12] py-24 relative overflow-hidden text-white text-center">
      
      {/* Background glowing orb accents */}
      <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] rounded-full bg-brand-indigo/20 blur-[130px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-10 left-10 w-[200px] h-[200px] rounded-full bg-channel-pink/15 blur-[100px]" />
      <div className="absolute bottom-10 right-10 w-[240px] h-[240px] rounded-full bg-emerald-950/15 blur-[110px]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Banner header badge */}
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 text-[10px] sm:text-xs font-semibold text-brand-indigo backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-brand-indigo animate-spin [animation-duration:12s]" />
          <span className="text-gray-200">Connect in less than 10 minutes</span>
        </div>

        {/* Big Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-display leading-tight tracking-tight text-white mb-6">
          Your customers are waiting on WhatsApp, Instagram, & Telegram.
        </h2>
        
        {/* Subtitle */}
        <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          Don't make them wait hours for response cycles. Unify all your marketing, support, and billing interfaces into one AI inbox today, completely free.
        </p>

        {/* Two CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-10">
          <button
            id="last-cta-start"
            onClick={onStartFree}
            className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold text-xs sm:text-sm px-6 py-4 rounded-xl shadow-xl shadow-brand-purple/35 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Start Free Trial — No Card Needed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 5 Channel Icons row below buttons (pulsing + hover scale) */}
        <div className="flex items-center justify-center space-x-6 mb-10">
          <div className="w-9 h-9 rounded-full bg-channel-green/10 border border-channel-green/30 flex items-center justify-center shadow-lg shadow-channel-green/10 animate-pulse">
            <MessageSquare className="w-4 h-4 text-channel-green" />
          </div>
          <div className="w-9 h-9 rounded-full bg-channel-pink/10 border border-channel-pink/30 flex items-center justify-center shadow-lg shadow-channel-pink/10 animate-pulse [animation-delay:0.2s]">
            <Instagram className="w-4 h-4 text-channel-pink" />
          </div>
          <div className="w-9 h-9 rounded-full bg-channel-blue/10 border border-channel-blue/30 flex items-center justify-center shadow-lg shadow-channel-blue/10 animate-pulse [animation-delay:0.4s]">
            <span className="font-extrabold text-xs text-channel-blue font-sans">N</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-channel-sky/10 border border-channel-sky/30 flex items-center justify-center shadow-lg shadow-channel-sky/10 animate-pulse [animation-delay:0.6s]">
            <Send className="w-4 h-4 text-channel-sky" />
          </div>
          <div className="w-9 h-9 rounded-full bg-gray-500/10 border border-gray-500/30 flex items-center justify-center shadow-lg shadow-gray-500/10 animate-pulse [animation-delay:0.8s]">
            <Mail className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Small trust checklist */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 font-mono">
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>14-day free trial</span>
          </span>
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>No credit card</span>
          </span>
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Cancel anytime</span>
          </span>
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Setup in 10 mins</span>
          </span>
        </div>

      </div>
    </section>
  );
}
