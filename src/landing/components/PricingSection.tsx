/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Check, Info, Sparkles, Receipt, Coins } from 'lucide-react';
import { PRICING_PLANS } from '../data';
import { trackEvent } from '../../lib/analytics';
import { LandingSection, LandingSectionHeader } from './landing-ui';

interface PricingSectionProps {
  onSelectPlan: (planId: string, isAnnual: boolean) => void;
}

export default function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPriceText = (planId: string, baseMonthly: number, baseAnnual: number) => {
    if (planId === 'enterprise') return 'Custom';
    return isAnnual ? `₹${baseAnnual}` : `₹${baseMonthly}`;
  };

  return (
    <LandingSection id="pricing" tone="grid" className="text-center">
      <LandingSectionHeader
        badge="Pricing"
        title="Start free."
        titleAccent="Scale with confidence."
        description="No per-message markup from us. Pay official Meta API costs directly."
      />

      <div className="flex items-center justify-center space-x-4 mb-14">
        <span className={`text-sm font-semibold ${!isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
        <button
          id="billing-frequency-toggle"
          onClick={() => {
            const next = !isAnnual;
            trackEvent('pricing_billing_toggle', { billing: next ? 'annual' : 'monthly' });
            setIsAnnual(next);
          }}
          className="w-14 h-7 bg-emerald-100 rounded-full p-1 border border-emerald-200 flex items-center cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-channel-green"
        >
          <div className={`w-5 h-5 bg-channel-green rounded-full transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
        </button>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold ${isAnnual ? 'text-emerald-800' : 'text-gray-400'}`}>Annual</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">2 months free</span>
        </div>
      </div>

        {/* 3 Main Pricing Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isGrowth = plan.id === 'growth';
            const price = getPriceText(plan.id, plan.priceMonthly, plan.priceAnnual);
            
            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between p-8 rounded-3xl transition-transform hover:-translate-y-1 ${
                  isGrowth
                    ? 'bg-white border-2 border-channel-green shadow-xl shadow-emerald-600/10 relative scale-105'
                    : 'bg-white/90 border border-gray-200/80 shadow-sm'
                }`}
              >
                {/* Popular Pill badge */}
                {isGrowth && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-channel-green text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recommended Plan</span>
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold font-display text-gray-950 text-left">{plan.name}</h3>
                  <p className="text-xs text-gray-500 text-left mt-2 min-h-12 leading-relaxed">{plan.description}</p>
                  
                  {/* Price display block */}
                  <div className="my-6 py-4 border-y border-gray-50 flex items-baseline space-x-1.5 text-left">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-950 font-display">
                      {price}
                    </span>
                    {plan.id !== 'enterprise' && (
                      <span className="text-xs text-gray-500 font-semibold">/ month</span>
                    )}
                  </div>

                  {/* Savings display info */}
                  {isAnnual && plan.id !== 'enterprise' && (
                    <p className="text-[10px] text-emerald-600 font-bold font-mono text-left -mt-4 mb-4">
                      🎉 saving ₹{plan.id === 'starter' ? '4,800' : '12,000'} per year!
                    </p>
                  )}

                  {/* Features list */}
                  <ul className="space-y-3.5 mt-4 text-left">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-2.5 text-xs text-gray-600 leading-relaxed font-sans font-medium">
                        <span className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    id={`plan-cta-${plan.id}`}
                    onClick={() => onSelectPlan(plan.id, isAnnual)}
                    className={`w-full font-bold text-xs py-3.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                      isGrowth
                        ? 'bg-channel-green hover:bg-[#20bd5a] text-white shadow-md shadow-emerald-600/15'
                        : 'bg-gray-50 hover:bg-emerald-50 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Made for India localization disclosure bottom */}
        <div className="mt-14 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 bg-white border border-gray-200/80 rounded-2xl p-5 text-left">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-sm font-bold shrink-0">
            IN
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-gray-950 font-display">
              Made in India. Locally Priced.
            </p>
            <p className="text-[11.5px] text-gray-500 font-sans mt-0.5">
              Secure INR invoicing. Pay comfortably in Indian Rupees via UPI, NetBanking, local credits, or business cards. No complicated foreign exchange hurdles or undisclosed markups.
            </p>
          </div>
        </div>
    </LandingSection>
  );
}
