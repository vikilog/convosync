/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Download,
  Users,
  UserX,
  Ban,
  UserPlus,
  LayoutGrid,
  Facebook,
  Instagram,
  Pencil,
  Trash2,
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
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadContacts = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const params: Record<string, string> = { list: activeList };
      if (channelFilter !== 'all') params.channel = channelFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

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
  }, [activeList, channelFilter, searchQuery]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadContacts(), searchQuery ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [loadContacts, searchQuery]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeList, channelFilter, searchQuery]);

  useKeepAliveActivation(() => {
    void loadContacts({ silent: true });
  });

  const allVisibleSelected =
    contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));
  const someVisibleSelected = contacts.some((c) => selectedIds.has(c.id));
  const selectedCount = selectedIds.size;

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

  const countForList = (id: ContactListKey) => {
    if (id === 'all') return stats.all;
    if (id === 'unsubscribe') return stats.unsubscribe;
    return stats.blocklist;
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
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      await loadContacts({ silent: true });
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
    await loadContacts({ silent: true });
    if (failed.size > 0) {
      window.alert(`Failed to delete ${failed.size} of ${ids.length} contacts.`);
    }
    setBulkDeleting(false);
  };

  return (
    <div className="h-full min-h-0 border border-slate-200 bg-slate-50/60 overflow-hidden">
      <div className="h-full min-h-0">
        <section className="min-h-0 h-full flex flex-col">
          <div className="border-b border-slate-200 bg-white px-3 md:px-4 py-3 space-y-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Contacts</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,1fr)_auto_auto_auto_auto] gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, email..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <select
                value={activeList}
                onChange={(e) => setActiveList(e.target.value as ContactListKey)}
                className={`${SELECT_FIELD_CLASS} py-2 min-w-[120px]`}
              >
                {LIST_NAV.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExport}
                disabled={contacts.length === 0 || loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleBulkDelete()}
                  disabled={bulkDeleting || loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {bulkDeleting ? 'Deleting…' : `Delete (${selectedCount})`}
                </button>
              )}

              <button
                type="button"
                onClick={openAddContact}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-channel-green px-3 py-2 text-sm font-semibold text-white hover:bg-[#20bd5a]"
              >
                <UserPlus className="w-4 h-4" />
                Add contact
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {CHANNEL_NAV.map((item) => {
                const active = channelFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setChannelFilter(item.id)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-sky-50 text-primary border-primary/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={active ? 'text-primary' : 'text-slate-400'}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>

          </div>

          <div className="flex-1 min-h-0 overflow-auto bg-white">
            {loading ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-500">
                Loading contacts...
              </div>
            ) : contacts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center mb-3">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No contacts found</p>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Try changing list/channel filters or add your first contact.
                </p>
              </div>
            ) : (
              <>
                <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                    }}
                    onChange={toggleSelectAll}
                    disabled={bulkDeleting}
                    className="w-4 h-4 accent-sky-600 cursor-pointer"
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
                        <input
                          type="checkbox"
                          checked={selectedIds.has(contact.id)}
                          onChange={() => toggleSelect(contact.id)}
                          disabled={bulkDeleting}
                          className="w-4 h-4 accent-sky-600 cursor-pointer shrink-0"
                          aria-label={`Select ${contact.name}`}
                        />
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <button
                          type="button"
                          onClick={() => void openEditContact(contact)}
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
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-2 font-bold w-10">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                            }}
                            onChange={toggleSelectAll}
                            disabled={bulkDeleting}
                            className="w-4 h-4 accent-sky-600 cursor-pointer"
                            aria-label="Select all contacts"
                          />
                        </th>
                        <th className="px-4 py-2 font-bold">Contact</th>
                        <th className="px-4 py-2 font-bold">Phone</th>
                        <th className="px-4 py-2 font-bold">Email</th>
                        <th className="px-4 py-2 font-bold">Source</th>
                        <th className="px-4 py-2 font-bold">List</th>
                        <th className="px-4 py-2 font-bold">Tags</th>
                        <th className="px-4 py-2 font-bold">Last active</th>
                        <th className="px-4 py-2 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 text-sm">
                      {contacts.map((contact) => (
                        <tr
                          key={contact.id}
                          className={`hover:bg-slate-50/70 ${selectedIds.has(contact.id) ? 'bg-sky-50/40' : ''}`}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(contact.id)}
                              onChange={() => toggleSelect(contact.id)}
                              disabled={bulkDeleting}
                              className="w-4 h-4 accent-sky-600 cursor-pointer"
                              aria-label={`Select ${contact.name}`}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => void openEditContact(contact)}
                              className="flex items-center gap-2 min-w-0 cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                {contact.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-900 truncate">{contact.name}</span>
                            </button>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-600">{contact.phone}</td>
                          <td className="px-4 py-2 text-slate-600">{contact.email || '—'}</td>
                          <td className="px-4 py-2 text-slate-500">{contact.source}</td>
                          <td className="px-4 py-2 text-slate-600">{listLabelForContact(contact)}</td>
                          <td className="px-4 py-2">
                            {contact.tags.length === 0 ? (
                              <span className="text-xs text-slate-400">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {contact.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-primary"
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
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-400">{contact.lastActive}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => void openEditContact(contact)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-sky-50"
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
      </div>

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
