import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ImagePlus,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  COLLECTIONS,
  PRODUCTS,
  brandName,
  categoryName,
  formatInr,
  formatRelative,
  getProduct,
} from '../mock/data';
import {
  AiBadge,
  InventoryBadge,
  PublishBadge,
  SyncBadge,
  WhatsAppBadge,
} from '../components/badges';
import { EmptyState } from '../components/EmptyState';
import { WhatsAppPreviewPanel } from '../components/WhatsAppPreviewPanel';
import { cx } from '../components/ui';

const TABS = [
  'General',
  'Description',
  'Variants',
  'Pricing',
  'Inventory',
  'Attributes',
  'AI Knowledge',
  'Channels',
  'SEO',
] as const;

type Tab = (typeof TABS)[number];

export function ProductDetailPage() {
  const params = useParams();
  const { pathname } = useLocation();
  // App mounts commerce under `/commerce/*` splat — prefer path segment over params.
  const productId =
    params.productId ||
    pathname.replace(/\/$/, '').split('/').filter(Boolean)[2] ||
    '';
  const product = getProduct(productId);
  const [tab, setTab] = useState<Tab>('General');
  const [regenFlash, setRegenFlash] = useState(false);

  if (!product) {
    return (
      <div className="p-6">
        <EmptyState
          title="Product not found"
          description="This SKU is not in the mock catalog."
          action={
            <Link to="/commerce/products" className="text-sm font-semibold text-primary">
              Back to products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className={cx.page}>
      <Link
        to="/commerce/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Products
      </Link>

      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        {/* LEFT — images */}
        <section className="space-y-3">
          <div className={`overflow-hidden ${cx.card}`}>
            <img src={product.images[0]} alt={product.name} className="aspect-square w-full object-cover" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {product.images.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                className="aspect-square rounded-xl border border-black/5 object-cover"
              />
            ))}
            <button
              type="button"
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-black/15 text-neutral-400 hover:border-primary/40 hover:text-primary"
            >
              <ImagePlus className="h-4 w-4" />
              <span className="text-[10px] font-semibold">Add</span>
            </button>
          </div>
          <div className="rounded-xl border border-dashed border-black/10 bg-surface-muted/60 p-4 text-center">
            <Upload className="mx-auto h-5 w-5 text-neutral-400" />
            <p className="mt-2 text-xs font-medium text-neutral-700">Drag & drop images</p>
            <p className="text-[11px] text-neutral-400">PNG, JPG up to 5MB · UI only</p>
          </div>
        </section>

        {/* CENTER — tabs */}
        <section className={`min-w-0 ${cx.card}`}>
          <div className="border-b border-black/5 px-5 py-4">
            <h2 className="text-xl font-semibold text-dark-navy">{product.name}</h2>
            <p className="mt-0.5 font-mono text-xs text-neutral-400">{product.sku}</p>
          </div>
          <div className="flex gap-1 overflow-x-auto border-b border-black/5 px-3 py-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-500 hover:bg-surface-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'General' && (
                  <div className="space-y-4">
                    <Field label="Name" value={product.name} />
                    <Field label="SKU" value={product.sku} />
                    <Field label="Category" value={categoryName(product.categoryId)} />
                    <Field label="Brand" value={brandName(product.brandId)} />
                    <Field label="Short description" value={product.shortDescription} />
                  </div>
                )}
                {tab === 'Description' && (
                  <p className="text-sm leading-relaxed text-neutral-700">
                    {product.description}
                  </p>
                )}
                {tab === 'Variants' && (
                  <div className="overflow-hidden rounded-xl border border-black/5">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-muted text-[11px] uppercase text-neutral-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Variant</th>
                          <th className="px-3 py-2 text-left">SKU</th>
                          <th className="px-3 py-2 text-left">Price</th>
                          <th className="px-3 py-2 text-left">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((v) => (
                          <tr key={v.id} className="border-t border-black/5">
                            <td className="px-3 py-2.5">{v.name}</td>
                            <td className="px-3 py-2.5 font-mono text-xs">{v.sku}</td>
                            <td className="px-3 py-2.5">{formatInr(v.price)}</td>
                            <td className="px-3 py-2.5">{v.inventory}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {tab === 'Pricing' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Price" value={formatInr(product.price)} />
                    <Field
                      label="Compare at"
                      value={product.compareAtPrice ? formatInr(product.compareAtPrice) : '—'}
                    />
                    <Field label="Currency" value={product.currency} />
                  </div>
                )}
                {tab === 'Inventory' && (
                  <div className="space-y-3">
                    <Field label="Available" value={String(product.inventory)} />
                    <InventoryBadge status={product.inventoryStatus} />
                  </div>
                )}
                {tab === 'Attributes' && (
                  <ul className="space-y-2">
                    {product.attributes.map((a) => (
                      <li
                        key={a.key}
                        className="flex justify-between rounded-xl bg-surface-muted px-3 py-2 text-sm"
                      >
                        <span className="text-neutral-500">{a.key}</span>
                        <span className="font-medium text-dark-navy">{a.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {tab === 'AI Knowledge' && (
                  <AiKnowledgePanel
                    product={product}
                    regenFlash={regenFlash}
                    onRegen={() => {
                      setRegenFlash(true);
                      window.setTimeout(() => setRegenFlash(false), 1600);
                    }}
                  />
                )}
                {tab === 'Channels' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-3">
                      <span className="text-sm font-medium">WhatsApp Catalog</span>
                      <WhatsAppBadge on={product.whatsappSynced} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-3">
                      <span className="text-sm font-medium">Meta sync</span>
                      <SyncBadge status={product.syncStatus} />
                    </div>
                  </div>
                )}
                {tab === 'SEO' && (
                  <div className="space-y-3">
                    <Field label="Title" value={product.seo.title} />
                    <Field label="Slug" value={product.seo.slug} />
                    <Field label="Description" value={product.seo.description} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* RIGHT sidebar */}
        <aside className="space-y-3">
          <SideCard title="Publish status">
            <PublishBadge status={product.publishStatus} />
            <p className="mt-2 text-[11px] text-neutral-500">
              Updated {formatRelative(product.updatedAt)}
            </p>
          </SideCard>
          <SideCard title="WhatsApp sync">
            <WhatsAppBadge on={product.whatsappSynced} />
            <SyncBadge status={product.syncStatus} />
            <button
              type="button"
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/5 py-2 text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync now
            </button>
          </SideCard>
          <SideCard title="AI status">
            <AiBadge status={product.aiStatus} />
            <p className="mt-2 text-[11px] text-neutral-500">
              Embeddings {product.ai.embeddingStatus}
            </p>
          </SideCard>
          <SideCard title="Collections">
            <ul className="space-y-1">
              {product.collectionIds.map((id) => {
                const c = COLLECTIONS.find((x) => x.id === id);
                return (
                  <li key={id} className="text-xs font-medium text-neutral-700">
                    {c?.name ?? id}
                  </li>
                );
              })}
            </ul>
          </SideCard>
          <SideCard title="Related products">
            <ul className="space-y-2">
              {PRODUCTS.filter((p) => p.id !== product.id)
                .slice(0, 3)
                .map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/commerce/products/${p.id}`}
                      className="flex items-center gap-2 text-xs font-medium hover:text-primary"
                    >
                      <img src={p.images[0]} alt="" className="h-7 w-7 rounded-md object-cover" />
                      {p.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </SideCard>
          <SideCard title="Quick actions">
            <div className="flex flex-col gap-1.5">
              {['Duplicate', 'Archive', 'Open in picker'].map((a) => (
                <button
                  key={a}
                  type="button"
                  className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-neutral-700 hover:bg-surface-muted"
                >
                  {a}
                </button>
              ))}
            </div>
          </SideCard>
          <WhatsAppPreviewPanel product={product} />
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </span>
      <div className="mt-1 rounded-xl border border-black/5 bg-surface-muted/60 px-3 py-2.5 text-sm text-dark-navy">
        {value}
      </div>
    </label>
  );
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${cx.card} p-4`}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function AiKnowledgePanel({
  product,
  onRegen,
  regenFlash,
}: {
  product: NonNullable<ReturnType<typeof getProduct>>;
  onRegen: () => void;
  regenFlash: boolean;
}) {
  const ai = product.ai;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-dark-navy">
            Conversation knowledge
          </p>
          <p className="text-xs text-neutral-500">
            Used by AI agents when selling this SKU on WhatsApp
          </p>
        </div>
        <button
          type="button"
          onClick={onRegen}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {regenFlash ? 'Queued…' : 'Regenerate with AI'}
        </button>
      </div>

      <AiBlock title="Summary" body={ai.summary} />
      <AiBlock
        title="FAQs"
        body={
          <ul className="space-y-2">
            {ai.faqs.map((f) => (
              <li key={f.q} className="rounded-xl bg-surface-muted px-3 py-2">
                <p className="text-xs font-semibold">{f.q}</p>
                <p className="mt-1 text-xs text-neutral-500">{f.a}</p>
              </li>
            ))}
          </ul>
        }
      />
      <AiBlock title="Sales talking points" list={ai.talkingPoints} />
      <AiBlock title="Cross sell" list={ai.crossSell} />
      <AiBlock title="Upsell" list={ai.upsell} />
      <AiBlock
        title="Objection handling"
        body={
          <ul className="space-y-2">
            {ai.objections.map((o) => (
              <li key={o.objection} className="rounded-xl border border-black/5 px-3 py-2">
                <p className="text-xs font-semibold text-dark-navy">
                  “{o.objection}”
                </p>
                <p className="mt-1 text-xs text-neutral-500">{o.reply}</p>
              </li>
            ))}
          </ul>
        }
      />
      <AiBlock title="Competitors" list={ai.competitors} />
      <AiBlock title="Use cases" list={ai.useCases} />
      <AiBlock title="Suggested replies" list={ai.suggestedReplies} />
      <AiBlock title="Keywords" list={ai.keywords} chips />
      <div className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-3">
        <div>
          <p className="text-xs font-semibold">Embedding status</p>
          <p className="text-[11px] text-neutral-500">
            Last generated {formatRelative(ai.lastGeneratedAt)}
          </p>
        </div>
        <AiBadge status={ai.embeddingStatus} />
      </div>
    </div>
  );
}

function AiBlock({
  title,
  body,
  list,
  chips,
}: {
  title: string;
  body?: React.ReactNode;
  list?: string[];
  chips?: boolean;
}) {
  return (
    <section>
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </h4>
      {typeof body === 'string' ? (
        <p className="text-sm leading-relaxed text-neutral-700">{body}</p>
      ) : (
        body
      )}
      {list && !chips ? (
        <ul className="list-disc space-y-1 pl-4 text-sm text-neutral-700">
          {list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {list && chips ? (
        <div className="flex flex-wrap gap-1.5">
          {list.map((k) => (
            <span
              key={k}
              className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700"
            >
              {k}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
