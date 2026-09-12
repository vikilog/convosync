import mjml2html from 'mjml-browser-real'

import { stripIllegalHtmlWhitespace } from '../lib/stripIllegalHtmlWhitespace'

type MjmlOptions = {
  validationLevel?: 'strict' | 'soft' | 'skip'
  minify?: boolean
  beautify?: boolean
}
type MjmlResult = { html: string; errors: { message: string }[] }

function unwrapMjml(
  mod: unknown
): (source: string, options?: MjmlOptions) => MjmlResult {
  if (typeof mod === 'function') return mod as (source: string, options?: MjmlOptions) => MjmlResult
  if (mod && typeof mod === 'object' && 'default' in mod) {
    const inner = (mod as { default: unknown }).default
    if (typeof inner === 'function') return inner as (source: string, options?: MjmlOptions) => MjmlResult
  }
  throw new Error('mjml-browser export is not a function')
}

const compile = unwrapMjml(mjml2html)

/** Wrap mjml-browser so Easy Email’s canvas/preview never hydrate illegal html/head/table whitespace. */
export default function mjml(source: string, options?: MjmlOptions): MjmlResult {
  const compiled = compile(source, { ...options, beautify: false })
  if (!compiled.html) return compiled
  return { ...compiled, html: stripIllegalHtmlWhitespace(compiled.html) }
}
