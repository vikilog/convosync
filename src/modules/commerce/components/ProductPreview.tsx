import React from 'react';
import type { CommerceProduct } from '../types';
import { formatInr } from '../mock/data';

type Props = {
  product: CommerceProduct;
  compact?: boolean;
};

/** Customer-facing product card preview (what gets sent). */
export function ProductPreview({ product, compact }: Props) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-black/5 bg-surface ${
        compact ? 'max-w-[260px]' : 'max-w-sm'
      }`}
    >
      <img
        src={product.images[0]}
        alt={product.name}
        className={`w-full object-cover ${compact ? 'aspect-[4/3]' : 'aspect-square'}`}
      />
      <div className="space-y-2 p-4">
        <p className="text-sm font-semibold text-dark-navy">{product.name}</p>
        <p className="text-base font-bold text-primary">{formatInr(product.price)}</p>
        <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">
          {product.shortDescription}
        </p>
        <button
          type="button"
          className="mt-2 w-full rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white hover:bg-primary-hover"
        >
          View Product
        </button>
      </div>
    </div>
  );
}
