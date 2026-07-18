/**
 * ponytail: session gate cache rules (mirrors ProtectedRoute ensureSessionValid).
 * Run: node frontend/src/components/ProtectedRoute.session.check.mjs
 */
import assert from 'node:assert/strict';

function shouldReuseValidation(validatedToken, currentToken) {
  if (!currentToken) return false;
  return validatedToken === currentToken;
}

assert.equal(shouldReuseValidation(null, null), false);
assert.equal(shouldReuseValidation('a', null), false);
assert.equal(shouldReuseValidation(null, 'a'), false);
assert.equal(shouldReuseValidation('a', 'a'), true);
assert.equal(shouldReuseValidation('a', 'b'), false);
console.log('ProtectedRoute.session.check: ok');
