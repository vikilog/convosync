import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, Route } from 'lucide-react'

import { SocialListeningAgentSettingsForm } from '@/components/social-listening/SocialListeningAgentSettingsForm'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePostSettings, useUpdatePostSettings } from '@/hooks/useSocialListeningQueries'
import {
  mapPostAgentSettings,
  POST_AGENT_DEFAULTS,
  postAgentSettingsPayload,
  type DmSkillOption,
  type PostAgentSettings,
} from '@/lib/socialListeningPostSettings'
import { realAutomationsService } from '@/services/realAutomations.service'
import { realLeadFunnelsService } from '@/services/realLeadFunnels.service'

export function SocialListeningPostAgentPanel({
  postId,
  platform = 'instagram',
  onSaved,
}: {
  postId: string
  platform?: 'instagram' | 'facebook'
  onSaved?: (leadFunnelId: string | null) => void
}) {
  const journeysQ = realAutomationsService.useList()
  const funnelsQ = realLeadFunnelsService.useList()
  const settingsQ = usePostSettings(postId)
  const updateSettings = useUpdatePostSettings()
  const [draft, setDraft] = useState<PostAgentSettings>(POST_AGENT_DEFAULTS)
  const [commentJourneyId, setCommentJourneyId] = useState('')
  const [skills, setSkills] = useState<DmSkillOption[]>([])
  const savingRef = useRef(false)
  const hydratedId = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const loading = settingsQ.isPending && !settingsQ.data
  const saving = updateSettings.isPending

  const publishedJourneys = useMemo(
    () => (journeysQ.data ?? []).filter((j) => j.channel === 'instagram' && j.status === 'published'),
    [journeysQ.data],
  )
  const funnels = (funnelsQ.data?.funnels ?? []).map((f) => ({ id: f.id, name: f.name }))

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (hydratedId.current !== postId) hydratedId.current = null
    const res = settingsQ.data
    if (!res || hydratedId.current === postId) return
    hydratedId.current = postId
    setDraft(mapPostAgentSettings(res.settings as unknown as Record<string, unknown>))
    setCommentJourneyId(res.settings.commentAutomationJourneyId ?? '')
    setSkills(res.dmSkillOptions ?? [])
  }, [postId, settingsQ.data])

  useEffect(() => {
    if (!settingsQ.error) return
    setError(settingsQ.error instanceof Error ? settingsQ.error.message : 'Failed to load agent settings')
  }, [settingsQ.error])

  const save = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setError(null)
    try {
      const res = await updateSettings.mutateAsync({
        postId,
        data: postAgentSettingsPayload(draft, commentJourneyId),
      })
      setDraft(mapPostAgentSettings(res.settings as unknown as Record<string, unknown>))
      setCommentJourneyId(res.settings.commentAutomationJourneyId ?? '')
      setToast('Comment handling saved')
      onSaved?.(res.settings.leadFunnelId ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      savingRef.current = false
    }
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
            <Bot className="size-3.5" />
            This post
          </p>
          <h2 className="text-sm font-semibold">Comment handling</h2>
        </div>
        <Button type="button" size="sm" disabled={loading || saving} onClick={() => void save()}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3.5">
        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {platform === 'instagram' ? (
              <div className="rounded-xl border p-3">
                <div className="flex items-start gap-2">
                  <Route className="mt-0.5 size-4 shrink-0 text-sky-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Instagram automation</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Start a published journey when someone comments on this post. Leave off to use global comment-on-post triggers.
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">Automation</p>
                      <Select value={commentJourneyId || 'off'} onValueChange={(v) => setCommentJourneyId(v === 'off' ? '' : v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Off — no post-specific automation</SelectItem>
                          {publishedJourneys.map((j) => (
                            <SelectItem key={j.id} value={j.id}>
                              {j.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {publishedJourneys.length === 0 ? (
                      <p className="mt-1.5 text-xs text-amber-700">
                        Publish an Instagram automation with a Comment on post trigger first.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
                AI agent (social listening)
              </p>
              <SocialListeningAgentSettingsForm
                draft={draft}
                setDraft={setDraft}
                skills={skills}
                funnels={funnels}
                error={error}
                onError={setError}
              />
            </div>
          </>
        )}
      </div>

      {toast ? (
        <div className="bg-primary text-primary-foreground pointer-events-none absolute top-4 right-4 z-10 rounded-lg px-3 py-2 text-xs font-semibold shadow-lg">
          {toast}
        </div>
      ) : null}
    </section>
  )
}
