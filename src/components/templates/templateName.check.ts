/**
 * ponytail: URL must not be accepted as a template/channel name.
 * Run: npx tsx frontend/src/components/templates/templateName.check.ts
 */
import assert from 'node:assert/strict';
import { assertValidTemplateName, isUrlLikeName } from './templateBuilderUtils.ts';

assert.equal(isUrlLikeName('https://example.com'), true);
assert.equal(isUrlLikeName('www.example.com'), true);
assert.equal(isUrlLikeName('example.com'), true);
assert.equal(isUrlLikeName('order_confirmation'), false);

assert.throws(() => assertValidTemplateName('https://foo.com/bar'), /URL/);
assert.equal(assertValidTemplateName('Order Confirmation'), 'order_confirmation');

console.log('templateName.check.ts: ok');
