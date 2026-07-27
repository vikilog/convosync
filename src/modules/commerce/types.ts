export type PublishStatus = 'published' | 'draft' | 'archived';
export type InventoryStatus = 'in_stock' | 'low' | 'out_of_stock';
export type SyncStatus = 'synced' | 'pending' | 'error' | 'never';
export type AiIndexStatus = 'indexed' | 'stale' | 'pending' | 'failed';

export type CommerceProduct = {
  id: string;
  name: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  categoryId: string;
  brandId: string;
  collectionIds: string[];
  images: string[];
  inventory: number;
  inventoryStatus: InventoryStatus;
  publishStatus: PublishStatus;
  whatsappSynced: boolean;
  syncStatus: SyncStatus;
  aiStatus: AiIndexStatus;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  variants: ProductVariant[];
  attributes: { key: string; value: string }[];
  ai: ProductAiKnowledge;
  seo: { title: string; description: string; slug: string };
};

export type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  price: number;
  inventory: number;
};

export type ProductAiKnowledge = {
  summary: string;
  faqs: { q: string; a: string }[];
  talkingPoints: string[];
  crossSell: string[];
  upsell: string[];
  objections: { objection: string; reply: string }[];
  competitors: string[];
  useCases: string[];
  suggestedReplies: string[];
  keywords: string[];
  embeddingStatus: AiIndexStatus;
  lastGeneratedAt: string;
};

export type CommerceCategory = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  description: string;
};

export type CommerceBrand = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  logoInitial: string;
};

export type CommerceCollection = {
  id: string;
  name: string;
  slug: string;
  productIds: string[];
  description: string;
  cover: string;
  updatedAt: string;
};

export type CatalogActivity = {
  id: string;
  type: 'edit' | 'sync' | 'publish' | 'ai' | 'import';
  title: string;
  detail: string;
  at: string;
};

export type SyncEvent = {
  id: string;
  status: 'success' | 'pending' | 'error' | 'info';
  title: string;
  detail: string;
  at: string;
  count?: number;
};

export type CommerceSection =
  | 'catalog'
  | 'products'
  | 'categories'
  | 'collections'
  | 'brands'
  | 'inventory'
  | 'ai-knowledge'
  | 'sync';
