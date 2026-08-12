/**
 * ponytail: onboarding phone dial split/compose must not double-prefix.
 * Run: npx tsx frontend/src/lib/locale/dialCodes.check.ts
 */
import assert from 'node:assert/strict';
import { dialForCountry, splitPhone, toE164 } from './dialCodes.ts';

assert.equal(dialForCountry('IN'), '+91');
assert.equal(dialForCountry('US'), '+1');
assert.equal(dialForCountry(null), '+91');

assert.deepEqual(splitPhone('919992492168', 'IN'), {
  dial: '+91',
  national: '9992492168',
});
assert.deepEqual(splitPhone('+919992492168', 'IN'), {
  dial: '+91',
  national: '9992492168',
});
assert.deepEqual(splitPhone('9992492168', 'IN'), {
  dial: '+91',
  national: '9992492168',
});
assert.deepEqual(splitPhone('+14155552671', 'US'), {
  dial: '+1',
  national: '4155552671',
});

assert.equal(toE164('+91', '9992492168'), '+919992492168');
assert.equal(toE164('+91', '919992492168'), '+919992492168');
assert.equal(toE164('+1', '4155552671'), '+14155552671');

console.log('dialCodes.check.ts: ok');
