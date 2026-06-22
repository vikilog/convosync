/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { Check, MessageCircle, ShieldCheck, Smartphone } from 'lucide-react';
import {
  COEXISTENCE_BENEFITS,
  COEXISTENCE_CONNECTION_TIMELINE,
  COEXISTENCE_IMPORTANT_NOTES,
  COEXISTENCE_MOBILE_FEATURES,
  COEXISTENCE_PLATFORM_FEATURES,
  COEXISTENCE_PROGRESS_STEPS,
  COEXISTENCE_REQUIREMENTS,
  COEXISTENCE_TRUST_BADGES,
} from './coexistenceOnboardingData';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';
import { RequirementsChecklist } from './RequirementsChecklist';
import { BenefitsSection } from './BenefitsSection';
import { HowItWorksSection } from './HowItWorksSection';
import { ConnectionTimeline } from './ConnectionTimeline';
import { ImportantNotes } from './ImportantNotes';
import { OnboardingFooter } from './OnboardingFooter';

export type CoexistenceOnboardingPageProps = {
  activeStep?: number;
  onBack: () => void;
  onStart: () => void;
  isStarting?: boolean;
};

function WhatsAppBusinessAppIllustration() {
  return (
    <div
      className="relative shrink-0 w-full sm:w-[240px] lg:w-[280px] h-[170px] sm:h-[190px]"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#e6f7ec] via-white to-sky-50 border border-slate-200" />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="relative flex items-end gap-3">
          <div className="w-[72px] h-[128px] rounded-[1.25rem] bg-gray-900 shadow-xl border-4 border-gray-800 flex flex-col items-center pt-3 gap-1">
            <span className="w-8 h-1 rounded-full bg-gray-600" />
            <div className="flex-1 w-full px-2 pb-2 flex flex-col justify-end">
              <div className="w-full h-14 rounded-lg bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-[#25D366]" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-2">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-md text-primary">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="p-2.5 rounded-xl bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30">
              <MessageCircle className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBadges() {
  return (
    <ul className="mt-5 flex flex-col gap-2">
      {COEXISTENCE_TRUST_BADGES.map((badge) => (
        <li
          key={badge}
          className="flex items-center gap-2 text-sm font-bold text-gray-700"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#e6f7ec] text-[#006d2f] shrink-0">
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
          {badge}
        </li>
      ))}
    </ul>
  );
}

export const CoexistenceOnboardingPage: FC<CoexistenceOnboardingPageProps> = ({
  activeStep = 1,
  onBack,
  onStart,
  isStarting = false,
}) => {
  return (
    <div className="max-w-4xl mx-auto pb-4 animate-scale-up">
      <header className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10 mb-8">
        <div className="flex-1 text-left order-2 lg:order-1">
          <p className="text-sm font-black uppercase tracking-widest text-[#006d2f] mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            WhatsApp Business App Coexistence
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-tight">
            Connect Existing WhatsApp Business App
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 font-medium leading-relaxed max-w-xl">
            Keep using your WhatsApp Business App while enabling AI automation, shared inbox, and
            team collaboration.
          </p>
          <TrustBadges />
        </div>
        <div className="order-1 lg:order-2 lg:pt-1">
          <WhatsAppBusinessAppIllustration />
        </div>
      </header>

      <div className="mb-10 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <OnboardingStepIndicator steps={COEXISTENCE_PROGRESS_STEPS} activeStep={activeStep} />
      </div>

      <div className="space-y-6">
        <RequirementsChecklist
          title="Requirements"
          description="Before connecting your WhatsApp Business App, please ensure the following requirements are met."
          items={COEXISTENCE_REQUIREMENTS}
        />

        <BenefitsSection title="What You'll Get" items={COEXISTENCE_BENEFITS} />

        <HowItWorksSection
          mobileFeatures={COEXISTENCE_MOBILE_FEATURES}
          platformFeatures={COEXISTENCE_PLATFORM_FEATURES}
        />

        <ImportantNotes notes={COEXISTENCE_IMPORTANT_NOTES} />

        <ConnectionTimeline
          title="Connection Process"
          steps={COEXISTENCE_CONNECTION_TIMELINE}
        />
      </div>

      <OnboardingFooter
        onStart={onStart}
        onBack={onBack}
        startLabel="Connect WhatsApp Business App"
        isStarting={isStarting}
      />
    </div>
  );
};
