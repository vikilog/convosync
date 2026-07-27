import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Bot,
  FileUp,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  TriangleAlert,
} from 'lucide-react';
import {
  ACTIVITIES,
  CATALOG_NAME,
  CATALOG_STATS,
  COLLECTIONS,
  PRODUCTS,
  formatRelative,
} from '../mock/data';
import { MetricCard } from '../components/MetricCard';
import { PublishBadge, SyncBadge } from '../components/badges';
import { WhatsAppPreviewPanel } from '../components/WhatsAppPreviewPanel';
import { PageHeader, cx } from '../components/ui';

export function CatalogDashboard() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const recent = [...PRODUCTS]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
    .filter((p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <PageHeader
          title={CATALOG_NAME}
          subtitle="AI commerce catalog for WhatsApp conversations"
          actions={
            <>
              <div className="relative min-w-[200px] flex-1 sm:w-56 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search catalog…"
                  className={cx.input}
                />
              </div>
              <button
                type="button"
                onClick={() => navigate('/commerce/products')}
                className={cx.btnPrimary}
              >
                <Plus className="h-3.5 w-3.5" />
                Create Product
              </button>
              <button type="button" className={cx.btnGhost}>
                <FileUp className="h-3.5 w-3.5" />
                Import
              </button>
              <button type="button" onClick={() => navigate('/commerce/sync')} className={cx.btnGhost}>
                <RefreshCw className="h-3.5 w-3.5" />
                Sync
              </button>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Total products" value={CATALOG_STATS.total} icon={Package} />
          <MetricCard label="Published" value={CATALOG_STATS.published} icon={ShoppingBag} />
          <MetricCard
            label="Draft"
            value={CATALOG_STATS.draft}
            icon={Package}
            accent="bg-neutral-500/10 text-neutral-600"
          />
          <MetricCard
            label="Out of stock"
            value={CATALOG_STATS.outOfStock}
            icon={TriangleAlert}
            accent="bg-red-500/10 text-red-600"
          />
          <MetricCard
            label="Synced to WhatsApp"
            value={CATALOG_STATS.whatsappSynced}
            icon={RefreshCw}
            accent="bg-[#25d366]/15 text-[#128c7e]"
          />
          <MetricCard
            label="AI indexed"
            value={CATALOG_STATS.aiIndexed}
            icon={Bot}
            accent="bg-violet-500/10 text-violet-700"
          />
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className={cx.cardPad}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={cx.sectionTitle}>Recently edited</h3>
              <button
                type="button"
                onClick={() => navigate('/commerce/products')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all
              </button>
            </div>
            <ul className="divide-y divide-black/5">
              {recent.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/commerce/products/${p.id}`)}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface-muted/70"
                  >
                    <img
                      src={p.images[0]}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-black/5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-dark-navy">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-neutral-400">{formatRelative(p.updatedAt)}</p>
                    </div>
                    <PublishBadge status={p.publishStatus} />
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className={cx.cardPad}>
            <h3 className={`mb-4 ${cx.sectionTitle}`}>Recent activity</h3>
            <ul className="space-y-4">
              {ACTIVITIES.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium text-dark-navy">{a.title}</p>
                    <p className="text-xs text-neutral-500">{a.detail}</p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">{formatRelative(a.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-black/5 bg-surface-muted/80 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-neutral-700">Meta sync status</p>
                <SyncBadge status="synced" />
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">Last sync 2h ago · 24 products</p>
            </div>
          </div>
        </section>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <WhatsAppPreviewPanel
          product={PRODUCTS[0]}
          products={PRODUCTS}
          collection={COLLECTIONS[0]}
        />
      </div>
    </div>
  );
}
