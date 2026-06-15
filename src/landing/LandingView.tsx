/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ChannelLogosBar from './components/ChannelLogosBar';
import ProblemSection from './components/ProblemSection';
import SolutionDiagram from './components/SolutionDiagram';
import FeaturesDeepDive from './components/FeaturesDeepDive';
import AiAgentsSpotlight from './components/AiAgentsSpotlight';
import HowItWorks from './components/HowItWorks';
import UseCases from './components/UseCases';
import Testimonials from './components/Testimonials';
import PricingSection from './components/PricingSection';
import ComparisonTable from './components/ComparisonTable';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';

export default function LandingView() {
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStartSignup = (planId: string = 'growth', isAnnual = false) => {
    const params = new URLSearchParams({ plan: planId });
    if (isAnnual) params.set('billing', 'annual');
    navigate(`/signup?${params.toString()}`);
  };

  return (
    <div id="root" className="min-h-screen bg-[#FAFAFA] font-sans antialiased text-gray-900 scroll-smooth">
      <Navbar
        onNavigate={handleNavigate}
        onLogin={() => navigate('/login')}
        onSignup={() => handleStartSignup('growth')}
      />

      <Hero
        onStartFree={() => handleStartSignup('growth')}
        onWatchDemo={() => setShowDemoModal(true)}
      />

      <ChannelLogosBar />

      <ProblemSection />

      <SolutionDiagram />

      <FeaturesDeepDive />

      <AiAgentsSpotlight onStartAgentDemo={() => handleStartSignup('growth')} />

      <HowItWorks />

      <UseCases />

      <Testimonials />

      <PricingSection onSelectPlan={handleStartSignup} />

      <ComparisonTable />

      <FinalCta
        onStartFree={() => handleStartSignup('growth')}
        onBookDemo={() => setShowDemoModal(true)}
      />

      <Footer onNavigate={handleNavigate} />

      {showDemoModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121222] border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden text-white relative shadow-2xl">
            <button
              id="close-demo-modal"
              onClick={() => setShowDemoModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors z-30 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative aspect-video bg-black flex flex-col items-center justify-center p-8 text-center bg-gradient-to-tr from-purple-950 via-gray-950 to-indigo-950 select-none">
              <div className="space-y-4 max-w-md my-auto flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-brand-indigo/25 border border-brand-indigo text-brand-indigo flex items-center justify-center text-xl animate-pulse">
                  <Bot className="w-10 h-10 animate-bounce" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                  WaBiz 2-minute Product Overview
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                  Watch how our AI Agent Sara instantly answers a complex WhatsApp return enquiry,
                  checks the shipping ledger API, and recovers a lost cart.
                </p>

                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-6 relative">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-brand-indigo rounded-full animate-[progress_8s_infinite]"
                    style={{ width: '45%' }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-mono block">
                  SIMULATED PRESENTATION PLAYER ACTIVE
                </span>
              </div>

              <div className="absolute bottom-5 left-8 right-8 flex items-center justify-between text-[11px] text-gray-500 font-mono border-t border-white/5 pt-3 w-full max-w-2xl px-2 self-center">
                <span>Presenter: Nitin V., CTO, Lazybinary</span>
                <span>Length: 1:42</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
