import { Sparkles } from 'lucide-react';

type AppLoadingScreenProps = {
  message?: string;
  brand?: string;
  variant?: 'fullscreen' | 'card';
  title?: string;
};

function AnimatedLoader({ compact = false }: { compact?: boolean }) {
  const size = compact ? 'h-16 w-16' : 'h-28 w-28';
  const iconSize = compact ? 'h-7 w-7' : 'h-8 w-8';
  const innerSize = compact ? 'h-11 w-11' : 'h-16 w-16';

  return (
    <div className={`relative flex ${size} items-center justify-center`}>
      <div
        aria-hidden
        className="app-loader-glow absolute inset-0 rounded-full bg-primary/20 blur-xl"
      />

      <div
        aria-hidden
        className="app-loader-ring absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/30"
      />
      <div
        aria-hidden
        className="app-loader-ring-reverse absolute inset-2 rounded-full border-2 border-transparent border-b-sky-400 border-l-sky-400/40"
      />
      {!compact && (
        <div
          aria-hidden
          className="app-loader-ring absolute inset-4 rounded-full border border-dashed border-primary/25"
          style={{ animationDuration: '3s' }}
        />
      )}

      <div
        className={`app-loader-pulse relative flex ${innerSize} items-center justify-center rounded-2xl border border-primary/20 bg-white shadow-[0_8px_32px_rgba(2,132,199,0.16)]`}
      >
        <Sparkles className={`${iconSize} text-primary`} strokeWidth={2} />
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5 pl-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="app-loader-dot inline-block h-1 w-1 rounded-full bg-primary"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function isLoadingMessage(message: string) {
  return /…|\.\.\.$|ing…?$|ing\.\.\.$/i.test(message.trim());
}

export function AppLoadingScreen({
  message = 'Loading',
  brand = 'WaBiz',
  variant = 'fullscreen',
  title,
}: AppLoadingScreenProps) {
  if (variant === 'card') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex justify-center">
            <AnimatedLoader compact />
          </div>
          {title ? (
            <h1 className="text-lg font-black text-gray-950">{title}</h1>
          ) : null}
          <p className={`text-sm font-medium text-gray-600 ${title ? 'mt-2' : ''}`}>
            {message}
            {isLoadingMessage(message) ? <LoadingDots /> : null}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-loader relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50">
      <div
        aria-hidden
        className="app-loader-orb pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="app-loader-orb pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl"
        style={{ animationDelay: '-3s' }}
      />
      <div
        aria-hidden
        className="app-loader-orb pointer-events-none absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/5 blur-2xl"
        style={{ animationDelay: '-5s' }}
      />

      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="mb-8">
          <AnimatedLoader />
        </div>

        <p className="font-display text-sm font-semibold tracking-wide text-slate-900">{brand}</p>
        <p className="mt-2 flex items-center gap-0.5 text-xs font-medium text-gray-500">
          {message}
          <LoadingDots />
        </p>

        <div
          className="mt-6 h-1 w-36 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label="Loading"
        >
          <div className="app-loader-bar h-full w-2/5 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      </div>
    </div>
  );
}
