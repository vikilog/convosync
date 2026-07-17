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

/** Minimal CSV: question,answer header (quoted fields ok). */
function fromCsv(text: string): FaqPair[] | null {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return null;

  const splitCsv = (line: string): string[] => {
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
    return cells.map((c) => c.trim());
  };

  const heads = splitCsv(lines[0]).map((h) => h.toLowerCase().replace(/^"|"$/g, ''));
  const qi = heads.findIndex((h) => h === 'question' || h === 'q');
  const ai = heads.findIndex((h) => h === 'answer' || h === 'a');
  if (qi < 0 || ai < 0) return null;

  const out: FaqPair[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line).map((c) => c.replace(/^"|"$/g, ''));
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
