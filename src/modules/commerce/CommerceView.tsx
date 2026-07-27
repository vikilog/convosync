import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';
import { CatalogPickerDrawer } from './components/CatalogPickerDrawer';
import { cx } from './components/ui';
import { CATALOG_NAME } from './mock/data';
import { CatalogDashboard } from './pages/CatalogDashboard';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SyncCenterPage } from './pages/SyncCenterPage';
import {
  AiKnowledgeHubPage,
  BrandsPage,
  CategoriesPage,
  CollectionsPage,
  InventoryPage,
} from './pages/SimpleListPages';

const SECTION_LABEL: Record<string, string> = {
  catalog: CATALOG_NAME,
  products: 'Products',
  categories: 'Categories',
  collections: 'Collections',
  brands: 'Brands',
  inventory: 'Inventory',
  'ai-knowledge': 'AI Knowledge',
  sync: 'Sync Center',
};

/** Path-based switch — avoids nested `<Routes>` under App's `/commerce/*` splat. */
export function CommerceView() {
  const { pathname } = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { section, page } = useMemo(() => resolveCommerce(pathname), [pathname]);
  const crumb = SECTION_LABEL[section] ?? CATALOG_NAME;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 px-1 pb-3 pt-0.5 sm:px-0">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wide"
        >
          <span className="text-neutral-400">Commerce</span>
          <span className="text-neutral-300">/</span>
          <span className="truncate text-neutral-600">{crumb}</span>
        </nav>
        <button type="button" onClick={() => setPickerOpen(true)} className={cx.btnPrimary}>
          <Send className="h-3.5 w-3.5" />
          Send Catalog
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {page}
      </div>

      <CatalogPickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSend={() => setPickerOpen(false)}
      />
    </div>
  );
}

function resolveCommerce(pathname: string): { section: string; page: React.ReactNode } {
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  const section = parts[1] ?? 'catalog';
  const productId = parts[1] === 'products' ? parts[2] : undefined;

  if (section === 'products' && productId) {
    return { section: 'products', page: <ProductDetailPage key={productId} /> };
  }

  switch (section) {
    case 'products':
      return { section, page: <ProductsPage /> };
    case 'categories':
      return { section, page: <CategoriesPage /> };
    case 'collections':
      return { section, page: <CollectionsPage /> };
    case 'brands':
      return { section, page: <BrandsPage /> };
    case 'inventory':
      return { section, page: <InventoryPage /> };
    case 'ai-knowledge':
      return { section, page: <AiKnowledgeHubPage /> };
    case 'sync':
      return { section, page: <SyncCenterPage /> };
    default:
      return { section: 'catalog', page: <CatalogDashboard /> };
  }
}
