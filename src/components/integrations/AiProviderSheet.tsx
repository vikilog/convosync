import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiError } from '@/lib/httpClient'
import {
  realIntegrationsService,
  type AiProviderMode,
  type AiProviderType,
} from '@/services/realIntegrations.service'

const PROVIDER_LABEL: Record<AiProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
  custom: 'Custom (OpenAI-compatible)',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  credentials_missing: 'API key required',
  connection_failed: 'Connection failed',
}

export function AiProviderSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: config } = realIntegrationsService.useAiProviderConfig()
  const updateMutation = realIntegrationsService.useUpdateAiProvider()
  const testMutation = realIntegrationsService.useTestAiProvider()

  const [mode, setMode] = useState<AiProviderMode>('convosync')
  const [provider, setProvider] = useState<AiProviderType>('openai')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<'ok' | 'failed' | null>(null)

  useEffect(() => {
    if (config && open) {
      setMode(config.mode)
      setProvider(config.provider)
      setModel(config.model)
      setApiKey('')
      setBaseUrl(config.baseUrl ?? '')
      setTestResult(null)
    }
  }, [config, open])

  const availableModels = config?.availableModels ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>AI Provider</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {config ? (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={config.status === 'active' ? 'default' : 'outline'}>
                {STATUS_LABEL[config.status] ?? config.status}
              </Badge>
              {config.lastTestedAt ? (
                <span className="text-muted-foreground">
                  Last tested {new Date(config.lastTestedAt).toLocaleString()}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as AiProviderMode)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="convosync">Managed by ConvoSync</SelectItem>
                <SelectItem value="byok">Bring your own API key</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'byok' ? (
            <>
              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as AiProviderType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROVIDER_LABEL) as AiProviderType[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PROVIDER_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {provider === 'custom' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="ai-base-url">API base URL</Label>
                  <Input
                    id="ai-base-url"
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://your-api.example.com/v1"
                    className="font-mono text-xs"
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="ai-api-key">API key</Label>
                <Input
                  id="ai-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config?.hasApiKey ? 'Leave blank to keep the current key' : 'sk-…'}
                  className="font-mono text-xs"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={testMutation.isPending}
                onClick={() => {
                  setTestResult(null)
                  testMutation.mutate(
                    {
                      mode,
                      provider,
                      model: model || undefined,
                      apiKey: apiKey || undefined,
                      baseUrl: provider === 'custom' ? baseUrl.trim() || null : undefined,
                    },
                    {
                      onSuccess: () => setTestResult('ok'),
                      onError: () => setTestResult('failed'),
                    }
                  )
                }}
              >
                {testMutation.isPending ? 'Testing…' : 'Test connection'}
              </Button>
              {testResult === 'ok' ? (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  Connection works.
                </p>
              ) : null}
              {testResult === 'failed' ? (
                <p className="text-destructive flex items-center gap-1.5 text-xs">
                  <XCircle className="size-3.5" />
                  Couldn't connect with these settings.
                </p>
              ) : null}
            </>
          ) : null}

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button
            disabled={updateMutation.isPending}
            onClick={() => {
              setError(null)
              updateMutation.mutate(
                {
                  mode,
                  ...(mode === 'byok'
                    ? {
                        provider,
                        model: model || undefined,
                        apiKey: apiKey || undefined,
                        baseUrl: provider === 'custom' ? baseUrl.trim() || null : undefined,
                      }
                    : {}),
                },
                {
                  onSuccess: () => onOpenChange(false),
                  onError: (err) => {
                    setError(err instanceof ApiError ? err.message : 'Could not save these settings.')
                  },
                }
              )
            }}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
