import { Plus, Trash2 } from 'lucide-react';
import type { WebhookResponseMapping } from '../types';

type HeaderRow = { key: string; value: string };

type Props = {
  local: Record<string, unknown>;
  patch: (key: string, value: unknown) => void;
};

function mappingsToRows(mappings: unknown): WebhookResponseMapping[] {
  if (!Array.isArray(mappings)) return [];
  return mappings
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      return {
        jsonPath: String(r.jsonPath ?? ''),
        attributeKey: String(r.attributeKey ?? ''),
      };
    })
    .filter(Boolean) as WebhookResponseMapping[];
}

function rowsToMappings(rows: WebhookResponseMapping[]): WebhookResponseMapping[] {
  return rows.map((row) => ({
    jsonPath: row.jsonPath,
    attributeKey: row.attributeKey,
  }));
}

function headersToRows(headers: unknown): HeaderRow[] {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return [{ key: '', value: '' }];
  }
  const entries = Object.entries(headers as Record<string, string>);
  if (entries.length === 0) return [{ key: '', value: '' }];
  return entries.map(([key, value]) => ({ key, value: String(value) }));
}

function rowsToHeaders(rows: HeaderRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key) out[key] = row.value;
  }
  return out;
}

function bodyToText(body: unknown): string {
  if (body == null) return '';
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && Object.keys(body as object).length === 0) return '';
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}

export function WebhookConfig({ local, patch }: Props) {
  const method = String(local.method ?? 'POST');
  const headerRows = headersToRows(local.headers);
  const bodyText = bodyToText(local.body);
  const mappingRows = mappingsToRows(local.responseMappings);
  const displayMappings =
    mappingRows.length > 0 ? mappingRows : [{ jsonPath: '', attributeKey: '' }];

  const updateHeaders = (rows: HeaderRow[]) => {
    patch('headers', rowsToHeaders(rows));
  };

  const updateMappings = (rows: WebhookResponseMapping[]) => {
    patch('responseMappings', rowsToMappings(rows));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Request name
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          value={String(local.name ?? '')}
          onChange={(e) => patch('name', e.target.value)}
          placeholder="e.g. Notify CRM"
        />
        <span className="mt-1 block text-xs font-normal text-gray-400">
          Shown on the journey canvas and contact journey timeline.
        </span>
      </label>

      <label className="block text-sm font-semibold text-gray-700">
        Method
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          value={method}
          onChange={(e) => patch('method', e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </label>

      <label className="block text-sm font-semibold text-gray-700">
        URL
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono text-xs"
          value={String(local.url ?? '')}
          onChange={(e) => patch('url', e.target.value)}
          placeholder="https://api.example.com/hook"
        />
        <span className="mt-1 block text-xs font-normal text-gray-400">
          Use {'{{contact.name}}'}, {'{{contact.phone}}'}, {'{{contact.email}}'} in URL, headers, or body.
        </span>
      </label>

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-700">Headers</p>
          <button
            type="button"
            onClick={() => updateHeaders([...headerRows, { key: '', value: '' }])}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-gray-600 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add header
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {headerRows.map((row, index) => (
            <div key={index} className="flex items-start gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono text-xs"
                value={row.key}
                onChange={(e) => {
                  const next = headerRows.map((r, i) =>
                    i === index ? { ...r, key: e.target.value } : r
                  );
                  updateHeaders(next);
                }}
                placeholder="Header name"
              />
              <input
                className="min-w-0 flex-[1.5] rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono text-xs"
                value={row.value}
                onChange={(e) => {
                  const next = headerRows.map((r, i) =>
                    i === index ? { ...r, value: e.target.value } : r
                  );
                  updateHeaders(next);
                }}
                placeholder="Header value"
              />
              <button
                type="button"
                onClick={() => {
                  const next = headerRows.filter((_, i) => i !== index);
                  updateHeaders(next.length ? next : [{ key: '', value: '' }]);
                }}
                className="rounded-lg border border-slate-200 p-1.5 text-gray-400 hover:border-rose-200 hover:text-rose-600"
                title="Remove header"
                disabled={headerRows.length === 1 && !row.key && !row.value}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {method === 'POST' && headerRows.every((r) => !r.key.toLowerCase().includes('content-type')) ? (
          <button
            type="button"
            onClick={() =>
              updateHeaders([
                ...headerRows.filter((r) => r.key.trim() || r.value.trim()),
                { key: 'Content-Type', value: 'application/json' },
              ])
            }
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            + Add Content-Type: application/json
          </button>
        ) : null}
      </div>

      {method === 'POST' && (
        <label className="block text-sm font-semibold text-gray-700">
          Request body
          <textarea
            rows={6}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono text-xs"
            value={bodyText}
            onChange={(e) => patch('body', e.target.value)}
            placeholder={'{\n  "name": "{{contact.name}}",\n  "phone": "{{contact.phone}}"\n}'}
          />
          <span className="mt-1 block text-xs font-normal text-gray-400">
            JSON or plain text. Variables are replaced at runtime.
          </span>
        </label>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">Save response to contact</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Extract API fields into customized attributes for later journey steps.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateMappings([...displayMappings, { jsonPath: '', attributeKey: '' }])
            }
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-gray-600 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add field
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {displayMappings.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
              <div>
                {index === 0 ? (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    JSON path
                  </p>
                ) : null}
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-mono text-xs"
                  value={row.jsonPath}
                  onChange={(e) => {
                    const next = displayMappings.map((r, i) =>
                      i === index ? { ...r, jsonPath: e.target.value } : r
                    );
                    updateMappings(next);
                  }}
                  placeholder="data.accountId"
                />
              </div>
              <div>
                {index === 0 ? (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Attribute name
                  </p>
                ) : null}
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                  value={row.attributeKey}
                  onChange={(e) => {
                    const next = displayMappings.map((r, i) =>
                      i === index ? { ...r, attributeKey: e.target.value } : r
                    );
                    updateMappings(next);
                  }}
                  placeholder="accountId"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = displayMappings.filter((_, i) => i !== index);
                  updateMappings(next.length ? next : [{ jsonPath: '', attributeKey: '' }]);
                }}
                className="mt-5 rounded-lg border border-slate-200 bg-white p-1.5 text-gray-400 hover:border-rose-200 hover:text-rose-600"
                title="Remove mapping"
                disabled={
                  displayMappings.length === 1 && !row.jsonPath && !row.attributeKey
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-gray-500">
          Use dot notation for nested JSON, e.g.{' '}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">user.tier</code> or{' '}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">items[0].sku</code>.
          Later steps can use{' '}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">
            {'{{contact.accountId}}'}
          </code>{' '}
          (same name as attribute).
        </p>
      </div>
    </div>
  );
}
