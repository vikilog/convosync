export type JourneyStatus = 'draft' | 'published';

export type JourneyNodeType =
  | 'TRIGGER'
  | 'SEND_MESSAGE'
  | 'ASK_QUESTION'
  | 'BUTTONS'
  | 'SEND_FLOW'
  | 'ASSIGN_TO'
  | 'WAIT'
  | 'GOTO_STEP'
  | 'CONDITION'
  | 'RANDOMIZER'
  | 'UPDATE_FIELD'
  | 'WEBHOOK'
  | 'UPDATE_TAG'
  | 'ADD_TO_FUNNEL'
  | 'OPEN_CONVERSATION'
  | 'CLOSE_CONVERSATION'
  | 'TRIGGER_JOURNEY'
  | 'UPDATE_LIFECYCLE'
  | 'SEND_CAPI'
  | 'SEND_TIKTOK'
  | 'GOOGLE_SHEETS'
  | 'AI_OBJECTIVE'
  | 'END';

export type JourneyRecord = {
  id: string;
  name: string;
  status: JourneyStatus;
  createdAt: string;
  updatedAt: string;
  /** From TRIGGER node — e.g. message.received */
  triggerEvent?: string | null;
  _count?: { executions: number; nodes: number };
};

export type JourneyGraphNode = {
  id: string;
  type: JourneyNodeType;
  data: Record<string, unknown>;
  positionX: number;
  positionY: number;
};

export type JourneyGraphEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  conditionValue?: string | null;
};

export type JourneyGraph = {
  nodes: JourneyGraphNode[];
  edges: JourneyGraphEdge[];
};

export type JourneyAnalytics = {
  metrics: Record<'sent' | 'delivered' | 'read' | 'clicked' | 'replied', number>;
  executions: Record<string, number>;
};

export type WebhookResponseMapping = {
  jsonPath: string;
  attributeKey: string;
};

export const NODE_LABELS: Record<JourneyNodeType, string> = {
  TRIGGER: 'Trigger',
  SEND_MESSAGE: 'Send Message',
  ASK_QUESTION: 'Ask Question',
  BUTTONS: 'Buttons',
  SEND_FLOW: 'Send Flow',
  ASSIGN_TO: 'Assign To',
  WAIT: 'Wait',
  GOTO_STEP: 'Go to Step',
  CONDITION: 'Condition',
  RANDOMIZER: 'Randomizer',
  UPDATE_FIELD: 'Update Field',
  WEBHOOK: 'HTTP Request',
  UPDATE_TAG: 'Update Tag',
  ADD_TO_FUNNEL: 'Add to Funnel',
  OPEN_CONVERSATION: 'Open Conversation',
  CLOSE_CONVERSATION: 'Close Conversation',
  TRIGGER_JOURNEY: 'Trigger Journey',
  UPDATE_LIFECYCLE: 'Update Lifecycle',
  SEND_CAPI: 'Meta CAPI',
  SEND_TIKTOK: 'TikTok Event',
  GOOGLE_SHEETS: 'Google Sheets',
  AI_OBJECTIVE: 'AI Objective',
  END: 'End',
};

export const TRIGGER_EVENTS = [
  { value: 'contact.created', label: 'Contact created' },
  { value: 'contact.tag_added', label: 'Tag added' },
  { value: 'message.received', label: 'Message received' },
  { value: 'conversation.opened', label: 'Conversation opened' },
  { value: 'manual', label: 'Manual trigger' },
] as const;

export const CONDITION_OPERATORS = ['=', '!=', '>', '<', 'contains'] as const;

export const CONTACT_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'journeyStatus', label: 'Lifecycle stage' },
  { value: 'custom', label: 'Custom field' },
] as const;

export const ASSIGNEE_TYPES = [
  { value: 'user', label: 'Team member' },
  { value: 'ai', label: 'AI Copilot' },
  { value: 'rule_based', label: 'Rule-based bot' },
  { value: 'journey', label: 'Journey' },
  { value: 'unassigned', label: 'Unassigned' },
] as const;

export const DEFAULT_NODE_DATA: Record<JourneyNodeType, Record<string, unknown>> = {
  TRIGGER: {
    event: 'message.received',
  },
  SEND_MESSAGE: {
    messageMode: 'text',
    text: '',
    templateName: '',
    templateId: '',
    language: 'en',
    variables: [],
    simulateTyping: false,
  },
  ASK_QUESTION: {
    text: '',
    saveReplyTo: 'last_reply',
    quickCollect: false,
    simulateTyping: false,
  },
  BUTTONS: {
    text: '',
    buttons: [
      { id: 'btn_a', title: 'Option A' },
      { id: 'btn_b', title: 'Option B' },
    ],
    simulateTyping: false,
  },
  SEND_FLOW: {
    flowId: '',
    text: '',
    ctaLabel: 'Open',
    headerText: '',
    saveFieldsPrefix: 'flow_',
    mapNameField: '',
    mapPhoneField: '',
    mapEmailField: '',
    funnelId: '',
    stageId: '',
  },
  ASSIGN_TO: { assigneeType: 'user', assigneeId: '' },
  WAIT: {
    amount: 1,
    unit: 'hours',
    businessHours: {
      enabled: false,
      startTime: '08:00',
      endTime: '22:00',
      daysOfWeek: [],
    },
  },
  GOTO_STEP: { targetNodeId: '' },
  CONDITION: {
    combinator: 'all',
    conditions: [{ type: 'field', field: 'contact.name', operator: 'contains', value: '' }],
  },
  RANDOMIZER: {
    paths: [
      { id: 'a', label: 'Path A', weight: 50 },
      { id: 'b', label: 'Path B', weight: 50 },
    ],
  },
  UPDATE_FIELD: { field: 'name', value: '', customFieldKey: '' },
  WEBHOOK: {
    name: '',
    method: 'POST',
    url: '',
    headers: {},
    body: '',
    timeoutMs: 15000,
    retries: 2,
    responseMappings: [],
  },
  UPDATE_TAG: { action: 'add', tags: [] },
  ADD_TO_FUNNEL: { funnelId: '', stageId: '' },
  OPEN_CONVERSATION: {},
  CLOSE_CONVERSATION: { closingNote: '' },
  TRIGGER_JOURNEY: { journeyId: '' },
  UPDATE_LIFECYCLE: { stage: '' },
  SEND_CAPI: { eventName: 'Purchase', pixelId: '' },
  SEND_TIKTOK: { eventName: 'CompletePayment' },
  GOOGLE_SHEETS: { spreadsheetId: '', sheetName: 'Sheet1' },
  AI_OBJECTIVE: { agentId: '', objective: '' },
  END: {},
};
