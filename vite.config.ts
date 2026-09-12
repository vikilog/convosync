import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { patchEasyEmailHtmlStringToReactNodes } from './src/shims/patchEasyEmailHtmlStringToReactNodes.ts'

export const rootDir = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const reactDomDir = path.dirname(require.resolve('react-dom/package.json'))
const reactDomShim = path.resolve(rootDir, 'src/shims/react-dom.ts')
const reactDomReal = path.join(reactDomDir, 'index.js')
const mjmlBrowserReal = require.resolve('mjml-browser')
const mjmlBrowserShim = path.resolve(rootDir, 'src/shims/mjml-browser.ts')
const easyEmailEditorEntry = require.resolve('easy-email-editor/lib/index.js')

function reactDomFindDomNodePlugin(): Plugin {
  return {
    name: 'react-dom-finddomnode-shim',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'react-dom-real') return reactDomReal
      if (id === 'react-dom') return reactDomShim
    },
  }
}

function mjmlBrowserSanitizePlugin(): Plugin {
  return {
    name: 'mjml-browser-sanitize-shim',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'mjml-browser-real') return mjmlBrowserReal
      if (id === 'mjml-browser') return mjmlBrowserShim
    },
  }
}

function isEasyEmailEditorSource(id: string): boolean {
  const file = id.split('?')[0]?.replace(/\\/g, '/') ?? ''
  return file.endsWith('/easy-email-editor/lib/index.js') || file === easyEmailEditorEntry.replace(/\\/g, '/')
}

function easyEmailPreviewUnwrapPlugin(): Plugin {
  return {
    name: 'easy-email-preview-unwrap',
    enforce: 'pre',
    load(id) {
      if (!isEasyEmailEditorSource(id)) return
      return patchEasyEmailHtmlStringToReactNodes(readFileSync(easyEmailEditorEntry, 'utf8'))
    },
    transform(code, id) {
      if (code.includes('function HtmlStringToReactNodes') && code.includes('node: doc.documentElement')) {
        return { code: patchEasyEmailHtmlStringToReactNodes(code), map: null }
      }
      if (isEasyEmailEditorSource(id)) {
        return { code: patchEasyEmailHtmlStringToReactNodes(code), map: null }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    reactDomFindDomNodePlugin(),
    mjmlBrowserSanitizePlugin(),
    easyEmailPreviewUnwrapPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(rootDir, './src') },
      // More-specific react-dom subpaths first so they never hit the shim.
      { find: 'react-dom/client', replacement: path.join(reactDomDir, 'client.js') },
      { find: 'react-dom/server', replacement: path.join(reactDomDir, 'server.browser.js') },
      { find: 'react-dom/test-utils', replacement: path.join(reactDomDir, 'test-utils.js') },
      { find: 'react-dom-real', replacement: path.join(reactDomDir, 'index.js') },
      { find: /^react-dom$/, replacement: path.resolve(rootDir, 'src/shims/react-dom.ts') },
      { find: 'mjml-browser-real', replacement: mjmlBrowserReal },
      { find: /^mjml-browser$/, replacement: mjmlBrowserShim },
    ],
  },
  optimizeDeps: {
    include: ['easy-email-core', 'easy-email-editor', 'easy-email-extensions', 'mjml-browser', 'react-dom'],
    rolldownOptions: {
      plugins: [
        {
          name: 'easy-email-preview-unwrap-opt',
          load(id: string) {
            if (!isEasyEmailEditorSource(id)) return
            return patchEasyEmailHtmlStringToReactNodes(readFileSync(easyEmailEditorEntry, 'utf8'))
          },
        },
      ],
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
})
