import { useState } from 'react'
import { Check, Copy, Plus, RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/httpClient'
import {
  parseEmailDnsRecords,
  realIntegrationsService,
  type EmailDomain,
} from '@/services/realIntegrations.service'

function reportError(err: unknown, fallback: string) {
  window.alert(err instanceof ApiError ? err.message : fallback)
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? 'default' : 'outline'} className="text-[10px]">
      {label} {ok ? 'verified' : 'pending'}
    </Badge>
  )
}

function DomainCard({ domain }: { domain: EmailDomain }) {
  const verify = realIntegrationsService.useVerifyEmailDomain()
  const refresh = realIntegrationsService.useRefreshEmailDomain()
  const records = parseEmailDnsRecords(domain.dnsRecords)

  const copy = (value: string) => {
    void navigator.clipboard.writeText(value)
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{domain.domain}</p>
          <p className="text-muted-foreground text-xs">{domain.provider}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={domain.status === 'verified' ? 'default' : 'outline'} className="text-[10px]">
            {domain.status}
          </Badge>
          <Flag ok={domain.spfVerified} label="SPF" />
          <Flag ok={domain.dkimVerified} label="DKIM" />
          <Flag ok={domain.dmarcVerified} label="DMARC" />
        </div>
      </div>

      {records.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            DNS records
          </p>
          {records.map((record, idx) => (
            <div key={`${record.type}-${record.name}-${idx}`} className="rounded-md border bg-muted/40 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">
                  {record.type} · {record.name}
                </p>
                <Button variant="ghost" size="icon-sm" onClick={() => copy(record.value)} aria-label="Copy value">
                  <Copy />
                </Button>
              </div>
              <p className="font-mono text-[11px] break-all">{record.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          No DNS records returned yet. Refresh after adding the domain at your DNS host.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={verify.isPending}
          onClick={() =>
            verify.mutate(domain.id, { onError: (err) => reportError(err, 'Could not verify domain.') })
          }
        >
          <Check />
          Verify DNS
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={refresh.isPending}
          onClick={() =>
            refresh.mutate(domain.id, { onError: (err) => reportError(err, 'Could not refresh domain.') })
          }
        >
          <RefreshCw />
          Refresh
        </Button>
      </div>
    </div>
  )
}

export function EmailDomainVerify() {
  const { data: domains = [] } = realIntegrationsService.useEmailDomains()
  const addDomain = realIntegrationsService.useAddEmailDomain()
  const [domain, setDomain] = useState('')

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Sending domains</h3>
        <p className="text-muted-foreground text-xs">
          Add a domain and publish SPF, DKIM, and DMARC records, then verify.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="mail.yourbrand.com"
        />
        <Button
          size="sm"
          disabled={!domain.trim() || addDomain.isPending}
          onClick={() => {
            addDomain.mutate(domain.trim(), {
              onSuccess: () => setDomain(''),
              onError: (err) => reportError(err, 'Could not add domain.'),
            })
          }}
        >
          <Plus />
          Add domain
        </Button>
      </div>

      <div className="space-y-2">
        {domains.map((row) => (
          <DomainCard key={row.id} domain={row} />
        ))}
        {domains.length === 0 ? (
          <p className="text-muted-foreground text-xs">No custom domains yet.</p>
        ) : null}
      </div>
    </div>
  )
}
