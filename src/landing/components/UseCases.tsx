/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { USE_CASES } from '../data';
import {
  Building2,
  GraduationCap,
  ShoppingBag,
  HeartPulse,
  Building,
  Store,
  Landmark,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { LandingCard, LandingSection, LandingSectionHeader, landingTabActive, landingTabIdle } from './landing-ui';

export default function UseCases() {
  const [activeIndustryId, setActiveIndustryId] = useState<string>('edtech');

  const selectedCase = USE_CASES.find(uc => uc.id === activeIndustryId) || USE_CASES[0];

  const getIndustryIcon = (id: string, colorClass: string) => {
    switch (id) {
      case 'edtech':
        return <GraduationCap className={`w-5 h-5 ${colorClass}`} />;
      case 'ecommerce':
        return <ShoppingBag className={`w-5 h-5 ${colorClass}`} />;
      case 'healthcare':
        return <HeartPulse className={`w-5 h-5 ${colorClass}`} />;
      case 'realestate':
        return <Building className={`w-5 h-5 ${colorClass}`} />;
      case 'salons':
        return <Store className={`w-5 h-5 ${colorClass}`} />;
      case 'fintech':
        return <Landmark className={`w-5 h-5 ${colorClass}`} />;
      default:
        return <Building2 className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  return (
    <LandingSection id="usecases" tone="white">
      <LandingSectionHeader
        badge="Industries"
        title="Built for every industry"
        titleAccent="that talks to customers."
        description="Ready-to-deploy playbooks for high-volume Indian conversion models."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-nowrap lg:overflow-x-auto pb-3 gap-2 mb-12 scrollbar-none">
        {USE_CASES.map((uc) => {
          const isActive = activeIndustryId === uc.id;
          return (
            <button
              key={uc.id}
              type="button"
              onClick={() => setActiveIndustryId(uc.id)}
              className={`flex w-full lg:w-auto lg:shrink-0 items-center justify-center lg:justify-start gap-2 px-4 py-3 rounded-full text-xs font-bold lg:whitespace-nowrap transition-all cursor-pointer ${
                isActive ? `${landingTabActive} bg-channel-green text-white border-channel-green/30` : landingTabIdle
              }`}
            >
              {getIndustryIcon(uc.id, isActive ? 'text-white' : 'text-emerald-700')}
              <span>{uc.title}</span>
            </button>
          );
        })}
      </div>

      <LandingCard className="p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Narrative side */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                  {getIndustryIcon(selectedCase.id, 'text-emerald-700')}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-gray-900">
                  {selectedCase.title} Automation Hub
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                {selectedCase.description}
              </p>

              {/* Sub features chips */}
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs text-xs sm:text-sm font-semibold text-gray-800 space-y-1.5 font-mono">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2">FEATURES PACK</p>
                {selectedCase.subFeatures.split('•').map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feat.trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right KPI Card visual side */}
              <div className="lg:col-span-6 bg-emerald-50/30 rounded-2xl p-6 sm:p-8 border border-emerald-100 relative overflow-hidden flex flex-col justify-between h-[250px] sm:h-[280px]">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-100 rounded-full blur-[60px] opacity-60 -z-1" aria-hidden />
              
              <div>
                <span className="text-[9px] font-mono tracking-widest font-extrabold text-gray-400 uppercase block mb-1">MEASURED OUTCOMES:</span>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-950 font-display leading-tight">
                  Real conversions experienced by clients in {selectedCase.title}
                </p>
              </div>

              {/* Massive metrics highlight banner */}
              <div className="p-4 rounded-xl bg-white border border-emerald-100 flex items-center justify-between mt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-channel-green flex items-center justify-center text-white shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Verified gains</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight mt-0.5">{selectedCase.metrics}</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full">ROI</span>
              </div>

              <p className="text-[10px] text-gray-500 text-center">
                Analytics verified by customer cohorts in India.
              </p>
            </div>

          </div>
        </LandingCard>
    </LandingSection>
  );
}
