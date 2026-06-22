import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import {
  defaultRestrictedInboxScope,
  FULL_INBOX_SCOPE,
  type InboxChannel,
  type InboxScope,
} from '../../lib/inboxScope';

type WhatsAppAccount = {
  phoneNumberId: string;
  phoneNumber?: string | null;
  displayName?: string | null;
  label?: string | null;
};

type SocialAccount = {
  pageId: string;
  label?: string;
  username?: string;
  displayName?: string;
};

type InboxScopeEditorProps = {
  value: InboxScope;
  onChange: (next: InboxScope) => void;
  disabled?: boolean;
};

const CHANNEL_LABELS: Record<InboxChannel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
};

function waLabel(acc: WhatsAppAccount) {
  return acc.label || acc.displayName || acc.phoneNumber || acc.phoneNumberId;
}

export function InboxScopeEditor({ value, onChange, disabled }: InboxScopeEditorProps) {
  const [loading, setLoading] = useState(true);
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppAccount[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<SocialAccount[]>([]);
  const [messengerAccounts, setMessengerAccounts] = useState<SocialAccount[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [waRaw, igRaw, msRaw] = await Promise.all([
          api.getWhatsAppAccounts() as Promise<WhatsAppAccount[] | { accounts?: WhatsAppAccount[] }>,
          api.getInstagramAccounts() as Promise<{ accounts?: SocialAccount[] }>,
          api.getMessengerAccounts() as Promise<{ accounts?: SocialAccount[] }>,
        ]);
        if (cancelled) return;
        const waList = Array.isArray(waRaw) ? waRaw : (waRaw.accounts ?? []);
        setWhatsappAccounts(waList);
        setInstagramAccounts(igRaw.accounts ?? []);
        setMessengerAccounts(msRaw.accounts ?? []);
      } catch {
        if (!cancelled) {
          setWhatsappAccounts([]);
          setInstagramAccounts([]);
          setMessengerAccounts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const restricted = value.mode === 'restricted';
  const channels = new Set(value.channels ?? []);
  const accounts = value.accounts ?? {};

  function setRestricted(next: InboxScope) {
    onChange(next.mode === 'all' ? FULL_INBOX_SCOPE : next);
  }

  function toggleMode(all: boolean) {
    if (disabled) return;
    if (all) setRestricted(FULL_INBOX_SCOPE);
    else setRestricted(defaultRestrictedInboxScope());
  }

  function toggleChannel(channel: InboxChannel) {
    if (disabled || !restricted) return;
    const nextChannels = new Set(channels);
    const nextAccounts = { ...accounts };
    if (nextChannels.has(channel)) {
      nextChannels.delete(channel);
      delete nextAccounts[channel];
    } else {
      nextChannels.add(channel);
    }
    setRestricted({
      mode: 'restricted',
      channels: [...nextChannels],
      accounts: Object.keys(nextAccounts).length ? nextAccounts : undefined,
    });
  }

  function toggleAccount(channel: InboxChannel, accountId: string) {
    if (disabled || !restricted) return;
    const current = new Set(accounts[channel] ?? []);
    if (current.has(accountId)) current.delete(accountId);
    else current.add(accountId);
    const nextAccounts = { ...accounts };
    if (current.size) nextAccounts[channel] = [...current];
    else delete nextAccounts[channel];
    const nextChannels = new Set(channels);
    if (current.size > 0) nextChannels.add(channel);
    setRestricted({
      mode: 'restricted',
      channels: [...nextChannels],
      accounts: Object.keys(nextAccounts).length ? nextAccounts : undefined,
    });
  }

  function renderAccountList(channel: InboxChannel, list: { id: string; label: string }[]) {
    if (!list.length) {
      return (
        <p className="text-xs text-gray-400 font-medium pl-6">
          No connected {CHANNEL_LABELS[channel]} accounts
        </p>
      );
    }
    const selected = new Set(accounts[channel] ?? []);
    const channelWide = channels.has(channel) && selected.size === 0;
    return (
      <ul className="pl-6 space-y-1">
        {list.map((item) => (
          <li key={item.id}>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="accent-sky-600"
                disabled={disabled || channelWide}
                checked={channelWide || selected.has(item.id)}
                onChange={() => toggleAccount(channel, item.id)}
              />
              <span className="font-medium">{item.label}</span>
            </label>
          </li>
        ))}
        <p className="text-xs text-gray-400 pt-1">
          Leave all unchecked with channel enabled for full channel access, or pick specific numbers/pages.
        </p>
      </ul>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500">Inbox access</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Choose which channels and connected numbers/pages this user can manage.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800">
          <input
            type="radio"
            name="inbox-scope-mode"
            checked={!restricted}
            disabled={disabled}
            onChange={() => toggleMode(true)}
          />
          All connected inboxes
        </label>
        <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800">
          <input
            type="radio"
            name="inbox-scope-mode"
            checked={restricted}
            disabled={disabled}
            onChange={() => toggleMode(false)}
          />
          Selected only
        </label>
      </div>

      {restricted && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading connected accounts…
            </div>
          ) : (
            (['whatsapp', 'instagram', 'messenger'] as InboxChannel[]).map((channel) => {
              const list =
                channel === 'whatsapp'
                  ? whatsappAccounts.map((a) => ({
                      id: a.phoneNumberId,
                      label: waLabel(a),
                    }))
                  : channel === 'instagram'
                    ? instagramAccounts.map((a) => ({
                        id: a.pageId,
                        label: a.label || a.username || a.displayName || a.pageId,
                      }))
                    : messengerAccounts.map((a) => ({
                        id: a.pageId,
                        label: a.label || a.displayName || a.pageId,
                      }));

              return (
                <div key={channel} className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <input
                      type="checkbox"
                      className="accent-sky-600"
                      checked={channels.has(channel) || (accounts[channel]?.length ?? 0) > 0}
                      disabled={disabled}
                      onChange={() => toggleChannel(channel)}
                    />
                    {CHANNEL_LABELS[channel]}
                  </label>
                  {(channels.has(channel) || (accounts[channel]?.length ?? 0) > 0) &&
                    renderAccountList(channel, list)}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
