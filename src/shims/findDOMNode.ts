type Fiber = {
  child?: Fiber | null
  stateNode?: unknown
}

function isDomNode(value: unknown): value is Element | Text | SVGElement {
  if (value instanceof Element || value instanceof Text || value instanceof SVGElement) return true
  return false
}

function fiberDom(fiber: Fiber | null | undefined): Element | Text | null {
  let node: Fiber | null | undefined = fiber
  while (node) {
    if (isDomNode(node.stateNode)) return node.stateNode
    node = node.child
  }
  return null
}

/** React 19 dropped this export; Easy Email / Arco still call it. Never throw. */
export function findDOMNode(componentOrElement: unknown): Element | Text | null {
  try {
    if (componentOrElement == null) return null
    if (isDomNode(componentOrElement)) return componentOrElement
    if (typeof componentOrElement !== 'object') return null
    const inst = componentOrElement as {
      _reactInternals?: Fiber
      _reactInternalFiber?: Fiber
    }
    return fiberDom(inst._reactInternals ?? inst._reactInternalFiber)
  } catch {
    return null
  }
}
