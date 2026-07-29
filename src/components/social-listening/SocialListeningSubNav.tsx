import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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
  trailing,
}: {
  trailing?: React.ReactNode;
}) {
  const { pathname } = useLocation();

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <nav className="inline-flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
        {LINKS.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              key={link.to}
              to={link.to}
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
      {trailing ? <div className="flex flex-wrap items-center gap-2">{trailing}</div> : null}
    </div>
  );
}
