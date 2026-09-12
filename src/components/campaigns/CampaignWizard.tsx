import { useEffect, useMemo, useState } from 'react'

import { ReviewStep } from '@/components/campaigns/CampaignWizardReview'
import {
  AudienceStep,
  AUTO_EMAIL_VARS,
  ChannelStep,
  MessageStep,
} from '@/components/campaigns/CampaignWizardSteps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { estimateCampaignCostCc } from '@/lib/campaignCost'
import {
  defaultScheduleLocal,
  isoToLocalDateTime,
  localDateTimeToIso,
  wizardSeedFromCampaignDetail,
  type ScheduledWizardSeed,
} from '@/lib/campaignScheduleEdit'
import { realAgentsService } from '@/services/realAgents.service'
import { realAutomationsService } from '@/services/realAutomations.service'
import { realIntegrationsService } from '@/services/realIntegrations.service'
import {
  realCampaignsService,
  type CampaignChannel,
  type CampaignWriteInput,
  type ReplyHandling,
  type TagMatchMode,
} from '@/services/realCampaigns.service'
import { realTemplatesService } from '@/services/realTemplates.service'

const STEPS = ['Channel', 'Audience', 'Message', 'Review'] as const
type Step = (typeof STEPS)[number]

function defaultWaMappings(vars: string[], prev: Record<string, string> = {}): Record<string, string> {
  const next: Record<string, string> = {}
  vars.forEach((v, i) => {
    next[v] = prev[v]?.trim() ? prev[v] : i === 0 || v.toLowerCase().includes('name') ? '{{contact.name}}' : ''
  })
  return next
}

export function CampaignWizard({
  editCampaignId,
  onDone,
  onCancel,
}: {
  editCampaignId?: string | null
  onDone: () => void
  onCancel: () => void
}) {
  const [step, setStep] = useState<Step>('Channel')
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<CampaignChannel>('whatsapp')
  const [audienceType, setAudienceType] = useState<'all' | 'segment'>('segment')
  const [segmentIds, setSegmentIds] = useState<string[]>([])
  const [tagMatchMode, setTagMatchMode] = useState<TagMatchMode>('any')
  const [tagQuery, setTagQuery] = useState('')
  const [waTemplateId, setWaTemplateId] = useState('')
  const [emailTemplateId, setEmailTemplateId] = useState('')
  const [waMappings, setWaMappings] = useState<Record<string, string>>({})
  const [emailMappings, setEmailMappings] = useState<Record<string, string>>({})
  const [igMessage, setIgMessage] = useState('')
  const [headerKey, setHeaderKey] = useState<string | null>(null)
  const [headerMime, setHeaderMime] = useState<string | null>(null)
  const [headerName, setHeaderName] = useState<string | null>(null)
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState(() => defaultScheduleLocal().date)
  const [scheduledTime, setScheduledTime] = useState(() => defaultScheduleLocal().time)
  const [replyHandling, setReplyHandling] = useState<ReplyHandling>('default')
  const [replyJourneyId, setReplyJourneyId] = useState<string | null>(null)
  const [replyAgentId, setReplyAgentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seeded, setSeeded] = useState(false)
  const [isRelaunch, setIsRelaunch] = useState(false)

  const { data: detail } = realCampaignsService.useGet(editCampaignId ?? null)
  const { data: audience, isLoading: audienceLoading } = realCampaignsService.useAudience(channel)
  const activeSegmentIds = audienceType === 'all' ? ['all'] : segmentIds
  const { data: contactsRes, isFetching: contactsLoading } = realCampaignsService.useAudienceContacts(
    channel,
    activeSegmentIds,
    tagMatchMode,
    audienceType === 'all' || segmentIds.length > 0
  )
  const { data: waTemplates = [] } = realTemplatesService.useList()
  const { data: emailTemplates = [] } = realCampaignsService.useEmailTemplates(channel === 'email')
  const { data: waAccounts } = realIntegrationsService.useWhatsAppAccounts()
  const { data: emailProviders = [] } = realIntegrationsService.useEmailProviders()
  const { data: automations = [] } = realAutomationsService.useList()
  const { data: agents = [] } = realAgentsService.useList()
  const createCampaign = realCampaignsService.useCreate()
  const updateCampaign = realCampaignsService.useUpdate()
  const sendCampaign = realCampaignsService.useSend()
  const uploadHeader = realCampaignsService.useUploadHeaderMedia()

  const approvedWa = useMemo(() => waTemplates.filter((t) => t.status === 'approved'), [waTemplates])
  const activeEmail = useMemo(() => emailTemplates.filter((t) => t.status === 'active'), [emailTemplates])
  const waTemplate = approvedWa.find((t) => t.id === waTemplateId) ?? null
  const emailTemplate = activeEmail.find((t) => t.id === emailTemplateId) ?? null
  const tagged = (audience?.segments ?? []).filter((s) => s.id !== 'all')
  const filteredTags = tagQuery.trim()
    ? tagged.filter((s) => s.name.toLowerCase().includes(tagQuery.trim().toLowerCase()))
    : tagged

  const audienceCount = (() => {
    if (audienceLoading) return 0
    if (audienceType === 'all') return audience?.total ?? 0
    if (segmentIds.length === 0) return 0
    if (segmentIds.length === 1 && contactsLoading) {
      return tagged.find((s) => s.id === segmentIds[0])?.count ?? 0
    }
    if (segmentIds.length > 1 && contactsLoading) return 0
    return contactsRes?.total ?? 0
  })()

  const cost = estimateCampaignCostCc({
    channel,
    audienceCount,
    waCategory: waTemplate?.category,
    waPaymentMode: waAccounts?.accounts[0]?.paymentMode ?? null,
    emailDefaultProvider: (emailProviders.find((p) => p.isDefault) ?? emailProviders[0])?.provider ?? null,
  })

  useEffect(() => {
    if (!detail || seeded) return
    const seed = wizardSeedFromCampaignDetail({
      status: detail.campaign.status,
      channel: detail.channel,
      audienceType: detail.audienceType,
      segmentIds: detail.segmentIds,
      tagMatchMode: detail.tagMatchMode,
      template: detail.template,
      variableMappings: detail.variableMappings,
      headerMediaStorageKey: detail.headerMediaStorageKey,
      headerMediaMimeType: detail.headerMediaMimeType,
      headerMediaFileName: detail.headerMediaFileName,
      headerMediaAssetId: detail.headerMediaAssetId,
      replyHandling: detail.replyHandling,
      replyJourneyId: detail.replyJourneyId,
      replyAgentId: detail.replyAgentId,
      name: detail.campaign.name,
      scheduledAt: detail.campaign.scheduledAt,
    })
    if (!seed) return
    applySeed(seed)
    setIsRelaunch(detail.campaign.status === 'failed')
    setSeeded(true)
  }, [detail, seeded])

  function applySeed(seed: ScheduledWizardSeed) {
    setName(seed.name)
    setChannel(seed.channel)
    setAudienceType(seed.audienceType)
    setSegmentIds(seed.segmentIds)
    setTagMatchMode(seed.tagMatchMode)
    setReplyHandling(seed.replyHandling)
    setReplyJourneyId(seed.replyJourneyId)
    setReplyAgentId(seed.replyAgentId)
    setIsScheduled(Boolean(seed.scheduledAt))
    const local = isoToLocalDateTime(seed.scheduledAt)
    setScheduledDate(local.date)
    setScheduledTime(local.time)
    if (seed.channel === 'whatsapp' && seed.templateId) {
      setWaTemplateId(seed.templateId)
      setWaMappings({ ...seed.variableMappings })
    }
    if (seed.channel === 'email' && seed.templateId) {
      setEmailTemplateId(seed.templateId)
      setEmailMappings({ ...seed.variableMappings })
    }
    setHeaderKey(seed.headerMediaStorageKey)
    setHeaderMime(seed.headerMediaMimeType)
    setHeaderName(seed.headerMediaFileName)
    setStep('Audience')
  }

  useEffect(() => {
    if (waTemplate && channel === 'whatsapp') {
      setWaMappings((prev) => defaultWaMappings(waTemplate.variables, prev))
    }
  }, [waTemplate?.id, channel])

  const stepIndex = STEPS.indexOf(step)
  const editingScheduled = Boolean(editCampaignId) && !isRelaunch
  const pending = createCampaign.isPending || updateCampaign.isPending || sendCampaign.isPending
  const canNext =
    step === 'Channel' ||
    (step === 'Audience' && (audienceType === 'all' || segmentIds.length > 0) && audienceCount > 0) ||
    (step === 'Message' &&
      (channel === 'instagram' ||
        (channel === 'whatsapp' && waTemplateId.length > 0) ||
        (channel === 'email' && emailTemplateId.length > 0)))

  async function launch() {
    setError(null)
    if (channel === 'instagram') {
      setError('Instagram campaigns are preview-only right now. Use WhatsApp or Email to send.')
      return
    }
    if (audienceType === 'segment' && segmentIds.length === 0) {
      setError('Select at least one tag for the campaign audience.')
      return
    }
    if (audienceCount === 0) {
      setError('Your audience is empty. Add contacts or choose a different segment.')
      return
    }

    const mustSchedule = editingScheduled || isScheduled
    let scheduledAtIso: string | undefined
    if (mustSchedule) {
      try {
        scheduledAtIso = localDateTimeToIso(scheduledDate, scheduledTime)
      } catch {
        setError('Pick a valid schedule date and time.')
        return
      }
      if (new Date(scheduledAtIso).getTime() <= Date.now() + 30_000) {
        setError('Schedule time must be at least 30 seconds in the future.')
        return
      }
    }

    let templateId = ''
    let mappings: Record<string, string> = {}
    if (channel === 'whatsapp') {
      if (!waTemplate) {
        setError('Select an approved WhatsApp template before launching.')
        return
      }
      if (waTemplate.variables.some((v) => !waMappings[v]?.trim())) {
        setError('Fill in all template variables before launching.')
        return
      }
      const needsMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(waTemplate.headerFormat ?? '')
      if (needsMedia && !headerKey && !waTemplate.headerMediaStorageKey) {
        setError('This template needs a media header. Upload media before launching.')
        return
      }
      templateId = waTemplate.id
      mappings = waMappings
    } else {
      if (!emailTemplate) {
        setError('Select an active email template before launching.')
        return
      }
      const manual = emailTemplate.variables.filter((v) => !AUTO_EMAIL_VARS.has(v))
      if (manual.some((v) => !emailMappings[v]?.trim())) {
        setError('Fill in all campaign template variables before launching.')
        return
      }
      templateId = emailTemplate.id
      mappings = emailMappings
    }

    if (!mustSchedule && !window.confirm(`Send to ${audienceCount.toLocaleString()} contacts now?`)) return

    const ids = audienceType === 'all' ? ['all'] : segmentIds
    const audienceFilter: Record<string, unknown> = {
      channel,
      segmentId: ids[0] ?? 'all',
      segmentIds: ids,
      tagMatchMode,
      variableMappings: mappings,
    }
    if (channel === 'whatsapp' && headerKey) {
      audienceFilter.headerMediaStorageKey = headerKey
      if (headerMime) audienceFilter.headerMediaMimeType = headerMime
      if (headerName) audienceFilter.headerMediaFileName = headerName
    }
    if (replyHandling !== 'default') {
      audienceFilter.replyHandling = replyHandling
      if (replyHandling === 'journey' && replyJourneyId) audienceFilter.replyJourneyId = replyJourneyId
      if (replyHandling === 'ai_agent' && replyAgentId) audienceFilter.replyAgentId = replyAgentId
    }

    const resolvedName =
      name.trim() ||
      `${channel === 'whatsapp' ? waTemplate?.name : emailTemplate?.name} · ${new Date().toLocaleDateString()}`
    const body: CampaignWriteInput = {
      name: resolvedName,
      templateId,
      channel,
      audienceType: audienceType === 'all' ? 'all' : 'segment',
      audienceFilter,
      scheduledAt: scheduledAtIso,
    }

    try {
      if (editCampaignId) {
        await updateCampaign.mutateAsync({ id: editCampaignId, ...body })
        if (!scheduledAtIso) await sendCampaign.mutateAsync(editCampaignId)
      } else {
        const created = await createCampaign.mutateAsync(body)
        if (!scheduledAtIso && created.status !== 'scheduled') {
          await sendCampaign.mutateAsync(created.id)
        }
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-1 px-4 pt-2">
        <p className="text-muted-foreground text-xs">
          Step {stepIndex + 1} of {STEPS.length} · {step}
          {editCampaignId ? (isRelaunch ? ' · Relaunch' : ' · Edit') : ''}
        </p>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name">Campaign name</Label>
          <Input
            id="campaign-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend Flash Sale"
          />
        </div>

        {step === 'Channel' ? <ChannelStep channel={channel} onChange={setChannel} /> : null}
        {step === 'Audience' ? (
          <AudienceStep
            channel={channel}
            audienceType={audienceType}
            onAudienceType={setAudienceType}
            tagQuery={tagQuery}
            onTagQuery={setTagQuery}
            segmentIds={segmentIds}
            onToggleTag={(id) =>
              setSegmentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
            }
            tagMatchMode={tagMatchMode}
            onMatchMode={setTagMatchMode}
            tagged={filteredTags}
            audienceTotal={audience?.total ?? 0}
            excludedCount={audience?.excludedCount}
            audienceCount={audienceCount}
            contacts={contactsRes?.contacts ?? []}
            truncated={contactsRes?.truncated}
          />
        ) : null}
        {step === 'Message' ? (
          <MessageStep
            channel={channel}
            approvedWa={approvedWa}
            waTemplateId={waTemplateId}
            onWaTemplate={(id) => {
              setWaTemplateId(id)
              setHeaderKey(null)
              setHeaderMime(null)
              setHeaderName(null)
            }}
            waTemplate={waTemplate}
            waMappings={waMappings}
            onWaMapping={(key, value) => setWaMappings((prev) => ({ ...prev, [key]: value }))}
            headerName={headerName}
            onHeaderFile={(file) => {
              uploadHeader.mutate(file, {
                onSuccess: (res) => {
                  setHeaderKey(res.headerMediaStorageKey)
                  setHeaderMime(res.headerMediaMimeType)
                  setHeaderName(res.headerMediaFileName || file.name)
                },
                onError: (err) => setError(err instanceof Error ? err.message : 'Upload failed'),
              })
            }}
            activeEmail={activeEmail}
            emailTemplateId={emailTemplateId}
            onEmailTemplate={setEmailTemplateId}
            emailTemplate={emailTemplate}
            emailMappings={emailMappings}
            onEmailMapping={(key, value) => setEmailMappings((prev) => ({ ...prev, [key]: value }))}
            igMessage={igMessage}
            onIgMessage={setIgMessage}
          />
        ) : null}
        {step === 'Review' ? (
          <ReviewStep
            cost={cost}
            audienceCount={audienceCount}
            editingScheduled={editingScheduled}
            isScheduled={isScheduled}
            onScheduled={setIsScheduled}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            onDate={setScheduledDate}
            onTime={setScheduledTime}
            segmentIds={segmentIds}
            audienceType={audienceType}
            channel={channel}
            replyHandling={replyHandling}
            onReply={setReplyHandling}
            replyJourneyId={replyJourneyId}
            onJourney={setReplyJourneyId}
            replyAgentId={replyAgentId}
            onAgent={setReplyAgentId}
            journeys={automations.filter((a) => a.status === 'published')}
            agents={agents.filter(
              (a) => a.isPublished && a.isEnabled && (a.category === 'ai_agent' || a.category === 'responsive')
            )}
            templateName={channel === 'whatsapp' ? waTemplate?.name : emailTemplate?.name}
          />
        ) : null}

        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </div>

      <div className="flex shrink-0 justify-between gap-2 border-t p-4">
        {stepIndex === 0 ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setStep(STEPS[stepIndex - 1]!)}>
            Back
          </Button>
        )}
        {step === 'Review' ? (
          <Button disabled={pending || channel === 'instagram'} onClick={() => void launch()}>
            {isScheduled || editingScheduled ? 'Schedule campaign' : 'Send now'}
          </Button>
        ) : (
          <Button disabled={!canNext} onClick={() => setStep(STEPS[stepIndex + 1]!)}>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
