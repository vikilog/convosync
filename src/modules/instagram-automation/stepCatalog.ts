import type { IgJourneyNodeType } from './types';

export type StepCatalogItem = {
  type: IgJourneyNodeType;
  label: string;
  description: string;
  category: 'messages' | 'logic' | 'contact' | 'conversation' | 'integrations' | 'flow';
};

export const IG_STEP_CATALOG: StepCatalogItem[] = [
  {
    type: 'SEND_MESSAGE',
    label: 'Send a Message',
    description: 'Send a text message in Instagram DM',
    category: 'messages',
  },
  {
    type: 'ASK_QUESTION',
    label: 'Ask a Question',
    description: 'Send a question with quick reply buttons',
    category: 'messages',
  },
  {
    type: 'BUTTONS',
    label: 'Buttons',
    description: 'Send a message with buttons and branch by choice',
    category: 'messages',
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
    type: 'UPDATE_TAG',
    label: 'Update Contact Tag',
    description: 'Add, remove, or replace contact tags',
    category: 'contact',
  },
  {
    type: 'UPDATE_FIELD',
    label: 'Update Contact Field',
    description: 'Modify contact name, email, or custom fields',
    category: 'contact',
  },
  {
    type: 'ADD_TO_FUNNEL',
    label: 'Add to Funnel',
    description: 'Capture this contact as a lead in a funnel board',
    category: 'contact',
  },
  {
    type: 'ASSIGN_TO',
    label: 'Assign To',
    description: 'Assign the conversation to a team member',
    category: 'conversation',
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
    type: 'WEBHOOK',
    label: 'HTTP Request',
    description: 'Send an HTTP request to an external endpoint',
    category: 'integrations',
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
    label: 'Trigger Another Automation',
    description: 'Start another published Instagram automation',
    category: 'flow',
  },
  {
    type: 'END',
    label: 'End',
    description: 'Finish the automation for this contact',
    category: 'flow',
  },
];

export const TRIGGER_PALETTE_ITEM: StepCatalogItem = {
  type: 'TRIGGER',
  label: 'Trigger',
  description: 'Start when a DM or comment is received',
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
