/**
 * /c/:code → resolve short guest link → /call/{id}?t=…
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../../lib/brand';

export function CallShortRedirectPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!code) {
        setError('Invalid link');
        return;
      }
      try {
        const { redirectUrl, callId } = await api.resolveGuestShortCode(code);
        if (cancelled) return;
        if (redirectUrl.startsWith('http')) {
          const u = new URL(redirectUrl);
          navigate(`${u.pathname}${u.search}`, { replace: true });
        } else if (redirectUrl.startsWith('/')) {
          navigate(redirectUrl, { replace: true });
        } else {
          navigate(`/call/${callId}`, { replace: true });
        }
      } catch (err) {
        if (!cancelled) setError(formatCatchError(err));
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 0%, #d1fae5 0%, transparent 55%), linear-gradient(180deg, #f0fdf4 0%, #f8faf9 100%)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-8">
        <img src={PRODUCT_LOGO} alt="" className="h-9 w-9 object-contain" />
        <span className="font-display text-lg font-bold text-slate-900">{PRODUCT_NAME}</span>
      </div>
      {error ? (
        <div className="max-w-sm text-center space-y-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-emerald-900/5">
          <p className="text-sm font-bold text-red-600">{error}</p>
          <p className="text-xs text-slate-500">Ask the business to send a new call link.</p>
          <Link to="/" className="text-sm font-semibold text-emerald-700 underline">
            Home
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-channel-green" />
          <p className="text-sm font-medium">Opening call…</p>
        </div>
      )}
    </div>
  );
}
