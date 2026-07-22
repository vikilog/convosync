/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
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
import BookDemoSection from './components/BookDemoSection';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';

export default function LandingView() {
  const navigate = useNavigate();

  const handleNavigate = (sectionId: string) => {
    trackEvent('nav_scroll', { section_id: sectionId });
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStartSignup = (planId: string = 'starter', source = 'landing') => {
    trackEvent('cta_click', {
      source,
      plan_id: planId,
      billing: 'monthly',
    });
    navigate(`/signup?plan=${encodeURIComponent(planId)}`);
  };

  return (
    <div className="landing-page min-h-screen app-grid-bg font-sans antialiased text-gray-900 scroll-smooth">
      <Navbar
        onNavigate={handleNavigate}
        onLogin={() => {
          trackEvent('cta_click', { source: 'navbar_login' });
          navigate('/login');
        }}
        onSignup={() => handleStartSignup('starter', 'navbar')}
      />

      <Hero onStartFree={() => handleStartSignup('starter', 'hero')} />

      <ChannelLogosBar />

      <ProblemSection />

      <SolutionDiagram />

      <FeaturesDeepDive />

      <AiAgentsSpotlight onStartAgentDemo={() => handleStartSignup('starter', 'ai_agents')} />

      <HowItWorks />

      <UseCases />

      <Testimonials />

      <PricingSection onSelectPlan={(planId) => handleStartSignup(planId, 'pricing')} />

      <BookDemoSection />

      <FinalCta onStartFree={() => handleStartSignup('starter', 'final_cta')} />

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
