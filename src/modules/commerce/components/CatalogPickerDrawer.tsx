import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Sparkles, Star, X } from 'lucide-react';
import { COLLECTIONS, PRODUCTS } from '../mock/data';
import { ProductCard } from './ProductCard';
import { ProductPreview } from './ProductPreview';
import { cx } from './ui';
import type { CommerceProduct } from '../types';

type Tab = 'products' | 'collections' | 'favorites' | 'recent' | 'ai';

type Props = {
  open: boolean;
  onClose: () => void;
  onSend?: (product: CommerceProduct) => void;
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'products', label: 'Products' },
  { id: 'collections', label: 'Collections' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recently used' },
  { id: 'ai', label: 'AI suggestions' },
];

export function CatalogPickerDrawer({ open, onClose, onSend }: Props) {
  const [tab, setTab] = useState<Tab>('products');
  const [q, setQ] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(PRODUCTS[0]?.id ?? null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = PRODUCTS;
    if (tab === 'favorites') list = PRODUCTS.filter((p) => p.tags.includes('bestseller'));
    if (tab === 'recent') {
      list = [...PRODUCTS].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
    }
    if (tab === 'ai') {
      list = PRODUCTS.filter((p) => p.aiStatus === 'indexed' && p.publishStatus === 'published');
    }
    if (!query) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.tags.some((t) => t.includes(query))
    );
  }, [q, tab]);

  const preview = PRODUCTS.find((p) => p.id === previewId) ?? filtered[0] ?? null;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close catalog picker"
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Send catalog"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-black/5 bg-surface-muted"
          >
            <header className="flex items-center justify-between gap-3 border-b border-black/5 bg-surface px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-dark-navy">Send Catalog</h2>
                <p className="text-xs text-neutral-500">
                  Pick products or collections for the conversation
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-neutral-500 hover:bg-surface-muted hover:text-dark-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="border-b border-black/5 bg-surface px-5 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products or collections…"
                  className={cx.input}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                      tab === t.id
                        ? 'bg-primary text-white'
                        : 'bg-surface-muted text-neutral-500 hover:text-dark-navy'
                    }`}
                  >
                    {t.id === 'ai' ? <Sparkles className="h-3 w-3" /> : null}
                    {t.id === 'favorites' ? <Star className="h-3 w-3" /> : null}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_240px]">
              <div className="overflow-y-auto p-5">
                {tab === 'collections' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {COLLECTIONS.filter((c) =>
                      c.name.toLowerCase().includes(q.trim().toLowerCase())
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`overflow-hidden text-left transition-colors hover:border-primary/30 ${cx.card}`}
                      >
                        <img src={c.cover} alt="" className="aspect-[16/9] w-full object-cover" />
                        <div className="p-3">
                          <p className="text-sm font-semibold text-dark-navy">{c.name}</p>
                          <p className="text-xs text-neutral-500">
                            {c.productIds.length} products
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filtered.map((p) => (
                      <div key={p.id}>
                        <ProductCard
                          product={p}
                          selected={previewId === p.id}
                          onPreview={() => setPreviewId(p.id)}
                          onSend={() => onSend?.(p)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="hidden border-l border-black/5 bg-surface p-4 lg:block">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  Quick preview
                </p>
                {preview ? <ProductPreview product={preview} compact /> : null}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
