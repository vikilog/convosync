/**
 * Pick a file from Media Gallery (image by default; pass `filterType` for video/pdf/document).
 * Thumbs via auth /file; picked src = S3 presigned URL (bucket is private).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { File as FileIcon, Image as ImageIcon, Loader2, Search, Video, X } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { Input } from '../ui/input';

export type MediaGalleryFilterType = 'image' | 'video' | 'pdf' | 'document';

export type PickedGalleryImage = {
  id: string;
  url: string;
  title: string;
  filename: string;
};

type GalleryRow = {
  id: string;
  title: string;
  filename: string;
  thumbUrl?: string;
};

export const MEDIA_GALLERY_FILTER_META: Record<
  MediaGalleryFilterType,
  { icon: typeof ImageIcon; noun: string }
> = {
  image: { icon: ImageIcon, noun: 'image' },
  video: { icon: Video, noun: 'video' },
  pdf: { icon: FileIcon, noun: 'PDF' },
  document: { icon: FileIcon, noun: 'document' },
};

function mapAsset(raw: Record<string, unknown>, filterType: MediaGalleryFilterType): GalleryRow | null {
  if (String(raw.type ?? '') !== filterType) return null;
  if (raw.isActive === false) return null;
  const id = String(raw.id ?? '');
  if (!id) return null;
  return {
    id,
    title: String(raw.title ?? raw.filename ?? 'File'),
    filename: String(raw.filename ?? ''),
  };
}

type BrowserProps = {
  /** Whether this browser is the one currently visible — gates the load + thumb-URL lifecycle. */
  active: boolean;
  filterType?: MediaGalleryFilterType;
  onPick: (image: PickedGalleryImage) => void;
  /** Checkbox multi-select mode — picks are batched and confirmed via a footer button. */
  multiple?: boolean;
  /** Required when `multiple` is set — fires once with every selected item. */
  onPickMultiple?: (images: PickedGalleryImage[]) => void;
  /** Multi-select only — caps how many items can be chosen (e.g. Telegram album max of 10). */
  maxSelect?: number;
  /** Compact layout with no inner scroll cap — for embedding inline in another dialog. */
  embedded?: boolean;
};

/** Search + grid + (optional) multi-select confirm footer — no modal chrome of its own. */
export function MediaGalleryBrowser({
  active,
  filterType = 'image',
  onPick,
  multiple = false,
  onPickMultiple,
  maxSelect,
  embedded = false,
}: BrowserProps) {
  const { icon: TypeIcon, noun } = MEDIA_GALLERY_FILTER_META[filterType];
  const [items, setItems] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  // Guards against a slower, since-superseded load() response (e.g. the
  // browser became inactive and active again, or filterType changed, while a
  // fetch was still in flight) overwriting the results of a newer request
  // that already resolved.
  const loadGenerationRef = useRef(0);
  const pickingRef = useRef(false);

  const load = useCallback(async () => {
    const myGeneration = ++loadGenerationRef.current;
    setLoading(true);
    setError('');
    try {
      const raw = (await api.getMediaGallery({ activeOnly: true })) as Record<
        string,
        unknown
      >[];
      const rows = raw
        .map((r) => mapAsset(r, filterType))
        .filter((x): x is GalleryRow => Boolean(x));

      const withThumbs = await Promise.all(
        rows.map(async (row) => {
          if (filterType !== 'image') return row;
          try {
            const blob = await api.fetchMediaGalleryFile(row.id);
            if (!blob.type.startsWith('image/')) return row;
            return { ...row, thumbUrl: URL.createObjectURL(blob) };
          } catch {
            return row;
          }
        })
      );
      if (loadGenerationRef.current !== myGeneration) return;
      setItems(withThumbs);
    } catch (e) {
      if (loadGenerationRef.current !== myGeneration) return;
      setItems([]);
      setError(formatCatchError(e));
    } finally {
      if (loadGenerationRef.current === myGeneration) setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (!active) return;
    setSearch('');
    setSelectedIds([]);
    void load();
  }, [active, load]);

  useEffect(() => {
    if (active) return;
    for (const item of items) {
      if (item.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(item.thumbUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only when it goes inactive
  }, [active]);

  const handlePick = async (item: GalleryRow) => {
    if (multiple) {
      setSelectedIds((prev) => {
        if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
        if (maxSelect && prev.length >= maxSelect) return prev;
        return [...prev, item.id];
      });
      return;
    }
    // pickingId's disabled state lags a tick behind a fast double-click (or
    // a double-fire from a trackpad/touch event) on two different tiles —
    // this ref rejects a second concurrent pick synchronously.
    if (pickingRef.current) return;
    pickingRef.current = true;
    setPickingId(item.id);
    setError('');
    try {
      const signed = await api.getMediaGallerySignedUrl(item.id);
      onPick({
        id: item.id,
        url: signed.url,
        title: item.title,
        filename: item.filename,
      });
    } catch (e) {
      setError(formatCatchError(e));
    } finally {
      pickingRef.current = false;
      setPickingId(null);
    }
  };

  const handleConfirmSelection = async () => {
    if (!onPickMultiple || selectedIds.length === 0 || confirming) return;
    setConfirming(true);
    setError('');
    try {
      const picked = await Promise.all(
        selectedIds.map(async (id) => {
          const item = items.find((i) => i.id === id);
          if (!item) return null;
          const signed = await api.getMediaGallerySignedUrl(id);
          return { id, url: signed.url, title: item.title, filename: item.filename };
        })
      );
      onPickMultiple(picked.filter((p): p is PickedGalleryImage => Boolean(p)));
    } catch (e) {
      setError(formatCatchError(e));
    } finally {
      setConfirming(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (i) => i.title.toLowerCase().includes(q) || i.filename.toLowerCase().includes(q)
      )
    : items;

  return (
    <div className="flex flex-col min-h-0">
      <div className={embedded ? 'pb-3' : 'px-5 py-3 border-b border-swiss-line shrink-0'}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-swiss-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${noun}s…`}
            className="h-auto w-full rounded-xl border border-black/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-swiss-accent/20"
          />
        </div>
      </div>

      <div
        className={
          embedded
            ? 'max-h-[min(50vh,380px)] overflow-y-auto'
            : 'flex-1 min-h-0 overflow-y-auto p-5'
        }
      >
        {loading ? (
          <div className="flex justify-center py-16 text-swiss-faint">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error && items.length === 0 ? (
          <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <TypeIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-swiss-muted">
              {items.length === 0 ? `No ${noun}s in Media Gallery` : 'No matches'}
            </p>
            <p className="text-xs text-swiss-faint mt-1">
              {items.length === 0
                ? `Upload ${noun}s under Media Gallery, then pick them here.`
                : 'Try a different search.'}
            </p>
          </div>
        ) : (
          <>
            {error ? (
              <p className="mb-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            ) : null}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((item) => {
                const busy = pickingId === item.id;
                const selected = selectedIds.includes(item.id);
                const selectionFull = Boolean(maxSelect) && selectedIds.length >= (maxSelect ?? 0);
                const disabled = multiple
                  ? confirming || (!selected && selectionFull)
                  : Boolean(pickingId);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => void handlePick(item)}
                    className={`group text-left rounded-xl border overflow-hidden transition-all disabled:opacity-60 ${
                      selected
                        ? 'border-swiss-accent ring-2 ring-swiss-accent/30'
                        : 'border-swiss-line bg-white hover:border-swiss-accent/40 hover:ring-2 hover:ring-swiss-accent/15'
                    }`}
                  >
                    <div className="aspect-[4/3] bg-white overflow-hidden relative flex items-center justify-center">
                      {item.thumbUrl ? (
                        <img
                          src={item.thumbUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                        />
                      ) : (
                        <TypeIcon className="w-8 h-8 text-gray-300" />
                      )}
                      {multiple && selected ? (
                        <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-swiss-accent text-[11px] font-black text-white shadow">
                          {selectedIds.indexOf(item.id) + 1}
                        </span>
                      ) : null}
                      {busy ? (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-swiss-accent" />
                        </div>
                      ) : null}
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="text-xs font-bold text-swiss-ink truncate">{item.title}</p>
                      {item.filename ? (
                        <p className="text-[10px] text-swiss-faint truncate mt-0.5">{item.filename}</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {multiple && (
        <div
          className={
            embedded
              ? 'flex items-center justify-between gap-3 pt-3'
              : 'flex items-center justify-between gap-3 border-t border-swiss-line px-5 py-3 shrink-0'
          }
        >
          <p className="text-xs font-semibold text-swiss-muted">
            {selectedIds.length} selected{maxSelect ? ` / ${maxSelect}` : ''}
          </p>
          <button
            type="button"
            disabled={selectedIds.length === 0 || confirming}
            onClick={() => void handleConfirmSelection()}
            className="inline-flex items-center gap-2 rounded-xl bg-swiss-accent px-4 py-2 text-sm font-bold text-white hover:bg-swiss-accent-hover disabled:opacity-50"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Add {selectedIds.length || ''}
          </button>
        </div>
      )}
    </div>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (image: PickedGalleryImage) => void;
  /** Media Gallery asset type to list — defaults to 'image' (existing callers unaffected). */
  filterType?: MediaGalleryFilterType;
  /** Checkbox multi-select mode — picks are batched and confirmed via a button instead of closing on first tap. */
  multiple?: boolean;
  /** Required when `multiple` is set — fires once with every selected item. */
  onPickMultiple?: (images: PickedGalleryImage[]) => void;
  /** Multi-select only — caps how many items can be chosen (e.g. Telegram album max of 10). */
  maxSelect?: number;
};

export function MediaGalleryPickerModal({
  open,
  onClose,
  onPick,
  filterType = 'image',
  multiple = false,
  onPickMultiple,
  maxSelect,
}: Props) {
  const { icon: TypeIcon, noun } = MEDIA_GALLERY_FILTER_META[filterType];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-labelledby="media-gallery-picker-title"
        className="w-full max-w-2xl max-h-[min(80vh,640px)] flex flex-col rounded-2xl border border-swiss-line bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-swiss-line shrink-0">
          <div className="min-w-0">
            <h2
              id="media-gallery-picker-title"
              className="text-sm font-bold text-swiss-ink flex items-center gap-2"
            >
              <TypeIcon className="w-4 h-4 text-swiss-accent" />
              {multiple
                ? `Pick ${noun}s from Media Gallery${maxSelect ? ` (up to ${maxSelect})` : ''}`
                : `Pick a ${noun} from Media Gallery`}
            </h2>
            <p className="text-xs text-swiss-faint mt-0.5">
              Uses a secure link (S3 bucket is private)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-muted text-swiss-muted disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <MediaGalleryBrowser
          active={open}
          filterType={filterType}
          multiple={multiple}
          maxSelect={maxSelect}
          onPick={(image) => {
            onPick(image);
            onClose();
          }}
          onPickMultiple={
            onPickMultiple
              ? (images) => {
                  onPickMultiple(images);
                  onClose();
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
