/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, X } from 'lucide-react';

export type ReconnectAlert = {
  id: string;
  channelLabel: string;
  title: string;
  reason: 'expired' | 'revoked';
};

type ChannelReconnectDialogProps = {
  open: boolean;
  alerts: ReconnectAlert[];
  onReconnect: (alert: ReconnectAlert) => void;
  onDismiss: () => void;
};

export function ChannelReconnectDialog({
  open,
  alerts,
  onReconnect,
  onDismiss,
}: ChannelReconnectDialogProps) {
  if (!open || alerts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md bg-white border border-swiss-line shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="channel-reconnect-title"
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3">
          <h4
            id="channel-reconnect-title"
            className="flex items-center gap-2 text-sm font-bold text-slate-900"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Connection needs attention
          </h4>
          <button
            type="button"
            onClick={onDismiss}
            className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">
                  {alert.channelLabel}
                </p>
                <p className="truncate text-sm font-bold text-slate-900">{alert.title}</p>
                <p className="text-xs text-slate-500">
                  {alert.reason === 'revoked'
                    ? 'Access was revoked — reconnect to keep messages coming in.'
                    : 'Connection expired — reconnect to keep messages coming in.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onReconnect(alert)}
                className="shrink-0 rounded-lg bg-swiss-accent px-3 py-2 text-xs font-bold text-white hover:bg-swiss-accent-hover"
              >
                Reconnect
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-[#E5E7EB] px-5 py-3">
          <button
            type="button"
            onClick={onDismiss}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}
