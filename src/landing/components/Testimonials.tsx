/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data';
import { PRODUCT_NAME } from '../brand';
import { LandingCard, LandingSection, LandingSectionHeader } from './landing-ui';

export default function Testimonials() {
  return (
    <LandingSection id="testimonials" tone="muted">
      <LandingSectionHeader
        badge="Social proof"
        title="Real businesses."
        titleAccent="Real results."
        description={`Teams across India run support and campaigns on ${PRODUCT_NAME} every day.`}
      />

      <LandingCard className="p-8 sm:p-12 relative overflow-hidden max-w-4xl mx-auto mb-10 border-emerald-200/60 bg-emerald-50/40">
        <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center shrink-0">
            <Quote className="w-6 h-6 text-emerald-700" aria-hidden />
          </div>
          <div className="space-y-5">
            <p className="text-lg sm:text-xl font-semibold leading-relaxed text-gray-900">
              &ldquo;We replaced 3 different tools with {PRODUCT_NAME}. WhatsApp, Instagram, and Telegram
              are all in one place. The AI agent handles 89% of student queries. Best investment we
              made this year.&rdquo;
            </p>
            <div className="border-t border-emerald-200/60 pt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-gray-950">Deepak Sharma</p>
                <p className="text-sm text-gray-600">Founder, ExamPilot EdTech · Delhi</p>
              </div>
              <span className="text-xs bg-white border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full font-semibold">
                Case study
              </span>
            </div>
          </div>
        </div>
      </LandingCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TESTIMONIALS.map((test) => (
          <LandingCard
            key={test.id}
            className="p-6 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <Quote className="w-7 h-7 text-emerald-200" aria-hidden />
              <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{test.quote}&rdquo;</p>
            </div>
            <div className="border-t border-gray-100 pt-4 mt-6">
              <p className="text-sm font-bold text-gray-950">{test.author}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {test.role}, {test.company} ·{' '}
                <span className="text-emerald-700 font-medium">{test.location}</span>
              </p>
            </div>
          </LandingCard>
        ))}
      </div>
    </LandingSection>
  );
}
