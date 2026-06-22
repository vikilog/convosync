/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link2Off, Clock, UserX } from 'lucide-react';

export default function ProblemSection() {
  const painPoints = [
    {
      id: 1,
      title: 'Fragmented Channels',
      desc: 'You have WhatsApp on one phone, Instagram on another, emails in Gmail, and Facebook messages nobody checks. Leads and critical customer questions fall through the cracks every single day.',
      icon: <Link2Off className="w-6 h-6 text-[#EF4444]" />
    },
    {
      id: 2,
      title: 'Slow Response Times',
      desc: 'Modern shoppers expect replies in under 10 minutes. Overworked manual teams take hours or days. Every single delayed response is a lost sale — and a 1-star review waiting to trigger.',
      icon: <Clock className="w-6 h-6 text-[#EF4444]" />
    },
    {
      id: 3,
      title: 'No AI, Just Overwhelmed Teams',
      desc: 'Your support representatives answer the same 20 repeat questions 100 times a day. There is no automated buffer, no AI triage, and no affordable way to scale your operations without endless expensive hiring.',
      icon: <UserX className="w-6 h-6 text-[#EF4444]" />
    }
  ];

  return (
    <section id="problem" className="bg-[#0A0A12] border-t border-b border-white/5 py-24 relative overflow-hidden text-white">
      {/* Background soft red/rose warning orb */}
      <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] rounded-full bg-red-950/10 blur-[130px] -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs text-[#EF4444] font-bold uppercase tracking-widest font-mono">
            The Omnichannel Nightmare
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display leading-tight mt-3 text-white">
            Your customers are everywhere.<br/>Your team is utterly overwhelmed.
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mt-4 leading-relaxed">
            Multi-tab chaos is silently killing your brand sales. Managing isolated communications wastes thousands of human hours and builds severe client friction.
          </p>
        </div>

        {/* 3 Pain Point cards with red outline glow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {painPoints.map((point) => (
            <div 
              key={point.id} 
              className="group bg-[#11111E] border border-white/5 hover:border-red-900/30 rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-rose-950/5 hover:-translate-y-1.5 duration-300 relative overflow-hidden"
            >
              {/* Border indicator */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/20 flex items-center justify-center mb-6">
                {point.icon}
              </div>

              <h3 className="text-lg font-bold text-white mb-3 font-display">{point.title}</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">{point.desc}</p>
            </div>
          ))}
        </div>

        {/* Below warning prompt banner */}
        <div className="bg-gradient-to-r from-red-950/10 via-red-950/25 to-red-950/10 border border-[#DE3E3E]/20 rounded-2xl p-8 text-center max-w-4xl mx-auto backdrop-blur-md">
          <p className="text-base sm:text-lg md:text-xl font-semibold leading-relaxed tracking-wide">
            "There are <span className="text-[#EF4444] font-bold">2.5 billion WhatsApp users</span>, <span className="text-[#EF4444] font-bold">2 billion Instagram users</span>, and billions more on Messenger and Telegram. They are all actively trying to interact with your business. Are you genuinely ready to answer?"
          </p>
        </div>
      </div>
    </section>
  );
}
