/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Facebook, Instagram } from 'lucide-react';
import { api } from '../../lib/api';

type ConnectSuccessData = {
  pageId: string;
  pageName?: string;
  displayName?: string;
  profilePicture?: string;
};

type InstagramPageOption = {
  pageId: string;
  pageName?: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
};

type Props = {
  hasInstagram: boolean;
  pendingPages: InstagramPageOption[];
  onSuccess: (data: ConnectSuccessData) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
  connectDisabled?: boolean;
  connectDisabledMessage?: string;
};

export function MessengerConnectPanel({
  hasInstagram,
  pendingPages,
  onSuccess,
  onError,
  autoStart = false,
  onAutoStartConsumed,
  connectDisabled = false,
  connectDisabledMessage,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    pendingPages[0]?.pageId ?? null
  );
  const autoStartTriggered = useRef(false);

  useEffect(() => {
    setSelectedPageId(pendingPages[0]?.pageId ?? null);
  }, [pendingPages]);

  const handleConnect = useCallback(
    async (pageId?: string) => {
      if (!hasInstagram) {
        onError?.('Connect Instagram first. Messenger uses the same Meta Page access token.');
        return;
      }

      const targetPageId = pageId ?? selectedPageId ?? pendingPages[0]?.pageId;
      if (!targetPageId) {
        onError?.('Select a Facebook Page to enable Messenger.');
        return;
      }

      if (connectDisabled) {
        onError?.(
          connectDisabledMessage ||
            'Channel limit reached for your current plan. Upgrade to enable Messenger.'
        );
        return;
      }

      setLoading(true);

      try {
        const data = (await api.connectMessenger(targetPageId)) as ConnectSuccessData & {
          success?: boolean;
        };
        onSuccess({
          pageId: data.pageId,
          pageName: data.pageName,
          displayName: data.displayName,
          profilePicture: data.profilePicture,
        });
      } catch (err) {
        let message = 'Failed to enable Messenger';
        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message) as { error?: string; details?: string };
            message = [parsed.error, parsed.details].filter(Boolean).join(' · ') || err.message;
          } catch {
            message = err.message || message;
          }
        }
        onError?.(message);
      } finally {
        setLoading(false);
      }
    },
    [
      connectDisabled,
      connectDisabledMessage,
      hasInstagram,
      onError,
      onSuccess,
      pendingPages,
      selectedPageId,
    ]
  );

  useEffect(() => {
    if (!autoStart || autoStartTriggered.current || pendingPages.length !== 1) return;
    autoStartTriggered.current = true;
    onAutoStartConsumed?.();
    void handleConnect(pendingPages[0]?.pageId);
  }, [autoStart, handleConnect, onAutoStartConsumed, pendingPages]);

  const canConnect =
    hasInstagram && pendingPages.length > 0 && !loading && !connectDisabled && Boolean(selectedPageId);
  const requiresSelection = pendingPages.length > 1;

  return (
    <div className="bg-white border-2 border-[#1877F2]/25 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(24,119,242,0.1)]">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider bg-[#e8f4ff] text-[#1877F2] border border-[#1877F2]/20 mb-4">
        <Facebook className="w-3 h-3" />
        Facebook Messenger
      </span>
      <h4 className="text-xl font-black text-gray-950">Enable Messenger</h4>
      <p className="mt-2 text-sm text-gray-600 font-medium max-w-xl">
        Uses the same Meta Page token from your Instagram connection — no extra login required.
      </p>

      <ul className="mt-4 space-y-2 text-xs text-gray-500 font-medium">
        <li>• Requires Instagram on the same Facebook Page</li>
        <li>• Shows as a separate channel in your workspace</li>
        <li>• Syncs Messenger inbox alongside Instagram DMs</li>
      </ul>

      {!hasInstagram && (
        <p className="mt-4 text-sm font-bold text-amber-600">
          Connect Instagram first, then return here to enable Messenger.
        </p>
      )}

      {hasInstagram && pendingPages.length === 0 && (
        <p className="mt-4 text-sm font-bold text-emerald-700">
          Messenger is already enabled for all connected Instagram pages.
        </p>
      )}

      {requiresSelection && (
        <div className="mt-5 space-y-2">
          <p className="text-sm font-semibold text-slate-800">Choose a page to enable Messenger</p>
          {pendingPages.map((page) => {
            const selected = selectedPageId === page.pageId;
            const title = page.username
              ? `@${page.username}`
              : page.displayName || page.pageName || 'Instagram Page';
            return (
              <button
                key={page.pageId}
                type="button"
                onClick={() => setSelectedPageId(page.pageId)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? 'border-[#1877F2]/40 bg-[#e8f4ff]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {page.profilePicture ? (
                    <img
                      src={page.profilePicture}
                      alt=""
                      className="h-9 w-9 rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fce8f0] text-[#C13584]">
                      <Instagram className="h-4 w-4" aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {page.pageName ? `Page · ${page.pageName}` : 'Linked Facebook Page'}
                    </p>
                  </div>
                  <span
                    className={`h-4 w-4 rounded-full border shrink-0 ${
                      selected ? 'border-[#1877F2] bg-[#1877F2]' : 'border-slate-300 bg-white'
                    }`}
                    aria-hidden
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {connectDisabled && connectDisabledMessage && (
        <p className="mt-4 text-sm font-bold text-amber-700">{connectDisabledMessage}</p>
      )}

      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={!canConnect}
        className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black shadow-md transition-all"
      >
        {loading ? 'Enabling Messenger…' : requiresSelection ? 'Enable Messenger for page' : 'Enable Messenger'}
      </button>

      {pendingPages.length === 1 && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          One page ready to enable
        </p>
      )}
    </div>
  );
}
