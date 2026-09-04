import React from 'react';
import { CheckCircle2, Lock, Mail, Plug } from 'lucide-react';
import type { PlanChannelKind } from '../../lib/planEntitlements';

export type DashboardChannel = {
  kind: PlanChannelKind;
  label: string;
  connected: boolean;
  allowedByPlan: boolean;
  detail?: string;
};

interface ChannelsPanelProps {
  channels: DashboardChannel[];
  onConnect: (kind: PlanChannelKind) => void;
  onUpgrade: () => void;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

/** Meta Messenger mark (chat bubble + lightning), not the Facebook "f". */
function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17V22l3.45-1.89c.99.27 2.04.42 3.41.42 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm.99 13.07l-2.54-2.71-4.95 2.71 5.44-5.79 2.61 2.71 4.89-2.71-5.45 5.79z" />
    </svg>
  );
}

const ICON: Record<PlanChannelKind, React.ComponentType<{ className?: string }>> = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  messenger: MessengerIcon,
  email: Mail,
};

const ICON_CLASS: Record<PlanChannelKind, string> = {
  whatsapp: 'bg-[#e6f7ec] text-channel-green',
  instagram: 'bg-[#fce8f0] text-[#C13584]',
  messenger: 'bg-[#e8f4ff] text-[#1877F2]',
  email: 'bg-[#e8f4ff] text-channel-blue',
};

export const ChannelsPanel: React.FC<ChannelsPanelProps> = ({
  channels,
  onConnect,
  onUpgrade,
}) => {
  return (
    <div className="flex h-full flex-col font-swiss">
      <p className="mb-3 text-[13.5px] font-bold text-swiss-ink">Channels</p>

      <ul className="divide-y divide-swiss-line">
        {channels.map((channel) => {
          const Icon = ICON[channel.kind];
          return (
            <li key={channel.kind} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ICON_CLASS[channel.kind]}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-swiss-ink">{channel.label}</p>
                <p className="truncate text-[11px] text-swiss-muted">
                  {!channel.allowedByPlan
                    ? 'Not on your plan'
                    : channel.connected
                      ? channel.detail || 'Connected'
                      : 'Not connected'}
                </p>
              </div>

              {!channel.allowedByPlan ? (
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-semibold text-swiss-muted hover:text-swiss-ink"
                >
                  <Lock className="h-3 w-3" aria-hidden />
                  Upgrade
                </button>
              ) : channel.connected ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-swiss-accent">
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  Connected
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onConnect(channel.kind)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-semibold text-swiss-muted hover:text-swiss-ink"
                >
                  <Plug className="h-3 w-3" aria-hidden />
                  Connect
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
