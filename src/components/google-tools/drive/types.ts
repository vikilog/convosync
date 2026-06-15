export type DriveIntegration = {
  connectionId: string;
  connectionEmail: string | null;
  lastSyncAt: string | null;
};

export type DriveView = 'my' | 'shared' | 'recent' | 'starred' | 'folders';

export type DriveFile = {
  id: string;
  name: string | null;
  mimeType: string | null;
  modifiedTime: string | null;
  createdTime: string | null;
  parents: string[];
  owner: string | null;
  size: number | null;
  starred: boolean;
  shared: boolean;
  webViewLink: string | null;
  webContentLink: string | null;
  iconLink: string | null;
  thumbnailLink: string | null;
  isFolder: boolean;
};

export type DriveSortKey = 'name' | 'modified' | 'size';
export type DriveSortDir = 'asc' | 'desc';
export type LayoutMode = 'grid' | 'list';
