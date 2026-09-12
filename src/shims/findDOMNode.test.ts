import { describe, expect, it } from 'vitest'
import * as ReactDOM from 'react-dom'

import { createPortal } from './react-dom'
import { findDOMNode } from './findDOMNode'

const reactDom = ReactDOM as typeof ReactDOM & {
  findDOMNode: typeof findDOMNode
  createPortal: typeof createPortal
  default?: { findDOMNode?: typeof findDOMNode; createPortal?: typeof createPortal }
}

describe('findDOMNode', () => {
  it('returns a DOM node as-is', () => {
    const el = document.createElement('div')
    expect(findDOMNode(el)).toBe(el)
    const text = document.createTextNode('hi')
    expect(findDOMNode(text)).toBe(text)
  })

  it('returns null for nullish values', () => {
    expect(findDOMNode(null)).toBeNull()
    expect(findDOMNode(undefined)).toBeNull()
  })

  it('returns null for a plain object', () => {
    expect(findDOMNode({})).toBeNull()
  })

  it('walks a class-instance fiber for a host stateNode', () => {
    const el = document.createElement('span')
    expect(findDOMNode({ _reactInternals: { child: { stateNode: el } } })).toBe(el)
    expect(findDOMNode({ _reactInternalFiber: { stateNode: el } })).toBe(el)
  })

  it('is a named export and default property of react-dom', () => {
    expect(typeof reactDom.findDOMNode).toBe('function')
    expect(reactDom.findDOMNode(document.createElement('p'))?.nodeName).toBe('P')
    expect(typeof reactDom.default?.findDOMNode).toBe('function')
    expect(reactDom.default?.findDOMNode?.(null)).toBeNull()
  })

  it('does not throw when createPortal is given a missing container', () => {
    expect(createPortal('x', null as unknown as Element)).toBeNull()
    expect(createPortal('x', {} as Element)).toBeNull()
    const el = document.createElement('div')
    const portal = createPortal('ok', el)
    expect(portal).not.toBeNull()
    expect(typeof reactDom.createPortal).toBe('function')
    expect(reactDom.createPortal('x', null as unknown as Element)).toBeNull()
  })
})
