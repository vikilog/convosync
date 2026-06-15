/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useNavigate } from 'react-router-dom';
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
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';

export default function LandingView() {
  const navigate = useNavigate();

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

      <Hero onStartFree={() => handleStartSignup('growth')} />

      <ChannelLogosBar />

      <ProblemSection />

      <SolutionDiagram />

      <FeaturesDeepDive />

      <AiAgentsSpotlight onStartAgentDemo={() => handleStartSignup('growth')} />

      <HowItWorks />

      <UseCases />

      <Testimonials />

      <PricingSection onSelectPlan={handleStartSignup} />

      <FinalCta onStartFree={() => handleStartSignup('growth')} />

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
