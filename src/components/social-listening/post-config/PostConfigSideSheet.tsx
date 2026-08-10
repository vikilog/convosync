import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { PostConfigurationPanel } from './PostConfigurationPanel';

export function PostConfigSideSheet({
  open,
  postId,
  postCaption,
  onClose,
  onOpenPost,
}: {
  open: boolean;
  postId: string | null;
  postCaption?: string | null;
  onClose: () => void;
  onOpenPost?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && postId && (
        <>
          <motion.button
            type="button"
            aria-label="Close insights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 cursor-pointer bg-gray-900/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[520px] flex-col bg-white p-3 shadow-2xl sm:p-4"
          >
            <div className="mb-2 flex shrink-0 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <PostConfigurationPanel
                key={postId}
                postId={postId}
                postCaption={postCaption}
                onOpenPost={onOpenPost}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
