/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_CONNECTION_OPTIONS } from './connectionOptions';
import { ConnectionTypeCard } from './ConnectionTypeCard';
import { ConnectionBenefitsSidebar } from './ConnectionBenefitsSidebar';
import { ConnectionComparisonTable } from './ConnectionComparisonTable';
import type { WhatsAppConnectionType } from './types';

export type WhatsappConnectionSelectorProps = {
  value: WhatsAppConnectionType | null;
  onChange: (type: WhatsAppConnectionType) => void;
  onGetStarted: (type: WhatsAppConnectionType) => void;
  className?: string;
};

function HeroIllustration() {
  return (
    <div
      className="relative shrink-0 w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-lg shadow-[#25D366]/25 flex items-center justify-center"
      aria-hidden
    >
      <MessageCircle className="w-11 h-11 sm:w-12 sm:h-12 text-white" strokeWidth={1.5} />
      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-primary border-2 border-white flex items-center justify-center text-sm font-black text-white">
        +
      </span>
    </div>
  );
}

export const WhatsappConnectionSelector: FC<WhatsappConnectionSelectorProps> = ({
  value,
  onChange,
  onGetStarted,
  className = '',
}) => {
  const selected = value ?? 'business_api';
  const apiOption = WHATSAPP_CONNECTION_OPTIONS.find((o) => o.type === 'business_api')!;
  const coexistenceOption = WHATSAPP_CONNECTION_OPTIONS.find((o) => o.type === 'app_coexistence')!;
  const coexistenceComingSoon = coexistenceOption.comingSoon === true;

  return (
    <div className={`w-full space-y-10 pb-8 animate-scale-up ${className}`.trim()}>
      <header
        className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 text-left"
        aria-labelledby="whatsapp-connect-hero-title"
      >
        <HeroIllustration />
        <div className="flex-1 min-w-0">
          <h1
            id="whatsapp-connect-hero-title"
            className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight leading-[1.1]"
          >
            Connect WhatsApp
          </h1>
          <p className="mt-3 text-lg sm:text-xl font-semibold text-gray-800">
            Choose Business API or keep using your WhatsApp Business App.
          </p>
          <p className="mt-2 text-sm sm:text-base text-gray-500 font-medium leading-relaxed max-w-2xl">
            Link your Meta Business account for inbox, templates, and automation — or enable
            coexistence so the same number stays active on your phone.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[4.5fr_4.5fr_1.5fr] gap-5 xl:gap-6 items-stretch">
        <ConnectionTypeCard
          data={apiOption}
          selected={selected === 'business_api'}
          onSelect={onChange}
          onGetStarted={onGetStarted}
        />
        <ConnectionTypeCard
          data={coexistenceOption}
          selected={selected === 'app_coexistence'}
          onSelect={onChange}
          onGetStarted={onGetStarted}
        />
        <div className="lg:col-span-1 order-last lg:order-none">
          <ConnectionBenefitsSidebar />
        </div>
      </div>

      {!coexistenceComingSoon && <ConnectionComparisonTable />}
    </div>
  );
};

export type { WhatsAppConnectionType } from './types';
