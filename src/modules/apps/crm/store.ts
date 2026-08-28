/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorkspaceId } from '../../../lib/api';
import type {
  Account,
  Contact,
  CrmEntityKind,
  CrmFieldValues,
  CrmSchema,
  CrmTask,
  FieldDef,
  TimelineEntry,
} from './types';

export const CRM_CHANGED_EVENT = 'convosync:crm-changed';

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CRM_CHANGED_EVENT));
}

function wsKey(name: string): string {
  return `convosync_crm_${name}_${getWorkspaceId() ?? 'default'}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_SCHEMA: CrmSchema = {
  account: [
    { id: 'f_acc_name', key: 'name', label: 'Account Name', type: 'text', required: true },
    { id: 'f_acc_industry', key: 'industry', label: 'Industry', type: 'text' },
    { id: 'f_acc_owner', key: 'owner', label: 'Owner', type: 'text' },
    { id: 'f_acc_phone', key: 'phone', label: 'Phone', type: 'phone' },
    { id: 'f_acc_website', key: 'website', label: 'Website', type: 'text' },
    { id: 'f_acc_address', key: 'address', label: 'Address', type: 'textarea' },
  ],
  contact: [
    { id: 'f_con_name', key: 'name', label: 'Name', type: 'text', locked: true, required: true },
    { id: 'f_con_phone', key: 'phone', label: 'Phone', type: 'phone', locked: true, required: true },
    { id: 'f_con_email', key: 'email', label: 'Email', type: 'email', locked: true },
    { id: 'f_con_role', key: 'role', label: 'Role / Title', type: 'text' },
  ],
  task: [
    { id: 'f_task_title', key: 'title', label: 'Title', type: 'text', required: true },
    { id: 'f_task_due', key: 'dueDate', label: 'Due Date', type: 'date' },
    {
      id: 'f_task_priority',
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: ['Low', 'Medium', 'High'],
    },
    { id: 'f_task_assignee', key: 'assignee', label: 'Assigned To', type: 'text' },
    { id: 'f_task_notes', key: 'notes', label: 'Notes', type: 'textarea' },
  ],
};

export function getSchema(): CrmSchema {
  return readJson<CrmSchema>(wsKey('schema'), DEFAULT_SCHEMA);
}

export function getEntitySchema(entity: CrmEntityKind): FieldDef[] {
  return getSchema()[entity];
}

function saveSchema(schema: CrmSchema) {
  writeJson(wsKey('schema'), schema);
  notifyChanged();
}

export function addField(entity: CrmEntityKind, field: Omit<FieldDef, 'id'>) {
  const schema = getSchema();
  schema[entity] = [...schema[entity], { ...field, id: uid('f') }];
  saveSchema(schema);
}

export function removeField(entity: CrmEntityKind, fieldId: string) {
  const schema = getSchema();
  schema[entity] = schema[entity].filter((f) => f.id !== fieldId || f.locked);
  saveSchema(schema);
}

export function reorderField(entity: CrmEntityKind, fieldId: string, direction: 'up' | 'down') {
  const schema = getSchema();
  const list = [...schema[entity]];
  const idx = list.findIndex((f) => f.id === fieldId);
  if (idx < 0) return;
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) return;
  [list[idx], list[swapWith]] = [list[swapWith], list[idx]];
  schema[entity] = list;
  saveSchema(schema);
}

function seedIfEmpty() {
  if (localStorage.getItem(wsKey('seeded'))) return;
  const now = new Date().toISOString();
  const accounts: Account[] = [
    {
      id: 'acc_blue_ridge',
      createdAt: now,
      updatedAt: now,
      fields: { name: 'Blue Ridge Retail', industry: 'Retail', owner: 'Sana Mehta', phone: '+91 98200 11223', website: 'blueridge.in', address: 'Andheri West, Mumbai' },
    },
    {
      id: 'acc_nova',
      createdAt: now,
      updatedAt: now,
      fields: { name: 'Nova Fitness Pvt Ltd', industry: 'Wellness', owner: 'Rohit Kadam', phone: '', website: '', address: 'Pune' },
    },
  ];
  const contacts: Contact[] = [
    {
      id: 'con_rohan',
      accountId: 'acc_blue_ridge',
      createdAt: now,
      updatedAt: now,
      fields: { name: 'Rohan Mehta', phone: '+91 98213 44210', email: 'rohan@blueridge.in', role: 'Store Manager' },
      pushedToContactId: null,
    },
  ];
  const tasks: CrmTask[] = [
    {
      id: 'task_contract',
      createdAt: now,
      updatedAt: now,
      fields: { title: 'Send renewed contract for signature', dueDate: '', priority: 'High', assignee: 'Sana Mehta', notes: '' },
      link: { type: 'account', id: 'acc_blue_ridge' },
      done: false,
    },
    {
      id: 'task_delivery',
      createdAt: now,
      updatedAt: now,
      fields: { title: 'Confirm delivery address with Rohan', dueDate: '', priority: 'Medium', assignee: 'Sana Mehta', notes: '' },
      link: { type: 'contact', id: 'con_rohan' },
      done: false,
    },
  ];
  const timeline: TimelineEntry[] = [
    {
      id: uid('tl'),
      contactId: 'con_rohan',
      kind: 'meeting',
      text: 'Discussed renewing the annual contract — wants revised pricing on the winter catalog before signing.',
      author: 'Sana Mehta',
      createdAt: now,
    },
  ];
  writeJson(wsKey('accounts'), accounts);
  writeJson(wsKey('contacts'), contacts);
  writeJson(wsKey('tasks'), tasks);
  writeJson(wsKey('timeline'), timeline);
  localStorage.setItem(wsKey('seeded'), '1');
}

seedIfEmpty();

export function listAccounts(): Account[] {
  return readJson<Account[]>(wsKey('accounts'), []);
}

export function getAccount(id: string): Account | undefined {
  return listAccounts().find((a) => a.id === id);
}

export function createAccount(fields: CrmFieldValues): Account {
  const now = new Date().toISOString();
  const record: Account = { id: uid('acc'), createdAt: now, updatedAt: now, fields };
  const accounts = [record, ...listAccounts()];
  writeJson(wsKey('accounts'), accounts);
  notifyChanged();
  return record;
}

/** Deletes an account along with its contacts, their timeline entries, and any tasks linked to either. */
export function deleteAccount(accountId: string) {
  const contactIds = listContacts(accountId).map((c) => c.id);

  writeJson(
    wsKey('accounts'),
    listAccounts().filter((a) => a.id !== accountId)
  );
  writeJson(
    wsKey('contacts'),
    listContacts().filter((c) => c.accountId !== accountId)
  );
  writeJson(
    wsKey('tasks'),
    listTasks().filter((t) => {
      if (!t.link) return true;
      if (t.link.type === 'account') return t.link.id !== accountId;
      return !contactIds.includes(t.link.id);
    })
  );
  writeJson(
    wsKey('timeline'),
    readJson<TimelineEntry[]>(wsKey('timeline'), []).filter((t) => !contactIds.includes(t.contactId))
  );
  notifyChanged();
}

export function listContacts(accountId?: string): Contact[] {
  const all = readJson<Contact[]>(wsKey('contacts'), []);
  return accountId ? all.filter((c) => c.accountId === accountId) : all;
}

export function getContact(id: string): Contact | undefined {
  return listContacts().find((c) => c.id === id);
}

export function createContact(accountId: string, fields: CrmFieldValues): Contact {
  const now = new Date().toISOString();
  const record: Contact = { id: uid('con'), accountId, createdAt: now, updatedAt: now, fields, pushedToContactId: null };
  const contacts = [record, ...listContacts()];
  writeJson(wsKey('contacts'), contacts);
  notifyChanged();
  return record;
}

/** Simulated push — matches on phone, marks the contact as synced. Real API wiring happens once a Contacts endpoint is designed for this. */
export function pushContactToContacts(contactId: string): Contact | undefined {
  const contacts = listContacts();
  const idx = contacts.findIndex((c) => c.id === contactId);
  if (idx < 0) return undefined;
  contacts[idx] = { ...contacts[idx], pushedToContactId: uid('pushed') };
  writeJson(wsKey('contacts'), contacts);
  notifyChanged();
  return contacts[idx];
}

export function listTasks(link?: { type: 'account' | 'contact'; id: string }): CrmTask[] {
  const all = readJson<CrmTask[]>(wsKey('tasks'), []);
  if (!link) return all;
  return all.filter((t) => t.link?.type === link.type && t.link.id === link.id);
}

/** Tasks linked directly to this account, plus tasks linked to any of its contacts. */
export function listTasksForAccount(accountId: string): CrmTask[] {
  const contactIds = new Set(listContacts(accountId).map((c) => c.id));
  return listTasks().filter(
    (t) =>
      (t.link?.type === 'account' && t.link.id === accountId) ||
      (t.link?.type === 'contact' && contactIds.has(t.link.id))
  );
}

export function createTask(fields: CrmFieldValues, link: CrmTask['link'], images?: string[]): CrmTask {
  const now = new Date().toISOString();
  const record: CrmTask = {
    id: uid('task'),
    createdAt: now,
    updatedAt: now,
    fields,
    link,
    done: false,
    images: images?.slice(0, 5),
  };
  const tasks = [record, ...listTasks()];
  writeJson(wsKey('tasks'), tasks);
  notifyChanged();
  return record;
}

export function updateTaskFields(taskId: string, partial: CrmFieldValues) {
  const tasks = listTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) return;
  tasks[idx] = {
    ...tasks[idx],
    fields: { ...tasks[idx].fields, ...partial },
    updatedAt: new Date().toISOString(),
  };
  writeJson(wsKey('tasks'), tasks);
  notifyChanged();
}

export function getTask(taskId: string): CrmTask | undefined {
  return listTasks().find((t) => t.id === taskId);
}

/** Full edit — replaces fields, link and images for an existing task. */
export function updateTask(
  taskId: string,
  fields: CrmFieldValues,
  link: CrmTask['link'],
  images?: string[]
): CrmTask | undefined {
  const tasks = listTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) return undefined;
  tasks[idx] = {
    ...tasks[idx],
    fields,
    link,
    images: images?.slice(0, 5),
    updatedAt: new Date().toISOString(),
  };
  writeJson(wsKey('tasks'), tasks);
  notifyChanged();
  return tasks[idx];
}

export function toggleTaskDone(taskId: string) {
  const tasks = listTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) return;
  tasks[idx] = { ...tasks[idx], done: !tasks[idx].done };
  writeJson(wsKey('tasks'), tasks);
  notifyChanged();
}

export function listTimeline(contactId: string): TimelineEntry[] {
  return readJson<TimelineEntry[]>(wsKey('timeline'), [])
    .filter((t) => t.contactId === contactId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addTimelineEntry(contactId: string, kind: TimelineEntry['kind'], text: string, author: string): TimelineEntry {
  const entry: TimelineEntry = { id: uid('tl'), contactId, kind, text, author, createdAt: new Date().toISOString() };
  const entries = [...readJson<TimelineEntry[]>(wsKey('timeline'), []), entry];
  writeJson(wsKey('timeline'), entries);
  notifyChanged();
  return entry;
}
