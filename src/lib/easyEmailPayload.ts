import { stripIllegalHtmlWhitespace } from '@/lib/stripIllegalHtmlWhitespace'

export const EASY_EMAIL_ENGINE = 'easy-email' as const

export const DEFAULT_EMAIL_HTML = `<h2>Hello {{first_name}},</h2>
<p>Thanks for choosing {{company_name}}. We're excited to have you on board.</p>
<p><a href="{{cta_url}}">Get started</a></p>`

export type EasyEmailBlock = {
  type: string
  data: { value: Record<string, unknown>; hidden?: boolean | string }
  attributes: Record<string, string>
  children: EasyEmailBlock[]
  title?: string
}

export type EasyEmailDesignJson = {
  engine: typeof EASY_EMAIL_ENGINE
  content: EasyEmailBlock
  htmlEdited?: boolean
}

export function emailTemplateBuilderPath(id?: string | null): string {
  return id ? `/templates/email/${encodeURIComponent(id)}/builder` : '/templates/email/new/builder'
}

export function emailMergeTags(): Record<string, string> {
  return {
    first_name: 'Ada',
    company_name: 'Acme',
    cta_url: 'https://example.com',
  }
}

export function mergeTagToken(name: string): string {
  return `{{${name}}}`
}

function pageValue(): Record<string, unknown> {
  return {
    breakpoint: '480px',
    headAttributes: '',
    'font-size': '14px',
    'font-weight': '400',
    'line-height': '1.7',
    headStyles: [],
    fonts: [],
    responsive: true,
    'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    'text-color': '#000000',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isEasyEmailBlock(value: unknown): value is EasyEmailBlock {
  if (!isRecord(value) || typeof value.type !== 'string') return false
  if (!isRecord(value.data) || !isRecord(value.data.value)) return false
  if (!isRecord(value.attributes) || !Array.isArray(value.children)) return false
  return value.children.every(isEasyEmailBlock)
}

export function isPageBlock(value: unknown): value is EasyEmailBlock {
  return isEasyEmailBlock(value) && value.type === 'page'
}

export function wrapHtmlAsPage(html: string): EasyEmailBlock {
  return {
    type: 'page',
    data: { value: pageValue() },
    attributes: { width: '600px', 'background-color': '#ffffff' },
    children: [
      {
        type: 'raw',
        data: { value: { content: html } },
        attributes: {},
        children: [],
      },
    ],
  }
}

export function extractRawHtml(block: EasyEmailBlock): string {
  if (block.type === 'raw') {
    const content = block.data.value.content
    return typeof content === 'string' ? content : ''
  }
  return block.children.map(extractRawHtml).join('')
}

export function parseStoredDesign(
  designJson: Record<string, unknown> | null | undefined,
  htmlBody: string
): { content: EasyEmailBlock; htmlEdited: boolean } {
  const fallbackHtml = htmlBody.trim() || DEFAULT_EMAIL_HTML
  if (isRecord(designJson) && designJson.engine === EASY_EMAIL_ENGINE && isPageBlock(designJson.content)) {
    return { content: designJson.content, htmlEdited: designJson.htmlEdited === true }
  }
  if (isPageBlock(designJson)) {
    return { content: designJson, htmlEdited: false }
  }
  return { content: wrapHtmlAsPage(fallbackHtml), htmlEdited: false }
}

export function toDesignJson(content: EasyEmailBlock, htmlEdited = false): EasyEmailDesignJson {
  return htmlEdited
    ? { engine: EASY_EMAIL_ENGINE, content, htmlEdited: true }
    : { engine: EASY_EMAIL_ENGINE, content }
}

export function serializeEmailTemplatePayload(input: {
  content: EasyEmailBlock
  htmlBody: string
  htmlEdited: boolean
}): { htmlBody: string; designJson: Record<string, unknown> } {
  return {
    htmlBody: stripIllegalHtmlWhitespace(input.htmlBody),
    designJson: toDesignJson(input.content, input.htmlEdited) as unknown as Record<string, unknown>,
  }
}

export function deserializeEmailTemplatePayload(
  designJson: Record<string, unknown> | null | undefined,
  htmlBody: string
): { content: EasyEmailBlock; htmlBody: string; htmlEdited: boolean } {
  const parsed = parseStoredDesign(designJson, htmlBody)
  return {
    content: parsed.content,
    htmlBody: htmlBody.trim() || extractRawHtml(parsed.content) || DEFAULT_EMAIL_HTML,
    htmlEdited: parsed.htmlEdited,
  }
}
