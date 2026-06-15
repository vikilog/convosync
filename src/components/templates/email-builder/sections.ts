import type { EmailBlock } from './types';
import { createBlock } from './blockRegistry';
import { getWorkspaceId } from '../../../lib/api';

const STORAGE_KEY = 'convosync_email_sections';

export type SavedSection = {
  id: string;
  name: string;
  blocks: EmailBlock[];
  createdAt: string;
};

function storageKey(): string {
  const ws = getWorkspaceId() ?? 'default';
  return `${STORAGE_KEY}_${ws}`;
}

export function loadSavedSections(): SavedSection[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedSection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSection(name: string, blocks: EmailBlock[]): SavedSection[] {
  const section: SavedSection = {
    id: `sec_${Date.now()}`,
    name,
    blocks: JSON.parse(JSON.stringify(blocks)) as EmailBlock[],
    createdAt: new Date().toISOString(),
  };
  const next = [...loadSavedSections(), section];
  localStorage.setItem(storageKey(), JSON.stringify(next));
  return next;
}

export function deleteSection(id: string): SavedSection[] {
  const next = loadSavedSections().filter((s) => s.id !== id);
  localStorage.setItem(storageKey(), JSON.stringify(next));
  return next;
}

export const BUILTIN_SECTIONS: { name: string; blocks: EmailBlock[] }[] = [
  {
    name: 'Hero + CTA',
    blocks: (() => {
      const h = createBlock('header');
      h.props.text = 'Big announcement';
      const t = createBlock('text');
      const b = createBlock('button');
      return [h, t, b];
    })(),
  },
  {
    name: 'Social proof',
    blocks: (() => {
      const t = createBlock('text');
      t.props.content = '"ConvoSync helped us 3× our reply rate." — Happy Customer';
      t.props.align = 'center';
      return [t, createBlock('divider')];
    })(),
  },
];
