/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link2Off, Clock, UserX } from 'lucide-react';
import { LandingCard, LandingSection, LandingSectionHeader } from './landing-ui';

export default function ProblemSection() {
  const painPoints = [
    {
      id: 1,
      title: 'Fragmented channels',
      desc: 'WhatsApp on one phone, Instagram on another, email in Gmail — leads and urgent questions slip through every day.',
      icon: Link2Off,
    },
    {
      id: 2,
      title: 'Slow response times',
      desc: 'Customers expect replies in minutes. Manual teams take hours. Every delay is a lost sale and a bad review.',
      icon: Clock,
    },
    {
      id: 3,
      title: 'Overwhelmed teams',
      desc: 'Support reps answer the same questions all day. No AI triage, no automation — scaling means endless hiring.',
      icon: UserX,
    },
  ];

  return (
    <LandingSection id="problem" tone="muted">
      <LandingSectionHeader
        badge="The problem"
        title="Your customers are everywhere."
        titleAccent="Your team is overwhelmed."
        description="Multi-tab chaos wastes hours and creates friction. Most growing teams can't keep up across channels."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {painPoints.map((point) => (
          <LandingCard key={point.id} className="p-6 sm:p-8 hover:shadow-md transition-shadow duration-200">
            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
              <point.icon className="w-5 h-5 text-red-500" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-gray-950 mb-2">{point.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{point.desc}</p>
          </LandingCard>
        ))}
      </div>

      <LandingCard className="p-6 sm:p-8 text-center max-w-4xl mx-auto border-red-100/80 bg-red-50/30">
        <p className="text-base sm:text-lg font-medium text-gray-800 leading-relaxed">
          Billions of users message businesses on WhatsApp, Instagram, and Telegram every day.{' '}
          <span className="text-red-600 font-semibold">Are you ready to answer?</span>
        </p>
      </LandingCard>
    </LandingSection>
  );
}
