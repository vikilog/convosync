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

/**
 * Defuses CSV/formula injection: a cell starting with =, +, -, @, or a tab
 * is interpreted as a formula by Excel/Sheets on open, even when quoted —
 * quoting alone does not stop it. Prefixing with a single quote forces the
 * cell to render as text instead. Contact fields (name, tags, source) can
 * contain attacker-controlled text from an external channel or a prior
 * import, so this runs on every export regardless of source.
 */
function defuseFormulaInjection(v: string): string {
  if (/^[=+\-@\t]/.test(v)) return `'${v}`;
  return v;
}

function csvEscape(v: string): string {
  const safe = defuseFormulaInjection(v);
  return `"${safe.replace(/"/g, '""')}"`;
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
