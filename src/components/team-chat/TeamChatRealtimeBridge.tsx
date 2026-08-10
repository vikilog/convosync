/**
 * Global team-chat socket listener: SideNav unread badge + toast/sound when not viewing that DM.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getUserId } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { playMessageNotifySound } from '../../lib/messageNotifySound';
import { isViewingTeamChatPeer } from '../../lib/teamChatFocus';
import {
  dispatchOpenTeamChatPeer,
  incrementTeamChatUnread,
} from '../../lib/teamChatEvents';
import { pathForTab } from '../../routes';

type TeamChatToast = {
  id: string;
  peerUserId: string;
  senderName: string;
  preview: string;
};

type TeamChatSocketMessage = {
  id: string;
  body: string;
  recipientUserId: string;
  sender: { id: string; name: string };
};

function maybeDesktopNotify(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (!document.hidden) return;
  try {
    new Notification(title, { body, silent: true });
  } catch {
    // unsupported / blocked
  }
}

export function TeamChatRealtimeBridge() {
  const navigate = useNavigate();
  const selfId = getUserId();
  const [toast, setToast] = useState<TeamChatToast | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((next: TeamChatToast) => {
    setToast(next);
    playMessageNotifySound();
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onMsg = (payload: TeamChatSocketMessage) => {
      if (!payload?.sender?.id || payload.sender.id === selfId) return;

      const peerUserId = payload.sender.id;
      // Viewing this exact thread with the window visible → don't annoy
      if (isViewingTeamChatPeer(peerUserId) && !document.hidden) return;

      incrementTeamChatUnread(peerUserId);

      const previewRaw = typeof payload.body === 'string' ? payload.body.trim() : '';
      if (!previewRaw) return;

      const senderName = payload.sender.name?.trim() || 'Team mate';
      const preview = previewRaw.length > 72 ? `${previewRaw.slice(0, 69)}…` : previewRaw;

      showToast({
        id: `${payload.id}-${Date.now()}`,
        peerUserId,
        senderName,
        preview,
      });
      maybeDesktopNotify(senderName, preview);
    };

    socket.on('team_chat_message', onMsg);
    return () => {
      socket.off('team_chat_message', onMsg);
    };
  }, [selfId, showToast]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  const openPeer = (peerUserId: string) => {
    setToast(null);
    navigate(pathForTab('team-chat'));
    dispatchOpenTeamChatPeer(peerUserId);
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-4 right-4 z-[200] w-[min(100vw-1.5rem,20rem)]"
        >
          <div
            role="status"
            className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white text-gray-900 shadow-lg shadow-slate-900/10"
          >
            <button
              type="button"
              onClick={() => openPeer(toast.peerUserId)}
              className="w-full px-3 py-2.5 pr-9 text-left transition-colors hover:bg-sky-50/70"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-600">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold text-gray-900">{toast.senderName}</p>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-channel-green">
                      Team
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs leading-snug text-gray-500">{toast.preview}</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="absolute right-1.5 top-1.5 rounded-md p-1 text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-700"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
