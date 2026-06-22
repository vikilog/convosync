/**
 * Global inbox socket listener: unread badge sync + snackbar for background chats.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '../lib/api';
import { getActiveInboxConversationId } from '../lib/inboxFocus';
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

export function InboxRealtimeBridge() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<InboxToast | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const contactCacheRef = useRef<Map<string, string>>(new Map());

  const refreshUnreadTotal = useCallback(async () => {
    try {
      const total = await fetchInboxUnreadTotal();
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

  const showToast = useCallback((next: InboxToast) => {
    setToast(next);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 5500);
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
      if (conversationId === getActiveInboxConversationId()) return;
      if (!preview) return;

      const contactName = await resolveContactName(conversationId);
      showToast({
        id: `${conversationId}-${Date.now()}`,
        conversationId,
        contactName,
        preview: preview.length > 120 ? `${preview.slice(0, 117)}…` : preview,
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
      showToast(detail);
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
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-[200] max-w-sm w-[min(100vw-2rem,22rem)]"
        >
          <div
            role="status"
            className="bg-gray-950 text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => openConversation(toast.conversationId)}
              className="w-full text-left p-4 pr-10 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white truncate">{toast.contactName}</p>
                  <p className="text-meta text-white/70 mt-1 line-clamp-2 leading-relaxed">
                    {toast.preview}
                  </p>
                  <p className="text-xs text-sky-600 font-bold mt-2">Open chat</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="absolute top-3 right-3 p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
