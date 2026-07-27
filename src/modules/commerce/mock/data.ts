import type {
  CatalogActivity,
  CommerceBrand,
  CommerceCategory,
  CommerceCollection,
  CommerceProduct,
  SyncEvent,
} from '../types';

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=640&q=80`;

export const CATALOG_NAME = 'ConvoSync Demo Catalog';

export const CATEGORIES: CommerceCategory[] = [
  { id: 'cat-skincare', name: 'Skincare', slug: 'skincare', productCount: 12, description: 'Face & body care essentials.' },
  { id: 'cat-hair', name: 'Hair Care', slug: 'hair-care', productCount: 8, description: 'Shampoos, serums, and kits.' },
  { id: 'cat-kits', name: 'Kits & Bundles', slug: 'kits', productCount: 5, description: 'Curated multi-product sets.' },
  { id: 'cat-tools', name: 'Tools', slug: 'tools', productCount: 4, description: 'Devices and accessories.' },
];

export const BRANDS: CommerceBrand[] = [
  { id: 'br-aura', name: 'Aura Lab', slug: 'aura-lab', productCount: 14, logoInitial: 'A' },
  { id: 'br-leaf', name: 'Leaf & Co', slug: 'leaf-co', productCount: 9, logoInitial: 'L' },
  { id: 'br-nova', name: 'Nova Beauty', slug: 'nova-beauty', productCount: 6, logoInitial: 'N' },
];

const aiBase = (name: string) => ({
  summary: `${name} is positioned for WhatsApp-assisted selling — short benefits, clear CTA, and FAQ-ready copy.`,
  faqs: [
    { q: 'Is this suitable for sensitive skin?', a: 'Yes — fragrance-free and dermatologist tested. Patch test recommended.' },
    { q: 'How long does shipping take?', a: 'Metro cities 2–3 days; other regions 4–6 business days.' },
  ],
  talkingPoints: [
    'Lead with the primary benefit in one line.',
    'Mention size / usage duration early.',
    'Offer kit upgrade when cart value fits.',
  ],
  crossSell: ['Travel pouch', 'Gentle cleanser'],
  upsell: ['Complete routine kit', 'Subscription refill'],
  objections: [
    { objection: 'Too expensive', reply: 'Share per-use cost and the 30-day satisfaction note.' },
    { objection: 'Will it work for me?', reply: 'Ask skin type, then map to the matching product line.' },
  ],
  competitors: ['Generic drugstore serum', 'Clinic private label'],
  useCases: ['First-time WhatsApp buyer', 'Reorder after 6 weeks', 'Gift for routine starters'],
  suggestedReplies: [
    'Here’s the product card — want shade / size options?',
    'I can send the kit that pairs with this if you’d like.',
  ],
  keywords: ['serum', 'glow', 'whatsapp catalog', 'routine'],
  embeddingStatus: 'indexed' as const,
  lastGeneratedAt: '2026-07-22T10:00:00.000Z',
});

export const PRODUCTS: CommerceProduct[] = [
  {
    id: 'p1',
    name: 'Vitamin C Glow Serum',
    sku: 'AURA-VC-30',
    description:
      'A lightweight 15% Vitamin C serum that brightens dull skin and supports an even tone. Ideal for morning routines under sunscreen.',
    shortDescription: 'Brightening serum for dull, tired skin.',
    price: 1499,
    compareAtPrice: 1799,
    currency: 'INR',
    categoryId: 'cat-skincare',
    brandId: 'br-aura',
    collectionIds: ['col-bestsellers', 'col-summer'],
    images: [
      img('photo-1620916567454-8b7e8f0a0a0a'),
      img('photo-1556228578-0d85b1a4d571'),
    ],
    inventory: 128,
    inventoryStatus: 'in_stock',
    publishStatus: 'published',
    whatsappSynced: true,
    syncStatus: 'synced',
    aiStatus: 'indexed',
    tags: ['serum', 'vitamin-c', 'bestseller'],
    updatedAt: '2026-07-24T08:12:00.000Z',
    createdAt: '2026-05-01T00:00:00.000Z',
    variants: [
      { id: 'v1', name: '30 ml', sku: 'AURA-VC-30', price: 1499, inventory: 90 },
      { id: 'v2', name: '50 ml', sku: 'AURA-VC-50', price: 2199, inventory: 38 },
    ],
    attributes: [
      { key: 'Skin type', value: 'All / dull' },
      { key: 'Texture', value: 'Lightweight gel' },
    ],
    ai: aiBase('Vitamin C Glow Serum'),
    seo: {
      title: 'Vitamin C Glow Serum | Aura Lab',
      description: 'Brighten dull skin with 15% Vitamin C.',
      slug: 'vitamin-c-glow-serum',
    },
  },
  {
    id: 'p2',
    name: 'Hydra Barrier Moisturizer',
    sku: 'LEAF-HM-50',
    description: 'Ceramide-rich cream that locks moisture for 24 hours without a heavy finish.',
    shortDescription: '24h barrier repair moisturizer.',
    price: 999,
    currency: 'INR',
    categoryId: 'cat-skincare',
    brandId: 'br-leaf',
    collectionIds: ['col-bestsellers'],
    images: [img('photo-1570194065650-d99fb4b38b17')],
    inventory: 14,
    inventoryStatus: 'low',
    publishStatus: 'published',
    whatsappSynced: true,
    syncStatus: 'synced',
    aiStatus: 'indexed',
    tags: ['moisturizer', 'barrier'],
    updatedAt: '2026-07-23T14:40:00.000Z',
    createdAt: '2026-04-12T00:00:00.000Z',
    variants: [{ id: 'v3', name: '50 g', sku: 'LEAF-HM-50', price: 999, inventory: 14 }],
    attributes: [{ key: 'Finish', value: 'Soft matte' }],
    ai: { ...aiBase('Hydra Barrier Moisturizer'), embeddingStatus: 'indexed' },
    seo: {
      title: 'Hydra Barrier Moisturizer',
      description: 'Ceramide moisturizer for barrier repair.',
      slug: 'hydra-barrier-moisturizer',
    },
  },
  {
    id: 'p3',
    name: 'Scalp Calm Shampoo',
    sku: 'NOVA-SC-250',
    description: 'Sulfate-free shampoo for itchy, sensitive scalps with oat and zinc PCA.',
    shortDescription: 'Gentle shampoo for sensitive scalp.',
    price: 649,
    currency: 'INR',
    categoryId: 'cat-hair',
    brandId: 'br-nova',
    collectionIds: ['col-summer'],
    images: [img('photo-1527799820374-dcf8d9d4a388')],
    inventory: 0,
    inventoryStatus: 'out_of_stock',
    publishStatus: 'published',
    whatsappSynced: false,
    syncStatus: 'pending',
    aiStatus: 'stale',
    tags: ['shampoo', 'scalp'],
    updatedAt: '2026-07-21T11:00:00.000Z',
    createdAt: '2026-03-01T00:00:00.000Z',
    variants: [{ id: 'v4', name: '250 ml', sku: 'NOVA-SC-250', price: 649, inventory: 0 }],
    attributes: [{ key: 'Hair type', value: 'Sensitive scalp' }],
    ai: { ...aiBase('Scalp Calm Shampoo'), embeddingStatus: 'stale' },
    seo: {
      title: 'Scalp Calm Shampoo',
      description: 'Sulfate-free shampoo for sensitive scalps.',
      slug: 'scalp-calm-shampoo',
    },
  },
  {
    id: 'p4',
    name: 'Morning Glow Kit',
    sku: 'AURA-KIT-AM',
    description: 'Cleanser + Vitamin C serum + SPF — a complete AM routine in one WhatsApp-ready kit.',
    shortDescription: '3-step morning routine kit.',
    price: 2999,
    compareAtPrice: 3499,
    currency: 'INR',
    categoryId: 'cat-kits',
    brandId: 'br-aura',
    collectionIds: ['col-bestsellers', 'col-gifting'],
    images: [img('photo-1596462502278-27bfdc403348')],
    inventory: 42,
    inventoryStatus: 'in_stock',
    publishStatus: 'published',
    whatsappSynced: true,
    syncStatus: 'synced',
    aiStatus: 'indexed',
    tags: ['kit', 'routine'],
    updatedAt: '2026-07-24T06:05:00.000Z',
    createdAt: '2026-06-01T00:00:00.000Z',
    variants: [{ id: 'v5', name: 'Standard', sku: 'AURA-KIT-AM', price: 2999, inventory: 42 }],
    attributes: [{ key: 'Includes', value: '3 products' }],
    ai: aiBase('Morning Glow Kit'),
    seo: {
      title: 'Morning Glow Kit',
      description: 'Complete AM skincare kit.',
      slug: 'morning-glow-kit',
    },
  },
  {
    id: 'p5',
    name: 'Jade Facial Roller',
    sku: 'LEAF-JR-01',
    description: 'Cooling jade roller for depuffing and product absorption. Draft — pending photography.',
    shortDescription: 'Facial roller accessory.',
    price: 799,
    currency: 'INR',
    categoryId: 'cat-tools',
    brandId: 'br-leaf',
    collectionIds: ['col-gifting'],
    images: [img('photo-1512496015851-a90fb38ba796')],
    inventory: 60,
    inventoryStatus: 'in_stock',
    publishStatus: 'draft',
    whatsappSynced: false,
    syncStatus: 'never',
    aiStatus: 'pending',
    tags: ['tool', 'draft'],
    updatedAt: '2026-07-20T09:30:00.000Z',
    createdAt: '2026-07-18T00:00:00.000Z',
    variants: [{ id: 'v6', name: 'One size', sku: 'LEAF-JR-01', price: 799, inventory: 60 }],
    attributes: [{ key: 'Material', value: 'Natural jade' }],
    ai: { ...aiBase('Jade Facial Roller'), embeddingStatus: 'pending' },
    seo: {
      title: 'Jade Facial Roller',
      description: 'Cooling facial roller.',
      slug: 'jade-facial-roller',
    },
  },
  {
    id: 'p6',
    name: 'Repair Night Cream',
    sku: 'AURA-NC-40',
    description: 'Retinol alternative night cream with bakuchiol for overnight renewal.',
    shortDescription: 'Overnight renewal cream.',
    price: 1899,
    currency: 'INR',
    categoryId: 'cat-skincare',
    brandId: 'br-aura',
    collectionIds: ['col-summer'],
    images: [img('photo-1611930022073-b7a4ba5fcccd')],
    inventory: 8,
    inventoryStatus: 'low',
    publishStatus: 'published',
    whatsappSynced: true,
    syncStatus: 'error',
    aiStatus: 'failed',
    tags: ['night', 'cream'],
    updatedAt: '2026-07-22T19:10:00.000Z',
    createdAt: '2026-02-10T00:00:00.000Z',
    variants: [{ id: 'v7', name: '40 g', sku: 'AURA-NC-40', price: 1899, inventory: 8 }],
    attributes: [{ key: 'Active', value: 'Bakuchiol' }],
    ai: { ...aiBase('Repair Night Cream'), embeddingStatus: 'failed' },
    seo: {
      title: 'Repair Night Cream',
      description: 'Bakuchiol night cream.',
      slug: 'repair-night-cream',
    },
  },
];

// Fix broken unsplash seeds with reliable fallbacks
PRODUCTS.forEach((p, i) => {
  const seeds = [
    'photo-1620916567454-8b7e8f0a0a0a',
    'photo-1570194065650-d99fb38b17',
    'photo-1527799820374-dcf8d9d4a388',
    'photo-1596462502278-27bfdc403348',
    'photo-1512496015851-a90fb38ba796',
    'photo-1611930022073-b7a4ba5fcccd',
  ];
  // Use picsum for reliable placeholders
  p.images = [`https://picsum.photos/seed/cshop${i + 1}/640/640`];
  if (i === 0) p.images.push(`https://picsum.photos/seed/cshop1b/640/640`);
  void seeds;
});

export const COLLECTIONS: CommerceCollection[] = [
  {
    id: 'col-bestsellers',
    name: 'Bestsellers',
    slug: 'bestsellers',
    productIds: ['p1', 'p2', 'p4'],
    description: 'Top performers from WhatsApp conversations.',
    cover: 'https://picsum.photos/seed/colbest/800/400',
    updatedAt: '2026-07-24T07:00:00.000Z',
  },
  {
    id: 'col-summer',
    name: 'Summer Edit',
    slug: 'summer-edit',
    productIds: ['p1', 'p3', 'p6'],
    description: 'Light textures for warm weather.',
    cover: 'https://picsum.photos/seed/colsummer/800/400',
    updatedAt: '2026-07-19T12:00:00.000Z',
  },
  {
    id: 'col-gifting',
    name: 'Gifting',
    slug: 'gifting',
    productIds: ['p4', 'p5'],
    description: 'Ready-to-send gift-friendly SKUs.',
    cover: 'https://picsum.photos/seed/colgift/800/400',
    updatedAt: '2026-07-15T09:00:00.000Z',
  },
];

export const ACTIVITIES: CatalogActivity[] = [
  {
    id: 'a1',
    type: 'edit',
    title: 'Vitamin C Glow Serum updated',
    detail: 'Price and AI talking points refreshed',
    at: '2026-07-24T08:12:00.000Z',
  },
  {
    id: 'a2',
    type: 'sync',
    title: 'Meta Catalog sync completed',
    detail: '24 products · 0 errors',
    at: '2026-07-24T07:40:00.000Z',
  },
  {
    id: 'a3',
    type: 'ai',
    title: 'AI knowledge regenerated',
    detail: 'Morning Glow Kit',
    at: '2026-07-23T16:20:00.000Z',
  },
  {
    id: 'a4',
    type: 'publish',
    title: 'Hydra Barrier Moisturizer published',
    detail: 'Live on WhatsApp catalog',
    at: '2026-07-23T14:40:00.000Z',
  },
  {
    id: 'a5',
    type: 'import',
    title: 'CSV import finished',
    detail: '6 rows · 1 draft created',
    at: '2026-07-22T10:05:00.000Z',
  },
];

export const SYNC_EVENTS: SyncEvent[] = [
  {
    id: 's1',
    status: 'success',
    title: 'Full catalog sync',
    detail: 'Meta Commerce Manager accepted the payload.',
    at: '2026-07-24T07:40:00.000Z',
    count: 24,
  },
  {
    id: 's2',
    status: 'error',
    title: 'Repair Night Cream failed',
    detail: 'Image URL timed out during Meta validation.',
    at: '2026-07-22T19:12:00.000Z',
    count: 1,
  },
  {
    id: 's3',
    status: 'pending',
    title: 'Scalp Calm Shampoo queued',
    detail: 'Waiting for inventory restock before push.',
    at: '2026-07-21T11:05:00.000Z',
  },
  {
    id: 's4',
    status: 'info',
    title: 'WhatsApp catalog connected',
    detail: 'WABA linked to ConvoSync Demo Catalog.',
    at: '2026-07-10T08:00:00.000Z',
  },
];

export function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? '—';
}

export function brandName(id: string): string {
  return BRANDS.find((b) => b.id === id)?.name ?? '—';
}

export function getProduct(id: string): CommerceProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export const CATALOG_STATS = {
  total: PRODUCTS.length,
  published: PRODUCTS.filter((p) => p.publishStatus === 'published').length,
  draft: PRODUCTS.filter((p) => p.publishStatus === 'draft').length,
  outOfStock: PRODUCTS.filter((p) => p.inventoryStatus === 'out_of_stock').length,
  whatsappSynced: PRODUCTS.filter((p) => p.whatsappSynced).length,
  aiIndexed: PRODUCTS.filter((p) => p.aiStatus === 'indexed').length,
};
