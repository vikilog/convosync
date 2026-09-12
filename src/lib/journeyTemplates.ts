import { defaultDataForKind } from '@/lib/journeyNodeTypes'
import type { JourneyGraph, JourneyGraphEdge, JourneyGraphNode } from '@/services/realAutomations.service'

export type JourneyTemplateCategory = 'welcome' | 'support' | 'nurture'

export type JourneyTemplate = {
  id: string
  name: string
  description: string
  category: JourneyTemplateCategory
  triggerLabel: string
  buildGraph: () => JourneyGraph
}

const COL_X = 80
const COL_GAP = 260
const ROW_Y = 80

function node(type: string, data: Record<string, unknown>, col: number): JourneyGraphNode {
  return {
    id: crypto.randomUUID(),
    type,
    data,
    positionX: COL_X + col * COL_GAP,
    positionY: ROW_Y,
  }
}

function chain(nodes: JourneyGraphNode[]): JourneyGraph {
  const edges: JourneyGraphEdge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: crypto.randomUUID(),
      sourceNodeId: nodes[i].id,
      targetNodeId: nodes[i + 1].id,
      conditionValue: null,
    })
  }
  return { nodes, edges }
}

export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    id: 'welcome-new-contact',
    name: 'Welcome new contacts',
    description: 'Greet a new contact and ask how you can help.',
    category: 'welcome',
    triggerLabel: 'Welcome',
    buildGraph: () =>
      chain([
        node('TRIGGER', { event: 'contact.created' }, 0),
        node(
          'SEND_MESSAGE',
          { text: "Hi {{contact.name}}! Thanks for messaging us. We're glad you're here." },
          1
        ),
        node('UPDATE_TAG', { action: 'add', tags: ['welcomed'] }, 2),
        node('ASK_QUESTION', { text: 'How can we help you today?' }, 3),
        node('END', {}, 4),
      ]),
  },
  {
    id: 'keyword-reply',
    name: 'Keyword reply',
    description: 'Reply when a WhatsApp message arrives, then wait for the next reply.',
    category: 'support',
    triggerLabel: 'Keyword / message',
    buildGraph: () =>
      chain([
        node('TRIGGER', defaultDataForKind('trigger', 'whatsapp'), 0),
        node(
          'SEND_MESSAGE',
          { text: "Thanks {{contact.name}} — we've got your message. How can we help?" },
          1
        ),
        node('ASK_QUESTION', { text: 'Reply with your question and a teammate will pick it up.' }, 2),
        node('END', {}, 3),
      ]),
  },
  {
    id: 'ack-and-handoff',
    name: 'Acknowledge and hand off',
    description: 'Confirm the message, open the inbox, and leave the chat unassigned.',
    category: 'support',
    triggerLabel: 'Keyword / message',
    buildGraph: () =>
      chain([
        node('TRIGGER', { event: 'message.received' }, 0),
        node(
          'SEND_MESSAGE',
          { text: "Thanks {{contact.name}} — we've got your message. Connecting you with our team now." },
          1
        ),
        node('ASSIGN_TO', { assigneeType: 'unassigned', assigneeId: '' }, 2),
        node('OPEN_CONVERSATION', {}, 3),
        node('END', {}, 4),
      ]),
  },
  {
    id: 'simple-nurture',
    name: 'Simple nurture drip',
    description: 'Send a follow-up after a short wait.',
    category: 'nurture',
    triggerLabel: 'Keyword / message',
    buildGraph: () =>
      chain([
        node('TRIGGER', { event: 'message.received' }, 0),
        node(
          'SEND_MESSAGE',
          { text: "Hi {{contact.name}}! Here's a quick tip to get started. Reply anytime." },
          1
        ),
        node('WAIT', { amount: 1, unit: 'days' }, 2),
        node('SEND_MESSAGE', { text: 'Just checking in — anything we can help with today?' }, 3),
        node('END', {}, 4),
      ]),
  },
]

export function getJourneyTemplate(id: string): JourneyTemplate | undefined {
  return JOURNEY_TEMPLATES.find((t) => t.id === id)
}
