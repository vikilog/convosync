export type DataColumnType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'phone' | 'email';

export const DATA_COLUMN_TYPE_OPTIONS: { value: DataColumnType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'select', label: 'Choice list' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
];

export type DataTableColumn = {
  id: string;
  key: string;
  label: string;
  type: DataColumnType;
  options?: string[];
};

export type DataTableRecord = {
  id: string;
  name: string;
  description: string | null;
  rowCount: number;
  columns: DataTableColumn[];
  createdAt: string;
  updatedAt: string;
};

export type DataTableRow = {
  id: string;
  data: Record<string, unknown>;
  source: 'manual' | 'flow';
  createdAt: string;
  updatedAt: string;
};

export type ConnectedFlow = {
  id: string;
  name: string;
  fieldMap: Record<string, string>;
};

export type AvailableFlow = {
  id: string;
  name: string;
  connectedElsewhere: boolean;
};
