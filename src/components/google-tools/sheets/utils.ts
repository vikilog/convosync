import type { SortDir, SortKey, SpreadsheetSummary } from './types';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function sortSpreadsheets(
  items: SpreadsheetSummary[],
  key: SortKey,
  dir: SortDir
): SpreadsheetSummary[] {
  const sorted = [...items].sort((a, b) => {
    if (key === 'name') {
      return (a.name ?? '').localeCompare(b.name ?? '');
    }
    if (key === 'worksheets') {
      return a.worksheetCount - b.worksheetCount;
    }
    const at = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
    const bt = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
    return at - bt;
  });
  return dir === 'asc' ? sorted : sorted.reverse();
}

export function exportPreviewCsv(values: unknown[][]): string {
  return values
    .map((row) =>
      row
        .map((cell) => {
          const s = cell == null ? '' : String(cell);
          return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');
}
