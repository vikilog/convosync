import assert from 'node:assert/strict';
import { parseFaqBulk } from './parseFaqBulk.ts';

const labeled = parseFaqBulk(`Q: Hours?
A: 9-6

Q: Shipping?
A: Yes`);
assert.equal(labeled.length, 2);
assert.equal(labeled[0].question, 'Hours?');
assert.equal(labeled[0].answer, '9-6');

const blocks = parseFaqBulk(`What is refund policy?
7 days full refund.

Where are you based?
Mumbai.`);
assert.equal(blocks.length, 2);
assert.equal(blocks[1].answer, 'Mumbai.');

const csv = parseFaqBulk(`question,answer
"Do you deliver?","Yes, city-wide"
Hours?,Mon-Fri`);
assert.equal(csv.length, 2);

const json = parseFaqBulk(`[{"q":"Hi?","a":"Hello"}]`);
assert.equal(json[0].question, 'Hi?');

console.log('parseFaqBulk.check: ok');
