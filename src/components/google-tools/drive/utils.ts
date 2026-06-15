import type { DriveFile, DriveSortDir, DriveSortKey } from './types';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function fileTypeLabel(file: DriveFile): string {
  if (file.isFolder) return 'Folder';
  const mime = file.mimeType ?? '';
  if (mime.includes('spreadsheet')) return 'Sheet';
  if (mime.includes('document')) return 'Doc';
  if (mime.includes('presentation')) return 'Slides';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('image')) return 'Image';
  if (mime.includes('video')) return 'Video';
  return 'File';
}

const GOOGLE_APP_OPEN: Record<string, (id: string) => string> = {
  'application/vnd.google-apps.folder': (id) => `https://drive.google.com/drive/folders/${id}`,
  'application/vnd.google-apps.document': (id) => `https://docs.google.com/document/d/${id}/edit`,
  'application/vnd.google-apps.spreadsheet': (id) => `https://docs.google.com/spreadsheets/d/${id}/edit`,
  'application/vnd.google-apps.presentation': (id) => `https://docs.google.com/presentation/d/${id}/edit`,
  'application/vnd.google-apps.form': (id) => `https://docs.google.com/forms/d/${id}/edit`,
  'application/vnd.google-apps.drawing': (id) => `https://docs.google.com/drawings/d/${id}/edit`,
  'application/vnd.google-apps.map': (id) => `https://www.google.com/maps/d/edit?mid=${id}`,
  'application/vnd.google-apps.site': (id) => `https://sites.google.com/view/${id}`,
};

/** Open URL in the correct Google app or Drive viewer for the file type. */
export function getDriveOpenUrl(file: DriveFile): string {
  if (file.webViewLink) return file.webViewLink;
  const mime = file.mimeType ?? '';
  const builder = GOOGLE_APP_OPEN[mime];
  if (builder && file.id) return builder(file.id);
  return `https://drive.google.com/file/d/${file.id}/view`;
}

export function base64ToBlobUrl(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

/** Download / export URL appropriate for the file type. */
export function getDriveDownloadUrl(file: DriveFile): string | null {
  if (file.isFolder || !file.id) return null;
  if (file.webContentLink) return file.webContentLink;
  const mime = file.mimeType ?? '';
  if (mime === 'application/vnd.google-apps.document') {
    return `https://docs.google.com/document/d/${file.id}/export?format=pdf`;
  }
  if (mime === 'application/vnd.google-apps.spreadsheet') {
    return `https://docs.google.com/spreadsheets/d/${file.id}/export?format=xlsx`;
  }
  if (mime === 'application/vnd.google-apps.presentation') {
    return `https://docs.google.com/presentation/d/${file.id}/export?format=pptx`;
  }
  if (mime === 'application/vnd.google-apps.drawing') {
    return `https://docs.google.com/drawings/d/${file.id}/export/png`;
  }
  return `https://drive.google.com/uc?export=download&id=${file.id}`;
}

export function openDriveFile(file: DriveFile): void {
  if (file.isFolder) {
    window.location.href = getDriveOpenUrl(file);
    return;
  }
  window.open(getDriveOpenUrl(file), '_blank', 'noopener,noreferrer');
}

export function sortFiles(files: DriveFile[], key: DriveSortKey, dir: DriveSortDir): DriveFile[] {
  const sorted = [...files].sort((a, b) => {
    if (key === 'name') return (a.name ?? '').localeCompare(b.name ?? '');
    if (key === 'size') return (a.size ?? 0) - (b.size ?? 0);
    const at = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
    const bt = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
    return at - bt;
  });
  return dir === 'asc' ? sorted : sorted.reverse();
}
