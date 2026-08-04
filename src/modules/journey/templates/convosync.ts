import type { JourneyGraph, JourneyGraphEdge, JourneyGraphNode, JourneyNodeType } from '../types';
import { DEFAULT_NODE_DATA } from '../types';
import { newEdgeId, newNodeId } from '../hooks/useJourneyGraph';
import type { JourneyTemplate } from './types';

const COL_X = 80;
const COL_GAP = 260;
const ROW_Y = 140;

function node(
  type: JourneyNodeType,
  data: Record<string, unknown>,
  col: number,
  row = 0
): JourneyGraphNode {
  return {
    id: newNodeId(),
    type,
    data: { ...DEFAULT_NODE_DATA[type], ...data },
    positionX: COL_X + col * COL_GAP,
    positionY: ROW_Y + row * 160,
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

/** First-reply automation for ConvoSync’s own inbound customers / trials. */
function convosyncCustomerCareGraph(): JourneyGraph {
  return chain([
    node(
      'TRIGGER',
      {
        event: 'message.received',
      },
      0
    ),
    node(
      'SEND_MESSAGE',
      {
        messageMode: 'text',
        text: `Hi {{contact.name}}! Welcome to ConvoSync — AI-powered customer engagement for WhatsApp, Instagram, and more.

I can help with:
• Connecting WhatsApp / Instagram
• Inbox, templates & campaigns
• AI agents & journeys
• Wallet, billing & trial

Reply with a number (1–4) or describe your issue.`,
      },
      1
    ),
    node(
      'UPDATE_TAG',
      {
        action: 'add',
        tags: ['convosync_customer', 'cs_inbound'],
      },
      2
    ),
    node(
      'ASK_QUESTION',
      {
        text: `What do you need help with?

1️⃣ Connect a channel (WhatsApp / Instagram / Messenger)
2️⃣ Billing, wallet & pricing
3️⃣ AI agents, journeys & automations
4️⃣ Talk to a human

Reply with 1, 2, 3, or 4.`,
        saveReplyTo: 'last_reply',
      },
      3
    ),
    node(
      'SEND_MESSAGE',
      {
        messageMode: 'text',
        text: `Thanks {{contact.name}} — I've noted that.

Quick links while you wait:
• Pricing → https://www.convosync.io/pricing
• Book a demo → https://www.convosync.io/demo
• Product site → https://www.convosync.io

A ConvoSync teammate will pick this up shortly.`,
      },
      4
    ),
    node('UPDATE_LIFECYCLE', { stage: 'support' }, 5),
    node('ASSIGN_TO', { assigneeType: 'unassigned', assigneeId: '' }, 6),
    node('OPEN_CONVERSATION', {}, 7),
    node('END', {}, 8),
  ]);
}

/** Light nurture for new ConvoSync trials after first message. */
function convosyncTrialOnboardGraph(): JourneyGraph {
  return chain([
    node(
      'TRIGGER',
      {
        event: 'message.received',
      },
      0
    ),
    node(
      'SEND_MESSAGE',
      {
        messageMode: 'text',
        text: `Hey {{contact.name}} 👋 Glad you're trying ConvoSync!

Day-1 tip: connect WhatsApp (or Instagram) under Integrations, then open Inbox — your team can reply from one place.

Stuck on Meta signup? Reply with the exact error text and we'll help.`,
      },
      1
    ),
    node('UPDATE_TAG', { action: 'add', tags: ['trial_onboarding', 'convosync_customer'] }, 2),
    node('WAIT', { amount: 1, unit: 'days' }, 3),
    node(
      'SEND_MESSAGE',
      {
        messageMode: 'text',
        text: `Quick check-in, {{contact.name}} —

Have you tried:
• Approving a WhatsApp template
• Creating a Journey from Automation gallery
• Topping up wallet for AI usage

Reply "help" anytime, or book a walkthrough: https://www.convosync.io/demo`,
      },
      4
    ),
    node('UPDATE_TAG', { action: 'add', tags: ['trial_day2_sent'] }, 5),
    node('END', {}, 6),
  ]);
}

export const CONVOSYNC_JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    id: 'convosync_customer_care',
    name: 'ConvoSync customer care',
    description:
      'Greet ConvoSync customers, menu for setup / billing / AI / human, tag & hand off to your team.',
    category: 'support',
    triggerLabel: 'Message received',
    buildGraph: convosyncCustomerCareGraph,
  },
  {
    id: 'convosync_trial_onboard',
    name: 'ConvoSync trial onboard',
    description:
      'Day-1 tip after first message, wait 1 day, then check-in with product next steps.',
    category: 'nurture',
    triggerLabel: 'Message received',
    buildGraph: convosyncTrialOnboardGraph,
  },
];
