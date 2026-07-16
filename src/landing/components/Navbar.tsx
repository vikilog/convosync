/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Play } from 'lucide-react';
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
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onNavigate(sectionId);
  };

  const navLinkClass =
    'transition-colors cursor-pointer text-gray-600 hover:text-emerald-700 font-medium';

  return (
    <nav
      id="main-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm py-3'
          : 'bg-[#f8faf9]/80 backdrop-blur-sm border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            id="nav-logo"
            onClick={() => handleLinkClick('hero')}
            className="group flex items-center gap-3 cursor-pointer text-left"
          >
            <img
              src={PRODUCT_LOGO}
              alt={PRODUCT_NAME}
              className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 object-contain transition-transform group-hover:scale-[1.02]"
            />
            <span className="hidden sm:block text-xl font-bold font-display tracking-tight text-gray-950">
              {PRODUCT_NAME}
            </span>
          </button>

          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-sm">
            {[
              ['feature-nav-btn', 'features', 'Features'],
              ['channels-nav-btn', 'channels', 'Channels'],
              ['agents-nav-btn', 'ai-agents', 'AI Agents'],
              ['pricing-nav-btn', 'pricing', 'Pricing'],
              ['usecases-nav-btn', 'usecases', 'Industries'],
            ].map(([id, section, label]) => (
              <button
                key={id}
                id={id}
                onClick={() => handleLinkClick(section)}
                className={navLinkClass}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button
              id="nav-login-btn"
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin?.();
              }}
              className={`text-sm px-4 py-2 ${navLinkClass}`}
            >
              Login
            </button>
            {isScrolled && (
              <button
                id="nav-cta-btn"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignup?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-channel-green hover:bg-[#20bd5a] text-white text-sm font-bold px-5 py-2.5 shadow-md shadow-emerald-600/15 transition-all cursor-pointer animate-fade-in"
              >
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden />
                <span>Start free trial</span>
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>

          <div className="lg:hidden">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full border border-gray-200 bg-white/90 text-gray-700 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-drawer"
          className="lg:hidden bg-white border-b border-gray-200 py-4 px-6 animate-fade-in shadow-lg"
        >
          <div className="flex flex-col space-y-3">
            {[
              ['mob-feat-btn', 'features', 'Features'],
              ['mob-chan-btn', 'channels', 'Channels'],
              ['mob-ag-btn', 'ai-agents', 'AI Agents'],
              ['mob-pr-btn', 'pricing', 'Pricing'],
              ['mob-uc-btn', 'usecases', 'Industries'],
            ].map(([id, section, label]) => (
              <button
                key={id}
                id={id}
                onClick={() => handleLinkClick(section)}
                className="text-left font-medium text-gray-700 hover:text-emerald-700 py-1.5 cursor-pointer"
              >
                {label}
              </button>
            ))}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                id="mob-login"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogin?.();
                }}
                className="text-gray-600 font-semibold text-sm hover:text-emerald-700 cursor-pointer"
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
                className="inline-flex items-center gap-1 rounded-full bg-channel-green text-white text-xs font-bold px-4 py-2.5 cursor-pointer"
              >
                <span>Free trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
