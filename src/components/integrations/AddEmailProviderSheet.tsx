import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { ApiError } from '@/lib/httpClient'
import { realIntegrationsService, type NewEmailProviderInput } from '@/services/realIntegrations.service'

type ByopProvider = 'RESEND' | 'AWS_SES' | 'SENDGRID' | 'SMTP'

const PROVIDER_LABEL: Record<ByopProvider, string> = {
  RESEND: 'Resend',
  AWS_SES: 'Amazon SES',
  SENDGRID: 'SendGrid',
  SMTP: 'Custom SMTP',
}

export function AddEmailProviderSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createProvider = realIntegrationsService.useCreateEmailProvider()

  const [provider, setProvider] = useState<ByopProvider>('RESEND')
  const [apiKey, setApiKey] = useState('')
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [region, setRegion] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('587')
  const [secure, setSecure] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setProvider('RESEND')
    setApiKey('')
    setAccessKeyId('')
    setSecretAccessKey('')
    setRegion('')
    setSenderEmail('')
    setHost('')
    setPort('587')
    setSecure(true)
    setUsername('')
    setPassword('')
    setError(null)
  }

  const buildInput = (): NewEmailProviderInput | null => {
    if (provider === 'RESEND' || provider === 'SENDGRID') {
      if (!apiKey.trim()) return null
      return { provider, config: { apiKey: apiKey.trim() } }
    }
    if (provider === 'AWS_SES') {
      if (!accessKeyId.trim() || !secretAccessKey.trim() || !region.trim()) return null
      return {
        provider: 'AWS_SES',
        config: {
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
          region: region.trim(),
          senderEmail: senderEmail.trim() || undefined,
        },
      }
    }
    if (!host.trim() || !username.trim() || !password.trim()) return null
    return {
      provider: 'SMTP',
      config: { host: host.trim(), port: Number(port) || 587, secure, username: username.trim(), password },
    }
  }

  const input = buildInput()

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add provider</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as ByopProvider)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROVIDER_LABEL) as ByopProvider[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PROVIDER_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {provider === 'RESEND' || provider === 'SENDGRID' ? (
            <div className="space-y-1.5">
              <Label htmlFor="api-key">API key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          ) : null}

          {provider === 'AWS_SES' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="ses-access-key">Access key ID</Label>
                <Input
                  id="ses-access-key"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ses-secret-key">Secret access key</Label>
                <Input
                  id="ses-secret-key"
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ses-region">Region</Label>
                <Input
                  id="ses-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="us-east-1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ses-sender">Verified sender email (optional)</Label>
                <Input
                  id="ses-sender"
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
              </div>
            </>
          ) : null}

          {provider === 'SMTP' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="smtp-host">Host</Label>
                <Input id="smtp-host" value={host} onChange={(e) => setHost(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtp-port">Port</Label>
                <Input id="smtp-port" value={port} onChange={(e) => setPort(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smtp-secure">Use TLS</Label>
                <Switch id="smtp-secure" checked={secure} onCheckedChange={setSecure} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtp-username">Username</Label>
                <Input id="smtp-username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtp-password">Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          ) : null}

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button
            disabled={!input || createProvider.isPending}
            onClick={() => {
              if (!input) return
              setError(null)
              createProvider.mutate(input, {
                onSuccess: () => onOpenChange(false),
                onError: (err) => {
                  setError(err instanceof ApiError ? err.message : 'Could not add this provider.')
                },
              })
            }}
          >
            {createProvider.isPending ? 'Adding…' : 'Add provider'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
