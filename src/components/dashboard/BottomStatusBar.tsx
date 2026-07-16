import React from 'react';
import {
  Bot,
  Circle,
  MessageCircle,
  Plus,
  Workflow,
  UserPlus,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { pathForSettingsSection, pathForTab } from '../../routes';

interface BottomStatusBarProps {
  whatsappConnected: boolean;
  planName?: string | null;
  isTrial?: boolean;
  trialDaysLeft?: number | null;
  activeAgents: number;
  onNewCampaign: () => void;
  onNewJourney: () => void;
  onAddContact: () => void;
  onImportCSV: () => void;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  whatsappConnected,
  planName,
  isTrial,
  trialDaysLeft,
  activeAgents,
  onNewCampaign,
  onNewJourney,
  onAddContact,
  onImportCSV,
}) => (
  <div className="flex flex-col gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <Link
        to={pathForTab('integrations')}
        className="inline-flex cursor-pointer items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
      >
        <MessageCircle className="h-4 w-4 text-slate-400" />
        <span>WhatsApp</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
          <Circle
            className={`h-2 w-2 fill-current ${
              whatsappConnected ? 'text-emerald-500' : 'text-red-500'
            }`}
          />
          {whatsappConnected ? 'Connected' : 'Offline'}
        </span>
      </Link>

      <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />

      <Link
        to={pathForSettingsSection('wallet')}
        className="inline-flex cursor-pointer items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
      >
        <span className="font-medium text-slate-900">{planName || 'Starter Plan'}</span>
        {isTrial && trialDaysLeft != null ? (
          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
            {trialDaysLeft}d trial
          </span>
        ) : null}
      </Link>

      <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />

      <Link
        to={pathForTab('ai-agent')}
        className="inline-flex cursor-pointer items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
      >
        <Bot className="h-4 w-4 text-slate-400" />
        <span>
          <span className="font-medium text-slate-900">{activeAgents}</span> AI agent
          {activeAgents === 1 ? '' : 's'} active
        </span>
      </Link>
    </div>

    <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
      <button
        type="button"
        onClick={onNewCampaign}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-channel-green px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#20bd5a]"
      >
        <Plus className="h-4 w-4" />
        New campaign
      </button>
      <button
        type="button"
        onClick={onNewJourney}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <Workflow className="h-4 w-4 text-slate-400" />
        Journey
      </button>
      <button
        type="button"
        onClick={onAddContact}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <UserPlus className="h-4 w-4 text-slate-400" />
        Contact
      </button>
      <button
        type="button"
        onClick={onImportCSV}
        className="hidden cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:inline-flex"
      >
        <Upload className="h-4 w-4 text-slate-400" />
        Import
      </button>
      <button
        type="button"
        onClick={onImportCSV}
        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50 sm:hidden"
        aria-label="Import CSV"
      >
        <Upload className="h-4 w-4" />
      </button>
    </div>
  </div>
);
