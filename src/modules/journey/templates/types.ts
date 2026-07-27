import type { JourneyGraph } from '../types';

export type JourneyTemplateCategory = 'welcome' | 'support' | 'nurture' | 'sales';

export type JourneyTemplate = {
  id: string;
  name: string;
  description: string;
  category: JourneyTemplateCategory;
  triggerLabel: string;
  buildGraph: () => JourneyGraph;
};
