/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { USE_CASES } from '../data';
import { 
  Building2, GraduationCap, ShoppingBag, HeartPulse, Sparkles, Building, 
  Store, Landmark, CheckCircle2, TrendingUp
} from 'lucide-react';

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
    <section id="usecases" className="bg-white border-b border-gray-100 py-24 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-extrabold text-brand-indigo tracking-widest font-mono">
            Target Industries
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-gray-900 mt-2">
            Engineered for every industry conversing with customers
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 font-sans">
            Ready-to-deploy automated playbooks optimized for specific high-volume Indian conversion models.
          </p>
        </div>

        {/* 6 Industry tabs picker bar */}
        <div className="flex overflow-x-auto pb-3 gap-2 border-b border-gray-100 mb-12 scrollbar-none">
          {USE_CASES.map((uc) => {
            const isActive = activeIndustryId === uc.id;
            return (
              <button
                key={uc.id}
                onClick={() => setActiveIndustryId(uc.id)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-brand-indigo text-white shadow-md shadow-brand-indigo/15' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {getIndustryIcon(uc.id, isActive ? 'text-white' : 'text-brand-indigo')}
                <span>{uc.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Industry details layout */}
        <div className="bg-gray-50 rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Narrative side */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="w-10 h-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo shrink-0">
                  {getIndustryIcon(selectedCase.id, 'text-brand-indigo')}
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
            <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-[250px] sm:h-[280px]">
              
              {/* Background abstract layout */}
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-50 rounded-full blur-[60px] opacity-60 -z-1" />
              
              <div>
                <span className="text-[9px] font-mono tracking-widest font-extrabold text-gray-400 uppercase block mb-1">MEASURED OUTCOMES:</span>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-950 font-display leading-tight">
                  Real conversions experienced by clients in {selectedCase.title}
                </p>
              </div>

              {/* Massive metrics highlight banner */}
              <div className="p-4 rounded-xl bg-brand-indigo/5 border border-brand-indigo/10 flex items-center justify-between mt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-indigo flex items-center justify-center text-white shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Verified Gains</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight mt-0.5">{selectedCase.metrics}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-extrabold text-brand-indigo bg-brand-indigo/15 px-2 py-1 rounded">PROVING ROI</span>
              </div>

              <p className="text-[10px] text-gray-400 font-mono text-center">
                📊 Real analytics verified by customer satisfaction cohorts in India in 2026.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
