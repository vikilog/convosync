import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Loader2, Plus } from 'lucide-react';
import { pathForTab } from '../../../routes';
import { GoogleToolsPageHeader } from '../shared/GoogleToolsPageHeader';
import { GoogleToolsSplitLayout } from '../shared/GoogleToolsSplitLayout';
import { PillSubTabs } from '../shared/PillSubTabs';
import { SheetsBanner, SheetsLoadingState } from './SheetsHeader';
import { SheetsList } from './SheetsList';
import { SheetsPreview } from './SheetsPreview';
import { useGoogleSheets } from './useGoogleSheets';
import { exportPreviewCsv } from './utils';

export function GoogleSheetsView() {
  const navigate = useNavigate();
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const sheets = useGoogleSheets();

  if (!sheets.loading && !sheets.integration) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="max-w-md text-center rounded-xl border border-[#E2E8F0] bg-white px-8 py-10 shadow-sm">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-[#16A34A] mb-4" />
          <h2 className="text-lg font-bold text-[#0F172A]">Google Sheets not connected</h2>
          <p className="text-sm text-[#64748B] mt-2">Connect Sheets from Integrations → Google.</p>
          <button
            type="button"
            onClick={() => navigate(`${pathForTab('integrations')}?channel=google`)}
            className="mt-5 px-4 py-2.5 rounded-lg bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803D]"
          >
            Go to Integrations
          </button>
        </div>
      </div>
    );
  }

  if (sheets.loading) return <SheetsLoadingState label="Loading Google Sheets…" />;

  const handleExport = () => {
    if (sheets.previewValues.length === 0) return;
    const csv = exportPreviewCsv(sheets.previewValues);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheets.selected?.name ?? 'sheet'}-preview.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GoogleToolsSplitLayout
      header={
        <GoogleToolsPageHeader
          toolLabel="Google Sheets"
          email={sheets.integration?.connectionEmail ?? null}
          avatarClassName="bg-emerald-100 text-emerald-700"
          lastSyncAt={sheets.integration?.lastSyncAt ?? null}
          syncing={sheets.syncing}
          onSync={() => void sheets.handleSync()}
          onRefresh={() => void sheets.handleRefresh()}
          actions={
            <>
              {sheets.selected?.webViewLink && (
                <a
                  href={sheets.selected.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center h-9 px-3 rounded-lg text-sm font-semibold border border-[#E2E8F0] text-[#0F172A] bg-white hover:bg-[#F8FAFC]"
                >
                  Open in Sheets
                </a>
              )}
              <button
                type="button"
                onClick={handleExport}
                className="hidden sm:inline-flex h-9 px-3 rounded-lg text-sm font-semibold border border-[#E2E8F0] text-[#0F172A] bg-white hover:bg-[#F8FAFC]"
              >
                Export CSV
              </button>
              <button
                type="button"
                title="Create new spreadsheet"
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Sheet
              </button>
            </>
          }
        />
      }
      subTabs={
        <PillSubTabs
          activeClassName="text-[#16A34A]"
          tabs={[
            {
              id: 'connected',
              label: 'Connected Sheets',
              active: sheets.sidebarView === 'connected',
              onClick: () => sheets.setSidebarView('connected'),
            },
            {
              id: 'recent',
              label: 'Recent Sheets',
              active: sheets.sidebarView === 'recent',
              onClick: () => sheets.setSidebarView('recent'),
            },
            {
              id: 'starred',
              label: 'Starred',
              active: sheets.sidebarView === 'starred',
              onClick: () => sheets.setSidebarView('starred'),
            },
          ]}
        />
      }
      banner={<SheetsBanner message={sheets.message} />}
      leftPanel={
        <SheetsList
          spreadsheets={sheets.spreadsheets}
          selectedId={sheets.selectedId}
          onSelect={sheets.setSelectedId}
          loading={sheets.listLoading}
          searchQuery={sheets.searchQuery}
          onSearchChange={sheets.setSearchQuery}
          sortKey={sheets.sortKey}
          sortDir={sheets.sortDir}
          onSortKeyChange={sheets.setSortKey}
          onSortDirChange={sheets.setSortDir}
          statusFilter={sheets.statusFilter}
          onStatusFilterChange={sheets.setStatusFilter}
          hasMore={sheets.hasMore}
          onLoadMore={sheets.loadMore}
          layout={layout}
          onLayoutChange={setLayout}
        />
      }
      rightPanel={
        <SheetsPreview
          sheet={sheets.selected}
          title={sheets.detailTitle}
          worksheets={sheets.worksheets}
          activeSheetTitle={sheets.activeSheetTitle}
          previewValues={sheets.previewValues}
          loading={sheets.previewLoading}
          empty={!sheets.selectedId}
          onTabChange={sheets.handleSheetTab}
        />
      }
    />
  );
}
