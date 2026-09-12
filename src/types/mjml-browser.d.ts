declare module 'mjml-browser' {
  type MjmlResult = { html: string; errors: { message: string }[] }
  export default function mjml2html(
    source: string,
    options?: {
      validationLevel?: 'strict' | 'soft' | 'skip'
      minify?: boolean
      beautify?: boolean
    }
  ): MjmlResult
}

declare module 'mjml-browser-real' {
  export { default } from 'mjml-browser'
}
