import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../../../lib/api';
import {
  GOOGLE_TOOLS_CHANGED_EVENT,
  GOOGLE_TOOLS_MAIN_TABS,
  isGoogleToolProduct,
  type GoogleToolProduct,
  type GoogleToolsMainTab,
} from '../../../lib/googleTools';

export type GoogleProductRow = {
  product: GoogleToolProduct;
  status: string;
  connectionId: string | null;
  connectionEmail: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  syncCount: number;
  config: Record<string, unknown> | null;
};

export const googleToolsProductsQueryKey = ['google-tools', 'products'] as const;

async function fetchGoogleProducts(): Promise<GoogleProductRow[]> {
  const res = await api.getGoogleProducts();
  return (res.products ?? [])
    .filter((p) => isGoogleToolProduct(p.product))
    .map((p) => ({
      product: p.product as GoogleToolProduct,
      status: p.status,
      connectionId: p.connectionId,
      connectionEmail: p.connectionEmail,
      lastSyncAt: p.lastSyncAt,
      lastError: p.lastError,
      syncCount: p.syncCount,
      config: p.config,
    }));
}

export function useGoogleToolsProducts() {
  const query = useQuery({
    queryKey: googleToolsProductsQueryKey,
    queryFn: fetchGoogleProducts,
    staleTime: 60_000,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const onChanged = () => {
      void queryClient.invalidateQueries({ queryKey: googleToolsProductsQueryKey });
    };
    window.addEventListener(GOOGLE_TOOLS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(GOOGLE_TOOLS_CHANGED_EVENT, onChanged);
  }, [queryClient]);

  const connectedTools = (query.data ?? []).filter((p) => p.status === 'connected').map((p) => p.product);
  const connectedMainTabs = GOOGLE_TOOLS_MAIN_TABS.filter((tab) => connectedTools.includes(tab));

  const productByTool = (tool: GoogleToolsMainTab | GoogleToolProduct) =>
    (query.data ?? []).find((p) => p.product === tool && p.status === 'connected') ?? null;

  return {
    ...query,
    products: query.data ?? [],
    connectedTools,
    connectedMainTabs,
    productByTool,
    refresh: () => queryClient.invalidateQueries({ queryKey: googleToolsProductsQueryKey }),
  };
}
