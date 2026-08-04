import { UNIVERSAL_JOURNEY_TEMPLATES } from './universal';
import { CONVOSYNC_JOURNEY_TEMPLATES } from './convosync';
import type { JourneyTemplate } from './types';

export type { JourneyTemplate, JourneyTemplateCategory } from './types';
export { UNIVERSAL_JOURNEY_TEMPLATES } from './universal';
export { CONVOSYNC_JOURNEY_TEMPLATES } from './convosync';

/** Gallery order: ConvoSync-branded first, then universal starters. */
export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  ...CONVOSYNC_JOURNEY_TEMPLATES,
  ...UNIVERSAL_JOURNEY_TEMPLATES,
];

export function getJourneyTemplate(id: string): JourneyTemplate | undefined {
  return JOURNEY_TEMPLATES.find((t) => t.id === id);
}
