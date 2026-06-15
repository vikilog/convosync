import { Inbox, Mail, Send, Star, Trash2, type LucideIcon } from 'lucide-react';
import type { GmailFolder } from './types';

export const GMAIL_ROW_HEIGHT = 96;

export const GMAIL_FOLDERS: {
  id: GmailFolder;
  label: string;
  icon: LucideIcon;
  query: string;
}[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, query: 'in:inbox' },
  { id: 'starred', label: 'Starred', icon: Star, query: 'is:starred' },
  { id: 'sent', label: 'Sent', icon: Send, query: 'in:sent' },
  { id: 'drafts', label: 'Drafts', icon: Mail, query: 'in:drafts' },
  { id: 'trash', label: 'Trash', icon: Trash2, query: 'in:trash' },
];

export const GMAIL_SYSTEM_LABELS = new Set([
  'UNREAD',
  'STARRED',
  'IMPORTANT',
  'SENT',
  'INBOX',
  'TRASH',
  'DRAFT',
  'SPAM',
  'CATEGORY_PERSONAL',
  'CATEGORY_SOCIAL',
  'CATEGORY_PROMOTIONS',
  'CATEGORY_UPDATES',
  'CATEGORY_FORUMS',
]);

export const GMAIL_CATEGORY_LABELS: Record<string, string> = {
  CATEGORY_PERSONAL: 'Personal',
  CATEGORY_SOCIAL: 'Social',
  CATEGORY_PROMOTIONS: 'Promotions',
  CATEGORY_UPDATES: 'Updates',
  CATEGORY_FORUMS: 'Forums',
};
