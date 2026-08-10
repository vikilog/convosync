import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Cloud,
  FileText,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { api } from '../lib/api';
import {
  mediaGalleryAllowedByPlan,
  planFeaturesFromSubscription,
} from '../lib/planEntitlements';
import { PlanUpgradeBanner } from './PlanUpgradeBanner';

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

/** Dense tile width — caps card growth so 2 items never become half-page monsters. */
const GRID_COLS = 'repeat(auto-fill, minmax(min(100%, 200px), 220px))';

/** Treat null/undefined/"none"/whitespace as empty for display + form hydrate. */
function normalizeMediaDescription(raw: unknown): string {
  const t = String(raw ?? '').trim();
  if (!t || t.toLowerCase() === 'none') return '';
  return t;
}

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
    description: normalizeMediaDescription(raw.description),
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
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatStorageLimit(gb: number | undefined, limitBytes: number | null): string {
  if (limitBytes == null) return 'Custom';
  if (gb != null && gb > 0) return `${gb} GB`;
  return formatBytes(limitBytes);
}

function formatUsageLabel(usage: {
  usedBytes: number;
  limitBytes: number | null;
  storageGb?: number;
}): string {
  const used = formatBytes(usage.usedBytes);
  if (usage.limitBytes == null) return `${used} used (Custom storage)`;
  const limit = formatStorageLimit(usage.storageGb, usage.limitBytes);
  return `${used} of ${limit} used`;
}

function storagePct(usage: { usedBytes: number; limitBytes: number | null }): number {
  if (usage.limitBytes == null || usage.limitBytes <= 0) return 0;
  return Math.min(100, Math.max(0, (usage.usedBytes / usage.limitBytes) * 100));
}

const TYPE_ICON: Record<MediaType, React.ReactNode> = {
  image: <ImageIcon className="w-5 h-5" aria-hidden />,
  pdf: <FileText className="w-5 h-5" aria-hidden />,
  video: <Video className="w-5 h-5" aria-hidden />,
  document: <FileText className="w-5 h-5" aria-hidden />,
};

const EASE = [0.22, 1, 0.36, 1] as const;

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
  const menuRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<MediaScope>('customer');
  const [usage, setUsage] = useState('agent');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [storageUsage, setStorageUsage] = useState<{
    usedBytes: number;
    limitBytes: number | null;
    storageGb?: number;
  } | null>(null);
  const [galleryAllowed, setGalleryAllowed] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [raw, usageRes, subscription] = await Promise.all([
        api.getMediaGallery(),
        api.getMediaGalleryUsage().catch(() => null),
        api.getSubscription().catch(() => null),
      ]);
      setItems((raw as Record<string, unknown>[]).map(mapAsset));
      setStorageUsage(usageRes);
      const currentPlan = (subscription as { currentPlan?: unknown } | null)?.currentPlan;
      setGalleryAllowed(mediaGalleryAllowedByPlan(planFeaturesFromSubscription(currentPlan as never)));
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

  useEffect(() => {
    if (!openMenuId) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenuId]);

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
    setEditing(null);
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

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: MediaAsset) => {
    resetForm();
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description);
    setScope(item.scope);
    setUsage(item.usage.join(', '));
    setTags(item.tags.join(', '));
    setShowForm(true);
    setOpenMenuId(null);
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

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    if (!editing && !file) {
      setError('Title, description, and file are required');
      return;
    }
    setSubmitting(true);
    setError(null);
    const usageList = usage
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      if (editing) {
        await api.updateMediaGalleryItemForm(editing.id, {
          title: title.trim(),
          description: description.trim(),
          scope,
          usage: usageList,
          tags: tagList,
          file,
        });
        setShowForm(false);
        resetForm();
        setToast(file ? 'Image replaced and details saved' : 'Media details saved');
      } else {
        await api.createMediaGalleryItem({
          title: title.trim(),
          description: description.trim(),
          scope,
          usage: usageList,
          tags: tagList,
          file: file!,
        });
        setShowForm(false);
        resetForm();
        setToast('Uploaded to S3 and saved in gallery');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : editing ? 'Update failed' : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item: MediaAsset) => {
    setOpenMenuId(null);
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
    setOpenMenuId(null);
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
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      i.filename.toLowerCase().includes(search.toLowerCase())
  );

  const hasSearch = search.trim().length > 0;
  const usagePercent = storageUsage ? storagePct(storageUsage) : 0;
  const countLabel =
    filtered.length === items.length
      ? `${items.length} item${items.length !== 1 ? 's' : ''}`
      : `${filtered.length} of ${items.length}`;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-surface-muted selection:bg-primary/15">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 md:px-8">
        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
              className="fixed top-6 right-6 z-50 bg-primary text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {!galleryAllowed && (
          <PlanUpgradeBanner
            message="Media Gallery storage is available on Growth plan and above."
            className="mb-4"
          />
        )}

        {/* Command bar — search, storage, add */}
        <div className="relative mb-5 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="media-search" className="sr-only">
                Search media
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="media-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, tag, or filename"
                className="w-full min-h-11 rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-base text-slate-900 outline-none ring-primary/20 placeholder:text-slate-400 transition-colors duration-200 focus:border-primary/40 focus:bg-white focus:ring-2 sm:text-sm"
              />
            </div>

            {!loading && items.length > 0 && (
              <p className="font-mono text-xs font-medium tabular-nums text-slate-500 sm:shrink-0">
                {countLabel}
              </p>
            )}

            {galleryAllowed && storageUsage && (
              <div className="min-w-0 sm:w-44 md:w-52">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <p className="truncate text-[11px] font-medium text-slate-500">
                    {formatUsageLabel(storageUsage)}
                  </p>
                  {storageUsage.limitBytes != null && (
                    <p className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">
                      {usagePercent < 1 && usagePercent > 0
                        ? '<1%'
                        : `${Math.round(usagePercent)}%`}
                    </p>
                  )}
                </div>
                {storageUsage.limitBytes != null && (
                  <div className="h-1.5 w-full overflow-hidden rounded-sm bg-black/[0.04]">
                    <motion.div
                      className="h-full origin-left rounded-sm bg-primary"
                      style={{
                        width: `${Math.max(usagePercent, usagePercent > 0 ? 1.5 : 0)}%`,
                      }}
                      initial={reduceMotion ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.45,
                        ease: EASE,
                      }}
                      role="progressbar"
                      aria-valuenow={Math.round(usagePercent)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Storage used"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={!galleryAllowed}
              onClick={openCreate}
              className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add media
            </button>
          </div>
        </div>

        {loading ? (
          <ul
            className="m-0 grid list-none gap-3 p-0"
            style={{ gridTemplateColumns: GRID_COLS }}
            aria-busy="true"
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                className="h-52 animate-pulse rounded-xl border border-black/5 bg-white"
              />
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE }}
            className="relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80"
            role="status"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(6,78,59,0.12) 1px, transparent 0)',
                backgroundSize: '18px 18px',
              }}
              aria-hidden
            />
            <div className="relative flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Cloud className="h-8 w-8" aria-hidden />
              </div>
              {hasSearch ? (
                <>
                  <p className="text-base font-semibold text-slate-900">No matches</p>
                  <p className="mt-1.5 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                    Nothing matches “{search.trim()}”. Try another title, tag, or filename.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-6 min-h-11 cursor-pointer rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-slate-900">No media yet</p>
                  <p className="mt-1.5 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                    Upload images, PDFs, or documents for agents and campaigns to reuse.
                  </p>
                  <button
                    type="button"
                    disabled={!galleryAllowed}
                    onClick={openCreate}
                    className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" aria-hidden />
                    Upload first file
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <ul
            className="m-0 grid list-none justify-start gap-3 p-0"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((item, index) => {
                const thumb = item.type === 'image' ? thumbnails[item.id] : undefined;
                const menuOpen = openMenuId === item.id;
                const metaTag =
                  item.tags[0] ??
                  (item.usage[0] ? item.usage[0] : null) ??
                  item.scope;
                return (
                  <motion.li
                    key={item.id}
                    layout={!reduceMotion}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 6, transition: { duration: 0.18 } }
                    }
                    transition={{
                      duration: reduceMotion ? 0 : 0.28,
                      delay: reduceMotion ? 0 : Math.min(index, 12) * 0.035,
                      ease: EASE,
                    }}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            y: -2,
                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
                            transition: { duration: 0.18, ease: EASE },
                          }
                    }
                    className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition-[box-shadow] duration-200 hover:ring-slate-300"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 text-primary">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary/[0.06] to-slate-50">
                          {TYPE_ICON[item.type]}
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            {item.type}
                          </span>
                        </div>
                      )}
                      <span
                        className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
                          item.isActive
                            ? 'bg-white/90 text-primary ring-1 ring-primary/15'
                            : 'bg-white/90 text-slate-500 ring-1 ring-slate-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.isActive ? 'bg-primary' : 'bg-slate-300'
                          }`}
                          aria-hidden
                        />
                        {item.isActive ? 'Active' : 'Off'}
                      </span>
                      <div
                        className="absolute right-1.5 top-1.5"
                        ref={menuOpen ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          aria-label={`Actions for ${item.title}`}
                          aria-haspopup="menu"
                          aria-expanded={menuOpen}
                          onClick={() =>
                            setOpenMenuId((id) => (id === item.id ? null : item.id))
                          }
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/90 text-slate-600 opacity-100 shadow-sm ring-1 ring-slate-200/80 transition-opacity duration-150 hover:bg-white hover:text-slate-900 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 data-[open=true]:opacity-100"
                          data-open={menuOpen}
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </button>
                        <AnimatePresence>
                          {menuOpen && (
                            <motion.div
                              role="menu"
                              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={reduceMotion ? undefined : { opacity: 0, y: -2 }}
                              transition={{
                                duration: reduceMotion ? 0 : 0.15,
                                ease: EASE,
                              }}
                              className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => openEdit(item)}
                                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
                              >
                                <Pencil className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                                Edit
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => void toggleActive(item)}
                                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
                              >
                                <Power className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                                {item.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => void handleDelete(item)}
                                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
                      <h2 className="truncate text-sm font-semibold leading-snug text-slate-900">
                        {item.title}
                      </h2>
                      {item.description ? (
                        <p className="line-clamp-1 text-xs font-medium text-slate-500">
                          {item.description}
                        </p>
                      ) : null}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                        <p
                          className="min-w-0 truncate text-[11px] font-medium text-slate-400"
                          title={item.filename}
                        >
                          {item.filename || item.type}
                        </p>
                        <span className="shrink-0 truncate rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-500 ring-1 ring-slate-200/80">
                          {metaTag}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-upload-title"
          >
            <div className="flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-black/5 bg-surface shadow-2xl sm:max-w-lg sm:rounded-2xl">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/5 px-5 py-4 sm:px-6">
                <div>
                  <h2 id="media-upload-title" className="text-base font-bold text-slate-900">
                    {editing ? 'Edit media' : 'Upload to S3'}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {editing
                      ? 'Update details or replace the file. Other fields stay editable.'
                      : 'Files are stored in your AWS bucket, then indexed for agents.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  aria-label="Close dialog"
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
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
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center motion-safe:transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-8 ${
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
                      className="mx-auto mb-3 max-h-36 rounded-xl object-contain"
                    />
                  ) : editing && editing.type === 'image' && thumbnails[editing.id] ? (
                    <img
                      src={thumbnails[editing.id]}
                      alt={`Current ${editing.title}`}
                      className="mx-auto mb-3 max-h-36 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {editing ? TYPE_ICON[editing.type] : <Upload className="h-6 w-6" aria-hidden />}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-slate-900">
                    {file
                      ? file.name
                      : editing
                        ? `Replace file (optional) · ${editing.filename}`
                        : 'Drag & drop or click to browse'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {file
                      ? `${formatBytes(file.size)} · Will upload to S3`
                      : editing
                        ? 'Keep current file, or pick a new image/PDF/DOC · max 16 MB'
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
                      className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {editing ? 'Keep current file' : 'Remove file'}
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor={titleId} className="block text-sm font-bold text-slate-900">
                    Title
                  </label>
                  <input
                    id={titleId}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 w-full min-h-11 rounded-xl border border-black/10 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm"
                    placeholder="Price list PDF"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor={descId} className="block text-sm font-bold text-slate-900">
                    Description
                  </label>
                  <textarea
                    id={descId}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="When should this be sent? e.g. customer asks for pricing"
                    className="mt-1.5 w-full resize-none rounded-xl border border-black/10 px-3 py-2.5 text-base leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={scopeId} className="block text-sm font-bold text-slate-900">
                      Scope
                    </label>
                    <select
                      id={scopeId}
                      value={scope}
                      onChange={(e) => setScope(e.target.value as MediaScope)}
                      className="mt-1.5 w-full min-h-11 cursor-pointer rounded-xl border border-black/10 bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="customer">Customer</option>
                      <option value="partner">Partner</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={usageId} className="block text-sm font-bold text-slate-900">
                      Usage
                    </label>
                    <input
                      id={usageId}
                      value={usage}
                      onChange={(e) => setUsage(e.target.value)}
                      className="mt-1.5 w-full min-h-11 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="agent, catalog"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={tagsId} className="block text-sm font-bold text-slate-900">
                    Tags
                  </label>
                  <input
                    id={tagsId}
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-1.5 w-full min-h-11 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="pricing, brochure"
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-black/5 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="min-h-11 cursor-pointer rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || (!editing && !file)}
                  onClick={() => void handleSave()}
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {editing ? (file ? 'Replacing…' : 'Saving…') : 'Uploading to S3…'}
                    </>
                  ) : editing ? (
                    <>
                      <Pencil className="h-4 w-4" aria-hidden />
                      {file ? 'Replace & save' : 'Save changes'}
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4" aria-hidden />
                      Upload to S3
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
