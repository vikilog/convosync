/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Filter,
  Users,
  UserX,
  Ban,
  UserPlus,
  LayoutGrid,
  Facebook,
  Instagram,
  Pencil,
} from 'lucide-react';
import { Contact } from '../types';
import { api } from '../lib/api';
import { useKeepAliveActivation } from './KeepAlive';
import { mapContactFromApi } from '../lib/mappers';
import { AddContactDrawer, type ContactEditPayload } from './contacts/AddContactDrawer';

type ContactListKey = 'all' | 'unsubscribe' | 'blocklist';
type ContactChannelKey = 'all' | 'whatsapp' | 'instagram' | 'messenger';

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
    activeClass: 'bg-sky-50 text-primary',
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

const SELECT_FIELD_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export const ContactsView: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState({ all: 0, unsubscribe: 0, blocklist: 0 });
  const [activeList, setActiveList] = useState<ContactListKey>('all');
  const [channelFilter, setChannelFilter] = useState<ContactChannelKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editContact, setEditContact] = useState<ContactEditPayload | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTag, setFilterTag] = useState('');

  const loadContacts = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const params: Record<string, string> = { list: activeList };
      if (channelFilter !== 'all') params.channel = channelFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filterTag) params.tag = filterTag;

      const [rawContacts, rawStats] = await Promise.all([
        api.getContacts(params),
        api.getContactStats(),
      ]);
      setContacts(rawContacts.map((c: Record<string, unknown>) => mapContactFromApi(c)));
      setStats(rawStats as { all: number; unsubscribe: number; blocklist: number });
    } catch (err) {
      console.error(err);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [activeList, channelFilter, searchQuery, filterTag]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadContacts(), searchQuery ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [loadContacts, searchQuery]);

  useKeepAliveActivation(() => {
    void loadContacts({ silent: true });
  });

  const countForList = (id: ContactListKey) => {
    if (id === 'all') return stats.all;
    if (id === 'unsubscribe') return stats.unsubscribe;
    return stats.blocklist;
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags))).sort();

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
      });
      setDrawerOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    if (contacts.length === 0) return;
    const header = ['id', 'name', 'phone', 'email', 'source', 'tags'];
    const rows = contacts.map((c) =>
      [
        c.id,
        c.name,
        c.phone,
        c.email ?? '',
        c.source,
        c.tags.join(';'),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${activeList}${channelFilter !== 'all' ? `-${channelFilter}` : ''}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100dvh-9.5rem)] md:h-[calc(100vh-4rem)] max-h-[calc(100dvh-9.5rem)] md:max-h-none -m-2 md:-m-4 lg:-m-6 bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="md:hidden border-b border-slate-200 bg-slate-50 p-3 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <label htmlFor="contacts-list-mobile" className="sr-only">
            Contact list
          </label>
          <select
            id="contacts-list-mobile"
            value={activeList}
            onChange={(e) => setActiveList(e.target.value as ContactListKey)}
            className={SELECT_FIELD_CLASS}
          >
            {LIST_NAV.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({countForList(item.id)})
              </option>
            ))}
          </select>
          <label htmlFor="contacts-channel-mobile" className="sr-only">
            Channel filter
          </label>
          <select
            id="contacts-channel-mobile"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as ContactChannelKey)}
            className={SELECT_FIELD_CLASS}
          >
            {CHANNEL_NAV.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List sidebar — All / Unsubscribe / Blocklist */}
      <aside className="hidden md:flex w-[188px] shrink-0 border-r border-slate-200 bg-slate-50 py-3 flex-col">
        <nav className="space-y-0.5 px-2">
          {LIST_NAV.map((item) => {
            const active = activeList === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveList(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-sky-50 text-primary font-bold'
                    : 'text-gray-600 hover:bg-white hover:text-primary'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={active ? 'text-primary' : 'text-gray-400'}>{item.icon}</span>
                  {item.label}
                </span>
                <span className="text-xs font-mono text-gray-500 shrink-0">
                  ({countForList(item.id)})
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4 px-3">
          <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Channel
          </p>
          <nav className="space-y-0.5">
            {CHANNEL_NAV.map((item) => {
              const active = channelFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setChannelFilter(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    active
                      ? `${item.activeClass} font-bold`
                      : 'text-gray-600 hover:bg-white hover:text-primary'
                  }`}
                >
                  <span className={active ? '' : 'text-gray-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main panel */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="px-3 md:px-4 py-3 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts…"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl border transition-colors shrink-0 ${
                showFilters || filterTag
                  ? 'border-primary text-primary bg-sky-50'
                  : 'border-slate-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 sm:hidden" aria-hidden />
              <Plus className="w-3.5 h-3.5 hidden sm:block" aria-hidden />
              <span>{showFilters || filterTag ? 'Filters' : 'Add filter'}</span>
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="text-xs text-gray-500 font-medium">Tag:</span>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className={`${SELECT_FIELD_CLASS} w-auto min-w-[140px] py-2 text-sm font-medium`}
              >
                <option value="">Any</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {filterTag && (
                <button
                  type="button"
                  onClick={() => setFilterTag('')}
                  className="text-sm font-bold text-primary"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600 shrink-0">
              <span className="font-bold text-gray-900">{contacts.length}</span> Contacts
            </p>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExport}
                disabled={contacts.length === 0 || loading}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-gray-700 border border-slate-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate hidden sm:inline">Export all</span>
                <span className="truncate sm:hidden">Export</span>
              </button>
              <button
                type="button"
                onClick={openAddContact}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="truncate hidden sm:inline">Add contact</span>
                <span className="truncate sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {loading ? (
            <>
              <div className="p-4 space-y-3 md:hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/5 rounded bg-gray-100" />
                      <div className="h-3 w-3/5 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:flex items-center justify-center min-h-[12rem] text-sm text-gray-400">
                Loading contacts…
              </div>
            </>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-6">
              <div className="w-24 h-24 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
                <Filter className="w-10 h-10 text-primary/40" />
              </div>
              <p className="text-sm font-bold text-gray-500">No data</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {activeList === 'all' && channelFilter === 'all'
                  ? 'Add a contact or connect WhatsApp to start building your audience.'
                  : activeList !== 'all'
                    ? `No contacts in ${activeList === 'unsubscribe' ? 'Unsubscribe' : 'Blocklist'}${channelFilter !== 'all' ? ` on ${CHANNEL_NAV.find((c) => c.id === channelFilter)?.label}` : ''} yet.`
                    : `No ${CHANNEL_NAV.find((c) => c.id === channelFilter)?.label ?? ''} contacts yet.`}
              </p>
              {activeList === 'all' && (
                <button
                  type="button"
                  onClick={openAddContact}
                  className="mt-4 px-4 py-2 text-sm font-bold text-primary border border-primary/30 rounded-lg hover:bg-sky-50"
                >
                  Add your first contact
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="md:hidden divide-y divide-slate-200/60">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <button
                      type="button"
                      onClick={() => void openEditContact(contact)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/80 active:bg-sky-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {contact.phone || contact.email || contact.source}
                        </p>
                        {contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {contact.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                            {contact.tags.length > 2 && (
                              <span className="text-[11px] text-gray-400">
                                +{contact.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Pencil className="w-4 h-4 text-gray-300 shrink-0" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider font-bold text-gray-400 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Nickname</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-4 py-3 w-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{contact.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{contact.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{contact.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.length === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-sm font-bold bg-sky-50 text-primary"
                            >
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{contact.lastActive}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void openEditContact(contact)}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-sky-50 transition-colors"
                        title="Edit contact"
                        aria-label={`Edit ${contact.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </>
          )}
        </div>
      </section>

      <AddContactDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editContact={editContact}
        onCreated={() => void loadContacts()}
        onSaved={() => void loadContacts()}
      />
    </div>
  );
};
