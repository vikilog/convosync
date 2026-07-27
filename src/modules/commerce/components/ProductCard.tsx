import React from 'react';
import { motion } from 'motion/react';
import { Eye, Send } from 'lucide-react';
import type { CommerceProduct } from '../types';
import { formatInr } from '../mock/data';
import { AiBadge, InventoryBadge, WhatsAppBadge } from './badges';

type Props = {
  product: CommerceProduct;
  onPreview?: () => void;
  onSend?: () => void;
  selected?: boolean;
};

export function ProductCard({ product, onPreview, onSend, selected }: Props) {
  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      className={`overflow-hidden rounded-xl border bg-surface transition-colors ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-black/5'
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-muted">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <WhatsAppBadge on={product.whatsappSynced} />
          <AiBadge status={product.aiStatus} />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-dark-navy">
            {product.name}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500">{product.sku}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-dark-navy">
            {formatInr(product.price)}
          </p>
          <InventoryBadge status={product.inventoryStatus} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-surface-muted"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={onSend}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </div>
    </motion.article>
  );
}
