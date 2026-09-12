import { AdvancedType, BasicType, BlockManager, JsonToMjml, type IPage } from 'easy-email-core'
import mjml2html from 'mjml-browser'

import {
  DEFAULT_EMAIL_HTML,
  extractRawHtml,
  wrapHtmlAsPage,
  type EasyEmailBlock,
} from '@/lib/easyEmailPayload'
import { stripIllegalHtmlWhitespace } from '@/lib/stripIllegalHtmlWhitespace'

export function createDefaultEasyEmailPage(): EasyEmailBlock {
  const pageBlock = BlockManager.getBlockByType(BasicType.PAGE)
  const sectionBlock =
    BlockManager.getBlockByType(AdvancedType.SECTION) ?? BlockManager.getBlockByType(BasicType.SECTION)
  const columnBlock =
    BlockManager.getBlockByType(AdvancedType.COLUMN) ?? BlockManager.getBlockByType(BasicType.COLUMN)
  const textBlock =
    BlockManager.getBlockByType(AdvancedType.TEXT) ?? BlockManager.getBlockByType(BasicType.TEXT)
  const buttonBlock =
    BlockManager.getBlockByType(AdvancedType.BUTTON) ?? BlockManager.getBlockByType(BasicType.BUTTON)
  if (!pageBlock || !sectionBlock || !columnBlock || !textBlock || !buttonBlock) {
    return wrapHtmlAsPage(DEFAULT_EMAIL_HTML)
  }
  const page = pageBlock.create()
  page.children = [
    sectionBlock.create({
      children: [
        columnBlock.create({
          children: [
            textBlock.create({
              data: { value: { content: 'Hello {{first_name}},' } },
            }),
            textBlock.create({
              data: {
                value: {
                  content: "Thanks for choosing {{company_name}}. We're excited to have you on board.",
                },
              },
            }),
            buttonBlock.create({
              attributes: { href: '{{cta_url}}' },
              data: { value: { content: 'Get started' } },
            }),
          ],
        }),
      ],
    }),
  ]
  return page
}

export function compileEasyEmailHtml(content: EasyEmailBlock): string {
  try {
    const mjml = JsonToMjml({
      data: content as IPage,
      mode: 'production',
      context: content as IPage,
      beautify: false,
    })
    let compiled
    try {
      compiled = mjml2html(mjml, { validationLevel: 'soft', minify: true, beautify: false })
    } catch {
      // ponytail: mjml minify is deprecated and may throw; sanitizer still strips illegal html/head/table whitespace.
      compiled = mjml2html(mjml, { validationLevel: 'soft', beautify: false })
    }
    if (compiled.html?.trim()) return stripIllegalHtmlWhitespace(compiled.html)
  } catch {
    // ponytail: MJML compile can fail on RAW-only / invalid blocks; send stored HTML instead.
  }
  const raw = extractRawHtml(content).trim()
  if (raw) return stripIllegalHtmlWhitespace(raw)
  throw new Error('Could not compile email HTML from the visual layout')
}
