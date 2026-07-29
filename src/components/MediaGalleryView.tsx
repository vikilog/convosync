import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Cloud,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { api } from '../lib/api';

type MediaScope = 'customer' | 'partner' | 'both';
type MediaType = 'image' | 'pdf' | 'video' | 'document';

type MediaAsset = {
  id: string;
  type: MediaType;
  title: string;
  description: string;
  filename: string;
  url: string;
  tags: string[];
  usage: string[];
  scope: MediaScope;
  isActive: boolean;
  mimeType?: string | null;
  createdAt: string;
};

const ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,.pdf,.doc,.docx';
const MAX_BYTES = 16 * 1024 * 1024;

function mapAsset(raw: Record<string, unknown>): MediaAsset {
  const typeRaw = String(raw.type ?? 'document');
  const type: MediaType =
    typeRaw === 'image' || typeRaw === 'pdf' || typeRaw === 'video' || typeRaw === 'document'
      ? typeRaw
      : 'document';
  const scopeRaw = String(raw.scope ?? 'customer');
  const scope: MediaScope =
    scopeRaw === 'partner' || scopeRaw === 'both' ? scopeRaw : 'customer';
  return {
    id: String(raw.id),
    type,
    title: String(raw.title),
    description: String(raw.description ?? ''),
    filename: String(raw.filename ?? ''),
    url: String(raw.url ?? ''),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    usage: Array.isArray(raw.usage) ? raw.usage.map(String) : ['agent'],
    scope,
    isActive: raw.isActive !== false,
    mimeType: raw.mimeType ? String(raw.mimeType) : null,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_ICON: Record<MediaType, React.ReactNode> = {
  image: <ImageIcon className="w-5 h-5" aria-hidden />,
  pdf: <FileText className="w-5 h-5" aria-hidden />,
  video: <Video className="w-5 h-5" aria-hidden />,
  document: <FileText className="w-5 h-5" aria-hidden />,
};

function isAllowedFile(file: File): boolean {
  if (file.size > MAX_BYTES) return false;
  if (file.type.startsWith('image/') || file.type.startsWith('video/')) return true;
  if (file.type === 'application/pdf') return true;
  return /\.(pdf|doc|docx)$/i.test(file.name);
}

export const MediaGalleryView: React.FC = () => {
  const titleId = useId();
  const descId = useId();
  const scopeId = useId();
  const usageId = useId();
  const tagsId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<MediaScope>('customer');
  const [usage, setUsage] = useState('agent');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await api.getMediaGallery();
      setItems((raw as Record<string, unknown>[]).map(mapAsset));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Auth-fetch image thumbnails for gallery cards
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    const imageItems = items.filter((i) => i.type === 'image');

    void (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        imageItems.map(async (item) => {
          try {
            const blob = await api.fetchMediaGalleryFile(item.id);
            if (cancelled || !blob.type.startsWith('image/')) return;
            const url = URL.createObjectURL(blob);
            created.push(url);
            next[item.id] = url;
          } catch {
            /* keep icon fallback */
          }
        })
      );
      if (!cancelled) setThumbnails(next);
    })();

    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [items]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setScope('customer');
    setUsage('agent');
    setTags('');
    setFile(null);
    setError(null);
    setDragOver(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const pickFile = (incoming: File | null | undefined) => {
    if (!incoming) return;
    if (!isAllowedFile(incoming)) {
      setError(
        incoming.size > MAX_BYTES
          ? 'File must be 16 MB or smaller'
          : 'Use an image, PDF, or Word document'
      );
      return;
    }
    setError(null);
    setFile(incoming);
    if (!title.trim()) {
      setTitle(incoming.name.replace(/\.[^.]+$/, '').slice(0, 200));
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !file) {
      setError('Title, description, and file are required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createMediaGalleryItem({
        title: title.trim(),
        description: description.trim(),
        scope,
        usage: usage
          .split(',')
          .map((u) => u.trim())
          .filter(Boolean),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        file,
      });
      setShowAdd(false);
      resetForm();
      setToast('Uploaded to S3 and saved in gallery');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item: MediaAsset) => {
    try {
      await api.updateMediaGalleryItem(item.id, { isActive: !item.isActive });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i))
      );
      setToast(item.isActive ? 'Media deactivated' : 'Media activated');
    } catch {
      setToast('Could not update media');
    }
  };

  const handleDelete = async (item: MediaAsset) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try {
      await api.deleteMediaGalleryItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setToast('Media deleted');
    } catch {
      setToast('Could not delete media');
    }
  };

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
      {toast && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 bg-primary text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg motion-safe:transition-opacity"
        >
          {toast}
        </div>
      )}

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight mb-4">
          Media Gallery
        </h1>
        <div className="flex flex-row items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <label htmlFor="media-search" className="sr-only">
              Search media
            </label>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]"
              aria-hidden
            />
            <input
              id="media-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description"
              className="w-full min-h-11 pl-10 pr-3 py-2.5 border border-black/10 rounded-xl text-base sm:text-sm text-[#111827] bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors duration-200"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="inline-flex items-center justify-center gap-2 shrink-0 min-h-11 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Add media
          </button>
        </div>
      </header>

      <p className="text-sm text-[#64748B] mb-4">
        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-surface-muted border border-black/5 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-black/10 rounded-2xl bg-surface">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Cloud className="w-8 h-8 text-primary" aria-hidden />
          </div>
          <p className="text-base font-semibold text-[#111827]">No media yet</p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="mt-5 min-h-11 px-5 py-2.5 rounded-xl text-sm font-bold text-primary border border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors duration-200"
          >
            Upload first file
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="flex flex-col bg-surface border border-black/5 rounded-2xl overflow-hidden motion-safe:transition-colors duration-200 hover:border-primary/30"
            >
              <div className="h-36 bg-gradient-to-br from-primary/10 to-surface-muted text-primary overflow-hidden">
                {item.type === 'image' && thumbnails[item.id] ? (
                  <img
                    src={thumbnails[item.id]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {TYPE_ICON[item.type]}
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1 gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-[#111827] leading-snug line-clamp-2">
                    {item.title}
                  </h2>
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Off'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-muted text-[#475569] uppercase">
                    {item.type}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-muted text-[#475569] capitalize">
                    {item.scope}
                  </span>
                  {item.usage.map((u) => (
                    <span
                      key={u}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {u}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-[#94A3B8] truncate" title={item.filename}>
                  {item.filename}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void toggleActive(item)}
                    className="min-h-10 text-xs font-bold text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item)}
                    className="inline-flex items-center gap-1 min-h-10 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-upload-title"
        >
          <div className="bg-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border border-black/5 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-black/5 shrink-0">
              <div>
                <h2 id="media-upload-title" className="text-base font-bold text-[#111827]">
                  Upload to S3
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Files are stored in your AWS bucket, then indexed for agents.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  resetForm();
                }}
                aria-label="Close upload dialog"
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-[#64748B] hover:bg-surface-muted cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileRef.current?.click();
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
                className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer motion-safe:transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  dragOver
                    ? 'border-primary bg-primary/10'
                    : 'border-black/10 hover:border-primary hover:bg-primary/5'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT}
                  className="sr-only"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={file ? `Preview of ${file.name}` : 'Selected image preview'}
                    className="mx-auto max-h-36 rounded-xl object-contain mb-3"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" aria-hidden />
                  </div>
                )}
                <p className="text-sm font-semibold text-[#111827]">
                  {file ? file.name : 'Drag & drop or click to browse'}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  {file
                    ? `${formatBytes(file.size)} · Will upload to S3`
                    : 'Images, PDF, DOC · max 16 MB'}
                </p>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden />
                    Remove file
                  </button>
                )}
              </div>

              <div>
                <label htmlFor={titleId} className="block text-sm font-bold text-[#111827]">
                  Title
                </label>
                <input
                  id={titleId}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full min-h-11 px-3 py-2 border border-black/10 rounded-xl text-base sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Price list PDF"
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor={descId} className="block text-sm font-bold text-[#111827]">
                  Description
                </label>
                <textarea
                  id={descId}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="When should this be sent? e.g. customer asks for pricing"
                  className="mt-1.5 w-full px-3 py-2.5 border border-black/10 rounded-xl text-base sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={scopeId} className="block text-sm font-bold text-[#111827]">
                    Scope
                  </label>
                  <select
                    id={scopeId}
                    value={scope}
                    onChange={(e) => setScope(e.target.value as MediaScope)}
                    className="mt-1.5 w-full min-h-11 px-3 py-2 border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-surface cursor-pointer"
                  >
                    <option value="customer">Customer</option>
                    <option value="partner">Partner</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={usageId} className="block text-sm font-bold text-[#111827]">
                    Usage
                  </label>
                  <input
                    id={usageId}
                    value={usage}
                    onChange={(e) => setUsage(e.target.value)}
                    className="mt-1.5 w-full min-h-11 px-3 py-2 border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="agent, catalog"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={tagsId} className="block text-sm font-bold text-[#111827]">
                  Tags
                </label>
                <input
                  id={tagsId}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1.5 w-full min-h-11 px-3 py-2 border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="pricing, brochure"
                  autoComplete="off"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 px-5 sm:px-6 py-4 border-t border-black/5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  resetForm();
                }}
                className="min-h-11 px-4 py-2 text-sm font-bold text-[#64748B] hover:text-[#111827] cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !file}
                onClick={() => void handleCreate()}
                className="inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Uploading to S3…
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" aria-hidden />
                    Upload to S3
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
