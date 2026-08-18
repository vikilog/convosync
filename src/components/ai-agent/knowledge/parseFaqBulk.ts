export type FaqPair = { question: string; answer: string };

function flush(out: FaqPair[], q: string, a: string) {
  const question = q.trim();
  const answer = a.trim();
  if (question && answer) out.push({ question, answer });
}

/** JSON: [{question,answer}] or {faqs:[...]} with q/a aliases. */
function fromJson(text: string): FaqPair[] | null {
  try {
    const raw = JSON.parse(text) as unknown;
    const list = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object' && Array.isArray((raw as { faqs?: unknown }).faqs)
        ? (raw as { faqs: unknown[] }).faqs
        : null;
    if (!list) return null;
    const out: FaqPair[] = [];
    for (const row of list) {
      if (!row || typeof row !== 'object') continue;
      const o = row as Record<string, unknown>;
      const question = String(o.question ?? o.q ?? '').trim();
      const answer = String(o.answer ?? o.a ?? '').trim();
      if (question && answer) out.push({ question, answer });
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

/**
 * Splits CSV text into rows of trimmed cells in a single pass, honoring
 * quoted fields per RFC 4180 — including ones that contain an embedded
 * newline (e.g. a multi-line answer exported from Excel/Sheets). Splitting
 * on newlines before parsing quotes (the old approach) tears such a field
 * apart before the quote-aware logic ever sees it.
 */
function parseCsvRows(text: string): string[][] {
  const normalized = text.replace(/\r\n?/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQ) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      row.push(cur);
      cur = '';
    } else if (ch === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += ch;
    }
  }
  row.push(cur);
  rows.push(row);

  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.length > 1 || r[0] !== '');
}

/** Minimal CSV: question,answer header (quoted fields ok, including multi-line ones). */
function fromCsv(text: string): FaqPair[] | null {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return null;

  const heads = rows[0].map((h) => h.toLowerCase());
  const qi = heads.findIndex((h) => h === 'question' || h === 'q');
  const ai = heads.findIndex((h) => h === 'answer' || h === 'a');
  if (qi < 0 || ai < 0) return null;

  const out: FaqPair[] = [];
  for (const cells of rows.slice(1)) {
    flush(out, cells[qi] ?? '', cells[ai] ?? '');
  }
  return out.length ? out : null;
}

const Q_RE = /^(?:q(?:uestion)?|faq)\s*[:.\-)]\s*(.*)$/i;
const A_RE = /^(?:a(?:nswer)?)\s*[:.\-)]\s*(.*)$/i;

/** Q: / A: (or Question: / Answer:) labeled blocks. */
function fromLabeled(text: string): FaqPair[] {
  const out: FaqPair[] = [];
  let q = '';
  let a = '';
  let field: 'q' | 'a' | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const qm = line.match(Q_RE);
    if (qm) {
      flush(out, q, a);
      q = qm[1] ?? '';
      a = '';
      field = 'q';
      continue;
    }
    const am = line.match(A_RE);
    if (am) {
      a = am[1] ?? '';
      field = 'a';
      continue;
    }
    if (field === 'q') q = q ? `${q}\n${line}` : line;
    else if (field === 'a') a = a ? `${a}\n${line}` : line;
  }
  flush(out, q, a);
  return out;
}

/**
 * Blank-line blocks: first line = question, remaining lines = answer.
 * Also accepts "1. question" numbering on the first line.
 */
function fromBlocks(text: string): FaqPair[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const out: FaqPair[] = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const question = lines[0].replace(/^\d+[.)]\s*/, '');
    const answer = lines.slice(1).join('\n');
    flush(out, question, answer);
  }
  return out;
}

/** Parse pasted or file FAQ text into Q&A pairs. */
export function parseFaqBulk(text: string): FaqPair[] {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const json = fromJson(trimmed);
    if (json) return json;
  }

  const csv = fromCsv(trimmed);
  if (csv) return csv;

  const labeled = fromLabeled(trimmed);
  if (labeled.length) return labeled;

  return fromBlocks(trimmed);
}
