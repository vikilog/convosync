/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pathForTab } from '../routes';

export interface SimpleFeatureViewProps {
  title: string;
  description: string;
  icon: LucideIcon;
  statusLabel?: string;
  highlights?: string[];
}

export const SimpleFeatureView: FC<SimpleFeatureViewProps> = ({
  title,
  description,
  icon: Icon,
  statusLabel = 'Coming soon',
  highlights = [],
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-gray-900">{title}</h2>
              <span className="text-sm font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-50 text-primary border border-sky-100">
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          </div>
        </div>

        {highlights.length > 0 && (
          <ul className="mt-6 pt-6 border-t border-slate-200 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate(pathForTab('dashboard'))}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-channel-green hover:bg-[#20bd5a] text-white text-sm font-bold rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        <button
          type="button"
          onClick={() => navigate(pathForTab('inbox'))}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-sm font-bold rounded-xl transition-all"
        >
          Open Inbox
        </button>
      </div>
    </div>
  );
};
