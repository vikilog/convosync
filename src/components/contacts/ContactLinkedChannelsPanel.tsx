import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, Loader2, Search, Unlink, X } from 'lucide-react';
import { api } from '../../lib/api';
import { mapContactFromApi } from '../../lib/mappers';
import type { Contact } from '../../types';

type Channel = 'whatsapp' | 'instagram' | 'messenger';

type LinkChannel = {
  contactId: string;
  channel: Channel;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
};

const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
};

const CHANNEL_BADGE: Record<Channel, string> = {
  whatsapp: 'bg-emerald-50 text-emerald-700',
  instagram: 'bg-pink-50 text-pink-700',
  messenger: 'bg-blue-50 text-blue-700',
};

function channelOf(c: Contact): Channel {
  if (c.phone.startsWith('ig:')) return 'instagram';
  if (c.phone.startsWith('fb:')) return 'messenger';
  return 'whatsapp';
}

function handleLabel(channel: Channel, phone: string): string {
  if (channel === 'instagram') return phone.replace(/^ig:/, '@');
  if (channel === 'messenger') return phone.replace(/^fb:/, '');
  return phone;
}

type Props = {
  contactId: string;
  /** When false, hide the link picker (read-only list). */
  editable?: boolean;
  /** full = list + link; linkOnly = just the link control (detail page). */
  variant?: 'full' | 'linkOnly';
  onOpenContact?: (contactId: string) => void;
  onChanged?: () => void;
};

export function ContactLinkedChannelsPanel({
  contactId,
  editable = true,
  variant = 'full',
  onOpenContact,
  onChanged,
}: Props) {
  const [channels, setChannels] = useState<LinkChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);

  const presentChannels = useMemo(
    () => new Set(channels.map((c) => c.channel)),
    [channels]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getContactLinks(contactId);
      setChannels(res.channels ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load linked channels');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const res = await api.getContacts({
            ...(query.trim() ? { search: query.trim() } : {}),
            limit: '40',
          });
          if (cancelled) return;
          const rows = (res.items ?? []).map((raw) => mapContactFromApi(raw));
          setCandidates(
            rows.filter((c) => {
              if (c.id === contactId) return false;
              if (channels.some((ch) => ch.contactId === c.id)) return false;
              return !presentChannels.has(channelOf(c));
            })
          );
        } catch {
          if (!cancelled) setCandidates([]);
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [pickerOpen, query, contactId, channels, presentChannels]);

  const link = async (otherId: string) => {
    setBusyId(otherId);
    setError(null);
    try {
      const res = await api.linkContactChannel(contactId, otherId);
      setChannels(res.channels ?? []);
      setPickerOpen(false);
      setQuery('');
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Link failed');
    } finally {
      setBusyId(null);
    }
  };

  const unlink = async (otherId: string) => {
    setBusyId(otherId);
    setError(null);
    try {
      const res = await api.unlinkContactChannel(contactId, otherId);
      setChannels(res.channels ?? []);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unlink failed');
    } finally {
      setBusyId(null);
    }
  };

  const others = channels.filter((c) => c.contactId !== contactId);
  const linkOnly = variant === 'linkOnly';

  return (
    <div className={linkOnly ? 'space-y-2' : 'rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2'}>
      <div className="flex items-center justify-between gap-2">
        {!linkOnly ? (
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Linked channels
          </p>
        ) : (
          <span />
        )}
        {editable ? (
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            Link channel
          </button>
        ) : null}
      </div>

      {!linkOnly && loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading…
        </div>
      ) : null}

      {!linkOnly && !loading && others.length === 0 && !pickerOpen ? (
        <p className="text-xs text-slate-500">
          No other channels linked. Link Instagram, WhatsApp, or Messenger for the same person.
        </p>
      ) : null}

      {!linkOnly && others.length > 0 ? (
        <ul className="space-y-1.5">
          {others.map((ch) => (
            <li
              key={ch.contactId}
              className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-2.5 py-2"
            >
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${CHANNEL_BADGE[ch.channel]}`}
              >
                {CHANNEL_LABEL[ch.channel]}
              </span>
              <button
                type="button"
                className="min-w-0 flex-1 cursor-pointer text-left"
                onClick={() => onOpenContact?.(ch.contactId)}
                disabled={!onOpenContact}
              >
                <p className="text-sm font-semibold text-slate-800 truncate">{ch.name}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {handleLabel(ch.channel, ch.phone)}
                  {ch.email?.trim() ? ` · ${ch.email.trim()}` : ''}
                </p>
              </button>
              {editable ? (
                <button
                  type="button"
                  disabled={busyId === ch.contactId}
                  onClick={() => void unlink(ch.contactId)}
                  className="shrink-0 inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 disabled:opacity-50"
                  title="Unlink"
                >
                  {busyId === ch.contactId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Unlink className="h-3.5 w-3.5" />
                  )}
                  Unlink
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {pickerOpen && editable ? (
        <div className="rounded-xl border border-black/10 bg-white p-3 space-y-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts to link…"
                aria-label="Search contacts to link"
                className="w-full rounded-lg border border-black/10 py-2 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPickerOpen(false);
                setQuery('');
              }}
              className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors duration-200 hover:bg-surface-muted"
              aria-label="Close link picker"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {searching ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          ) : candidates.length === 0 ? (
            <p className="text-xs text-slate-500 py-1">
              No matching contacts for free channels.
            </p>
          ) : (
            <ul className="max-h-44 overflow-y-auto space-y-1">
              {candidates.map((c) => {
                const ch = channelOf(c);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => void link(c.id)}
                      className="w-full flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 hover:bg-surface-muted disabled:opacity-50"
                    >
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${CHANNEL_BADGE[ch]}`}
                      >
                        {CHANNEL_LABEL[ch]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800 truncate">
                          {c.name}
                        </span>
                        <span className="block text-xs text-slate-500 truncate">
                          {handleLabel(ch, c.phone)}
                        </span>
                      </span>
                      {busyId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5 text-primary" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600 font-medium">{error}</p> : null}
    </div>
  );
}
