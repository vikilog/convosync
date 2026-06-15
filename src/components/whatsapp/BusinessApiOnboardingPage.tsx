/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { Bot, Cloud, MessageCircle, Webhook, Zap } from 'lucide-react';
import {
  BUSINESS_API_BENEFITS,
  BUSINESS_API_IMPORTANT_NOTES,
  BUSINESS_API_PROGRESS_STEPS,
  BUSINESS_API_REQUIREMENTS,
  BUSINESS_API_SETUP_TIMELINE,
} from './businessApiOnboardingData';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';
import { RequirementsChecklist } from './RequirementsChecklist';
import { BenefitsSection } from './BenefitsSection';
import { SetupTimeline } from './SetupTimeline';
import { ImportantNotes } from './ImportantNotes';
import { OnboardingFooter } from './OnboardingFooter';

export type BusinessApiOnboardingPageProps = {
  activeStep?: number;
  onBack: () => void;
  onStart: () => void;
  isStarting?: boolean;
};

function WhatsAppBusinessIllustration() {
  return (
    <div
      className="relative shrink-0 w-full sm:w-[220px] lg:w-[260px] h-[160px] sm:h-[180px]"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#e6f7ec] via-white to-sky-50 border border-slate-200" />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[#25D366] shadow-lg flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-white" strokeWidth={1.75} />
          </div>
          <div className="absolute -top-2 -right-3 p-2 rounded-lg bg-white border border-slate-200 shadow-md text-primary">
            <Cloud className="w-4 h-4" />
          </div>
          <div className="absolute -bottom-2 -left-3 p-2 rounded-lg bg-primary text-white shadow-md">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="absolute top-1/2 -right-10 p-1.5 rounded-md bg-white border border-slate-200 text-[#006d2f] shadow-sm">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="absolute bottom-0 -right-8 p-1.5 rounded-md bg-white border border-slate-200 text-primary shadow-sm">
            <Webhook className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const BusinessApiOnboardingPage: FC<BusinessApiOnboardingPageProps> = ({
  activeStep = 1,
  onBack,
  onStart,
  isStarting = false,
}) => {
  return (
    <div className="max-w-4xl mx-auto pb-4 animate-scale-up">
      <header className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8 mb-8">
        <div className="flex-1 text-left order-2 sm:order-1">
          <p className="text-sm font-black uppercase tracking-widest text-primary mb-2">
            WhatsApp Business API
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-tight">
            Connect WhatsApp Business API
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 font-medium leading-relaxed max-w-xl">
            Set up a dedicated WhatsApp Business account for automation, AI agents, booking
            management, and customer communication.
          </p>
        </div>
        <div className="order-1 sm:order-2 sm:pt-1">
          <WhatsAppBusinessIllustration />
        </div>
      </header>

      <div className="mb-10 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <OnboardingStepIndicator steps={BUSINESS_API_PROGRESS_STEPS} activeStep={activeStep} />
      </div>

      <div className="space-y-6">
        <RequirementsChecklist
          title="Before You Start"
          description="To successfully connect WhatsApp Business API, please make sure you have the following ready."
          items={BUSINESS_API_REQUIREMENTS}
        />

        <BenefitsSection title="Benefits of WhatsApp Business API" items={BUSINESS_API_BENEFITS} />

        <SetupTimeline title="Setup Process" steps={BUSINESS_API_SETUP_TIMELINE} />

        <ImportantNotes notes={BUSINESS_API_IMPORTANT_NOTES} />
      </div>

      <OnboardingFooter onStart={onStart} onBack={onBack} isStarting={isStarting} />
    </div>
  );
};
