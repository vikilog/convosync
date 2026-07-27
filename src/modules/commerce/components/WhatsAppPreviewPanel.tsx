import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CommerceCollection, CommerceProduct } from '../types';
import { formatInr } from '../mock/data';
import { ProductPreview } from './ProductPreview';

type Mode = 'single' | 'multi' | 'catalog' | 'collection';

type Props = {
  product?: CommerceProduct | null;
  products?: CommerceProduct[];
  collection?: CommerceCollection | null;
};

const MODES: { id: Mode; label: string }[] = [
  { id: 'single', label: 'Single' },
  { id: 'multi', label: 'Multi' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'collection', label: 'Collection' },
];

export function WhatsAppPreviewPanel({ product, products = [], collection }: Props) {
  const [mode, setMode] = useState<Mode>('single');
  const list = products.length ? products : product ? [product] : [];

  return (
    <aside className="flex h-fit flex-col overflow-hidden rounded-xl border border-black/5 bg-surface">
      <div className="border-b border-black/5 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          WhatsApp preview
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                mode === m.id
                  ? 'bg-primary text-white'
                  : 'bg-surface-muted text-neutral-500 hover:text-dark-navy'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="min-h-[360px] p-4"
        style={{
          backgroundColor: '#0b141a',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(37,211,102,0.08), transparent 40%)',
        }}
      >
        <div className="mx-auto max-w-[280px] space-y-3">
          <p className="text-center text-[10px] font-medium text-white/40">Today</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {mode === 'single' && product ? (
                <div className="rounded-xl rounded-tl-sm bg-[#005c4b] p-1">
                  <ProductPreview product={product} compact />
                </div>
              ) : null}

              {mode === 'multi' ? (
                <div className="space-y-2 rounded-xl rounded-tl-sm bg-[#005c4b] p-2">
                  <p className="px-1 text-[11px] font-medium text-white/90">
                    Here are a few options for you:
                  </p>
                  {list.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="flex gap-2 rounded-xl bg-white/10 p-2 text-white"
                    >
                      <img
                        src={p.images[0]}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{p.name}</p>
                        <p className="text-[11px] text-white/70">{formatInr(p.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {mode === 'catalog' ? (
                <div className="rounded-xl rounded-tl-sm bg-[#005c4b] p-3 text-white">
                  <p className="text-xs font-semibold">Browse our catalog</p>
                  <p className="mt-1 text-[11px] text-white/70">
                    Explore {list.length || 24} products on WhatsApp
                  </p>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl bg-white/15 py-2 text-xs font-bold"
                  >
                    View catalog
                  </button>
                </div>
              ) : null}

              {mode === 'collection' ? (
                <div className="overflow-hidden rounded-xl rounded-tl-sm bg-[#005c4b]">
                  {collection ? (
                    <>
                      <img
                        src={collection.cover}
                        alt=""
                        className="aspect-[16/9] w-full object-cover"
                      />
                      <div className="p-3 text-white">
                        <p className="text-xs font-semibold">{collection.name}</p>
                        <p className="mt-1 text-[11px] text-white/70">
                          {collection.productIds.length} products
                        </p>
                        <button
                          type="button"
                          className="mt-3 w-full rounded-xl bg-white/15 py-2 text-xs font-bold"
                        >
                          View collection
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="p-4 text-xs text-white/60">Select a collection to preview.</p>
                  )}
                </div>
              ) : null}

              {!product && mode === 'single' ? (
                <p className="rounded-xl bg-white/5 px-3 py-6 text-center text-xs text-white/50">
                  Select a product to preview the customer message.
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
