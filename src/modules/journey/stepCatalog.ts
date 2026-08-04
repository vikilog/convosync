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
    type: 'BUTTONS',
    label: 'Buttons',
    description: 'Send a message with reply buttons and branch by choice',
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
    label: 'Condition',
    description: 'Branch the workflow when a contact matches a condition',
    category: 'logic',
  },
  {
    type: 'RANDOMIZER',
    label: 'Randomizer',
    description: 'Split contacts randomly across weighted paths',
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
    type: 'ADD_TO_FUNNEL',
    label: 'Add to Funnel',
    description: 'Capture this contact as a lead in a funnel board',
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
    type: 'GOTO_STEP',
    label: 'Go to Step',
    description: 'Jump to another step in this same automation',
    category: 'flow',
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
    type: 'UPDATE_LIFECYCLE',
    label: 'Update Lifecycle',
    description: "Update the contact's lifecycle stage",
    category: 'contact',
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
