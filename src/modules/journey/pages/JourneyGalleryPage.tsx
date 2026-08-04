import { ArrowLeft, LayoutGrid, MessagesSquare } from 'lucide-react';
import { JourneyAutomationGallery } from '../components/JourneyAutomationGallery';
import type { JourneyTemplate } from '../templates';

type Props = {
  onBack: () => void;
  onSelectTemplate: (template: JourneyTemplate) => void;
  onStartBlank: () => void;
};

export function JourneyGalleryPage({ onBack, onSelectTemplate, onStartBlank }: Props) {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 p-2 rounded-xl border border-primary/15 bg-primary/5 text-primary hover:bg-primary/10"
            aria-label="Back to journeys"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-black text-gray-950 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              Automation gallery
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              ConvoSync customer care plus universal starters — edit copy, publish, assign chats.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartBlank}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10"
        >
          <MessagesSquare className="w-4 h-4" />
          Start blank
        </button>
      </div>

      <JourneyAutomationGallery
        onSelect={onSelectTemplate}
        onStartBlank={onStartBlank}
        hideHeader
      />
    </div>
  );
}
