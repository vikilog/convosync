export type SheetsIntegration = {
  connectionId: string;
  connectionEmail: string | null;
  lastSyncAt: string | null;
};

export type SpreadsheetSummary = {
  id: string;
  name: string | null;
  owner: string | null;
  modifiedTime: string | null;
  createdTime: string | null;
  starred: boolean;
  shared: boolean;
  webViewLink: string | null;
  worksheetCount: number;
  rowCount: number;
  columnCount: number;
  status: string;
};

export type WorksheetInfo = {
  sheetId?: number;
  title?: string;
  index?: number;
  rowCount: number;
  columnCount: number;
};

export type SheetsSidebarView = 'connected' | 'recent' | 'starred';

export type SortKey = 'name' | 'modified' | 'worksheets';
export type SortDir = 'asc' | 'desc';
