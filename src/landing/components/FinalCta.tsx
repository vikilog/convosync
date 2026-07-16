/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowRight,
  CheckCircle2,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { LandingPrimaryButton, LandingSection, LandingSectionHeader } from './landing-ui';

interface FinalCtaProps {
  onStartFree: () => void;
}

export default function FinalCta({ onStartFree }: FinalCtaProps) {
  return (
    <LandingSection id="final-cta" tone="grid" className="text-center relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-channel-green/10 blur-3xl pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        <LandingSectionHeader
          badge="Get started today"
          title="Your customers are waiting"
          titleAccent="on WhatsApp & Instagram."
          description="Unify support, campaigns, and AI in one workspace. Start free — no credit card required."
          className="mb-8"
        />

        <LandingPrimaryButton
          id="last-cta-start"
          onClick={onStartFree}
          showPlayIcon
          className="mx-auto px-8"
        >
          Start free trial
          <ArrowRight className="w-5 h-5" aria-hidden />
        </LandingPrimaryButton>

        <div className="mt-10 flex items-center justify-center gap-4 sm:gap-5">
          {[MessageSquare, Instagram, Send, Mail, MessageCircle].map((Icon, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center shadow-sm"
            >
              <Icon className="w-4 h-4 text-gray-700" aria-hidden />
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
          {['14-day free trial', 'No credit card', 'Cancel anytime', 'Setup in 10 mins'].map(
            (item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-channel-green" aria-hidden />
                {item}
              </span>
            )
          )}
        </div>
      </div>
    </LandingSection>
  );
}
