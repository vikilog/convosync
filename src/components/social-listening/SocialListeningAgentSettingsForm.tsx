import type { Dispatch, SetStateAction } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { DmSkillOption, PostAgentSettings } from '@/lib/socialListeningPostSettings'

const INTENT_ROWS = [
  {
    key: 'interestedMode' as const,
    label: 'Interested',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'review', label: 'Review' },
      { value: 'off', label: 'Off' },
    ],
  },
  {
    key: 'questionMode' as const,
    label: 'Question',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'review', label: 'Review' },
      { value: 'off', label: 'Off' },
    ],
  },
  {
    key: 'complaintMode' as const,
    label: 'Complaint',
    options: [
      { value: 'review', label: 'Review' },
      { value: 'escalate_only', label: 'Escalate' },
    ],
  },
  {
    key: 'spamMode' as const,
    label: 'Spam',
    options: [
      { value: 'auto_ignore', label: 'Auto-ignore' },
      { value: 'review', label: 'Review' },
    ],
  },
] as const

export function SocialListeningAgentSettingsForm({
  draft,
  setDraft,
  skills,
  funnels,
  error,
  onError,
}: {
  draft: PostAgentSettings
  setDraft: Dispatch<SetStateAction<PostAgentSettings>>
  skills: DmSkillOption[]
  funnels: Array<{ id: string; name: string }>
  error: string | null
  onError: (msg: string | null) => void
}) {
  const patch = <K extends keyof PostAgentSettings>(key: K, value: PostAgentSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))
  const autoWarning = draft.autoResponseEnabled && (draft.interestedMode === 'auto' || draft.questionMode === 'auto')

  return (
    <div className="space-y-5">
      <section className="rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Agent</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {draft.autoResponseEnabled
                ? 'On: matching comments on this post can be handled automatically.'
                : 'Off (safe): every comment on this post stays in the review queue.'}
            </p>
          </div>
          <Switch
            checked={draft.autoResponseEnabled}
            onCheckedChange={(v) => {
              if (v && !draft.leadFunnelId) {
                onError('Select a lead funnel below before enabling the agent.')
                return
              }
              onError(null)
              patch('autoResponseEnabled', v)
            }}
            aria-label="Enable agent"
          />
        </div>
      </section>

      <section className="space-y-1.5">
        <Label>Lead funnel (required for agent)</Label>
        {funnels.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            No funnels yet. Create one under Leads before enabling the agent.
          </p>
        ) : (
          <Select
            value={draft.leadFunnelId || 'none'}
            onValueChange={(v) => {
              const id = v === 'none' ? null : v
              onError(null)
              setDraft((d) => ({ ...d, leadFunnelId: id, autoResponseEnabled: id ? d.autoResponseEnabled : false }))
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select funnel…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select funnel…</SelectItem>
              {funnels.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </section>

      {autoWarning ? (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Comments matching these rules will be handled without human review.
        </div>
      ) : null}

      <section>
        <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">Automation by intent</p>
        <div className="overflow-hidden rounded-xl border">
          {INTENT_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3 border-b px-3 py-2.5 last:border-b-0">
              <span className="text-sm font-medium">{row.label}</span>
              <Select
                value={draft[row.key]}
                onValueChange={(v) => patch(row.key, v as PostAgentSettings[typeof row.key])}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {row.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <Label>Confidence threshold</Label>
          <span className="text-xs font-semibold tabular-nums">{draft.confidenceThreshold}%</span>
        </div>
        <Slider
          value={[draft.confidenceThreshold]}
          max={100}
          step={1}
          onValueChange={([v]) => patch('confidenceThreshold', v)}
        />
      </section>

      <section className="space-y-3">
        <Label>Public reply tone</Label>
        <Select
          value={draft.publicReplyTone}
          onValueChange={(v) => patch('publicReplyTone', v as PostAgentSettings['publicReplyTone'])}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="playful">Playful</SelectItem>
          </SelectContent>
        </Select>
        <div className="space-y-1.5">
          <Label>DM agent skill</Label>
          <Select
            value={draft.dmAgentSkillId || 'none'}
            onValueChange={(v) => patch('dmAgentSkillId', v === 'none' ? null : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (default prompts)</SelectItem>
              {skills.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title} · {s.agentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sl-fallback">Fallback message</Label>
          <Textarea
            id="sl-fallback"
            value={draft.fallbackMessage || ''}
            onChange={(e) => patch('fallbackMessage', e.target.value || null)}
            rows={3}
            placeholder="Used for DM if AI generation fails"
          />
        </div>
      </section>

      <section className="space-y-1.5">
        <Label>Lead creation</Label>
        <Select
          value={draft.leadCreationRule}
          onValueChange={(v) => patch('leadCreationRule', v as PostAgentSettings['leadCreationRule'])}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="interested_only">Interested comments only</SelectItem>
            <SelectItem value="interested_and_questions">Interested + Questions</SelectItem>
            <SelectItem value="never">Never create leads</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="sl-max-dm">Max auto-DMs per day (this post)</Label>
          <Input
            id="sl-max-dm"
            type="number"
            min={0}
            max={10000}
            value={draft.maxAutoDmsPerDay}
            onChange={(e) => patch('maxAutoDmsPerDay', Math.max(0, Number(e.target.value) || 0))}
          />
          <p className="text-muted-foreground text-[11px]">
            Sent today: {draft.autoDmsSentToday} / {draft.maxAutoDmsPerDay}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Working hours only</p>
            <p className="text-muted-foreground text-[11px]">Outside the window, auto-eligible comments go to review.</p>
          </div>
          <Switch
            checked={draft.workingHoursOnly}
            onCheckedChange={(v) => patch('workingHoursOnly', v)}
            aria-label="Working hours only"
          />
        </div>
        {draft.workingHoursOnly ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="sl-wh-start">Start</Label>
              <Input
                id="sl-wh-start"
                type="time"
                value={draft.workingHoursStart || '09:00'}
                onChange={(e) => patch('workingHoursStart', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sl-wh-end">End</Label>
              <Input
                id="sl-wh-end"
                type="time"
                value={draft.workingHoursEnd || '18:00'}
                onChange={(e) => patch('workingHoursEnd', e.target.value)}
              />
            </div>
          </div>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
      ) : null}
    </div>
  )
}
