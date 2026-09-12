import { useMemo, type MutableRefObject } from 'react'
import { AdvancedType, BasicType, type IPage } from 'easy-email-core'
import { EmailEditor, EmailEditorProvider, type IEmailTemplate } from 'easy-email-editor'
import { StandardLayout, type ExtensionProps } from 'easy-email-extensions'

import {
  emailMergeTags,
  mergeTagToken,
  type EasyEmailBlock,
} from '@/lib/easyEmailPayload'
import { httpClient } from '@/lib/httpClient'
import { stripIllegalHtmlWhitespace } from '@/lib/stripIllegalHtmlWhitespace'

import 'easy-email-editor/lib/style.css'
import 'easy-email-extensions/lib/style.css'
import '@arco-themes/react-easy-email-theme/css/arco.css'
import './easy-email-builder.css'

const CATEGORIES: ExtensionProps['categories'] = [
  {
    label: 'Content',
    active: true,
    blocks: [
      { type: AdvancedType.TEXT },
      { type: AdvancedType.IMAGE, payload: { attributes: { padding: '0px 0px 0px 0px' } } },
      { type: AdvancedType.BUTTON },
      { type: AdvancedType.SOCIAL },
      { type: AdvancedType.DIVIDER },
      { type: AdvancedType.SPACER },
      { type: AdvancedType.HERO },
      { type: AdvancedType.WRAPPER },
      { type: BasicType.RAW, title: 'HTML' },
    ],
  },
  {
    label: 'Layout',
    active: true,
    displayType: 'column',
    blocks: [
      {
        title: '2 columns',
        payload: [
          ['50%', '50%'],
          ['33%', '67%'],
          ['67%', '33%'],
          ['25%', '75%'],
          ['75%', '25%'],
        ],
      },
      {
        title: '3 columns',
        payload: [
          ['33.33%', '33.33%', '33.33%'],
          ['25%', '25%', '50%'],
          ['50%', '25%', '25%'],
        ],
      },
      {
        title: '4 columns',
        payload: [['25%', '25%', '25%', '25%']],
      },
    ],
  },
]

const MERGE_TAGS = emailMergeTags()

async function uploadEmailImage(blob: Blob): Promise<string> {
  const file =
    blob instanceof File ? blob : new File([blob], 'email-image.png', { type: blob.type || 'image/png' })
  const form = new FormData()
  form.append('title', file.name || 'Email image')
  form.append('description', '')
  form.append('scope', 'both')
  form.append('usage', JSON.stringify(['email-template']))
  form.append('file', file)
  const asset = await httpClient.post<{ url?: string }>('/media-gallery', form)
  if (!asset.url) throw new Error('Image upload did not return a URL')
  return asset.url
}

type Props = {
  initialContent: EasyEmailBlock
  subject: string
  contentRef: MutableRefObject<EasyEmailBlock>
}

export function EasyEmailCanvas({ initialContent, subject, contentRef }: Props) {
  const data = useMemo<IEmailTemplate>(
    () => ({
      subject,
      subTitle: '',
      content: initialContent as IPage,
    }),
    // ponytail: EmailEditorProvider only hydrates `data` on mount; remount with `key` to reload.
    []
  )

  return (
    <div className="easy-email-canvas min-h-0 w-full flex-1">
      <EmailEditorProvider
        data={data}
        height="100%"
        autoComplete
        dashed={false}
        mergeTags={MERGE_TAGS}
        previewInjectData={MERGE_TAGS}
        mergeTagGenerate={mergeTagToken}
        enabledMergeTagsBadge
        onUploadImage={uploadEmailImage}
        onBeforePreview={(html) => stripIllegalHtmlWhitespace(html)}
      >
        {({ values }) => {
          contentRef.current = values.content as EasyEmailBlock
          return (
            <StandardLayout categories={CATEGORIES} showSourceCode={false} compact>
              <EmailEditor />
            </StandardLayout>
          )
        }}
      </EmailEditorProvider>
    </div>
  )
}
