import React from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export const META_ADS_CONNECT_ERROR_KEY = 'convosync_meta_ads_connect_error';
export const GOOGLE_ADS_CONNECT_ERROR_KEY = 'convosync_google_ads_connect_error';

export function readStoredConnectError(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function clearStoredConnectError(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function storeConnectError(key: string, message: string): void {
  try {
    sessionStorage.setItem(key, message);
  } catch {
    /* ignore */
  }
}

type IntegrationConnectErrorProps = {
  title: string;
  message: string;
  detail?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  onBack?: () => void;
  backLabel?: string;
};

export const IntegrationConnectError: React.FC<IntegrationConnectErrorProps> = ({
  title,
  message,
  detail,
  onRetry,
  retryLabel = 'Try again',
  retrying = false,
  onBack,
  backLabel = 'Back to integrations',
}) => (
  <div
    className="rounded-2xl border border-red-200 bg-red-50/80 p-6 space-y-4 max-w-2xl"
    role="alert"
  >
    <div className="flex items-start gap-3">
      <div className="p-2.5 rounded-xl bg-red-100 text-red-600 shrink-0">
        <AlertTriangle className="w-5 h-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-black text-red-950">{title}</h3>
        <p className="text-sm text-red-800 mt-1 leading-relaxed">{message}</p>
        {detail ? (
          <p className="text-xs text-red-700/90 mt-2 font-mono bg-white/70 border border-red-100 rounded-lg px-3 py-2 break-words">
            {detail}
          </p>
        ) : null}
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2 pt-1">
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Redirecting…' : retryLabel}
        </button>
      ) : null}
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-white text-sm font-bold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </button>
      ) : null}
    </div>
  </div>
);
