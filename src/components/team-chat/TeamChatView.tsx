import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, Search, Send } from 'lucide-react';
import { api, getUserId } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { formatNotificationRelativeTime } from '../../lib/notificationTime';
import { useIsLargeUp } from '../../hooks/useBreakpoint';
import { useKeepAliveActivation, useKeepAliveActive } from '../KeepAlive';
import { Input } from '../ui/input';
import {
  setActiveTeamChatPeerId,
  setTeamChatVisible,
} from '../../lib/teamChatFocus';
import {
  clearTeamChatUnread,
  getTeamChatUnreadSnapshot,
  TEAM_CHAT_OPEN_PEER_EVENT,
  TEAM_CHAT_UNREAD_CHANGED_EVENT,
} from '../../lib/teamChatEvents';

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  recipientUserId: string;
  sender: { id: string; name: string; avatar: string | null };
};

type Peer = {
  userId: string;
  name: string;
  avatar: string | null;
  online: boolean;
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    senderUserId: string;
  } | null;
};

function Avatar({
  name,
  avatar,
  online,
  size = 'md',
}: {
  name: string;
  avatar: string | null;
  online?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'h-10 w-10 text-sm' : size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs';
  const dot = size === 'lg' ? 'h-3 w-3' : 'h-2.5 w-2.5';
  return (
    <div className="relative shrink-0">
      <div
        className={`flex items-center justify-center overflow-hidden rounded-full bg-[#e6fcef] font-semibold text-primary ${dim}`}
      >
        {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          (name.charAt(0) || '?').toUpperCase()
        )}
      </div>
      {online != null && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white ${dot} ${
            online ? 'bg-emerald-500' : 'bg-neutral-300'
          }`}
        />
      )}
    </div>
  );
}

function previewBody(body: string, max = 48) {
  const t = body.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export const TeamChatView: React.FC = () => {
  const selfId = getUserId();
  const isLargeUp = useIsLargeUp();
  const teamChatTabActive = useKeepAliveActive();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingPeers, setLoadingPeers] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');
  const [unreadByPeer, setUnreadByPeer] = useState(() => getTeamChatUnreadSnapshot());
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedPeer = useMemo(
    () => peers.find((p) => p.userId === selectedPeerId) ?? null,
    [peers, selectedPeerId]
  );

  const filteredPeers = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return peers;
    return peers.filter((p) => p.name.toLowerCase().includes(q));
  }, [peers, listSearch]);

  const scrollBottom = () => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const loadPeers = useCallback(async () => {
    try {
      const res = await api.getTeamChatPeers();
      setPeers(res.peers ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingPeers(false);
    }
  }, []);

  const loadThread = useCallback(async (peerUserId: string) => {
    setLoadingThread(true);
    try {
      const res = await api.getTeamChatMessages(peerUserId, 50);
      setMessages(res.items ?? []);
      scrollBottom();
    } catch {
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useKeepAliveActivation(() => {
    void loadPeers();
    if (selectedPeerId) void loadThread(selectedPeerId);
  });

  useEffect(() => {
    setTeamChatVisible(teamChatTabActive);
  }, [teamChatTabActive]);

  useEffect(() => () => setTeamChatVisible(false), []);

  useEffect(() => {
    setActiveTeamChatPeerId(selectedPeerId ?? '');
    if (selectedPeerId) clearTeamChatUnread(selectedPeerId);
  }, [selectedPeerId]);

  // Returning to a focused, already-open thread clears badge from background arrivals
  useEffect(() => {
    const clearIfReading = () => {
      if (!document.hidden && teamChatTabActive && selectedPeerId) {
        clearTeamChatUnread(selectedPeerId);
      }
    };
    clearIfReading();
    document.addEventListener('visibilitychange', clearIfReading);
    return () => document.removeEventListener('visibilitychange', clearIfReading);
  }, [teamChatTabActive, selectedPeerId]);

  useEffect(() => {
    const onUnread = () => setUnreadByPeer(getTeamChatUnreadSnapshot());
    window.addEventListener(TEAM_CHAT_UNREAD_CHANGED_EVENT, onUnread);
    return () => window.removeEventListener(TEAM_CHAT_UNREAD_CHANGED_EVENT, onUnread);
  }, []);

  useEffect(() => {
    const onOpenPeer = (event: Event) => {
      const peerUserId = (event as CustomEvent<{ peerUserId: string }>).detail?.peerUserId;
      if (!peerUserId) return;
      setSelectedPeerId(peerUserId);
      if (!isLargeUp) setMobilePane('chat');
    };
    window.addEventListener(TEAM_CHAT_OPEN_PEER_EVENT, onOpenPeer);
    return () => window.removeEventListener(TEAM_CHAT_OPEN_PEER_EVENT, onOpenPeer);
  }, [isLargeUp]);

  useEffect(() => {
    void loadPeers();
  }, [loadPeers]);

  useEffect(() => {
    if (!selectedPeerId) {
      setMessages([]);
      return;
    }
    void loadThread(selectedPeerId);
  }, [selectedPeerId, loadThread]);

  useEffect(() => {
    const s = getSocket();
    const onMsg = (payload: ChatMessage) => {
      const peerId =
        payload.sender.id === selfId ? payload.recipientUserId : payload.sender.id;
      setPeers((prev) => {
        const next = prev.map((p) =>
          p.userId === peerId
            ? {
                ...p,
                lastMessage: {
                  id: payload.id,
                  body: payload.body,
                  createdAt: payload.createdAt,
                  senderUserId: payload.sender.id,
                },
              }
            : p
        );
        next.sort((a, b) => {
          const at = a.lastMessage ? Date.parse(a.lastMessage.createdAt) : 0;
          const bt = b.lastMessage ? Date.parse(b.lastMessage.createdAt) : 0;
          if (at !== bt) return bt - at;
          return a.name.localeCompare(b.name);
        });
        return next;
      });

      if (selectedPeerId && peerId === selectedPeerId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        scrollBottom();
      }
    };
    const onPresence = (payload: { online?: Array<{ userId: string }> }) => {
      const onlineIds = new Set((payload.online ?? []).map((u) => u.userId));
      setPeers((prev) =>
        prev.map((p) => ({
          ...p,
          online: onlineIds.has(p.userId),
        }))
      );
    };
    s.on('team_chat_message', onMsg);
    s.on('team_presence', onPresence);
    return () => {
      s.off('team_chat_message', onMsg);
      s.off('team_presence', onPresence);
    };
  }, [selectedPeerId, selfId]);

  const selectPeer = (userId: string) => {
    setSelectedPeerId(userId);
    clearTeamChatUnread(userId);
    if (!isLargeUp) setMobilePane('chat');
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending || !selectedPeerId) return;
    setSending(true);
    setDraft('');
    try {
      const msg = await api.sendTeamChatMessage(body, selectedPeerId);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setPeers((prev) => {
        const next = prev.map((p) =>
          p.userId === selectedPeerId
            ? {
                ...p,
                lastMessage: {
                  id: msg.id,
                  body: msg.body,
                  createdAt: msg.createdAt,
                  senderUserId: msg.sender.id,
                },
              }
            : p
        );
        next.sort((a, b) => {
          const at = a.lastMessage ? Date.parse(a.lastMessage.createdAt) : 0;
          const bt = b.lastMessage ? Date.parse(b.lastMessage.createdAt) : 0;
          if (at !== bt) return bt - at;
          return a.name.localeCompare(b.name);
        });
        return next;
      });
      scrollBottom();
    } catch {
      setDraft(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-row overflow-hidden border-t border-swiss-line bg-surface-muted selection:bg-primary/15">
      <section
        className={`${
          isLargeUp ? 'w-[300px] xl:w-[320px]' : 'w-full'
        } h-full shrink-0 flex-col border-r border-swiss-line bg-white text-left ${
          !isLargeUp && mobilePane !== 'list' ? 'hidden' : 'flex'
        }`}
      >
        <div className="flex flex-col gap-2.5 border-b border-swiss-line p-3">
          <div>
            <h2 className="text-sm font-semibold text-swiss-ink">Team chat</h2>
            <p className="text-xs text-swiss-muted">Direct messages with your team</p>
          </div>
          <label className="relative block">
            <span className="sr-only">Search team members</span>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              type="search"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search teammates…"
              className="h-auto min-h-10 w-full cursor-text rounded-xl border border-swiss-line bg-surface-muted py-2 pl-8 pr-3 text-sm font-medium text-swiss-ink outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingPeers ? (
            <p className="px-4 py-8 text-center text-sm text-swiss-faint">Loading team…</p>
          ) : filteredPeers.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-swiss-faint">
              {listSearch.trim() ? 'No matches' : 'No teammates yet'}
            </p>
          ) : (
            filteredPeers.map((peer) => {
              const active = peer.userId === selectedPeerId;
              const unread = unreadByPeer.get(peer.userId) ?? 0;
              const preview = peer.lastMessage
                ? `${peer.lastMessage.senderUserId === selfId ? 'You: ' : ''}${previewBody(
                    peer.lastMessage.body
                  )}`
                : 'No messages yet';
              return (
                <button
                  key={peer.userId}
                  type="button"
                  onClick={() => selectPeer(peer.userId)}
                  className={`flex w-full items-center gap-3 border-b border-black/4 px-3 py-3 text-left transition-colors ${
                    active ? 'bg-primary/8' : 'hover:bg-surface-muted'
                  }`}
                >
                  <Avatar name={peer.name} avatar={peer.avatar} online={peer.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          unread > 0 ? 'font-bold text-swiss-ink' : 'font-semibold text-swiss-ink'
                        }`}
                      >
                        {peer.name}
                      </p>
                      {peer.lastMessage && (
                        <span className="shrink-0 text-[10px] text-swiss-faint">
                          {formatNotificationRelativeTime(Date.parse(peer.lastMessage.createdAt))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-xs ${
                          unread > 0 ? 'font-medium text-swiss-ink' : 'text-swiss-muted'
                        }`}
                      >
                        {preview}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section
        className={`min-h-0 min-w-0 flex-1 flex-col bg-white ${
          !isLargeUp && mobilePane !== 'chat' ? 'hidden' : 'flex'
        }`}
      >
        {!selectedPeer ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-swiss-faint">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-swiss-ink">Select a teammate</p>
            <p className="max-w-xs text-xs text-swiss-muted">
              Pick someone from the list to start a private 1:1 chat.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-swiss-line px-3 py-3">
              {!isLargeUp && (
                <button
                  type="button"
                  onClick={() => setMobilePane('list')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-swiss-muted hover:bg-surface-muted"
                  aria-label="Back to team list"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <Avatar
                name={selectedPeer.name}
                avatar={selectedPeer.avatar}
                online={selectedPeer.online}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-swiss-ink">
                  {selectedPeer.name}
                </p>
                <p className="text-xs text-swiss-muted">
                  {selectedPeer.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-surface-muted/40 px-4 py-4">
              {loadingThread ? (
                <p className="py-10 text-center text-sm text-swiss-faint">Loading chat…</p>
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-swiss-faint">
                  Say hello to {selectedPeer.name.split(' ')[0] || selectedPeer.name}
                </p>
              ) : (
                messages.map((m) => {
                  const mine = m.sender.id === selfId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[min(72%,28rem)] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'rounded-br-md bg-primary text-white'
                            : 'rounded-bl-md bg-white text-swiss-ink ring-1 ring-black/5'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            mine ? 'text-white/70' : 'text-swiss-faint'
                          }`}
                        >
                          {formatNotificationRelativeTime(Date.parse(m.createdAt))}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className="flex items-center gap-2 border-t border-swiss-line bg-white px-3 py-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${selectedPeer.name.split(' ')[0] || selectedPeer.name}…`}
                maxLength={4000}
                className="h-auto min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-swiss-ink placeholder:text-swiss-faint focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
};
