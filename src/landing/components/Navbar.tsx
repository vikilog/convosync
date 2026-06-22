/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../brand';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
  onLogin?: () => void;
  onSignup?: () => void;
}

export default function Navbar({ onNavigate, onLogin, onSignup }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onNavigate(sectionId);
  };

  return (
    <nav
      id="main-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 text-gray-900 backdrop-blur-md border-b ${
        isScrolled
          ? 'shadow-sm border-gray-100 py-3'
          : 'border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            id="nav-logo"
            onClick={() => handleLinkClick('hero')}
            className="group flex items-center gap-3 cursor-pointer text-left"
          >
            <img
              src={PRODUCT_LOGO}
              alt={PRODUCT_NAME}
              className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 object-contain transition-transform group-hover:scale-[1.02]"
            />
            <div className="min-w-0 hidden sm:block">
              <span className="block text-xl font-bold font-display tracking-tight leading-tight text-gray-950">
                {PRODUCT_NAME}
              </span>
            </div>
          </button>

          {/* Desktop Nav — hamburger until large screens (tablet-friendly) */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-sm font-medium">
            <button
              id="feature-nav-btn"
              onClick={() => handleLinkClick('features')}
              className="transition-colors cursor-pointer text-gray-600 hover:text-brand-indigo"
            >
              Features
            </button>
            <button
              id="channels-nav-btn"
              onClick={() => handleLinkClick('channels')}
              className="transition-colors cursor-pointer text-gray-600 hover:text-brand-indigo"
            >
              Channels
            </button>
            <button
              id="agents-nav-btn"
              onClick={() => handleLinkClick('ai-agents')}
              className="transition-colors cursor-pointer text-gray-600 hover:text-brand-indigo"
            >
              AI Agents
            </button>
            <button
              id="pricing-nav-btn"
              onClick={() => handleLinkClick('pricing')}
              className="transition-colors cursor-pointer text-gray-600 hover:text-brand-indigo"
            >
              Pricing
            </button>
            <button
              id="usecases-nav-btn"
              onClick={() => handleLinkClick('usecases')}
              className="transition-colors cursor-pointer text-gray-600 hover:text-brand-indigo"
            >
              Industry Solutions
            </button>
          </div>

          {/* Right CTA buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              id="nav-login-btn"
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin?.();
              }}
              className="text-sm font-medium px-4 py-2 hover:underline transition-all cursor-pointer text-gray-600 hover:text-brand-indigo"
            >
              Login
            </button>
            <button
              id="nav-cta-btn"
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onSignup?.();
              }}
              className="bg-brand-gradient hover:bg-brand-gradient-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-purple/25 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-drawer" className="lg:hidden bg-white text-gray-900 border-b border-gray-200 py-4 px-6 animate-fade-in shadow-xl">
          <div className="flex flex-col space-y-4">
            <button
              id="mob-feat-btn"
              onClick={() => handleLinkClick('features')}
              className="text-left font-medium text-gray-700 hover:text-brand-indigo py-1.5"
            >
              Features
            </button>
            <button
              id="mob-chan-btn"
              onClick={() => handleLinkClick('channels')}
              className="text-left font-medium text-gray-700 hover:text-brand-indigo py-1.5"
            >
              Channels
            </button>
            <button
              id="mob-ag-btn"
              onClick={() => handleLinkClick('ai-agents')}
              className="text-left font-medium text-gray-700 hover:text-brand-indigo py-1.5"
            >
              AI Agents
            </button>
            <button
              id="mob-pr-btn"
              onClick={() => handleLinkClick('pricing')}
              className="text-left font-medium text-gray-700 hover:text-brand-indigo py-1.5"
            >
              Pricing
            </button>
            <button
              id="mob-uc-btn"
              onClick={() => handleLinkClick('usecases')}
              className="text-left font-medium text-gray-700 hover:text-brand-indigo py-1.5"
            >
              Industry Solutions
            </button>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                id="mob-login"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogin?.();
                }}
                className="text-gray-600 font-semibold text-sm hover:text-brand-indigo"
              >
                Login
              </button>
              <button
                id="mob-cta"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignup?.();
                }}
                className="bg-brand-gradient hover:bg-brand-gradient-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-1 cursor-pointer"
              >
                <span>Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
