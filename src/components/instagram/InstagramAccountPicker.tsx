/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, Instagram } from 'lucide-react';

export type InstagramConnectCandidate = {
  pageId: string;
  pageName?: string;
  instagramUserId: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  alreadyConnected?: boolean;
};

type InstagramAccountPickerProps = {
  candidates: InstagramConnectCandidate[];
  selectedPageId: string | null;
  onSelect: (pageId: string) => void;
  onConfirm: () => void;
  confirming?: boolean;
  error?: string;
};

export function InstagramAccountPicker({
  candidates,
  selectedPageId,
  onSelect,
  onConfirm,
  confirming = false,
  error,
}: InstagramAccountPickerProps) {
  const canConfirm = Boolean(selectedPageId) && !confirming;

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fce8f0] text-[#C13584]">
          <Instagram className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Choose Instagram account</h1>
          <p className="mt-1 text-sm text-slate-600">
            Multiple Instagram accounts are linked to your Meta login. Select one page to connect to
            this workspace.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {candidates.map((candidate) => {
          const selected = selectedPageId === candidate.pageId;
          const title =
            candidate.username ? `@${candidate.username}` : candidate.displayName || 'Instagram';
          const subtitle = candidate.pageName
            ? `Facebook Page · ${candidate.pageName}`
            : 'Instagram Business account';

          return (
            <button
              key={candidate.pageId}
              type="button"
              onClick={() => onSelect(candidate.pageId)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? 'border-sky-300 bg-sky-50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {candidate.profilePicture ? (
                  <img
                    src={candidate.profilePicture}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fce8f0] text-[#C13584]">
                    <Instagram className="h-4 w-4" aria-hidden />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
                    {candidate.alreadyConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>
                </div>

                <span
                  className={`h-4 w-4 rounded-full border shrink-0 ${
                    selected ? 'border-channel-green bg-channel-green' : 'border-slate-300 bg-white'
                  }`}
                  aria-hidden
                />
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!canConfirm}
        onClick={onConfirm}
        className="mt-5 w-full rounded-xl bg-channel-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {confirming ? 'Connecting…' : 'Connect selected account'}
      </button>
    </div>
  );
}
