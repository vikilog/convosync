/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, MessageSquareCode } from 'lucide-react';

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 text-gray-900 shadow-sm border-b border-gray-100 backdrop-blur-md py-3'
          : 'bg-dark-navy/80 text-white backdrop-blur-sm py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            id="nav-logo"
            onClick={() => handleLinkClick('hero')}
            className="flex items-center space-x-2.5 group cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-brand-indigo flex items-center justify-center shadow-lg shadow-brand-indigo/30 transition-transform group-hover:scale-105">
              <MessageSquareCode className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold font-display tracking-tight flex items-center">
                WaBiz
                <span className="text-xs ml-1.5 px-1.5 py-0.5 roundedbg rounded-md bg-brand-indigo/10 text-brand-indigo font-normal border border-brand-indigo/20 hidden sm:inline">
                  v2.0
                </span>
              </span>
              <p className="text-[10px] text-gray-500 font-mono tracking-wider -mt-1 group-hover:text-brand-indigo transition-colors">By Lazybinary</p>
            </div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <button
              id="feature-nav-btn"
              onClick={() => handleLinkClick('features')}
              className={`transition-colors cursor-pointer ${
                isScrolled ? 'text-gray-600 hover:text-brand-indigo' : 'text-gray-300 hover:text-white'
              }`}
            >
              Features
            </button>
            <button
              id="channels-nav-btn"
              onClick={() => handleLinkClick('channels')}
              className={`transition-colors cursor-pointer ${
                isScrolled ? 'text-gray-600 hover:text-brand-indigo' : 'text-gray-300 hover:text-white'
              }`}
            >
              Channels
            </button>
            <button
              id="agents-nav-btn"
              onClick={() => handleLinkClick('ai-agents')}
              className={`transition-colors cursor-pointer ${
                isScrolled ? 'text-gray-600 hover:text-brand-indigo' : 'text-gray-300 hover:text-white'
              }`}
            >
              AI Agents
            </button>
            <button
              id="pricing-nav-btn"
              onClick={() => handleLinkClick('pricing')}
              className={`transition-colors cursor-pointer ${
                isScrolled ? 'text-gray-600 hover:text-brand-indigo' : 'text-gray-300 hover:text-white'
              }`}
            >
              Pricing
            </button>
            <button
              id="usecases-nav-btn"
              onClick={() => handleLinkClick('usecases')}
              className={`transition-colors cursor-pointer ${
                isScrolled ? 'text-gray-600 hover:text-brand-indigo' : 'text-gray-300 hover:text-white'
              }`}
            >
              Industry Solutions
            </button>
          </div>

          {/* Right CTA buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              id="nav-login-btn"
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin?.();
              }}
              className={`text-sm font-medium px-4 py-2 hover:underline transition-all cursor-pointer ${
                isScrolled ? 'text-gray-600 hover:text-brand-indigo' : 'text-gray-300 hover:text-white'
              }`}
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
              className="bg-brand-indigo hover:bg-brand-indigo/90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-indigo/25 hover:shadow-brand-indigo/40 hover:-translate-y-0.5 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-drawer" className="md:hidden bg-white text-gray-900 border-b border-gray-200 py-4 px-6 animate-fade-in shadow-xl">
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
                className="bg-brand-indigo hover:bg-brand-indigo/90 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-1 cursor-pointer"
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
