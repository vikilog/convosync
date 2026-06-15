import { ExternalLink, FileSpreadsheet, Loader2 } from 'lucide-react';
import type { SpreadsheetSummary, WorksheetInfo } from './types';
import { formatDate, formatNumber } from './utils';

type SheetsPreviewProps = {
  sheet: SpreadsheetSummary | null;
  title: string | null;
  worksheets: WorksheetInfo[];
  activeSheetTitle: string | null;
  previewValues: unknown[][];
  loading: boolean;
  empty: boolean;
  onTabChange: (title: string) => void;
};

export function SheetsPreview({
  sheet,
  title,
  worksheets,
  activeSheetTitle,
  previewValues,
  loading,
  empty,
  onTabChange,
}: SheetsPreviewProps) {
  if (empty || !sheet) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <FileSpreadsheet className="w-16 h-16 text-[#CBD5E1] mb-4" />
        <h3 className="text-base font-semibold text-[#0F172A]">Select a spreadsheet</h3>
        <p className="text-sm text-[#64748B] mt-1 max-w-xs">
          Click any sheet from the list to preview data and details
        </p>
      </div>
    );
  }

  const displayTitle = title ?? sheet.name ?? 'Spreadsheet';
  const openUrl = sheet.webViewLink;

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="h-[55%] min-h-[200px] shrink-0 overflow-hidden border-b border-[#E2E8F0] bg-[#1E293B] flex flex-col">
        {openUrl ? (
          <iframe
            title={displayTitle}
            src={openUrl}
            className="w-full flex-1 border-0 bg-white"
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-auto bg-white">
            {worksheets.length > 0 && (
              <div className="px-3 py-2 border-b border-[#E2E8F0] flex gap-1 overflow-x-auto bg-[#F8FAFC] shrink-0">
                {worksheets.map((ws) => (
                  <button
                    key={ws.sheetId ?? ws.title}
                    type="button"
                    onClick={() => ws.title && onTabChange(ws.title)}
                    className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                      activeSheetTitle === ws.title
                        ? 'bg-white text-[#16A34A] shadow-sm'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {ws.title ?? 'Sheet'}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 overflow-auto h-full">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-[#64748B]">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading preview…
                </div>
              ) : previewValues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#64748B]">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-sm">This worksheet is empty.</p>
                </div>
              ) : (
                <table className="w-full text-xs border-collapse min-w-[480px]">
                  <tbody>
                    {previewValues.map((row, ri) => (
                      <tr key={ri} className={ri === 0 ? 'bg-[#F8FAFC] font-semibold' : ''}>
                        {(row as unknown[]).map((cell, ci) => (
                          <td
                            key={ci}
                            className="border border-[#E2E8F0] px-2 py-1.5 text-[#0F172A] max-w-[200px] truncate"
                          >
                            {cell == null ? '' : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[#0F172A] break-words">{displayTitle}</h2>
              <span className="inline-block mt-2 text-sm font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Google Sheet
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-5">
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Owner</dt>
              <dd className="font-medium text-[#0F172A] mt-0.5 truncate">{sheet.owner ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Rows</dt>
              <dd className="font-medium text-[#0F172A] mt-0.5">{formatNumber(sheet.rowCount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Modified</dt>
              <dd className="font-medium text-[#0F172A] mt-0.5">{formatDate(sheet.modifiedTime)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Created</dt>
              <dd className="font-medium text-[#0F172A] mt-0.5">{formatDate(sheet.createdTime)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Worksheets</dt>
              <dd className="font-medium text-[#0F172A] mt-0.5">{sheet.worksheetCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Status</dt>
              <dd className="font-medium text-[#0F172A] mt-0.5">{sheet.starred ? 'Starred' : sheet.status}</dd>
            </div>
          </dl>

          {openUrl && (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Sheets
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
