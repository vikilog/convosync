/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { AlertCircle, Globe, Loader2, RefreshCw, Send } from 'lucide-react';
import { Input } from '../ui/input';

export type VerifiedIdentity = {
  identity: string;
  type: 'email' | 'domain';
};

const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
];

export function sesConsoleUrlForRegion(region: string): string {
  const r = region.trim() || 'us-east-1';
  return `https://${r}.console.aws.amazon.com/ses/home?region=${encodeURIComponent(r)}#/verified-identities`;
}

export function splitSenderAgainstIdentities(
  senderEmail: string,
  identities: VerifiedIdentity[]
): { selectedIdentity: string; localPart: string } {
  const from = senderEmail.trim().toLowerCase();
  if (!from) return { selectedIdentity: '', localPart: '' };

  const emailMatch = identities.find(
    (i) => i.type === 'email' && i.identity.toLowerCase() === from
  );
  if (emailMatch) return { selectedIdentity: emailMatch.identity, localPart: '' };

  const domain = from.includes('@') ? from.split('@')[1] : '';
  const domainMatch = identities.find(
    (i) => i.type === 'domain' && i.identity.toLowerCase() === domain
  );
  if (domainMatch) {
    return {
      selectedIdentity: domainMatch.identity,
      localPart: from.split('@')[0] ?? '',
    };
  }

  return { selectedIdentity: '', localPart: '' };
}

export type SesProviderFormFieldsProps = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  accessKeyIdMasked?: string | null;
  hasSecretAccessKey?: boolean;
  selectedIdentity: string;
  domainLocalPart: string;
  identities: VerifiedIdentity[];
  identitiesFetchedAt?: string | null;
  sesConsoleUrl?: string | null;
  refreshing?: boolean;
  testing?: boolean;
  saving?: boolean;
  disabled?: boolean;
  onAccessKeyIdChange: (value: string) => void;
  onSecretAccessKeyChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onSelectIdentity: (identity: string) => void;
  onDomainLocalPartChange: (value: string) => void;
  onRefreshIdentities: () => void;
  onTestSend?: () => void;
};

/** SES credentials + verified identity picker for Providers → Add/Edit AWS SES. */
export function SesProviderFormFields({
  accessKeyId,
  secretAccessKey,
  region,
  accessKeyIdMasked,
  hasSecretAccessKey,
  selectedIdentity,
  domainLocalPart,
  identities,
  identitiesFetchedAt,
  sesConsoleUrl,
  refreshing,
  testing,
  saving,
  disabled,
  onAccessKeyIdChange,
  onSecretAccessKeyChange,
  onRegionChange,
  onSelectIdentity,
  onDomainLocalPartChange,
  onRefreshIdentities,
  onTestSend,
}: SesProviderFormFieldsProps) {
  const selectedMeta = identities.find((i) => i.identity === selectedIdentity);
  const isDomainSelected = selectedMeta?.type === 'domain';

  const senderEmail = useMemo(() => {
    if (!selectedIdentity) return '';
    if (isDomainSelected) {
      const local = domainLocalPart.trim();
      if (!local) return '';
      return `${local}@${selectedIdentity}`;
    }
    return selectedIdentity;
  }, [selectedIdentity, isDomainSelected, domainLocalPart]);

  const hasCreds =
    (Boolean(accessKeyId.trim()) || Boolean(accessKeyIdMasked)) &&
    (Boolean(secretAccessKey.trim()) || Boolean(hasSecretAccessKey));
  const canRefresh = Boolean(region.trim()) && hasCreds;
  const canTest = canRefresh && Boolean(senderEmail.trim());
  const consoleUrl = sesConsoleUrl || sesConsoleUrlForRegion(region);
  const hasFetchedIdentities = Boolean(identitiesFetchedAt);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          New AWS accounts start in the <strong>SES Sandbox</strong> and can only send to verified
          addresses until you request <strong>Production Access</strong> in the AWS console. Sandbox
          and production approval are controlled by AWS, not ConvoSync.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          value={accessKeyId}
          disabled={disabled}
          onChange={(e) => onAccessKeyIdChange(e.target.value)}
          placeholder={
            accessKeyIdMasked
              ? `Saved: ${accessKeyIdMasked} — leave blank to keep`
              : 'Access key ID'
          }
          autoComplete="off"
          className="h-auto text-sm border border-swiss-line rounded-lg px-3 py-2"
        />
        <Input
          type="password"
          value={secretAccessKey}
          disabled={disabled}
          onChange={(e) => onSecretAccessKeyChange(e.target.value)}
          placeholder={
            hasSecretAccessKey
              ? '•••••••• — leave blank to keep existing'
              : 'Secret access key'
          }
          autoComplete="new-password"
          className="h-auto text-sm border border-swiss-line rounded-lg px-3 py-2"
        />
        <select
          value={region}
          disabled={disabled}
          onChange={(e) => onRegionChange(e.target.value)}
          className="text-sm border border-swiss-line rounded-lg px-3 py-2 sm:col-span-2"
        >
          {!AWS_REGIONS.includes(region) && region ? (
            <option value={region}>{region}</option>
          ) : null}
          {AWS_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h5 className="flex items-center gap-2 text-sm font-bold text-swiss-ink">
              <Globe className="h-4 w-4 text-sky-700" />
              Choose From address
            </h5>
            <p className="mt-0.5 text-xs text-swiss-muted">
              Pick a verified <span className="font-semibold">email</span> to send as that address, or
              pick a <span className="font-semibold">domain</span> and type the mailbox name (e.g.{' '}
              <span className="font-mono">hello</span>) to send as{' '}
              <span className="font-mono">hello@domain</span>.
            </p>
            <p className="mt-1 text-[11px] text-swiss-muted">
              These are AWS SES verified senders for the From field only — not the ConvoSync Domains
              tab.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled || refreshing || saving || !canRefresh}
            onClick={onRefreshIdentities}
            title={
              !canRefresh
                ? 'Enter Access Key ID, Secret Access Key, and Region first (or use saved keys).'
                : 'Load verified SES identities using the credentials above — Save is not required first.'
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh identities
          </button>
        </div>

        <p className="text-xs text-swiss-muted">
          Click <span className="font-semibold text-swiss-ink">Refresh identities</span> after entering
          keys (no Save needed). Only VerificationStatus = Success identities in{' '}
          <span className="font-medium text-swiss-ink">{region || 'this region'}</span> appear.
        </p>

        {!canRefresh && !disabled && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Enter Access Key ID and Secret Access Key to enable Refresh identities.
            {accessKeyIdMasked
              ? ' Saved keys work — re-enter the secret only if you changed it.'
              : null}
          </p>
        )}

        {identities.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-700">
            {hasFetchedIdentities ? (
              <p>
                No verified domains or emails in region{' '}
                <span className="font-medium">{region}</span>. Verify a domain or email in this SES
                region, then click Refresh identities again.
              </p>
            ) : (
              <p>
                No identities loaded yet. Enter credentials, then click{' '}
                <span className="font-semibold">Refresh identities</span>.
              </p>
            )}
            <a
              href={consoleUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-semibold text-sky-800 underline"
            >
              Open AWS SES verified identities
            </a>
          </div>
        )}

        {identities.length > 0 && (
          <>
            <div
              className="space-y-2"
              role="radiogroup"
              aria-label="Choose From address from verified SES identities"
            >
              {identities.map((id) => {
                const selected = selectedIdentity === id.identity;
                const isDomain = id.type === 'domain';
                const localPreview = domainLocalPart.trim() || 'hello';
                return (
                  <div
                    key={id.identity}
                    className={`rounded-xl border transition-colors ${
                      selected
                        ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-200'
                        : 'border-swiss-line bg-white hover:border-sky-200'
                    }`}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={disabled}
                      onClick={() => onSelectIdentity(id.identity)}
                      className="flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm disabled:opacity-60"
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected ? 'border-sky-600' : 'border-slate-300'
                        }`}
                      >
                        {selected ? (
                          <span className="h-2 w-2 rounded-full bg-sky-600" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="break-all font-mono text-[13px] font-semibold text-swiss-ink">
                            {id.identity}
                          </span>
                          <span
                            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              isDomain
                                ? 'bg-violet-50 text-violet-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {isDomain ? 'Domain' : 'Email'}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-swiss-muted">
                          {isDomain
                            ? selected
                              ? 'Type the mailbox name below — From becomes that@domain'
                              : 'Select, then type mailbox name (e.g. hello)'
                            : selected
                              ? `From will be ${id.identity}`
                              : 'Select to send as this address'}
                        </span>
                      </span>
                    </button>

                    {selected && isDomain ? (
                      <div className="border-t border-sky-200/80 px-3 py-3">
                        <label
                          htmlFor="ses-local-part"
                          className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-swiss-muted"
                        >
                          From local part
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            id="ses-local-part"
                            type="text"
                            disabled={disabled}
                            value={domainLocalPart}
                            onChange={(e) =>
                              onDomainLocalPartChange(e.target.value.replace(/@.*/, ''))
                            }
                            placeholder="hello"
                            autoComplete="off"
                            className="h-auto min-w-0 flex-1 rounded-lg border border-swiss-line bg-white px-3 py-2 font-mono text-sm"
                          />
                          <span className="shrink-0 font-mono text-sm text-swiss-ink">
                            @{id.identity}
                          </span>
                        </div>
                        <p className="mt-2 rounded-lg bg-white/80 px-2.5 py-1.5 font-mono text-sm text-swiss-ink">
                          Full From:{' '}
                          <span className="font-semibold">
                            {domainLocalPart.trim()
                              ? `${domainLocalPart.trim()}@${id.identity}`
                              : `${localPreview}@${id.identity}`}
                          </span>
                          {!domainLocalPart.trim() ? (
                            <span className="ml-1 font-sans text-xs font-normal text-amber-800">
                              (example — type your mailbox name)
                            </span>
                          ) : null}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {!selectedIdentity && (
              <p className="text-xs font-medium text-amber-800">
                Click an identity above to choose your From address.
              </p>
            )}

            {isDomainSelected && !domainLocalPart.trim() && (
              <p className="text-xs font-medium text-amber-800">
                Enter a From local part (e.g. hello) so Save knows the full address.
              </p>
            )}

            <div
              className={`rounded-xl border px-3 py-2.5 text-sm ${
                senderEmail
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-swiss-line bg-white text-slate-600'
              }`}
              aria-live="polite"
            >
              {senderEmail ? (
                <>
                  <span className="font-bold">Selected From:</span>{' '}
                  <span className="font-mono font-semibold">{senderEmail}</span>
                  <span className="mt-0.5 block text-xs font-normal text-emerald-800/80">
                    Click Save below to use this address for outgoing email.
                    {identitiesFetchedAt
                      ? ` Identities last refreshed ${new Date(identitiesFetchedAt).toLocaleString()}.`
                      : null}
                  </span>
                </>
              ) : (
                <span className="text-xs">
                  Selected From: <span className="font-medium">not set yet</span> — pick an email, or
                  a domain plus mailbox name.
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {onTestSend && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled || testing || saving || !canTest}
            onClick={onTestSend}
            className="inline-flex items-center gap-1.5 rounded-lg border border-swiss-line bg-white px-3 py-1.5 text-sm font-bold text-swiss-ink hover:border-swiss-accent/30 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send Test Email
          </button>
          <p className="text-xs text-swiss-muted">
            Sends to your account email via SES and refreshes verified identities.
          </p>
        </div>
      )}
    </div>
  );
}

export function computeSesSenderEmail(
  selectedIdentity: string,
  domainLocalPart: string,
  identities: VerifiedIdentity[]
): string {
  if (!selectedIdentity) return '';
  const meta = identities.find((i) => i.identity === selectedIdentity);
  if (meta?.type === 'domain') {
    const local = domainLocalPart.trim();
    return local ? `${local}@${selectedIdentity}` : '';
  }
  return selectedIdentity;
}
