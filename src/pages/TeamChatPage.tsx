import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageSquare, Search, Send } from 'lucide-react'

import { useKeepAliveActivation, useKeepAliveActive } from '@/components/KeepAlive'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  clearTeamChatUnread,
  consumePendingOpenTeamChatPeer,
  getTeamChatUnreadSnapshot,
  TEAM_CHAT_OPEN_PEER_EVENT,
  TEAM_CHAT_UNREAD_CHANGED_EVENT,
} from '@/lib/teamChatEvents'
import { setActiveTeamChatPeerId, setTeamChatVisible } from '@/lib/teamChatFocus'
import { previewBody } from '@/lib/teamChatCache'
import { realTeamChatService, teamChatQueryKeys } from '@/services/realTeamChat.service'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatPreviewTime(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  return sameDay
    ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function initials(name: string) {
  return name.charAt(0).toUpperCase()
}

export function TeamChatPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const teamChatTabActive = useKeepAliveActive()
  const { data: peersRes, isLoading: peersLoading } = realTeamChatService.usePeers()
  const peers = peersRes?.peers ?? []

  const [query, setQuery] = useState('')
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list')
  const [unreadByPeer, setUnreadByPeer] = useState(() => getTeamChatUnreadSnapshot())
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: messagesRes, isLoading: threadLoading } = realTeamChatService.useMessages(selectedPeerId)
  const thread = messagesRes?.items ?? []
  const sendMessage = realTeamChatService.useSendMessage()

  const filteredPeers = useMemo(
    () => peers.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())),
    [peers, query]
  )

  const selectedPeer = peers.find((p) => p.userId === selectedPeerId) ?? null

  const scrollBottom = () => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }

  useKeepAliveActivation(() => {
    void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.peers })
    if (selectedPeerId) {
      void queryClient.invalidateQueries({ queryKey: teamChatQueryKeys.messages(selectedPeerId) })
    }
  })

  useEffect(() => {
    setTeamChatVisible(teamChatTabActive)
  }, [teamChatTabActive])

  useEffect(() => () => setTeamChatVisible(false), [])

  useEffect(() => {
    setActiveTeamChatPeerId(selectedPeerId ?? '')
    if (selectedPeerId) clearTeamChatUnread(selectedPeerId)
  }, [selectedPeerId])

  useEffect(() => {
    const clearIfReading = () => {
      if (!document.hidden && selectedPeerId) clearTeamChatUnread(selectedPeerId)
    }
    clearIfReading()
    document.addEventListener('visibilitychange', clearIfReading)
    return () => document.removeEventListener('visibilitychange', clearIfReading)
  }, [selectedPeerId])

  useEffect(() => {
    const onUnread = () => setUnreadByPeer(getTeamChatUnreadSnapshot())
    window.addEventListener(TEAM_CHAT_UNREAD_CHANGED_EVENT, onUnread)
    return () => window.removeEventListener(TEAM_CHAT_UNREAD_CHANGED_EVENT, onUnread)
  }, [])

  useEffect(() => {
    const openPeer = (peerUserId: string) => {
      setSelectedPeerId(peerUserId)
      if (isMobile) setMobilePane('chat')
    }
    const pending = consumePendingOpenTeamChatPeer()
    if (pending) openPeer(pending)
    const onOpenPeer = (event: Event) => {
      const peerUserId = (event as CustomEvent<{ peerUserId: string }>).detail?.peerUserId
      if (!peerUserId) return
      consumePendingOpenTeamChatPeer()
      openPeer(peerUserId)
    }
    window.addEventListener(TEAM_CHAT_OPEN_PEER_EVENT, onOpenPeer)
    return () => window.removeEventListener(TEAM_CHAT_OPEN_PEER_EVENT, onOpenPeer)
  }, [isMobile])

  useEffect(() => {
    if (threadLoading) return
    scrollBottom()
  }, [thread.length, threadLoading, selectedPeerId])

  const selectPeer = (userId: string) => {
    setSelectedPeerId(userId)
    clearTeamChatUnread(userId)
    if (isMobile) setMobilePane('chat')
  }

  const send = () => {
    const body = draft.trim().slice(0, 4000)
    if (!body || !selectedPeer || sendMessage.isPending) return
    setDraft('')
    sendMessage.mutate(
      { body, recipientUserId: selectedPeer.userId },
      { onError: () => setDraft(body) }
    )
  }

  const showList = !isMobile || mobilePane === 'list'
  const showChat = !isMobile || mobilePane === 'chat'

  return (
    <div className="flex h-full min-h-0 w-full flex-1">
      <div
        className={`h-full shrink-0 flex-col border-r xl:w-80 ${
          showList ? 'flex' : 'hidden'
        } ${isMobile ? 'w-full' : 'w-72'}`}
      >
        <div className="shrink-0 space-y-2.5 border-b p-3">
          <div>
            <h2 className="text-sm font-semibold">Team chat</h2>
            <p className="text-muted-foreground text-xs">Direct messages with your team</p>
          </div>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teammates…"
              className="pl-8"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {peersLoading ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPeers.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              {query.trim() ? 'No matches' : 'No teammates yet'}
            </p>
          ) : (
            filteredPeers.map((peer) => {
              const last = peer.lastMessage
              const preview = last
                ? `${last.senderUserId === user?.id ? 'You: ' : ''}${previewBody(last.body)}`
                : 'No messages yet'
              const active = peer.userId === selectedPeerId
              const unread = unreadByPeer.get(peer.userId) ?? 0
              return (
                <button
                  key={peer.userId}
                  type="button"
                  onClick={() => selectPeer(peer.userId)}
                  className={`flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors ${
                    active ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar>
                      {peer.avatar ? (
                        <img src={peer.avatar} alt="" className="size-full object-cover" />
                      ) : null}
                      <AvatarFallback>{initials(peer.name)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={`ring-background absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ${
                        peer.online ? 'bg-channel-green' : 'bg-muted-foreground/40'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm ${unread > 0 ? 'font-bold' : 'font-medium'}`}>
                        {peer.name}
                      </p>
                      {last ? (
                        <span className="text-muted-foreground shrink-0 text-[10px]">
                          {formatPreviewTime(last.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-xs ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                      >
                        {preview}
                      </p>
                      {unread > 0 ? (
                        <span className="bg-primary text-primary-foreground shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className={`min-h-0 min-w-0 flex-1 flex-col ${showChat ? 'flex' : 'hidden'}`}>
        {!selectedPeer ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <MessageSquare className="text-muted-foreground size-5" />
            </div>
            <p className="text-sm font-medium">Select a teammate</p>
            <p className="text-muted-foreground max-w-xs text-xs">
              Pick someone from the list to start a private 1:1 chat.
            </p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
              {isMobile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobilePane('list')}
                  aria-label="Back to team list"
                >
                  <ArrowLeft />
                </Button>
              ) : null}
              <Avatar>
                {selectedPeer.avatar ? (
                  <img src={selectedPeer.avatar} alt="" className="size-full object-cover" />
                ) : null}
                <AvatarFallback>{initials(selectedPeer.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{selectedPeer.name}</p>
                <p className="text-muted-foreground text-xs">{selectedPeer.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {threadLoading ? (
                <div className="space-y-3">
                  <Skeleton className="ml-auto h-10 w-2/3" />
                  <Skeleton className="h-10 w-2/3" />
                </div>
              ) : thread.length === 0 ? (
                <p className="text-muted-foreground py-10 text-center text-sm">
                  Say hello to {selectedPeer.name.split(' ')[0]}
                </p>
              ) : (
                thread.map((m) => {
                  const mine = m.sender.id === user?.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          mine
                            ? 'bg-primary text-primary-foreground rounded-tr-md'
                            : 'bg-card rounded-tl-md border'
                        }`}
                      >
                        <p className="break-words whitespace-pre-wrap">{m.body}</p>
                        <p
                          className={`mt-1 text-right text-[10px] ${
                            mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className="shrink-0 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
            >
              <div className="bg-background focus-within:ring-ring/50 flex items-end gap-2 rounded-xl border p-1.5 focus-within:ring-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder={`Message ${selectedPeer.name.split(' ')[0]}…`}
                  rows={1}
                  maxLength={4000}
                  className="min-h-9 flex-1 resize-none border-0 shadow-none focus-visible:ring-0"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim() || sendMessage.isPending}
                  aria-label="Send message"
                >
                  <Send />
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
