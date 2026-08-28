import { Facebook } from 'lucide-react';

export type FacebookPageConnectCandidate = {
  pageId: string;
  pageName: string;
  category?: string;
  picture?: string;
};

type FacebookPagePickerProps = {
  pages: FacebookPageConnectCandidate[];
  selectedPageId: string | null;
  onSelect: (pageId: string) => void;
  onConfirm: () => void;
  confirming?: boolean;
  error?: string;
};

export function FacebookPagePicker({
  pages,
  selectedPageId,
  onSelect,
  onConfirm,
  confirming = false,
  error,
}: FacebookPagePickerProps) {
  const canConfirm = Boolean(selectedPageId) && !confirming;

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-swiss-line bg-white p-6 ">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f4ff] text-[#1877F2]">
          <Facebook className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {pages.length > 1 ? 'Choose a Facebook Page' : 'Confirm Facebook Page'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {pages.length > 1
              ? 'Your Meta login manages multiple Facebook Pages. Select the one to connect to this workspace.'
              : 'Confirm the Facebook Page below to connect it to this workspace.'}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {pages.map((page) => {
          const selected = selectedPageId === page.pageId;
          return (
            <button
              key={page.pageId}
              type="button"
              onClick={() => onSelect(page.pageId)}
              className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? 'border-[#1877F2]/40 bg-[#e8f4ff]'
                  : 'border-swiss-line bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {page.picture ? (
                  <img
                    src={page.picture}
                    alt=""
                    className="h-10 w-10 rounded-lg border border-swiss-line object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f4ff] text-[#1877F2]">
                    <Facebook className="h-4 w-4" aria-hidden />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{page.pageName}</p>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">
                    {page.category || 'Facebook Page'}
                  </p>
                </div>

                <span
                  className={`h-4 w-4 shrink-0 rounded-full border ${
                    selected ? 'border-[#1877F2] bg-[#1877F2]' : 'border-slate-300 bg-white'
                  }`}
                  aria-hidden
                />
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!canConfirm}
        onClick={onConfirm}
        className="mt-5 w-full cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {confirming ? 'Connecting…' : 'Connect selected Page'}
      </button>
    </div>
  );
}
