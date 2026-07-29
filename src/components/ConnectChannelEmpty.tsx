import { Plug } from 'lucide-react';

type Props = {
  onConnect: () => void;
  title?: string;
  description?: string;
  ctaLabel?: string;
};

export function ConnectChannelEmpty({
  onConnect,
  title = 'Connect a channel first',
  description = 'Connect WhatsApp, Instagram, or Messenger to get started.',
  ctaLabel = 'Go to Integrations',
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center h-full min-h-0">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Plug className="h-6 w-6" strokeWidth={2} />
      </div>
      <div className="max-w-sm space-y-1.5">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-sm font-medium text-slate-500 leading-snug">{description}</p>
      </div>
      <button
        type="button"
        onClick={onConnect}
        className="inline-flex items-center gap-2 rounded-lg bg-channel-green px-4 py-2.5 text-sm font-bold text-white hover:bg-[#20bd5a] transition-colors"
      >
        <Plug className="h-4 w-4" />
        {ctaLabel}
      </button>
    </div>
  );
}
