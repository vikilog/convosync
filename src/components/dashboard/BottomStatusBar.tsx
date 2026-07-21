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
import { pathForTab } from '../../routes';

interface BottomStatusBarProps {
  whatsappConnected: boolean;
  activeAgents: number;
  onNewCampaign: () => void;
  onNewJourney: () => void;
  onAddContact: () => void;
  onImportCSV: () => void;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  whatsappConnected,
  activeAgents,
  onNewCampaign,
  onNewJourney,
  onAddContact,
  onImportCSV,
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-black/5 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <Link
        to={pathForTab('integrations')}
        className="inline-flex cursor-pointer items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-900"
      >
        <MessageCircle className="h-4 w-4 text-neutral-400" />
        <span>WhatsApp</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-neutral-900">
          <Circle
            className={`h-2 w-2 fill-current ${
              whatsappConnected ? 'text-channel-green' : 'text-red-500'
            }`}
          />
          {whatsappConnected ? 'Connected' : 'Offline'}
        </span>
      </Link>

      <span className="hidden h-4 w-px bg-black/10 sm:block" aria-hidden />

      <Link
        to={pathForTab('ai-agent')}
        className="inline-flex cursor-pointer items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-900"
      >
        <Bot className="h-4 w-4 text-neutral-400" />
        <span>
          <span className="font-medium text-neutral-900">{activeAgents}</span> AI agent
          {activeAgents === 1 ? '' : 's'} active
        </span>
      </Link>
    </div>

    <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
      <button
        type="button"
        onClick={onNewCampaign}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
      >
        <Plus className="h-4 w-4" />
        New campaign
      </button>
      <button
        type="button"
        onClick={onNewJourney}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-surface-muted"
      >
        <Workflow className="h-4 w-4 text-neutral-400" />
        Journey
      </button>
      <button
        type="button"
        onClick={onAddContact}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-surface-muted"
      >
        <UserPlus className="h-4 w-4 text-neutral-400" />
        Contact
      </button>
      <button
        type="button"
        onClick={onImportCSV}
        className="hidden cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-surface-muted sm:inline-flex"
      >
        <Upload className="h-4 w-4 text-neutral-400" />
        Import
      </button>
      <button
        type="button"
        onClick={onImportCSV}
        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-black/10 bg-white p-1.5 text-neutral-500 transition-colors hover:bg-surface-muted sm:hidden"
        aria-label="Import CSV"
      >
        <Upload className="h-4 w-4" />
      </button>
    </div>
  </div>
);
