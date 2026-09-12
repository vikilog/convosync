import { describe, expect, it } from 'vitest'

import {
  graphFromFlow,
  layoutVertical,
  needsVerticalLayout,
  nextStepPosition,
  spliceStepEdge,
  toFlowEdges,
  toFlowNodes,
} from './journeyGraph'
import type { JourneyGraph } from '@/services/realAutomations.service'

describe('journeyGraph', () => {
  it('preserves unknown backend node types on save', () => {
    const graph: JourneyGraph = {
      nodes: [
        { id: 't', type: 'TRIGGER', data: { event: 'contact.created' }, positionX: 0, positionY: 0 },
        { id: 'c', type: 'SEND_CAPI', data: { eventName: 'Purchase' }, positionX: 0, positionY: 100 },
      ],
      edges: [{ id: 'e', sourceNodeId: 't', targetNodeId: 'c', conditionValue: null }],
    }
    const nodes = toFlowNodes(graph)
    expect(nodes[1].data.kind).toBe('custom')
    expect(nodes[1].data.backendType).toBe('SEND_CAPI')
    const saved = graphFromFlow(nodes, [
      { id: 'e', source: 't', target: 'c', sourceHandle: undefined },
    ])
    expect(saved.nodes[1].type).toBe('SEND_CAPI')
    expect(saved.nodes[0].type).toBe('TRIGGER')
  })

  it('maps condition and button handles onto smoothstep edges', () => {
    const graph: JourneyGraph = {
      nodes: [
        { id: 'c', type: 'CONDITION', data: {}, positionX: 0, positionY: 0 },
        { id: 'y', type: 'UPDATE_TAG', data: {}, positionX: 0, positionY: 100 },
        { id: 'n', type: 'WEBHOOK', data: {}, positionX: 200, positionY: 100 },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'c', targetNodeId: 'y', conditionValue: 'yes' },
        { id: 'e2', sourceNodeId: 'c', targetNodeId: 'n', conditionValue: 'NO' },
      ],
    }
    const edges = toFlowEdges(graph)
    expect(edges[0]).toMatchObject({ sourceHandle: 'yes', type: 'smoothstep', target: 'y' })
    expect(edges[1]).toMatchObject({ sourceHandle: 'no', type: 'smoothstep', target: 'n' })
  })

  it('assigns unlabeled condition branches to yes then no', () => {
    const graph: JourneyGraph = {
      nodes: [
        { id: 'c', type: 'CONDITION', data: {}, positionX: 0, positionY: 0 },
        { id: 'a', type: 'WEBHOOK', data: {}, positionX: 0, positionY: 100 },
        { id: 'b', type: 'RANDOMIZER', data: { paths: [{ id: 'p1' }] }, positionX: 0, positionY: 200 },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'c', targetNodeId: 'a', conditionValue: null },
        { id: 'e2', sourceNodeId: 'c', targetNodeId: 'b', conditionValue: null },
      ],
    }
    const edges = toFlowEdges(graph)
    expect(edges.map((e) => e.sourceHandle)).toEqual(['yes', 'no'])
    expect(graphFromFlow(toFlowNodes(graph), edges).nodes[2].type).toBe('RANDOMIZER')
  })

  it('splices an existing edge when inserting a step', () => {
    const next = spliceStepEdge(
      [{ id: 'e', source: 'ask', target: 'cond', sourceHandle: undefined }],
      'ask',
      undefined,
      'mid'
    )
    expect(next).toHaveLength(2)
    expect(next[0]).toMatchObject({ source: 'ask', target: 'mid' })
    expect(next[1]).toMatchObject({ source: 'mid', target: 'cond' })
  })

  it('lays out yes left of no without overlap', () => {
    const graph: JourneyGraph = {
      nodes: [
        { id: 'c', type: 'CONDITION', data: {}, positionX: 0, positionY: 0 },
        { id: 'y', type: 'UPDATE_TAG', data: {}, positionX: 0, positionY: 0 },
        { id: 'n', type: 'WEBHOOK', data: {}, positionX: 0, positionY: 0 },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'c', targetNodeId: 'y', conditionValue: 'yes' },
        { id: 'e2', sourceNodeId: 'c', targetNodeId: 'n', conditionValue: 'no' },
      ],
    }
    const nodes = toFlowNodes(graph)
    const edges = toFlowEdges(graph)
    expect(needsVerticalLayout(nodes, edges)).toBe(true)
    const laid = layoutVertical(nodes, edges)
    const yes = laid.find((n) => n.id === 'y')!
    const no = laid.find((n) => n.id === 'n')!
    expect(yes.position.x).toBeLessThan(no.position.x)
    expect(Math.abs(yes.position.x - no.position.x)).toBeGreaterThanOrEqual(224)
  })

  it('offsets yes/no from the source when placing a new step', () => {
    const source = toFlowNodes({
      nodes: [{ id: 'c', type: 'CONDITION', data: {}, positionX: 300, positionY: 40 }],
      edges: [],
    })[0]
    expect(nextStepPosition(source, 'yes').x).toBeLessThan(300)
    expect(nextStepPosition(source, 'no').x).toBeGreaterThan(300)
  })
})
