import { useEffect, useState } from 'react'
import { ArrowLeft, Code2, LayoutGrid, Loader2, Rocket, Save, Send } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { WhatsAppFlowVisualBuilder } from '@/components/templates/WhatsAppFlowVisualBuilder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  builderStateToFlowJson,
  emptyBuilderState,
  flowJsonToBuilderState,
  newFieldId,
  newScreenId,
  type BuilderState,
} from '@/lib/flowBuilderTypes'
import { realFlowsService } from '@/services/realFlows.service'

const STARTERS: Record<string, { label: string; description: string; state: () => BuilderState }> = {
  lead_capture: {
    label: 'Lead capture',
    description: 'Name, phone, and a short message.',
    state: () => ({
      screens: [
        {
          id: newScreenId(),
          title: 'Get in touch',
          footerLabel: 'Submit',
          nextScreenId: null,
          fields: [
            { id: newFieldId(), type: 'TextInput', label: 'Full name', name: 'full_name', required: true, options: [] },
            { id: newFieldId(), type: 'TextInput', label: 'Phone number', name: 'phone', required: true, options: [] },
            { id: newFieldId(), type: 'TextArea', label: 'What are you looking for?', name: 'message', required: false, options: [] },
          ],
        },
      ],
    }),
  },
  appointment_booking: {
    label: 'Appointment booking',
    description: 'Preferred date plus a service.',
    state: () => ({
      screens: [
        {
          id: newScreenId(),
          title: 'Book an appointment',
          footerLabel: 'Request booking',
          nextScreenId: null,
          fields: [
            { id: newFieldId(), type: 'TextInput', label: 'Full name', name: 'full_name', required: true, options: [] },
            {
              id: newFieldId(),
              type: 'Dropdown',
              label: 'Service',
              name: 'service',
              required: true,
              options: ['Consultation', 'Follow-up'],
            },
            { id: newFieldId(), type: 'DatePicker', label: 'Preferred date', name: 'preferred_date', required: true, options: [] },
          ],
        },
      ],
    }),
  },
  feedback_survey: {
    label: 'Feedback survey',
    description: 'A rating plus an open comment.',
    state: () => ({
      screens: [
        {
          id: newScreenId(),
          title: 'How did we do?',
          footerLabel: 'Send feedback',
          nextScreenId: null,
          fields: [
            {
              id: newFieldId(),
              type: 'RadioButtonsGroup',
              label: 'Rate your experience',
              name: 'rating',
              required: true,
              options: ['Excellent', 'Good', 'Okay', 'Poor', 'Very poor'],
            },
            { id: newFieldId(), type: 'TextArea', label: 'Anything you want to add?', name: 'comment', required: false, options: [] },
          ],
        },
      ],
    }),
  },
}

type Props = {
  flowId: string | null
  onBack: () => void
}

export function WhatsAppFlowEditor({ flowId, onBack }: Props) {
  const confirm = useConfirm()
  const isEdit = Boolean(flowId)
  const { data, isLoading } = realFlowsService.useGet(flowId)
  const createMutation = realFlowsService.useCreate()
  const updateMutation = realFlowsService.useUpdate()
  const publishMutation = realFlowsService.usePublish()
  const sendTestMutation = realFlowsService.useSendTest()

  const [name, setName] = useState('')
  const [mode, setMode] = useState<'visual' | 'json'>('visual')
  const [visualUnavailable, setVisualUnavailable] = useState(false)
  const [builderState, setBuilderState] = useState<BuilderState>(() => emptyBuilderState())
  const [jsonText, setJsonText] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [error, setError] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [notice, setNotice] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testError, setTestError] = useState('')
  const [testNotice, setTestNotice] = useState('')
  const [savedId, setSavedId] = useState<string | null>(flowId)

  useEffect(() => {
    const item = data?.item
    if (!item) return
    setName(item.name)
    setSavedId(item.id)
    setStatus(item.status === 'published' ? 'published' : 'draft')
    const parsed = flowJsonToBuilderState(item.flowJson)
    if (parsed) {
      setBuilderState(parsed)
      setMode('visual')
      setVisualUnavailable(false)
    } else {
      setVisualUnavailable(true)
      setMode('json')
    }
    setJsonText(JSON.stringify(item.flowJson, null, 2))
  }, [data])

  const applyStarter = (key: string) => {
    const starter = STARTERS[key]
    if (!starter) return
    const state = starter.state()
    setBuilderState(state)
    setJsonText(JSON.stringify(builderStateToFlowJson(state), null, 2))
    setJsonError('')
    if (!name.trim()) setName(starter.label)
  }

  const resolveFlowJson = (): unknown | null => {
    if (mode === 'visual') return builderStateToFlowJson(builderState)
    try {
      return JSON.parse(jsonText)
    } catch {
      setJsonError('This is not valid JSON — check for a missing comma or bracket.')
      return null
    }
  }

  const saveDraft = async () => {
    setError('')
    setJsonError('')
    setNotice('')
    if (!name.trim()) {
      setError('Give this flow a name')
      return
    }
    const flowJson = resolveFlowJson()
    if (!flowJson) return
    try {
      if (savedId) {
        await updateMutation.mutateAsync({ id: savedId, patch: { name: name.trim(), flowJson } })
        setNotice('Saved.')
      } else {
        const res = await createMutation.mutateAsync({ name: name.trim(), flowJson })
        setSavedId(res.item.id)
        setNotice('Saved.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flow')
    }
  }

  const publish = async () => {
    if (!savedId) return
    const flowJson = resolveFlowJson()
    if (!flowJson) return
    const ok = await confirm({
      title: 'Publish this flow to WhatsApp?',
      description:
        'Once published it goes live on your Meta Business Account and the JSON can no longer be edited.',
      confirmLabel: 'Publish',
    })
    if (!ok) return
    setError('')
    try {
      await updateMutation.mutateAsync({ id: savedId, patch: { name: name.trim(), flowJson } })
      await publishMutation.mutateAsync(savedId)
      setStatus('published')
      setNotice('Published to Meta.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish flow')
    }
  }

  const sendTest = async () => {
    if (!savedId) return
    setTestError('')
    setTestNotice('')
    if (!testPhone.trim()) {
      setTestError('Enter a phone number, with country code')
      return
    }
    try {
      await sendTestMutation.mutateAsync({ id: savedId, phone: testPhone.trim() })
      setTestNotice(`Sent to ${testPhone.trim()}.`)
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Failed to send test message')
    }
  }

  const locked = status === 'published'
  const pending = createMutation.isPending || updateMutation.isPending || publishMutation.isPending

  if (isEdit && isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft />
          Back to flows
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {status === 'draft' ? (
            <>
              <Button variant="outline" size="sm" disabled={pending} onClick={() => void saveDraft()}>
                {updateMutation.isPending || createMutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Save draft
              </Button>
              {savedId ? (
                <Button size="sm" disabled={pending} onClick={() => void publish()}>
                  {publishMutation.isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
                  Publish
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        {error ? (
          <p className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {notice}
          </p>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 space-y-1.5">
            <Label htmlFor="flow-name">Flow name</Label>
            <Input
              id="flow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Appointment booking"
              disabled={locked}
            />
          </div>
          {status === 'draft' ? (
            <div className="bg-muted flex rounded-lg p-1">
              <Button
                type="button"
                size="sm"
                variant={mode === 'visual' ? 'default' : 'ghost'}
                onClick={() => {
                  const parsed = flowJsonToBuilderState(
                    (() => {
                      try {
                        return JSON.parse(jsonText || '{}')
                      } catch {
                        return null
                      }
                    })()
                  )
                  if (mode === 'json') {
                    if (jsonText.trim()) {
                      try {
                        JSON.parse(jsonText)
                      } catch {
                        setJsonError('This is not valid JSON — check for a missing comma or bracket.')
                        return
                      }
                      const next = flowJsonToBuilderState(JSON.parse(jsonText))
                      if (!next) {
                        setJsonError(
                          "This JSON has a shape the visual builder can't represent — keep editing it here."
                        )
                        return
                      }
                      setBuilderState(next)
                    }
                    setJsonError('')
                    setMode('visual')
                    return
                  }
                  if (parsed) setBuilderState(parsed)
                }}
              >
                <LayoutGrid />
                Visual
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === 'json' ? 'default' : 'ghost'}
                onClick={() => {
                  setJsonText(JSON.stringify(builderStateToFlowJson(builderState), null, 2))
                  setJsonError('')
                  setMode('json')
                }}
              >
                <Code2 />
                JSON
              </Button>
            </div>
          ) : null}
        </div>

        {mode === 'visual' && !isEdit ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Object.entries(STARTERS).map(([key, tpl]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyStarter(key)}
                className="hover:bg-muted/60 rounded-xl border p-3 text-left"
              >
                <p className="text-xs font-semibold">{tpl.label}</p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">{tpl.description}</p>
              </button>
            ))}
          </div>
        ) : null}

        {visualUnavailable && mode === 'json' ? (
          <p className="text-xs text-amber-700">
            This flow's JSON has a shape the visual builder can't represent, so it opened in JSON mode.
          </p>
        ) : null}

        {mode === 'visual' ? (
          <WhatsAppFlowVisualBuilder value={builderState} onChange={setBuilderState} readOnly={locked} />
        ) : (
          <div className="space-y-2">
            <Label>Flow JSON</Label>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              disabled={locked}
              rows={16}
              className="font-mono text-xs"
            />
            {jsonError ? <p className="text-destructive text-xs">{jsonError}</p> : null}
          </div>
        )}

        {locked ? (
          <div className="space-y-2 rounded-xl border p-4">
            <Label>Send a test message</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 919992492168"
                className="min-w-[200px] flex-1"
              />
              <Button
                disabled={sendTestMutation.isPending}
                onClick={() => void sendTest()}
              >
                {sendTestMutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
                Send test
              </Button>
            </div>
            {testError ? <p className="text-destructive text-xs">{testError}</p> : null}
            {testNotice ? <p className="text-xs text-emerald-700">{testNotice}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
