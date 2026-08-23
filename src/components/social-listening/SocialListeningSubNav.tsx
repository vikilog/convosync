import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

const LINKS = [
  {
    to: '/social-listening/dashboard',
    label: 'Dashboard',
    match: (p: string) =>
      p === '/social-listening' || p.startsWith('/social-listening/dashboard'),
  },
  {
    to: '/social-listening/content',
    label: 'Content',
    match: (p: string) => p.startsWith('/social-listening/content'),
  },
  {
    to: '/social-listening/review',
    label: 'Review',
    match: (p: string) => p.startsWith('/social-listening/review'),
  },
] as const;

export function SocialListeningSubNav({
  navExtra,
  trailing,
}: {
  /** Rendered right next to the Dashboard/Content/Review nav, e.g. the date range dropdown. */
  navExtra?: React.ReactNode;
  /** Rendered on the far right, e.g. the Instagram / Facebook Page switcher. */
  trailing?: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const platform = searchParams.get('platform');
  const suffix = platform === 'facebook' ? '?platform=facebook' : '';

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <nav className="inline-flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
          {LINKS.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.to}
                to={`${link.to}${suffix}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        {navExtra}
      </div>
      {trailing}
    </div>
  );
}
