/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, Play } from 'lucide-react';

type SectionTone = 'grid' | 'white' | 'muted' | 'soft';

const SECTION_BG: Record<SectionTone, string> = {
  grid: 'hero-grid-bg',
  white: 'bg-white',
  muted: 'bg-[#f8faf9]',
  soft: 'bg-emerald-50/40',
};

export function LandingSection({
  id,
  tone = 'white',
  className = '',
  children,
  containerClassName = '',
}: {
  id?: string;
  tone?: SectionTone;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`${SECTION_BG[tone]} border-b border-gray-100/80 py-20 sm:py-24 text-gray-900 ${className}`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
}

export function LandingBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-channel-green shrink-0" aria-hidden />
      {children}
    </span>
  );
}

export function LandingSectionHeader({
  badge,
  title,
  titleAccent,
  description,
  align = 'center',
  className = '',
}: {
  badge: string;
  title: string;
  titleAccent?: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-3xl mb-14 sm:mb-16 ${alignClass} ${className}`}>
      <div className={`mb-5 ${align === 'center' ? 'flex justify-center' : ''}`}>
        <LandingBadge>{badge}</LandingBadge>
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold font-display tracking-tight leading-[1.08] text-gray-950">
        {title}
        {titleAccent ? (
          <>
            <br />
            <span className="text-channel-green">{titleAccent}</span>
          </>
        ) : null}
      </h2>
      {description ? (
        <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

export function LandingCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-sm shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function LandingPrimaryButton({
  children,
  className = '',
  showPlayIcon = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { showPlayIcon?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-channel-green hover:bg-[#20bd5a] text-white font-bold text-sm sm:text-base px-7 py-3.5 shadow-lg shadow-emerald-600/15 transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-channel-green disabled:opacity-50 ${className}`}
      {...props}
    >
      {showPlayIcon ? <Play className="w-4 h-4 fill-current" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function LandingSecondaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white/90 hover:bg-white text-gray-900 font-semibold text-sm sm:text-base px-7 py-3.5 transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LandingLinkButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors duration-200 cursor-pointer ${className}`}
      {...props}
    >
      {children}
      <ArrowRight className="w-3.5 h-3.5" aria-hidden />
    </button>
  );
}

/** Active tab pill for landing feature sections */
export const landingTabActive =
  'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm';
export const landingTabIdle =
  'text-gray-600 hover:text-gray-900 hover:bg-white/80 border border-transparent';

/** Checkmark row used in feature lists */
export function LandingCheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-gray-700">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 text-xs shrink-0">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
