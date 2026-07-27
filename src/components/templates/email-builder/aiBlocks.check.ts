/**
 * Runnable check: AI → builder block mapping.
 * Run: npx tsx src/components/templates/email-builder/aiBlocks.check.ts
 */
import assert from 'node:assert/strict';
import { blocksFromAiResult } from './aiBlocks.ts';

const empty = blocksFromAiResult({});
assert.equal(empty.length, 0);

const fromHtml = blocksFromAiResult({
  subject: 'Hi {{first_name}}',
  html: '<p>Hello {{first_name}}</p>',
});
assert.equal(fromHtml.length, 1);
assert.equal(fromHtml[0].type, 'html');
assert.match(String(fromHtml[0].props.rawHtml), /first_name/);

const fromBlocks = blocksFromAiResult({
  blocks: [
    { type: 'HEADER', props: { text: 'Sale for {{first_name}}' } },
    { type: 'nope', props: {} },
    { type: 'button', props: { label: 'Shop', url: '{{cta_url}}' } },
  ],
});
assert.equal(fromBlocks.length, 2);
assert.equal(fromBlocks[0].type, 'header');
assert.equal(fromBlocks[0].props.text, 'Sale for {{first_name}}');
assert.equal(fromBlocks[1].type, 'button');
assert.equal(fromBlocks[1].props.url, '{{cta_url}}');
// Defaults merged
assert.ok(fromBlocks[1].props.align);

console.log('aiBlocks.check: ok');
