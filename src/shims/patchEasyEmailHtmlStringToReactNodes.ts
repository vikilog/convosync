/**
 * Easy Email’s MjmlDomRender portals HtmlStringToReactNodes(doc.documentElement) into a <div>.
 * React 19 forbids <html>/<head>/<body>/<meta> there. Rewrite the bundled helper in place.
 *
 * ponytail: inlined JS must stay aligned with mjmlPreviewSourceNodes in unwrapMjmlDocumentForPreview.ts.
 */
const PREVIEW_NODES_FN = `function __wabizMjmlPreviewNodes(doc) {
  var skip = { META: 1, TITLE: 1, BASE: 1, HTML: 1, HEAD: 1, BODY: 1 };
  var styles = Array.prototype.slice.call(doc.head.querySelectorAll("style"));
  var kids = Array.prototype.slice.call(doc.body.childNodes).filter(function (n) {
    return n.nodeType !== 1 || !skip[n.tagName];
  });
  return styles.concat(kids);
}
`

const DOCUMENT_ELEMENT_ROOT = `const reactNode = /* @__PURE__ */ React.createElement(RenderReactNode, {
    selector: "0",
    node: doc.documentElement,
    index: 0
  });`

const PREVIEW_FRAGMENT_ROOT = `const reactNode = /* @__PURE__ */ React.createElement(React.Fragment, null, __wabizMjmlPreviewNodes(doc).map(function (node, index2) {
    return /* @__PURE__ */ React.createElement(RenderReactNode, {
      selector: getChildSelector("0", index2),
      key: index2,
      node,
      index: index2
    });
  }));`

const CREATE_ELEMENT_START = `function createElement(type, props) {
  if ((props == null ? void 0 : props.class) && props.class.includes("email-block")) {`

const CREATE_ELEMENT_FLAT = `function createElement(type, props) {
  if (type === "html" || type === "head" || type === "body") {
    return React.createElement(React.Fragment, { key: props == null ? void 0 : props.key }, props == null ? void 0 : props.children);
  }
  if (type === "meta" || type === "title" || type === "base") {
    return React.createElement(React.Fragment, null);
  }
  if ((props == null ? void 0 : props.class) && props.class.includes("email-block")) {`

export function patchEasyEmailHtmlStringToReactNodes(code: string): string {
  if (code.includes('__wabizMjmlPreviewNodes')) return code
  if (!code.includes('function HtmlStringToReactNodes')) return code
  let next = code
  if (next.includes(DOCUMENT_ELEMENT_ROOT)) {
    next = next.replace(DOCUMENT_ELEMENT_ROOT, PREVIEW_FRAGMENT_ROOT)
    const insertAt = next.indexOf('function HtmlStringToReactNodes')
    if (insertAt !== -1) next = next.slice(0, insertAt) + PREVIEW_NODES_FN + next.slice(insertAt)
  }
  if (next.includes(CREATE_ELEMENT_START)) {
    next = next.replace(CREATE_ELEMENT_START, CREATE_ELEMENT_FLAT)
  }
  return next
}
