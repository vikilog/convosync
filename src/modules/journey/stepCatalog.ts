import type { JourneyNodeType } from './types';

export type StepCatalogItem = {
  type: JourneyNodeType;
  label: string;
  description: string;
  category: 'messages' | 'logic' | 'contact' | 'conversation' | 'integrations' | 'flow';
  comingSoon?: boolean;
};

export const JOURNEY_STEP_CATALOG: StepCatalogItem[] = [
  {
    type: 'SEND_MESSAGE',
    label: 'Send a Message',
    description: 'Send a WhatsApp template or text message',
    category: 'messages',
  },
  {
    type: 'ASK_QUESTION',
    label: 'Ask a Question',
    description: 'Send a question and wait for the contact to reply',
    category: 'messages',
  },
  {
    type: 'ASSIGN_TO',
    label: 'Assign To',
    description: 'Assign the conversation to a user, AI, bot, or journey',
    category: 'conversation',
  },
  {
    type: 'CONDITION',
    label: 'Branch',
    description: 'Create workflow branches based on contact data',
    category: 'logic',
  },
  {
    type: 'UPDATE_FIELD',
    label: 'Update Contact Field',
    description: 'Modify contact name, email, or custom fields',
    category: 'contact',
  },
  {
    type: 'UPDATE_TAG',
    label: 'Update Contact Tag',
    description: 'Add, remove, or replace contact tags',
    category: 'contact',
  },
  {
    type: 'OPEN_CONVERSATION',
    label: 'Open Conversation',
    description: 'Reopen the contact conversation in the inbox',
    category: 'conversation',
  },
  {
    type: 'CLOSE_CONVERSATION',
    label: 'Close Conversation',
    description: 'Resolve the conversation with optional closing note',
    category: 'conversation',
  },
  {
    type: 'WAIT',
    label: 'Wait',
    description: 'Wait for a period of time before advancing',
    category: 'flow',
  },
  {
    type: 'SEND_CAPI',
    label: 'Send Conversions API Event',
    description: 'Send a Conversions API event to Meta',
    category: 'integrations',
    comingSoon: true,
  },
  {
    type: 'SEND_TIKTOK',
    label: 'Send TikTok Lower Funnel Event',
    description: 'Send a lower funnel event to TikTok',
    category: 'integrations',
    comingSoon: true,
  },
  {
    type: 'TRIGGER_JOURNEY',
    label: 'Trigger Another Workflow',
    description: 'Start another published journey for this contact',
    category: 'flow',
  },
  {
    type: 'WEBHOOK',
    label: 'HTTP Request',
    description: 'Send an HTTP request to an external endpoint',
    category: 'integrations',
  },
  {
    type: 'GOOGLE_SHEETS',
    label: 'Add Google Sheets Row',
    description: 'Append a row to a Google Sheet',
    category: 'integrations',
    comingSoon: true,
  },
  {
    type: 'UPDATE_LIFECYCLE',
    label: 'Update Lifecycle',
    description: "Update the contact's lifecycle stage",
    category: 'contact',
  },
  {
    type: 'AI_OBJECTIVE',
    label: 'AI Objective',
    description: 'Automate the conversation using an AI agent objective',
    category: 'messages',
    comingSoon: true,
  },
  {
    type: 'END',
    label: 'End',
    description: 'Finish the journey for this contact',
    category: 'flow',
  },
];

export const TRIGGER_PALETTE_ITEM: StepCatalogItem = {
  type: 'TRIGGER',
  label: 'Trigger',
  description: 'Start when an event occurs',
  category: 'flow',
};

export const STEP_CATEGORY_LABELS: Record<StepCatalogItem['category'], string> = {
  messages: 'Messages',
  logic: 'Logic',
  contact: 'Contact',
  conversation: 'Conversation',
  integrations: 'Integrations',
  flow: 'Flow',
};
