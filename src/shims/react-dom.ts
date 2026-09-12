import type { ReactNode } from 'react'
import * as ReactDOM from 'react-dom-real'

import { findDOMNode } from './findDOMNode'

function isPortalContainer(value: unknown): value is Element | DocumentFragment {
  if (typeof value !== 'object' || value == null) return false
  const t = (value as { nodeType?: number }).nodeType
  return t === 1 || t === 9 || t === 11
}

/** Easy Email portals into a ref that can be missing after an html-in-div crash. Never throw. */
export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: null | string) {
  if (!isPortalContainer(container)) return null
  return ReactDOM.createPortal(children, container, key)
}

export { findDOMNode }
export * from 'react-dom-real'

const real =
  'default' in ReactDOM && ReactDOM.default && typeof ReactDOM.default === 'object'
    ? (ReactDOM.default as object)
    : ReactDOM

const shim = { ...real, ...ReactDOM, findDOMNode, createPortal }
export default shim
