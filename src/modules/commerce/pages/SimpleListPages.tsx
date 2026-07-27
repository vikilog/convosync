import React from 'react';
import { Link } from 'react-router-dom';
import { BRANDS, CATEGORIES, COLLECTIONS, PRODUCTS, formatInr, formatRelative } from '../mock/data';
import { InventoryBadge } from '../components/badges';
import { EmptyState } from '../components/EmptyState';
import { PageHeader, cx } from '../components/ui';

export function CategoriesPage() {
  return (
    <ListShell title="Categories" subtitle="Organize products for browsing and AI routing">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <article
            key={c.id}
            className={`${cx.cardPad} transition-transform hover:-translate-y-0.5`}
          >
            <h3 className="text-sm font-semibold text-dark-navy">{c.name}</h3>
            <p className="mt-1 text-xs text-neutral-500">{c.description}</p>
            <p className="mt-4 text-[11px] font-semibold text-primary">{c.productCount} products</p>
          </article>
        ))}
      </div>
    </ListShell>
  );
}

export function CollectionsPage() {
  return (
    <ListShell title="Collections" subtitle="Curated sets for WhatsApp multi-product messages">
      <div className="grid gap-4 sm:grid-cols-2">
        {COLLECTIONS.map((c) => (
          <article key={c.id} className={`overflow-hidden ${cx.card}`}>
            <img src={c.cover} alt="" className="aspect-[16/8] w-full object-cover" />
            <div className="p-4">
              <h3 className="text-sm font-semibold text-dark-navy">{c.name}</h3>
              <p className="mt-1 text-xs text-neutral-500">{c.description}</p>
              <p className="mt-3 text-[11px] text-neutral-400">
                {c.productIds.length} products · Updated {formatRelative(c.updatedAt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </ListShell>
  );
}

export function BrandsPage() {
  return (
    <ListShell title="Brands" subtitle="Brand identity for catalog filtering">
      <div className="grid gap-3 sm:grid-cols-3">
        {BRANDS.map((b) => (
          <article key={b.id} className={`flex items-center gap-3 ${cx.cardPad}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {b.logoInitial}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-navy">{b.name}</h3>
              <p className="text-xs text-neutral-500">{b.productCount} products</p>
            </div>
          </article>
        ))}
      </div>
    </ListShell>
  );
}

export function InventoryPage() {
  return (
    <ListShell title="Inventory" subtitle="Stock levels across published SKUs">
      <div className={`overflow-hidden ${cx.card}`}>
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-[11px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">On hand</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => (
              <tr
                key={p.id}
                className="border-t border-black/5 transition-colors hover:bg-surface-muted/50"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/commerce/products/${p.id}`}
                    className="font-medium text-dark-navy hover:text-primary"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{p.sku}</td>
                <td className="px-4 py-3 text-dark-navy">{p.inventory}</td>
                <td className="px-4 py-3">
                  <InventoryBadge status={p.inventoryStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ListShell>
  );
}

export function AiKnowledgeHubPage() {
  const ready = PRODUCTS.filter((p) => p.aiStatus === 'indexed');
  const needsWork = PRODUCTS.filter((p) => p.aiStatus !== 'indexed');

  return (
    <ListShell
      title="AI Knowledge"
      subtitle="Catalog-wide embedding coverage for conversation agents"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cx.cardPad}>
          <h3 className={cx.sectionTitle}>Indexed</h3>
          <ul className="mt-3 space-y-1">
            {ready.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/commerce/products/${p.id}`}
                  className="flex items-center justify-between rounded-xl px-2 py-2 text-sm text-dark-navy transition-colors hover:bg-surface-muted"
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-neutral-400">{formatInr(p.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={cx.cardPad}>
          <h3 className={cx.sectionTitle}>Needs attention</h3>
          {needsWork.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="All clear" description="Every product has fresh AI knowledge." />
            </div>
          ) : (
            <ul className="mt-3 space-y-1">
              {needsWork.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/commerce/products/${p.id}`}
                    className="flex items-center justify-between rounded-xl px-2 py-2 text-sm text-dark-navy transition-colors hover:bg-surface-muted"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs capitalize text-amber-700">
                      {p.aiStatus}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ListShell>
  );
}

function ListShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx.page}>
      <PageHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}
