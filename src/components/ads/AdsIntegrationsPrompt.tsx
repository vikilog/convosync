import React from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Plug } from 'lucide-react';
import { pathForIntegrationsChannel, pathForTab } from '../../routes';
import { GoogleIcon } from './GoogleIcon';

export const AdsIntegrationsPrompt: React.FC = () => (
  <div className="flex-1 max-w-2xl mx-auto pb-12">
    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
        <Plug className="w-7 h-7 text-sky-600" />
      </div>
      <h2 className="text-lg font-black text-gray-900">Connect an ads platform first</h2>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-md mx-auto">
        Ads Manager data appears after you connect Meta Ads or Google Ads from Integrations. Link at least one platform to view campaigns and KPIs here.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <Link
          to={pathForIntegrationsChannel('meta-ads')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe0] text-white text-sm font-bold transition-colors cursor-pointer"
        >
          <Megaphone className="w-4 h-4" />
          Connect Meta Ads
        </Link>
        <Link
          to={pathForIntegrationsChannel('google-ads')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          <GoogleIcon className="w-4 h-4" />
          Connect Google Ads
        </Link>
      </div>

      <Link
        to={pathForTab('integrations')}
        className="inline-block mt-4 text-sm font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
      >
        Go to Integrations →
      </Link>
    </div>
  </div>
);
