import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Facebook, Instagram } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFacebookPageConnection } from '../../hooks/inbox/useInboxMeta';
import type { SocialListeningPlatform } from './types';

/** Reads the active platform from `?platform=`, defaulting to Instagram. */
export function useSocialListeningPlatform(): SocialListeningPlatform {
  const [searchParams] = useSearchParams();
  return searchParams.get('platform') === 'facebook' ? 'facebook' : 'instagram';
}

const OPTIONS = [
  { id: 'instagram' as const, label: 'Instagram', icon: Instagram, activeText: 'text-[#C13584]' },
  { id: 'facebook' as const, label: 'Facebook', icon: Facebook, activeText: 'text-[#1877F2]' },
];

/**
 * Top-level Instagram / Facebook Page switcher for Social Listening. Writes
 * `?platform=` on the current URL so Dashboard, Content, and Review all stay
 * scoped to the same platform as you move between them.
 */
export const SocialListeningPlatformSwitcher: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const platform = useSocialListeningPlatform();
  const facebookConnectionQ = useFacebookPageConnection();
  const facebookConnected = facebookConnectionQ.data?.connected ?? false;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const options = facebookConnected ? OPTIONS : OPTIONS.slice(0, 1);
  const current = options.find((o) => o.id === platform) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const setPlatform = (next: SocialListeningPlatform) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'instagram') nextParams.delete('platform');
    else nextParams.set('platform', 'facebook');
    setSearchParams(nextParams);
    setOpen(false);
  };

  if (options.length < 2) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/80 ${current.activeText}`}
      >
        <current.icon className="h-3.5 w-3.5" />
        {current.label}
      </div>
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/80 hover:bg-slate-50 ${current.activeText}`}
      >
        <current.icon className="h-3.5 w-3.5" />
        {current.label}
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-xl border border-black/5 bg-white shadow-xl">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setPlatform(o.id)}
              className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition-colors hover:bg-slate-50 ${
                platform === o.id ? o.activeText : 'text-gray-700'
              }`}
            >
              <o.icon className="h-3.5 w-3.5" />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
