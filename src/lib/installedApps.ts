/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Handshake, UserCheck, CalendarClock, IdCard, type LucideIcon } from 'lucide-react';
import { api } from './api';

export type AppPermission = { title: string; desc: string };

export type AppDefinition = {
  id: string;
  /** Sidebar/route tab id this app renders once installed. */
  tab: string;
  name: string;
  /** Short label for the sidebar nav item (falls back to `name` when omitted). */
  navLabel?: string;
  by: string;
  category: string;
  /** Short card description shown in the App Store grid. */
  description: string;
  /** Longer paragraph shown on the install-confirm screen. */
  about: string;
  whatYouGet: string[];
  permissions: AppPermission[];
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export const APP_CATEGORIES = ['CRM', 'Staff Management', 'Scheduling'] as const;

export const APP_REGISTRY: AppDefinition[] = [
  {
    id: 'crm',
    tab: 'crm',
    name: 'CRM',
    navLabel: 'CRM',
    by: 'ConvoSync',
    category: 'CRM',
    description:
      'Accounts, contacts, tasks and a meeting/notes timeline — every form customizable to how you work.',
    about:
      'A general-purpose CRM: organize the businesses you deal with as Accounts, their people as Contacts, and work as Tasks linked to either. Every form — Account, Contact, Task — can be customized with your own fields.',
    whatYouGet: [
      'A new "CRM" item in your sidebar, under Apps',
      'Accounts with contacts, tasks and a shared field builder for every form',
      'A per-contact timeline of logged meetings and notes, plus a one-click push into Contacts',
    ],
    permissions: [
      { title: 'Read contacts directory', desc: 'Matches existing contacts when you push a CRM contact in' },
      { title: 'Write account, contact & task records', desc: "Stored in its own tables — other apps can't see it" },
      { title: 'Send WhatsApp on your behalf', desc: 'Only for the follow-ups and reminders you configure' },
    ],
    icon: Handshake,
    iconBg: '#eaf2ff',
    iconColor: '#1d5fc9',
  },
  {
    id: 'attendance',
    tab: 'attendance',
    name: 'Attendance',
    by: 'ConvoSync',
    category: 'Staff Management',
    description:
      'Staff check-in and check-out, shift tracking, and daily attendance reports for every branch.',
    about:
      'Lets your front-desk or trainers mark staff in and out from ConvoSync, keeps a daily attendance log per branch, and rolls it up into weekly reports.',
    whatYouGet: [
      'A new "Attendance" item in your sidebar, under Apps',
      'Check-in / check-out for every staff member',
      'Daily and weekly attendance reports, exportable',
    ],
    permissions: [
      { title: 'Read staff directory', desc: 'Names and roles, to build the check-in list' },
      { title: 'Write attendance records', desc: "Stored in its own table — other apps can't see it" },
    ],
    icon: UserCheck,
    iconBg: '#e8f0ec',
    iconColor: '#064e3b',
  },
  {
    id: 'dasalon-console',
    tab: 'dasalon-console',
    name: 'Dasalon Console',
    navLabel: 'Dasalon Console',
    by: 'ConvoSync',
    category: 'Scheduling',
    description:
      'Manage salon appointments, stylist schedules, and your service menu from one dashboard.',
    about:
      'The main admin dashboard for your salon — book and manage appointments, assign stylists, track revenue per service, and keep your service menu and pricing up to date.',
    whatYouGet: [
      'A new "Appointments" item in your sidebar, under Apps',
      'Daily and weekly booking calendar with stylist assignment',
      'Service menu, pricing, and revenue per service',
    ],
    permissions: [
      { title: 'Read contacts directory', desc: 'Matches existing contacts to booking clients' },
      { title: 'Write appointment & service records', desc: "Stored in its own table — other apps can't see it" },
      { title: 'Send WhatsApp booking confirmations', desc: 'Only for bookings, using your approved templates' },
    ],
    icon: CalendarClock,
    iconBg: '#f1ecfb',
    iconColor: '#6b3fc9',
  },
  {
    id: 'dasalon-partner',
    tab: 'dasalon-partner',
    name: 'Dasalon Partner',
    navLabel: 'Dasalon Partner',
    by: 'ConvoSync',
    category: 'Staff Management',
    description:
      "Give stylists and chair partners their own view of today's bookings, availability, and earnings.",
    about:
      'A lightweight partner app for stylists and chair-renters — each partner sees their own schedule, toggles availability, and tracks commission, without access to the full salon console.',
    whatYouGet: [
      'A new "Partners" item in your sidebar, under Apps',
      "Each partner's own booking schedule and availability toggle",
      'Commission and payout tracking per partner',
    ],
    permissions: [
      { title: 'Read staff directory', desc: 'Names and roles, to build partner profiles' },
      { title: 'Write partner availability & commission records', desc: "Stored in its own table — other apps can't see it" },
    ],
    icon: IdCard,
    iconBg: '#fdf1e2',
    iconColor: '#b1650b',
  },
];

export function getAppDefinition(id: string): AppDefinition | undefined {
  return APP_REGISTRY.find((app) => app.id === id);
}

/** Fired whenever the installed-apps cache changes so the sidebar (and any other listener) can re-read it. */
export const APPS_CHANGED_EVENT = 'convosync:apps-changed';

/** In-memory cache of the last-known installed app ids for this workspace, backed by the server. */
let installedAppIdsCache: string[] = [];

function setCache(ids: string[]) {
  installedAppIdsCache = ids;
  window.dispatchEvent(new CustomEvent(APPS_CHANGED_EVENT, { detail: { ids } }));
}

/** Synchronous read of the last-known state — call `refreshInstalledApps()` on mount to populate/update it. */
export function getInstalledAppIds(): string[] {
  return installedAppIdsCache;
}

export function isAppInstalled(id: string): boolean {
  return installedAppIdsCache.includes(id);
}

/** Fetches installed apps from the backend and updates the cache. Call on mount / workspace change. */
export async function refreshInstalledApps(): Promise<string[]> {
  const res = await api.getInstalledApps();
  setCache(res.appIds ?? []);
  return installedAppIdsCache;
}

export async function installApp(id: string): Promise<void> {
  await api.installApp(id);
  if (!installedAppIdsCache.includes(id)) {
    setCache([...installedAppIdsCache, id]);
  }
}

export async function uninstallApp(id: string): Promise<void> {
  await api.uninstallApp(id);
  setCache(installedAppIdsCache.filter((x) => x !== id));
}
