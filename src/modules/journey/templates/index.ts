import { UNIVERSAL_JOURNEY_TEMPLATES } from './universal';
import type { JourneyTemplate } from './types';

export type { JourneyTemplate, JourneyTemplateCategory } from './types';
export { UNIVERSAL_JOURNEY_TEMPLATES };

export function getJourneyTemplate(id: string): JourneyTemplate | undefined {
  return UNIVERSAL_JOURNEY_TEMPLATES.find((t) => t.id === id);
}
