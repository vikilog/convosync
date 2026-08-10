/**
 * Self-check: Templates/Campaigns emailConnected must map API `enabled`, not `connected`.
 * Run: npx tsx frontend/src/hooks/inbox/useInboxMeta.email.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'useInboxMeta.ts'), 'utf8');

assert.match(src, /useEmailIntegration/);
assert.match(src, /Boolean\(data\.enabled\)/);
assert.doesNotMatch(
  src,
  /Boolean\(data\.connected\)/,
  'emailConnected must not read nonexistent API field `connected`'
);

const integrations = readFileSync(
  join(dir, '../../components/IntegrationsView.tsx'),
  'utf8'
);
assert.match(
  integrations,
  /connected:\s*Boolean\(res\.enabled\)/,
  'IntegrationsView and useEmailIntegration must agree on enabled→connected'
);

console.log('useInboxMeta.email.check.ts: ok');
