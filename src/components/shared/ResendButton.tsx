/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

type Props = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  /** compact = icon+label for bubbles; row = table action */
  size?: 'compact' | 'row';
};

/** Shared Resend control for inbox bubbles and campaign failed rows. */
export const ResendButton: React.FC<Props> = ({
  onClick,
  disabled,
  loading,
  className = '',
  size = 'compact',
}) => {
  const base =
    size === 'row'
      ? 'inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-colors'
      : 'inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${className}`.trim()}
      title="Resend"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
      ) : (
        <RotateCcw className="w-3 h-3" aria-hidden />
      )}
      Resend
    </button>
  );
};
