import type { JourneyGraph, JourneyGraphEdge, JourneyGraphNode, JourneyNodeType } from '../types';
import { DEFAULT_NODE_DATA } from '../types';
import { newEdgeId, newNodeId } from '../hooks/useJourneyGraph';
import type { JourneyTemplate } from './types';

const COL_X = 80;
const COL_GAP = 280;
const ROW_Y = 140;

function node(
  type: JourneyNodeType,
  data: Record<string, unknown>,
  col: number
): JourneyGraphNode {
  return {
    id: newNodeId(),
    type,
    data: { ...DEFAULT_NODE_DATA[type], ...data },
    positionX: COL_X + col * COL_GAP,
    positionY: ROW_Y,
  };
}

function chain(nodes: JourneyGraphNode[]): JourneyGraph {
  const edges: JourneyGraphEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: newEdgeId(),
      sourceNodeId: nodes[i].id,
      targetNodeId: nodes[i + 1].id,
      conditionValue: null,
    });
  }
  return { nodes, edges };
}

function welcomeReplyGraph(): JourneyGraph {
  return chain([
    node('TRIGGER', { event: 'message.received' }, 0),
    node(
      'SEND_MESSAGE',
      {
        messageMode: 'text',
        text: "Hi {{contact.name}}! Thanks for messaging us. We're glad you're here.",
      },
      1
    ),
    node('UPDATE_TAG', { action: 'add', tags: ['welcomed'] }, 2),
    node('ASK_QUESTION', { text: 'How can we help you today?' }, 3),
    node('END', {}, 4),
  ]);
}

function ackAndHandoffGraph(): JourneyGraph {
  return chain([
    node('TRIGGER', { event: 'message.received' }, 0),
    node(
      'SEND_MESSAGE',
      {
        messageMode: 'text',
        text: "Thanks {{contact.name}} — we've got your message. Connecting you with our team now.",
      },
      1
    ),
    node('ASSIGN_TO', { assigneeType: 'unassigned', assigneeId: '' }, 2),
    node('OPEN_CONVERSATION', {}, 3),
    node('END', {}, 4),
  ]);
}

function simpleDripGraph(): JourneyGraph {
  return chain([
    node('TRIGGER', { event: 'message.received' }, 0),
    node(
      'SEND_MESSAGE',
      {
        messageMode: 'text',
        text: "Hi {{contact.name}}! Here's a quick tip to get started with us. Reply anytime if you have questions.",
      },
      1
    ),
    node('WAIT', { amount: 1, unit: 'days' }, 2),
    node(
      'SEND_MESSAGE',
      {
        messageMode: 'text',
        text: "Just checking in, {{contact.name}} — still interested? We're here to help.",
      },
      3
    ),
    node('UPDATE_TAG', { action: 'add', tags: ['nurture_sent'] }, 4),
    node('END', {}, 5),
  ]);
}

function leadCaptureGraph(): JourneyGraph {
  return chain([
    node('TRIGGER', { event: 'message.received' }, 0),
    node(
      'ASK_QUESTION',
      {
        text: 'Thanks for reaching out! What are you looking for, and what’s the best way to reach you?',
      },
      1
    ),
    node('UPDATE_TAG', { action: 'add', tags: ['lead'] }, 2),
    node('ASSIGN_TO', { assigneeType: 'unassigned', assigneeId: '' }, 3),
    node('END', {}, 4),
  ]);
}

function quietAckGraph(): JourneyGraph {
  return chain([
    node('TRIGGER', { event: 'message.received' }, 0),
    node(
      'SEND_MESSAGE',
      {
        messageMode: 'text',
        text: 'Hi {{contact.name}} — we received your message and will get back to you shortly.',
      },
      1
    ),
    node('WAIT', { amount: 30, unit: 'minutes' }, 2),
    node('OPEN_CONVERSATION', {}, 3),
    node('END', {}, 4),
  ]);
}

export const UNIVERSAL_JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    id: 'welcome_reply',
    name: 'Welcome reply',
    description: 'Greet the contact, tag them, then ask how you can help.',
    category: 'welcome',
    triggerLabel: 'Message received',
    buildGraph: welcomeReplyGraph,
  },
  {
    id: 'ack_and_handoff',
    name: 'Ack + human handoff',
    description: 'Send a short acknowledgement and open the chat for your team.',
    category: 'support',
    triggerLabel: 'Message received',
    buildGraph: ackAndHandoffGraph,
  },
  {
    id: 'simple_drip',
    name: '2-step follow-up',
    description: 'Send a tip now, wait one day, then check in and tag the contact.',
    category: 'nurture',
    triggerLabel: 'Message received',
    buildGraph: simpleDripGraph,
  },
  {
    id: 'lead_capture',
    name: 'Lead capture',
    description: 'Ask what they need, tag as lead, and queue for a teammate.',
    category: 'sales',
    triggerLabel: 'Message received',
    buildGraph: leadCaptureGraph,
  },
  {
    id: 'quiet_ack',
    name: 'Quick ack then wait',
    description: 'Acknowledge immediately, wait 30 minutes, then open the conversation.',
    category: 'support',
    triggerLabel: 'Message received',
    buildGraph: quietAckGraph,
  },
];
