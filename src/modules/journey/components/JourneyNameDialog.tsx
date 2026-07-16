import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  initialName?: string;
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
};

export function JourneyNameDialog({
  open,
  title,
  description,
  initialName = '',
  confirmLabel = 'Continue',
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setError(null);
    }
  }, [open, initialName]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Journey name is required.');
      return;
    }
    if (trimmed.length > 200) {
      setError('Name must be 200 characters or less.');
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-labelledby="journey-name-dialog-title"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h2 id="journey-name-dialog-title" className="text-sm font-black text-gray-900">
                  {title}
                </h2>
                {description && (
                  <p className="text-meta text-gray-500 mt-0.5">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="block">
                <span className="text-sm font-bold text-gray-700">Journey name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  autoFocus
                  placeholder="e.g. Welcome new contacts"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </label>
              {error && (
                <p className="text-sm font-semibold text-rose-600">{error}</p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-bold text-gray-600 rounded-lg border border-slate-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-black text-white rounded-full bg-channel-green disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
