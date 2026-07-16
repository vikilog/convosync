/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  Cloud,
  Link2,
  Smartphone,
  Zap,
} from 'lucide-react';
import type { ConnectionTypeCardData, WhatsAppConnectionType } from './types';

type ConnectionTypeCardProps = {
  data: ConnectionTypeCardData;
  selected: boolean;
  onSelect: (type: WhatsAppConnectionType) => void;
  onGetStarted: (type: WhatsAppConnectionType) => void;
};

function BusinessApiIllustration() {
  return (
    <div className="relative h-[140px] w-full flex items-center justify-center" aria-hidden>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-50 via-white to-[#e6f7ec]/30 border border-slate-200/60" />
      <div className="relative flex items-center gap-2">
        <div className="p-3 rounded-2xl bg-white shadow-md border border-slate-200 text-primary">
          <Cloud className="w-7 h-7" strokeWidth={1.75} />
        </div>
        <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/25">
          <Zap className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="p-3 rounded-2xl bg-white shadow-md border border-slate-200 text-primary">
          <Bot className="w-7 h-7" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

function CoexistenceIllustration() {
  return (
    <div className="relative h-[140px] w-full flex items-center justify-center" aria-hidden>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#e6f7ec]/40 via-white to-sky-50/30 border border-slate-200/60" />
      <div className="relative flex items-center gap-3">
        <div className="p-3.5 rounded-2xl bg-[#25D366] text-white shadow-lg">
          <Smartphone className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <Link2 className="w-5 h-5 text-primary/50" />
        <div className="p-3.5 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
          <Cloud className="w-7 h-7" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

export const ConnectionTypeCard: FC<ConnectionTypeCardProps> = ({
  data,
  selected,
  onSelect,
  onGetStarted,
}) => {
  const isApi = data.type === 'business_api';
  const isComingSoon = data.comingSoon === true;

  return (
    <article
      role={isComingSoon ? undefined : 'button'}
      tabIndex={isComingSoon ? undefined : 0}
      aria-pressed={isComingSoon ? undefined : selected}
      onClick={isComingSoon ? undefined : () => onSelect(data.type)}
      onKeyDown={
        isComingSoon
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(data.type);
              }
            }
      }
      className={[
        'group relative flex flex-col min-h-[550px] h-full rounded-2xl bg-white text-left',
        'border-2 transition-all duration-200 overflow-hidden',
        isComingSoon
          ? 'border-slate-200 opacity-80 cursor-default'
          : 'cursor-pointer shadow-[0_2px_8px_rgba(25,26,43,0.04),0_12px_32px_rgba(65,44,221,0.06)] hover:-translate-y-1',
        !isComingSoon &&
          (selected
            ? 'border-primary ring-4 ring-primary/15 shadow-[0_8px_40px_rgba(65,44,221,0.18)]'
            : 'border-slate-200 hover:border-primary/40 hover:shadow-[0_8px_28px_rgba(65,44,221,0.1)]'),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'absolute top-5 right-5 z-10 px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider',
          isComingSoon
            ? 'bg-slate-100 text-slate-500 border border-slate-200'
            : isApi
              ? 'bg-sky-50 text-primary border border-primary/20'
              : 'bg-[#e6f7ec] text-[#006d2f] border border-[#5dfd8a]/30',
        ].join(' ')}
      >
        {isComingSoon ? 'Coming soon' : data.badge}
      </span>

      {selected && !isComingSoon && (
        <span className="absolute top-5 left-5 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-lg">
          <Check className="w-4 h-4" strokeWidth={3} />
        </span>
      )}

      <div className="p-6 pt-14 flex flex-col flex-1">
        <div className="mb-5">{isApi ? <BusinessApiIllustration /> : <CoexistenceIllustration />}</div>

        <h3 className="text-xl font-black text-gray-950 tracking-tight leading-tight pr-16">
          {data.title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed line-clamp-3">
          {data.subtitle}
        </p>
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">{data.description}</p>

        <div className="mt-5 flex-1">
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2.5">
            Features
          </p>
          <ul className="space-y-2">
            {data.features.slice(0, 6).map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm font-semibold text-gray-700"
              >
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" strokeWidth={2.5} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {data.features.length > 6 && (
            <p className="mt-2 text-sm font-bold text-gray-400">
              +{data.features.length - 6} more capabilities
            </p>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3">
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">
            Best For
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {data.bestFor.map((item) => (
              <li
                key={item}
                className="text-sm font-bold text-gray-700 bg-white px-2 py-0.5 rounded-md border border-slate-200"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          disabled={isComingSoon}
          onClick={(e) => {
            if (isComingSoon) return;
            e.stopPropagation();
            onSelect(data.type);
            onGetStarted(data.type);
          }}
          className={[
            'mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl',
            'text-sm font-black transition-all',
            isComingSoon
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : selected
                ? 'bg-channel-green hover:bg-[#20bd5a] text-white shadow-lg shadow-primary/25'
                : 'bg-gray-900 hover:bg-gray-950 text-white shadow-md',
          ].join(' ')}
        >
          {isComingSoon ? 'Coming soon' : data.ctaLabel}
          {!isComingSoon && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      {isApi && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
      {!isApi && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#25D366]/0 via-[#25D366]/50 to-[#25D366]/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </article>
  );
};
