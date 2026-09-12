import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Briefcase, Coffee, Handshake, Inbox, Smile } from 'lucide-react'

import { AiProviderSheet } from '@/components/integrations/AiProviderSheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ACTION_LABELS, LANGUAGE_LABELS, TONE_LABELS } from '@/lib/aiAgentLabels'
import { INTENT_FALLBACK_OPTIONS, type IntentFallback } from '@/lib/agentWelcome'
import { isAiHandlingAssignee, realInboxService } from '@/services/realInbox.service'
import { realIntegrationsService } from '@/services/realIntegrations.service'
import {
  getMatchThreshold,
  realAgentsService,
  type Agent,
  type AgentActionType,
  type AgentUpdateInput,
  type FallbackLanguage,
  type ToneOfVoice,
} from '@/services/realAgents.service'

const TONE_ICON: Record<ToneOfVoice, React.ComponentType<{ className?: string }>> = {
  professional: Briefcase,
  humorous: Smile,
  casual: Coffee,
  friendly: Handshake,
}

export function AgentProfilePanel({
  agent,
  onUpdate,
  onTestAgent,
}: {
  agent: Agent
  onUpdate: (patch: AgentUpdateInput) => void
  onTestAgent: () => void
}) {
  const navigate = useNavigate()
  const avatarRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(agent.name)
  const [description, setDescription] = useState(agent.description)
  const [instructions, setInstructions] = useState(agent.instructions)
  const [brandBackground, setBrandBackground] = useState(agent.brandBackground)
  const [welcomeText, setWelcomeText] = useState(agent.welcomeMessageText ?? '')
  const [threshold, setThreshold] = useState(getMatchThreshold(agent))
  const [providerOpen, setProviderOpen] = useState(false)
  const { data: provider } = realIntegrationsService.useAiProviderConfig()
  const { data: conversations = [] } = realInboxService.useList()
  const { data: tokenStats } = realAgentsService.useTokenStats(agent.id)
  const assignedChats = conversations.filter(
    (c) => isAiHandlingAssignee(c.assigneeType) && c.assigneeId === agent.id
  )
  const assignable = agent.isPublished && agent.isEnabled && (agent.category === 'ai_agent' || agent.category === 'responsive')

  const toggleAction = (type: AgentActionType) => {
    onUpdate({
      actions: agent.actions.map((a) => (a.type === type ? { ...a, enabled: !a.enabled } : a)),
    })
  }

  const updateActionInstruction = (type: AgentActionType, instruction: string) => {
    onUpdate({
      actions: agent.actions.map((a) => (a.type === type ? { ...a, instruction } : a)),
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => avatarRef.current?.click()} aria-label="Change avatar">
              <Avatar className="size-14">
                {agent.avatarUrl ? <AvatarImage src={agent.avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="size-6" />
                </AvatarFallback>
              </Avatar>
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 5 * 1024 * 1024) return
                const reader = new FileReader()
                reader.onload = () => {
                  if (typeof reader.result === 'string') onUpdate({ avatarUrl: reader.result })
                }
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            <div className="min-w-0">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => name.trim() && name !== agent.name && onUpdate({ name: name.trim() })}
                className="hover:border-input focus-visible:border-input h-8 border-transparent px-1 text-base font-semibold shadow-none"
              />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => description !== agent.description && onUpdate({ description })}
                placeholder="Short description"
                className="text-muted-foreground hover:border-input focus-visible:border-input h-7 border-transparent px-1 text-xs shadow-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={agent.isPublished ? 'default' : 'outline'}>
              {agent.isPublished ? 'Published' : 'Draft'}
            </Badge>
            <Button variant="outline" size="sm" onClick={onTestAgent}>
              Test agent
            </Button>
            <Button size="sm" onClick={() => onUpdate({ isPublished: true, isEnabled: true })}>
              {agent.isPublished ? 'Republish' : 'Publish'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{agent.isEnabled ? 'Live' : 'Paused'}</CardTitle>
            <Switch checked={agent.isEnabled} onCheckedChange={(v) => onUpdate({ isEnabled: v })} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {agent.isEnabled
              ? 'This agent is live and responding to assigned conversations. Turn off to pause it.'
              : 'This agent is paused and will not reply until you resume it.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Model & provider</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setProviderOpen(true)}>
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {provider
              ? `${provider.mode === 'byok' ? 'Your' : 'ConvoSync'} ${provider.provider} · ${provider.model || 'default model'}`
              : 'Workspace AI provider is used for this agent.'}
          </p>
        </CardContent>
      </Card>
      <AiProviderSheet open={providerOpen} onOpenChange={setProviderOpen} />

      <Card>
        <CardHeader>
          <CardTitle>Assign to inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-sm">
            {assignable
              ? `Assignable from Inbox. Currently handling ${assignedChats.length} open chat${assignedChats.length === 1 ? '' : 's'}.`
              : 'Publish and enable this agent so it appears in the Inbox assignee picker.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/inbox')}>
            <Inbox />
            Open inbox
          </Button>
        </CardContent>
      </Card>

      {tokenStats ? (
        <Card>
          <CardHeader>
            <CardTitle>This month</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">Tokens</p>
              <p className="font-semibold tabular-nums">{tokenStats.totalTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Conversations</p>
              <p className="font-semibold tabular-nums">{tokenStats.totalConversations.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Cache hits</p>
              <p className="font-semibold tabular-nums">{tokenStats.cacheSavingsPercent}%</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Welcome message</CardTitle>
            <Switch
              checked={agent.welcomeMessageEnabled}
              onCheckedChange={(v) => onUpdate({ welcomeMessageEnabled: v })}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Automatically send a welcome message when your customer opens the conversation.
          </p>
          {agent.welcomeMessageEnabled ? (
            <Textarea
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              onBlur={() =>
                welcomeText !== (agent.welcomeMessageText ?? '') &&
                onUpdate({ welcomeMessageText: welcomeText })
              }
              placeholder="Hi! How can we help you today?"
              rows={3}
              maxLength={1000}
              className="mt-3"
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intent fallback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            What should the agent do when it doesn&apos;t understand the user&apos;s intent?
          </p>
          <div className="space-y-2">
            {INTENT_FALLBACK_OPTIONS.map((option) => (
              <label key={option.id} className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="intentFallback"
                  checked={agent.intentFallback === option.id}
                  onChange={() => onUpdate({ intentFallback: option.id as IntentFallback })}
                  className="accent-primary size-4"
                />
                {option.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tone of voice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(TONE_LABELS) as ToneOfVoice[]).map((tone) => {
              const Icon = TONE_ICON[tone]
              const active = agent.toneOfVoice === tone
              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => onUpdate({ toneOfVoice: tone })}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${
                    active
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="text-xs font-medium">{TONE_LABELS[tone]}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fallback language</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={agent.fallbackLanguage}
            onValueChange={(v) => onUpdate({ fallbackLanguage: v as FallbackLanguage })}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(LANGUAGE_LABELS) as FallbackLanguage[]).map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge match threshold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Slider
              value={[threshold]}
              max={100}
              step={5}
              onValueChange={([v]) => setThreshold(v)}
              onValueCommit={([v]) => onUpdate({ similarityLowThreshold: v / 100 })}
              className="flex-1"
            />
            <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums">{threshold}%</span>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            How closely a question must match your knowledge base before the agent answers from it.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            onBlur={() => instructions !== agent.instructions && onUpdate({ instructions })}
            rows={6}
            maxLength={5000}
          />
          <p className="text-muted-foreground mt-1 text-right text-xs">{instructions.length}/5000</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {agent.actions.map((action) => (
            <div key={action.type} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{ACTION_LABELS[action.type]}</span>
                <Switch checked={action.enabled} onCheckedChange={() => toggleAction(action.type)} />
              </div>
              {action.enabled ? (
                <Input
                  defaultValue={action.instruction}
                  onBlur={(e) =>
                    e.target.value !== action.instruction &&
                    updateActionInstruction(action.type, e.target.value)
                  }
                  placeholder="When should the agent do this?"
                  className="text-xs"
                />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand background</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={brandBackground}
            onChange={(e) => setBrandBackground(e.target.value)}
            onBlur={() => brandBackground !== agent.brandBackground && onUpdate({ brandBackground })}
            placeholder="Optional — tell the agent about your brand, products, or tone."
            rows={3}
            maxLength={1200}
          />
        </CardContent>
      </Card>
    </div>
  )
}
