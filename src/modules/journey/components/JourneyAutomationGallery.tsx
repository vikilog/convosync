import {
  HandHelping,
  MessageCircleHeart,
  MessagesSquare,
  Timer,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type { JourneyTemplate, JourneyTemplateCategory } from '../templates';
import { UNIVERSAL_JOURNEY_TEMPLATES } from '../templates';

const CATEGORY_ICON: Record<JourneyTemplateCategory, LucideIcon> = {
  welcome: MessageCircleHeart,
  support: HandHelping,
  nurture: Timer,
  sales: UserPlus,
};

type Props = {
  onSelect: (template: JourneyTemplate) => void;
  onStartBlank?: () => void;
  /** When true, page supplies its own title — only render the card grid. */
  hideHeader?: boolean;
};

export function JourneyAutomationGallery({
  onSelect,
  onStartBlank,
  hideHeader = false,
}: Props) {
  return (
    <section className="space-y-3">
      {!hideHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-gray-900">Automation gallery</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Universal WhatsApp starters — edit copy after you create. Publish, then assign chats to
              this journey.
            </p>
          </div>
          {onStartBlank ? (
            <button
              type="button"
              onClick={onStartBlank}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10"
            >
              <MessagesSquare className="w-3.5 h-3.5" />
              Start blank
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {UNIVERSAL_JOURNEY_TEMPLATES.map((template) => {
          const Icon = CATEGORY_ICON[template.category];
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className="group text-left rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 transition-colors hover:border-primary/35 hover:bg-primary/[0.08]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary">
                      {template.name}
                    </p>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      {template.triggerLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
