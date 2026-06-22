/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Check, Info, Sparkles, Receipt, Coins } from 'lucide-react';
import { PRICING_PLANS } from '../data';
import { trackEvent } from '../../lib/analytics';

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
    <section id="pricing" className="bg-white border-b border-gray-100 py-24 text-gray-900 text-center relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold text-brand-indigo tracking-widest font-mono">
            Subscription Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-gray-900 mt-2">
            Start completely free. Scale with confidence.
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 font-sans leading-relaxed">
            No expensive per-message markup from us. Pay your official Meta API costs directly. Setup in minutes.
          </p>
        </div>

        {/* Pricing Toggle Switch (Annual Discount = 2 months free) */}
        <div className="flex items-center justify-center space-x-4 mb-16">
          <span className={`text-xs sm:text-sm font-semibold transition-colors ${!isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>Billed Monthly</span>
          <button
            id="billing-frequency-toggle"
            onClick={() => {
              const next = !isAnnual;
              trackEvent('pricing_billing_toggle', { billing: next ? 'annual' : 'monthly' });
              setIsAnnual(next);
            }}
            className="w-14 h-7 bg-brand-indigo/10 rounded-full p-1 border border-brand-indigo/20 flex items-center justify-start cursor-pointer transition-all focus:outline-none"
          >
            <div className={`w-5 h-5 bg-brand-gradient rounded-full transition-transform transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center space-x-1.5">
            <span className={`text-xs sm:text-sm font-semibold transition-colors ${isAnnual ? 'text-brand-indigo font-extrabold' : 'text-gray-400'}`}>Billed Annually</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full font-mono uppercase">2 months free 🔥</span>
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
                className={`flex flex-col justify-between p-8 rounded-3xl transition-transform transform hover:-translate-y-1 ${
                  isGrowth
                    ? 'bg-[#FCFBFF] border-2 border-brand-indigo shadow-xl shadow-brand-indigo/10 relative scale-105'
                    : 'bg-white border border-gray-100 shadow-xs'
                }`}
              >
                {/* Popular Pill badge */}
                {isGrowth && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-gradient text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center space-x-1">
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
                    className={`w-full font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-md shadow-brand-indigo/5 ${
                      isGrowth
                        ? 'bg-brand-gradient hover:bg-brand-gradient-hover text-white shadow-brand-purple/25'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
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
        <div className="mt-14 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg shrink-0 select-none">
            🇮🇳
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

      </div>
    </section>
  );
}
