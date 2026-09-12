import { useEffect, useRef, useState } from 'react'
import { Bot, RefreshCw, Send } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { realAgentsService, type Agent } from '@/services/realAgents.service'

type ChatLine = { role: 'user' | 'assistant'; content: string; tokensUsed?: number; fromCache?: boolean }

export function TestAgentSheet({
  agent,
  open,
  onOpenChange,
}: {
  agent: Agent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [messages, setMessages] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [conversationId, setConversationId] = useState<string | undefined>()
  const previewChat = realAgentsService.usePreviewChat(agent?.id)
  const requestId = useRef(0)

  useEffect(() => {
    setMessages([])
    setConversationId(undefined)
    setDraft('')
  }, [agent?.id])

  const restart = () => {
    requestId.current += 1
    setMessages([])
    setConversationId(undefined)
    setDraft('')
  }

  const send = () => {
    if (!draft.trim() || !agent) return
    const content = draft.trim()
    const id = ++requestId.current
    setMessages((prev) => [...prev, { role: 'user', content }])
    setDraft('')
    previewChat.mutate(
      { message: content, conversationId },
      {
        onSuccess: (result) => {
          if (requestId.current !== id) return
          setConversationId(result.conversationId)
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: result.reply,
              tokensUsed: result.tokensUsed,
              fromCache: result.fromCache,
            },
          ])
        },
        onError: (err) => {
          if (requestId.current !== id) return
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: err instanceof Error ? `⚠️ ${err.message}` : '⚠️ Something went wrong.',
            },
          ])
        },
      }
    )
  }

  const sessionTokens = messages.reduce((sum, m) => sum + (m.role === 'assistant' ? (m.tokensUsed ?? 0) : 0), 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        {agent ? (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between gap-2 pr-8">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{agent.name}</SheetTitle>
                    <p className="text-muted-foreground text-xs">
                      Preview chat · {sessionTokens.toLocaleString()} tokens
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={restart}>
                  <RefreshCw />
                  Restart
                </Button>
              </div>
            </SheetHeader>

            <ScrollArea className="min-h-0 flex-1 px-4">
              <div className="flex flex-col gap-3 py-2">
                {messages.length === 0 && !previewChat.isPending ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    Ask anything to test this agent. Messages stay in preview — they are not sent to customers.
                  </p>
                ) : null}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-md'
                          : 'bg-card rounded-tl-md border'
                      }`}
                    >
                      {m.content}
                      {m.role === 'assistant' && m.tokensUsed != null ? (
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          {m.tokensUsed} tokens{m.fromCache ? ' · cache' : ''}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
                {previewChat.isPending ? (
                  <div className="flex justify-start">
                    <div className="bg-card text-muted-foreground rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-sm">
                      Typing…
                    </div>
                  </div>
                ) : null}
              </div>
            </ScrollArea>

            <div className="shrink-0 border-t p-3">
              <div className="bg-background focus-within:ring-ring/50 flex items-end gap-2 rounded-xl border p-1.5 focus-within:ring-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder="Ask the agent something…"
                  rows={1}
                  className="min-h-9 flex-1 resize-none border-0 shadow-none focus-visible:ring-0"
                />
                <Button
                  size="icon"
                  disabled={!draft.trim() || previewChat.isPending}
                  onClick={send}
                  aria-label="Send message"
                >
                  <Send />
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
