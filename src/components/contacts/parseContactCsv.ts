export type ContactCsvRow = {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  tags: string[];
};

export type ContactCsvParseResult = {
  rows: ContactCsvRow[];
  /** 1-based data row numbers that were skipped (missing name/phone, etc.) */
  skipped: number[];
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === ',' && !inQ) {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim().replace(/^"|"$/g, ''));
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_-]+/g, '');
}

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return `+${digits.slice(1).replace(/\D/g, '')}`;
  const only = digits.replace(/\D/g, '');
  return only ? `+${only}` : '';
}

/**
 * CSV with header: name, phone required; email, source, tags optional.
 * Tags: semicolon or pipe separated in one cell.
 */
export function parseContactCsv(text: string): ContactCsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], skipped: [] };

  const heads = splitCsvLine(lines[0]).map(normalizeHeader);
  const nameI = heads.findIndex((h) => h === 'name' || h === 'fullname' || h === 'contactname');
  const phoneI = heads.findIndex(
    (h) => h === 'phone' || h === 'mobile' || h === 'phonenumber' || h === 'whatsapp'
  );
  if (nameI < 0 || phoneI < 0) {
    throw new Error('CSV must include name and phone columns');
  }
  const emailI = heads.findIndex((h) => h === 'email' || h === 'mail');
  const sourceI = heads.findIndex((h) => h === 'source');
  const tagsI = heads.findIndex((h) => h === 'tags' || h === 'tag' || h === 'labels');

  const rows: ContactCsvRow[] = [];
  const skipped: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const name = (cells[nameI] ?? '').trim();
    const phone = normalizePhone(cells[phoneI] ?? '');
    if (!name || phone.length < 6) {
      skipped.push(i + 1);
      continue;
    }
    const email = emailI >= 0 ? (cells[emailI] ?? '').trim() : '';
    const source = sourceI >= 0 ? (cells[sourceI] ?? '').trim() : '';
    const tagsRaw = tagsI >= 0 ? (cells[tagsI] ?? '') : '';
    const tags = tagsRaw
      .split(/[;|]/)
      .map((t) => t.trim())
      .filter(Boolean);

    rows.push({
      name,
      phone,
      ...(email ? { email } : {}),
      ...(source ? { source } : {}),
      tags,
    });
  }

  return { rows, skipped };
}
