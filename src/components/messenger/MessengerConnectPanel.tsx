/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Facebook } from 'lucide-react';
import { api } from '../../lib/api';

type ConnectSuccessData = {
  pageId: string;
  pageName?: string;
  displayName?: string;
  profilePicture?: string;
};

type Props = {
  hasInstagram: boolean;
  onSuccess: (data: ConnectSuccessData) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
};

export function MessengerConnectPanel({
  hasInstagram,
  onSuccess,
  onError,
  autoStart = false,
  onAutoStartConsumed,
}: Props) {
  const [loading, setLoading] = useState(false);
  const autoStartTriggered = useRef(false);

  const handleConnect = useCallback(async () => {
    if (!hasInstagram) {
      onError?.('Connect Instagram first. Messenger uses the same Meta Page access token.');
      return;
    }

    setLoading(true);

    try {
      const data = (await api.connectMessenger()) as ConnectSuccessData & { success?: boolean };
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
  }, [hasInstagram, onError, onSuccess]);

  useEffect(() => {
    if (!autoStart || autoStartTriggered.current) return;
    autoStartTriggered.current = true;
    onAutoStartConsumed?.();
    void handleConnect();
  }, [autoStart, handleConnect, onAutoStartConsumed]);

  const canConnect = hasInstagram && !loading;

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
        <li>• Requires Instagram to be connected on the same Facebook Page</li>
        <li>• Syncs Messenger inbox (without platform=instagram)</li>
        <li>• New messages arrive via the same Page webhook</li>
      </ul>

      {!hasInstagram && (
        <p className="mt-4 text-sm font-bold text-amber-600">
          Connect Instagram first, then return here to enable Messenger.
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={!canConnect}
        className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black shadow-md transition-all"
      >
        {loading ? 'Enabling Messenger…' : 'Enable Messenger'}
      </button>
    </div>
  );
}
