import type { ContactChannelFilter } from '@/services/realContacts.service'

export const CUSTOM_COLUMNS_STORAGE_KEY = 'contacts_table_custom_columns'
export const CONTACT_CHANNELS: ContactChannelFilter[] = ['whatsapp', 'instagram', 'messenger', 'telegram']
export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const

export type ContactsView = 'dashboard' | 'list'
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

export function parseCustomColumns(raw: string | null): string[] {
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function readCustomColumns(): string[] {
  try {
    return parseCustomColumns(localStorage.getItem(CUSTOM_COLUMNS_STORAGE_KEY))
  } catch {
    return []
  }
}

export function contactsViewFromPath(pathname: string): ContactsView {
  return pathname.startsWith('/contacts/list') ? 'list' : 'dashboard'
}
