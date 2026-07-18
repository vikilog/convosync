/**
 * Global inbox socket listener: unread badge sync + snackbar for background chats.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '../lib/api';
import {
  getViewingInboxConversationId,
  isViewingInboxConversation,
} from '../lib/inboxFocus';
import {
  dispatchInboxUnreadTotal,
  dispatchOpenInboxConversation,
  fetchInboxUnreadTotal,
  INBOX_MESSAGE_NOTIFICATION_EVENT,
} from '../lib/inboxEvents';
import { pathForTab } from '../routes';
import { getSocket } from '../lib/socket';
import { mapContactFromApi } from '../lib/mappers';

type InboxToast = {
  id: string;
  conversationId: string;
  contactName: string;
  preview: string;
};

/** Soft two-tone chime — no asset file; matches light product UI. */
function playInboxMessageSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const beep = (freq: number, start: number, dur: number, gainPeak: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    };

    beep(880, now, 0.12, 0.08);
    beep(1174.7, now + 0.1, 0.16, 0.06);

    window.setTimeout(() => void ctx.close(), 500);
  } catch {
    // Autoplay / unsupported — ignore
  }
}

export function InboxRealtimeBridge() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<InboxToast | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const contactCacheRef = useRef<Map<string, string>>(new Map());

  const refreshUnreadTotal = useCallback(async () => {
    try {
      const total = await fetchInboxUnreadTotal(getViewingInboxConversationId() || undefined);
      dispatchInboxUnreadTotal(total);
    } catch {
      // ignore — badge will refresh on next event
    }
  }, []);

  const resolveContactName = useCallback(async (conversationId: string) => {
    const cached = contactCacheRef.current.get(conversationId);
    if (cached) return cached;

    try {
      const conv = (await api.getConversation(conversationId)) as Record<string, unknown>;
      const contact = conv.contact as Record<string, unknown>;
      const mapped = mapContactFromApi(contact, conv);
      const name = mapped.name || mapped.handle || 'New message';
      contactCacheRef.current.set(conversationId, name);
      return name;
    } catch {
      return 'New message';
    }
  }, []);

  const showToast = useCallback((next: InboxToast, withSound = true) => {
    setToast(next);
    if (withSound) playInboxMessageSound();
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    void refreshUnreadTotal();
  }, [refreshUnreadTotal]);

  useEffect(() => {
    const socket = getSocket();

    const onNewMessage = async (payload: {
      conversationId: string;
      message: Record<string, unknown>;
    }) => {
      const conversationId = payload.conversationId;
      const isIncoming = payload.message.sender === 'contact';
      const preview =
        typeof payload.message.content === 'string'
          ? payload.message.content.trim()
          : 'New message';

      void refreshUnreadTotal();

      if (!isIncoming) return;
      // KeepAlive keeps Inbox mounted — only skip when that chat is actually on screen
      if (isViewingInboxConversation(conversationId)) return;
      if (!preview) return;

      const contactName = await resolveContactName(conversationId);
      showToast({
        id: `${conversationId}-${Date.now()}`,
        conversationId,
        contactName,
        preview: preview.length > 72 ? `${preview.slice(0, 69)}…` : preview,
      });
    };

    const onInboxChanged = () => {
      void refreshUnreadTotal();
    };

    socket.on('new_message', onNewMessage);
    socket.on('conversation_updated', onInboxChanged);
    socket.on('conversation_deleted', onInboxChanged);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('conversation_updated', onInboxChanged);
      socket.off('conversation_deleted', onInboxChanged);
    };
  }, [refreshUnreadTotal, resolveContactName, showToast]);

  useEffect(() => {
    const onExternalToast = (event: Event) => {
      const detail = (event as CustomEvent<InboxToast>).detail;
      if (!detail?.conversationId) return;
      showToast({
        ...detail,
        preview:
          detail.preview.length > 72 ? `${detail.preview.slice(0, 69)}…` : detail.preview,
      });
    };
    window.addEventListener(INBOX_MESSAGE_NOTIFICATION_EVENT, onExternalToast);
    return () => window.removeEventListener(INBOX_MESSAGE_NOTIFICATION_EVENT, onExternalToast);
  }, [showToast]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  const openConversation = (conversationId: string) => {
    setToast(null);
    navigate(pathForTab('inbox'));
    dispatchOpenInboxConversation(conversationId);
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
            className="relative bg-white text-gray-900 rounded-xl shadow-lg shadow-slate-900/10 border border-slate-200/90 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => openConversation(toast.conversationId)}
              className="w-full text-left px-3 py-2.5 pr-9 hover:bg-sky-50/70 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{toast.contactName}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-channel-green shrink-0">
                      New
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate leading-snug">{toast.preview}</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="absolute top-1.5 right-1.5 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-slate-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
