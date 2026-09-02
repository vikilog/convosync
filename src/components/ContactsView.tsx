/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Download,
  Upload,
  Users,
  UserX,
  Ban,
  UserPlus,
  LayoutGrid,
  Facebook,
  Instagram,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  X,
} from 'lucide-react';
import { Contact } from '../types';
import { api } from '../lib/api';
import { useKeepAliveActivation } from './KeepAlive';
import { mapContactFromApi } from '../lib/mappers';
import { AddContactDrawer, type ContactEditPayload } from './contacts/AddContactDrawer';
import { ImportContactsModal } from './contacts/ImportContactsModal';
import { ExportContactsDrawer } from './contacts/ExportContactsDrawer';
import { ThemeDateInput } from './contacts/ThemeDateInput';
import { ContactsDashboard } from './contacts/ContactsDashboard';
import { ContactDetailView } from './contacts/ContactDetailView';
import { contactIdFromPath, pathForContact, pathForContactsDashboard, pathForContactsList, pathForIntegrationsChannel } from '../routes';
import { useInboxAssigneeMeta } from '../hooks/inbox/useInboxMeta';
import { ConnectChannelEmpty } from './ConnectChannelEmpty';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

type ContactListKey = 'all' | 'unsubscribe' | 'blocklist';
type ContactChannelKey = 'all' | 'whatsapp' | 'instagram' | 'messenger';
type ContactsPageTab = 'dashboard' | 'contacts';

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const CUSTOM_COLUMNS_STORAGE_KEY = 'contacts_table_custom_columns';

/** "sourceUrl" -> "Source url" — best-effort label for an arbitrary customFields key. */
function labelForCustomFieldKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  const lower = spaced.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function formatCustomFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const LIST_NAV: { id: ContactListKey; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Users className="w-4 h-4" /> },
  { id: 'unsubscribe', label: 'Unsubscribe', icon: <UserX className="w-4 h-4" /> },
  { id: 'blocklist', label: 'Blocklist', icon: <Ban className="w-4 h-4" /> },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const CHANNEL_NAV: {
  id: ContactChannelKey;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}[] = [
  {
    id: 'all',
    label: 'All channels',
    icon: <LayoutGrid className="w-4 h-4" />,
    activeClass: 'bg-primary/15 text-primary',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: <WhatsAppIcon className="w-4 h-4" />,
    activeClass: 'bg-[#e7f8ef] text-[#128C7E]',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <Instagram className="w-4 h-4" />,
    activeClass: 'bg-[#fce8f3] text-[#E1306C]',
  },
  {
    id: 'messenger',
    label: 'FB',
    icon: <Facebook className="w-4 h-4" />,
    activeClass: 'bg-[#e8f1fd] text-[#0084ff]',
  },
];

/** Compact toolbar selects — never stretch. */
const FILTER_SELECT_CLASS =
  'h-auto shrink-0 rounded-lg border-swiss-line bg-white px-2.5 py-2 text-sm font-semibold text-slate-800 shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary';

export const ContactsView: React.FC = () => {
  const location = useLocation();
  const detailContactId = contactIdFromPath(location.pathname);
  if (detailContactId) {
    return <ContactDetailView contactId={detailContactId} />;
  }
  return <ContactsWorkspace />;
};

const ContactsWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    whatsappAccounts,
    instagramConnected,
    messengerConnected,
    channelsReady,
  } = useInboxAssigneeMeta();
  const pageTab: ContactsPageTab =
    location.pathname.startsWith('/contacts/dashboard') ? 'dashboard' : 'contacts';
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [activeList, setActiveList] = useState<ContactListKey>('all');
  const [channelFilter, setChannelFilter] = useState<ContactChannelKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageLimit, setPageLimit] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  // fetchPage is invoked from several places (filter changes, pagination,
  // keep-alive resume) that can race — a slower earlier request landing
  // after a newer one must not overwrite the newer, correct results.
  const fetchGenerationRef = useRef(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editContact, setEditContact] = useState<ContactEditPayload | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [tagDeleting, setTagDeleting] = useState(false);
  const [customColumnKeys, setCustomColumnKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_COLUMNS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_COLUMNS_STORAGE_KEY, JSON.stringify(customColumnKeys));
    } catch {
      // best-effort — a full/blocked localStorage shouldn't break the table
    }
  }, [customColumnKeys]);

  // Custom fields are free-form per-contact JSON (CSV-import extras, etc.) —
  // the picker offers whatever keys actually show up across loaded contacts,
  // not a fixed list.
  const availableCustomFieldKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const contact of contacts) {
      for (const key of Object.keys(contact.customFields ?? {})) keys.add(key);
    }
    return [...keys].sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  const toggleCustomColumn = useCallback((key: string) => {
    setCustomColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const connectedChannels = useMemo(() => {
    const channels: Array<'whatsapp' | 'instagram' | 'messenger'> = [];
    if (whatsappAccounts.length > 0) channels.push('whatsapp');
    if (instagramConnected) channels.push('instagram');
    if (messengerConnected) channels.push('messenger');
    return channels;
  }, [whatsappAccounts.length, instagramConnected, messengerConnected]);

  const visibleChannelNav = useMemo(() => {
    const connected = new Set(connectedChannels);
    return CHANNEL_NAV.filter((item) => {
      if (item.id === 'all') return connectedChannels.length > 1;
      return connected.has(item.id);
    });
  }, [connectedChannels]);

  useEffect(() => {
    if (searchParams.get('import') !== '1') return;
    setImportOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('import');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (connectedChannels.length === 0) return;
    if (connectedChannels.length === 1) {
      if (channelFilter !== connectedChannels[0]) {
        setChannelFilter(connectedChannels[0]);
      }
      return;
    }
    if (channelFilter === 'all') return;
    if (!connectedChannels.includes(channelFilter)) {
      setChannelFilter('all');
    }
  }, [channelFilter, connectedChannels]);

  const buildListParams = useCallback(
    (pageCursor: string | null): Record<string, string> => {
      const params: Record<string, string> = {
        list: activeList,
        limit: String(pageLimit),
      };
      if (channelFilter !== 'all') params.channel = channelFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (tagFilter) params.tag = tagFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (pageCursor) params.cursor = pageCursor;
      return params;
    },
    [activeList, channelFilter, searchQuery, tagFilter, dateFrom, dateTo, pageLimit]
  );

  const fetchPage = useCallback(
    async (pageCursor: string | null, options?: { silent?: boolean }) => {
      const generation = ++fetchGenerationRef.current;
      if (!options?.silent) setLoading(true);
      try {
        const [res, tagsRes] = await Promise.all([
          api.getContacts(buildListParams(pageCursor)),
          api.getContactTags().catch(() => ({ tags: [] as string[] })),
        ]);
        // A newer fetchPage call has since started — this response is for
        // filters/page the user has already moved away from.
        if (fetchGenerationRef.current !== generation) return;
        setContacts((res.items ?? []).map((c) => mapContactFromApi(c)));
        setNextCursor(res.nextCursor ?? null);
        setHasMore(Boolean(res.hasMore));
        setAvailableTags(tagsRes.tags ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (fetchGenerationRef.current === generation && !options?.silent) setLoading(false);
      }
    },
    [buildListParams]
  );

  useEffect(() => {
    setCursor(null);
    setCursorStack([]);
    setSelectedIds(new Set());
    const t = window.setTimeout(() => void fetchPage(null), searchQuery ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [fetchPage, searchQuery]);

  useKeepAliveActivation(() => {
    void fetchPage(cursor, { silent: true });
  });

  const goNext = () => {
    if (!nextCursor || loading) return;
    setCursorStack((s) => [...s, cursor]);
    setCursor(nextCursor);
    setSelectedIds(new Set());
    void fetchPage(nextCursor);
  };

  const goPrev = () => {
    if (cursorStack.length === 0 || loading) return;
    const prev = cursorStack[cursorStack.length - 1] ?? null;
    setCursorStack((s) => s.slice(0, -1));
    setCursor(prev);
    setSelectedIds(new Set());
    void fetchPage(prev);
  };

  const reloadCurrent = (options?: { silent?: boolean }) => {
    setCursor(null);
    setCursorStack([]);
    void fetchPage(null, options);
  };

  const allVisibleSelected =
    contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));
  const someVisibleSelected = contacts.some((c) => selectedIds.has(c.id));
  const selectedCount = selectedIds.size;
  const canPrev = cursorStack.length > 0;
  const pageLabel = `Showing ${contacts.length}${hasMore || canPrev ? '+' : ''}`;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(contacts.map((c) => c.id)));
  };

  const listLabelForContact = (contact: Contact) => {
    if (contact.tags.includes('Blocked')) return 'Blocklist';
    if (contact.tags.includes('Unsubscribed')) return 'Unsubscribe';
    return 'All';
  };

  const openAddContact = () => {
    setEditContact(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditContact(null);
  };

  const openEditContact = async (contact: Contact) => {
    try {
      const raw = (await api.getContact(contact.id)) as Record<string, unknown>;
      const customFields = (raw.customFields as Record<string, string>) ?? {};
      setEditContact({
        id: String(raw.id),
        name: String(raw.name),
        phone: String(raw.phone),
        email: raw.email ? String(raw.email) : undefined,
        tags: (raw.tags as string[]) ?? [],
        customFields,
        channel: contact.channel,
        excludeFromInsights: Boolean(raw.excludeFromInsights),
      });
      setDrawerOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    const confirmed = window.confirm(
      `Delete ${contact.name}? This will also delete related conversations, messages, and journey history.`
    );
    if (!confirmed) return;
    setDeletingContactId(contact.id);
    try {
      await api.deleteContact(contact.id);
      setSelectedIds((prev) => {
        if (!prev.has(contact.id)) return prev;
        const next = new Set(prev);
        next.delete(contact.id);
        return next;
      });
      reloadCurrent({ silent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete contact';
      window.alert(message);
    } finally {
      setDeletingContactId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${ids.length} contact${ids.length === 1 ? '' : 's'}? This will also delete related conversations, messages, and journey history.`
    );
    if (!confirmed) return;
    setBulkDeleting(true);
    const failed = new Set<string>();
    for (const id of ids) {
      try {
        await api.deleteContact(id);
      } catch {
        failed.add(id);
      }
    }
    setSelectedIds(failed);
    reloadCurrent({ silent: true });
    if (failed.size > 0) {
      window.alert(`Failed to delete ${failed.size} of ${ids.length} contacts.`);
    }
    setBulkDeleting(false);
  };

  const handleDeleteByTag = async () => {
    if (!tagFilter) return;
    setTagDeleting(true);
    try {
      const { count, tag } = await api.countContactsByTag(tagFilter);
      if (count === 0) {
        window.alert(`No contacts found with tag "${tag}".`);
        return;
      }
      const confirmed = window.confirm(
        `Delete ${count} contact${count === 1 ? '' : 's'} with tag "${tag}"? This will also delete related conversations, messages, and journey history. The tag itself will not be removed.`
      );
      if (!confirmed) return;
      const result = await api.deleteContactsByTag(tag);
      setSelectedIds(new Set());
      reloadCurrent({ silent: true });
      if (result.failed > 0) {
        window.alert(
          `Deleted ${result.deleted} of ${result.deleted + result.failed} contacts with tag "${tag}" — ${result.failed} failed and were left in place. Try again for the remaining ones.`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete contacts by tag';
      window.alert(message);
    } finally {
      setTagDeleting(false);
    }
  };

  const hasConnectedChannel =
    whatsappAccounts.length > 0 || instagramConnected || messengerConnected;
  const showConnectChannelEmpty = channelsReady && !hasConnectedChannel;

  if (showConnectChannelEmpty) {
    return (
      <div className="h-full min-h-0 border border-swiss-line bg-white overflow-hidden flex">
        <ConnectChannelEmpty
          onConnect={() => navigate(pathForIntegrationsChannel('whatsapp'))}
        />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 border border-swiss-line bg-white overflow-hidden">
      <div className="h-full min-h-0">
        <section className="min-h-0 h-full flex flex-col">
          <div className="border-b border-swiss-line bg-white px-3 md:px-4 py-3 space-y-3">
            <div className="inline-flex rounded-lg bg-surface-muted p-0.5">
              <button
                type="button"
                onClick={() => navigate(pathForContactsDashboard())}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  pageTab === 'dashboard'
                    ? 'bg-white text-primary ring-1 ring-swiss-line'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate(pathForContactsList())}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  pageTab === 'contacts'
                    ? 'bg-white text-primary ring-1 ring-swiss-line'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Contacts
              </button>
            </div>

            {pageTab === 'contacts' && (
              <>
            <div className="flex items-center gap-2 w-full">
              <div className="relative min-w-[180px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, email..."
                  className="h-auto rounded-lg border-swiss-line bg-white py-2 pl-9 pr-3 text-sm text-slate-800 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <Select
                value={activeList}
                onValueChange={(value) => setActiveList(value as ContactListKey)}
              >
                <SelectTrigger className={`${FILTER_SELECT_CLASS} w-[112px]`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIST_NAV.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ThemeDateInput
                value={dateFrom}
                onChange={setDateFrom}
                aria-label="From date"
                placeholder="From"
                max={dateTo || undefined}
              />
              <ThemeDateInput
                value={dateTo}
                onChange={setDateTo}
                aria-label="To date"
                placeholder="To"
                min={dateFrom || undefined}
              />

              <Select value={tagFilter || 'all'} onValueChange={(v) => setTagFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className={`${FILTER_SELECT_CLASS} w-[128px]`} aria-label="Filter by tag">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {availableTags.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(pageLimit)}
                onValueChange={(v) =>
                  setPageLimit(Number(v) as (typeof PAGE_SIZE_OPTIONS)[number])
                }
              >
                <SelectTrigger className={`${FILTER_SELECT_CLASS} w-[108px]`} aria-label="Per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 min-w-0 flex-1">
                {visibleChannelNav.map((item) => {
                  const active = channelFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChannelFilter(item.id)}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-primary/15 text-primary border-primary/20'
                          : 'bg-white text-slate-600 border-swiss-line hover:bg-surface-muted'
                      }`}
                    >
                      <span className={active ? 'text-primary' : 'text-slate-400'}>{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  disabled={contacts.length === 0 || loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-swiss-line px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-muted disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-swiss-line px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-muted"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>

                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleBulkDelete()}
                    disabled={bulkDeleting || tagDeleting || loading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {bulkDeleting ? 'Deleting…' : `Delete (${selectedCount})`}
                  </button>
                )}

                {tagFilter ? (
                  <button
                    type="button"
                    onClick={() => void handleDeleteByTag()}
                    disabled={bulkDeleting || tagDeleting || loading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
                    title={`Delete all contacts with tag "${tagFilter}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {tagDeleting ? 'Deleting…' : 'Delete all with tag'}
                  </button>
                ) : null}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-swiss-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-muted whitespace-nowrap"
                    >
                      <Columns3 className="w-4 h-4" />
                      Add column
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Custom fields</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableCustomFieldKeys.length === 0 ? (
                      <p className="px-1.5 py-1.5 text-xs text-slate-400">
                        No custom fields on any loaded contact yet.
                      </p>
                    ) : (
                      availableCustomFieldKeys.map((key) => (
                        <DropdownMenuCheckboxItem
                          key={key}
                          checked={customColumnKeys.includes(key)}
                          onCheckedChange={() => toggleCustomColumn(key)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {labelForCustomFieldKey(key)}
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  type="button"
                  onClick={openAddContact}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  Add contact
                </button>
              </div>
            </div>
              </>
            )}
          </div>

          {pageTab === 'dashboard' ? (
            <div className="flex-1 min-h-0">
              <ContactsDashboard connectedChannels={connectedChannels} />
            </div>
          ) : (
            <>
          <div className="flex-1 min-h-0 overflow-auto bg-white">
            {loading ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-500">
                Loading contacts...
              </div>
            ) : contacts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 rounded-xl bg-surface-muted flex items-center justify-center mb-3">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No contacts found</p>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Try changing list/channel filters or add your first contact.
                </p>
              </div>
            ) : (
              <>
                <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-swiss-line bg-white">
                  <Checkbox
                    checked={someVisibleSelected && !allVisibleSelected ? 'indeterminate' : allVisibleSelected}
                    onCheckedChange={toggleSelectAll}
                    disabled={bulkDeleting}
                    className="cursor-pointer"
                    aria-label="Select all contacts"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
                  </span>
                </div>
                <ul className="md:hidden divide-y divide-slate-200/70">
                  {contacts.map((contact) => (
                    <li key={contact.id} className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          checked={selectedIds.has(contact.id)}
                          onCheckedChange={() => toggleSelect(contact.id)}
                          disabled={bulkDeleting}
                          className="shrink-0 cursor-pointer"
                          aria-label={`Select ${contact.name}`}
                        />
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(pathForContact(contact.id))}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-sm font-semibold text-slate-900 truncate">{contact.name}</p>
                          <p className="text-xs text-slate-500 truncate">{contact.phone}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteContact(contact)}
                          disabled={deletingContactId === contact.id || bulkDeleting}
                          className="inline-flex items-center justify-center p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                          aria-label={`Delete ${contact.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden md:block">
                  <Table className="min-w-[760px] text-left">
                    <TableHeader className="sticky top-0 z-10 bg-surface-muted border-b border-swiss-line">
                      <TableRow className="text-[11px] uppercase tracking-wider text-slate-500 hover:bg-transparent">
                        <TableHead className="px-4 py-2 font-bold w-10 whitespace-normal">
                          <Checkbox
                            checked={someVisibleSelected && !allVisibleSelected ? 'indeterminate' : allVisibleSelected}
                            onCheckedChange={toggleSelectAll}
                            disabled={bulkDeleting}
                            className="cursor-pointer"
                            aria-label="Select all contacts"
                          />
                        </TableHead>
                        <TableHead className="px-4 py-2 font-bold whitespace-normal">Contact</TableHead>
                        <TableHead className="px-4 py-2 font-bold whitespace-normal">Phone</TableHead>
                        <TableHead className="px-4 py-2 font-bold whitespace-normal">Email</TableHead>
                        <TableHead className="px-4 py-2 font-bold whitespace-normal">Source</TableHead>
                        <TableHead className="px-4 py-2 font-bold whitespace-normal">List</TableHead>
                        <TableHead className="px-4 py-2 font-bold whitespace-normal">Tags</TableHead>
                        <TableHead className="px-4 py-2 font-bold whitespace-normal">Last active</TableHead>
                        {customColumnKeys.map((key) => (
                          <TableHead key={key} className="px-4 py-2 font-bold whitespace-normal">
                            <span className="inline-flex items-center gap-1">
                              {labelForCustomFieldKey(key)}
                              <button
                                type="button"
                                onClick={() => toggleCustomColumn(key)}
                                className="text-slate-400 hover:text-red-600"
                                aria-label={`Remove ${labelForCustomFieldKey(key)} column`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          </TableHead>
                        ))}
                        <TableHead className="px-4 py-2 font-bold text-right whitespace-normal">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-200/70 text-sm">
                      {contacts.map((contact) => (
                        <TableRow
                          key={contact.id}
                          className={`hover:bg-surface-muted/70 ${selectedIds.has(contact.id) ? 'bg-primary/15' : ''}`}
                        >
                          <TableCell className="px-4 py-2">
                            <Checkbox
                              checked={selectedIds.has(contact.id)}
                              onCheckedChange={() => toggleSelect(contact.id)}
                              disabled={bulkDeleting}
                              className="cursor-pointer"
                              aria-label={`Select ${contact.name}`}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => navigate(pathForContact(contact.id))}
                              className="flex items-center gap-2 min-w-0 cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                {contact.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-900 truncate">{contact.name}</span>
                            </button>
                          </TableCell>
                          <TableCell className="px-4 py-2 font-mono text-xs text-slate-600">{contact.phone}</TableCell>
                          <TableCell className="px-4 py-2 text-slate-600">{contact.email || '—'}</TableCell>
                          <TableCell className="px-4 py-2 text-slate-500">{contact.source}</TableCell>
                          <TableCell className="px-4 py-2 text-slate-600">{listLabelForContact(contact)}</TableCell>
                          <TableCell className="px-4 py-2 whitespace-normal">
                            {contact.tags.length === 0 ? (
                              <span className="text-xs text-slate-400">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {contact.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {contact.tags.length > 2 && (
                                  <span className="text-[11px] text-slate-400">
                                    +{contact.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-xs text-slate-400">{contact.lastActive}</TableCell>
                          {customColumnKeys.map((key) => {
                            const value = formatCustomFieldValue(contact.customFields?.[key]);
                            return (
                              <TableCell
                                key={key}
                                className="px-4 py-2 text-slate-600 max-w-[220px] truncate"
                                title={value}
                              >
                                {value}
                              </TableCell>
                            );
                          })}
                          <TableCell className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => void openEditContact(contact)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary/15"
                              aria-label={`Edit ${contact.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteContact(contact)}
                              disabled={deletingContactId === contact.id || bulkDeleting}
                              className="inline-flex items-center justify-center p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                              aria-label={`Delete ${contact.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 flex items-center justify-between gap-3 border-t border-swiss-line bg-white px-3 md:px-4 py-2.5">
            <p className="text-xs font-semibold text-slate-500">{pageLabel}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canPrev || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-swiss-line px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-surface-muted disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!hasMore || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-swiss-line px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-surface-muted disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
            </>
          )}
        </section>
      </div>

      <AddContactDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editContact={editContact}
        onCreated={() => reloadCurrent()}
        onSaved={() => reloadCurrent()}
      />
      <ImportContactsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => reloadCurrent({ silent: true })}
      />
      <ExportContactsDrawer
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        contacts={contacts}
        fileSuffix={`${activeList}${channelFilter !== 'all' ? `-${channelFilter}` : ''}`}
      />
    </div>
  );
};
