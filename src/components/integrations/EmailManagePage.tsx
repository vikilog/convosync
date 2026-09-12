import { useState } from 'react'
import { ArrowLeft, Plus, RefreshCw, Send } from 'lucide-react'

import { AddEmailProviderSheet } from '@/components/integrations/AddEmailProviderSheet'
import { EmailDomainVerify } from '@/components/integrations/EmailDomainVerify'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { ChannelIcon } from '@/components/channel-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@/lib/httpClient'
import {
  realIntegrationsService,
  type EmailProviderConfig,
  type EmailProviderStatus,
} from '@/services/realIntegrations.service'

const PROVIDER_LABEL: Record<string, string> = {
  CONVOSYNC_MANAGED: 'ConvoSync',
  RESEND: 'Resend',
  AWS_SES: 'Amazon SES',
  SENDGRID: 'SendGrid',
  SMTP: 'Custom SMTP',
}

const STATUS_BADGE: Record<
  EmailProviderStatus,
  { label: string; variant: 'default' | 'outline' | 'destructive' }
> = {
  active: { label: 'Active', variant: 'default' },
  disabled: { label: 'Disabled', variant: 'outline' },
  credentials_missing: { label: 'Needs credentials', variant: 'outline' },
  connection_failed: { label: 'Connection failed', variant: 'destructive' },
}

function reportError(err: unknown, fallback: string) {
  window.alert(err instanceof ApiError ? err.message : fallback)
}

export function EmailManagePage({ onBack }: { onBack: () => void }) {
  const confirm = useConfirm()
  const { data: status } = realIntegrationsService.useEmailIntegration()
  const { data: providers = [] } = realIntegrationsService.useEmailProviders()
  const { data: logs = [] } = realIntegrationsService.useEmailLogs()
  const disableEmail = realIntegrationsService.useDisableEmail()
  const updateProvider = realIntegrationsService.useUpdateEmailProvider()
  const testProvider = realIntegrationsService.useTestEmailProvider()
  const sendTest = realIntegrationsService.useSendTestEmail()

  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleRemoveIntegration = async () => {
    const ok = await confirm({
      title: 'Remove email integration?',
      description: 'This disables sending email from ConvoSync for this workspace.',
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (ok)
      disableEmail.mutate(undefined, {
        onSuccess: onBack,
        onError: (err) => reportError(err, 'Could not remove email integration.'),
      })
  }

  const toggleProvider = (provider: EmailProviderConfig) => {
    updateProvider.mutate(
      { id: provider.id, status: provider.status === 'disabled' ? 'active' : 'disabled' },
      { onError: (err) => reportError(err, 'Could not update this provider.') }
    )
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to integrations
      </button>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Email</h2>
        <Button variant="destructive" size="sm" onClick={() => void handleRemoveIntegration()}>
          Remove integration
        </Button>
      </div>

      <Tabs defaultValue="setup">
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6 pt-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Sending as</h3>
            <p className="text-muted-foreground text-xs">Set by your default provider.</p>
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f4ff]">
                  <ChannelIcon channel="email" className="text-channel-blue size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{status?.activeDomain ?? '—'}</p>
                  <p className="text-muted-foreground text-xs">{status?.defaultSenderEmail ?? '—'}</p>
                  <p className="text-muted-foreground text-xs">
                    Provider ·{' '}
                    {status?.providerLabel
                      ? (PROVIDER_LABEL[status.providerLabel] ?? status.providerLabel)
                      : '—'}
                  </p>
                </div>
              </div>
              <Badge>Active</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Providers</h3>
                <p className="text-muted-foreground text-xs">Default provider chooses how mail is sent.</p>
              </div>
              <Button size="sm" onClick={() => setAddProviderOpen(true)}>
                <Plus />
                Add provider
              </Button>
            </div>

            <div className="space-y-2">
              {providers.map((provider) => {
                const badge = STATUS_BADGE[provider.status]
                return (
                  <div
                    key={provider.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {PROVIDER_LABEL[provider.provider] ?? provider.provider}
                      </p>
                      <Badge variant={badge.variant} className="text-[10px]">
                        {badge.label}
                      </Badge>
                      {provider.isDefault ? (
                        <Badge variant="outline" className="text-[10px]">
                          Default
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.provider !== 'CONVOSYNC_MANAGED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={testProvider.isPending}
                          onClick={() =>
                            testProvider.mutate(provider.id, {
                              onError: (err) => reportError(err, 'Test failed.'),
                            })
                          }
                        >
                          <RefreshCw />
                          Test
                        </Button>
                      ) : null}
                      {!provider.isDefault ? (
                        <Button variant="outline" size="sm" onClick={() => toggleProvider(provider)}>
                          {provider.status === 'disabled' ? 'Enable' : 'Disable'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
              {providers.length === 0 ? (
                <p className="text-muted-foreground text-xs">No providers configured yet.</p>
              ) : null}
            </div>
          </div>

          <EmailDomainVerify />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Send test email</h3>
            <p className="text-muted-foreground text-xs">
              Sends with your active From ({status?.defaultSenderEmail ?? 'default sender'}).
            </p>
            <div className="flex gap-2">
              <Input
                value={testEmail}
                onChange={(e) => {
                  setTestEmail(e.target.value)
                  setTestResult(null)
                }}
                placeholder="recipient@example.com"
              />
              <Button
                disabled={!testEmail.trim() || sendTest.isPending}
                onClick={() => {
                  sendTest.mutate(testEmail.trim(), {
                    onSuccess: () => setTestResult('Sent.'),
                    onError: (err) => {
                      setTestResult(err instanceof ApiError ? err.message : 'Could not send test email.')
                    },
                  })
                }}
              >
                <Send />
                Send test
              </Button>
            </div>
            {testResult ? <p className="text-muted-foreground text-xs">{testResult}</p> : null}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="pt-4">
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{log.subject}</p>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {log.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  To {log.recipient} · {log.providerName ?? log.provider} ·{' '}
                  {new Date(log.createdAt).toLocaleString()}
                </p>
                {log.errorMessage ? <p className="text-destructive text-xs">{log.errorMessage}</p> : null}
              </div>
            ))}
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No email activity yet.</p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      <AddEmailProviderSheet open={addProviderOpen} onOpenChange={setAddProviderOpen} />
    </div>
  )
}
