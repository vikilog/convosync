/**
 * ponytail: wallet CC must keep 2dp so 1.30+1.23 charges don't round to whole tokens.
 * Run: npx tsx frontend/src/lib/convocoins.check.ts
 */
import assert from 'node:assert/strict';
import { formatCc, inrToCc, paiseToCc } from './convocoins.ts';

assert.equal(paiseToCc(49747), 497.47);
assert.equal(paiseToCc(130), 1.3);
assert.equal(inrToCc(1.23), 1.23);
assert.equal(formatCc(497.47), '497.47 CC');
assert.equal(formatCc(1.3), '1.30 CC');

// Sum on Usage cards (billed) should match month charge math
const wa = 1.3;
const ai = 1.23;
const email = 0; // included credit covers sends
const charged = Math.round((wa + ai + email) * 100) / 100;
assert.equal(charged, 2.53);
assert.equal(Math.round((500 - charged) * 100) / 100, 497.47);

console.log('convocoins.check.ts: ok');
