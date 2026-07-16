/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Github, Twitter, Linkedin, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../brand';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

const linkClass =
  'text-sm text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer text-left w-full';

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="relative z-20 border-t border-gray-200/80 hero-grid-bg pt-16 pb-8 text-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0 mb-14">
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="shrink-0 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-gray-100">
                <img
                  src={PRODUCT_LOGO}
                  alt={PRODUCT_NAME}
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-bold font-display tracking-tight text-gray-950 block leading-tight">
                  {PRODUCT_NAME}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed max-w-md">
              The AI-powered omnichannel customer communication platform helping growing Indian brands unify
              WhatsApp, Instagram, Telegram, and Email into one intelligent, self-resolving workspace.
            </p>

            <div className="flex items-center gap-3 pt-1">
              {[
                { label: 'Twitter', Icon: Twitter },
                { label: 'LinkedIn', Icon: Linkedin },
                { label: 'Facebook', Icon: Facebook },
                { label: 'GitHub', Icon: Github },
              ].map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-channel-green hover:border-channel-green hover:text-white transition-colors shadow-sm cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-gray-950 uppercase tracking-widest font-mono">Product</h4>
            <ul className="space-y-3">
              {[
                { label: 'Omnichannel Inbox', section: 'features' },
                { label: 'AI Agents Integration', section: 'ai-agents' },
                { label: 'Campaign Broadcasts', section: 'features' },
                { label: 'Journey Automation', section: 'features' },
                { label: 'Analytics & Reports', section: 'features' },
              ].map((item) => (
                <li key={item.label}>
                  <button type="button" onClick={() => onNavigate(item.section)} className={linkClass}>
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <a href="#" className={linkClass}>
                  Developer API Docs
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-gray-950 uppercase tracking-widest font-mono">Channels</h4>
            <ul className="space-y-3">
              {[
                { label: 'WhatsApp Business API', color: 'bg-channel-green' },
                { label: 'Instagram DM Portal', color: 'bg-channel-pink' },
                { label: 'Facebook Messenger', color: 'bg-channel-blue' },
                { label: 'Telegram Bot Service', color: 'bg-channel-sky' },
                { label: 'Unified Email OAuth', color: 'bg-gray-400' },
                { label: 'Live Chat Widget', color: 'bg-emerald-500' },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onNavigate('channels')}
                    className={`${linkClass} flex items-center gap-2.5`}
                  >
                    <span className={`w-2 h-2 shrink-0 rounded-full ${item.color}`} aria-hidden />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-gray-950 uppercase tracking-widest font-mono">Company</h4>
            <ul className="space-y-3">
              {[
                { label: 'About Lazybinary', href: 'https://www.lazybinary.com' },
                { label: 'Product Blog', href: '#' },
                { label: 'Careers (Hiring!)', href: '#' },
                { label: 'Partnerships', href: '#' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map((item) => (
                <li key={item.label}>
                  {item.href.startsWith('/') ? (
                    <Link to={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className={linkClass}
                      {...(item.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
          <p className="text-center sm:text-left font-sans">
            © {new Date().getFullYear()} {PRODUCT_NAME} · Made in India
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1 text-center font-sans">
            <a href="#" className="hover:text-emerald-700 transition-colors">
              Meta API Policy Compliance
            </a>
            <span className="text-gray-300 hidden sm:inline" aria-hidden>
              ·
            </span>
            <Link to="/privacy" className="hover:text-emerald-700 transition-colors">
              Privacy
            </Link>
            <span className="text-gray-300 hidden sm:inline" aria-hidden>
              ·
            </span>
            <Link to="/terms" className="hover:text-emerald-700 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
