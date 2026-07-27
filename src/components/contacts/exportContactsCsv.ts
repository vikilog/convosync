import type { Contact } from '../../types';

export type ExportColumnId = 'name' | 'phone' | 'email' | 'source' | 'tags';

export type ExportColumnDef = {
  id: ExportColumnId;
  label: string;
  /** Default checked in the export sheet */
  defaultOn: boolean;
};

export const EXPORT_COLUMNS: ExportColumnDef[] = [
  { id: 'name', label: 'Name', defaultOn: true },
  { id: 'phone', label: 'Phone', defaultOn: true },
  { id: 'email', label: 'Email', defaultOn: true },
  { id: 'source', label: 'Source', defaultOn: true },
  { id: 'tags', label: 'Tags', defaultOn: true },
];

export function defaultExportColumnIds(): ExportColumnId[] {
  return EXPORT_COLUMNS.filter((c) => c.defaultOn).map((c) => c.id);
}

function cellValue(contact: Contact, id: ExportColumnId): string {
  switch (id) {
    case 'name':
      return contact.name;
    case 'phone':
      return contact.phone;
    case 'email':
      return contact.email ?? '';
    case 'source':
      return contact.source === '—' ? '' : contact.source;
    case 'tags':
      return contact.tags.join(';');
    default:
      return '';
  }
}

function csvEscape(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

/** Build CSV for selected columns in EXPORT_COLUMNS order (stable header order). */
export function buildContactsCsv(contacts: Contact[], columnIds: ExportColumnId[]): string {
  const cols = EXPORT_COLUMNS.filter((c) => columnIds.includes(c.id));
  if (cols.length === 0) return '';
  const header = cols.map((c) => c.id).join(',');
  const rows = contacts.map((contact) =>
    cols.map((c) => csvEscape(cellValue(contact, c.id))).join(',')
  );
  return [header, ...rows].join('\n');
}
