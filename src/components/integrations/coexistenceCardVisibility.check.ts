/**
 * Runnable check: coexistence hub card stays until a coexistence number is linked.
 * Run: npx tsx src/components/integrations/coexistenceCardVisibility.check.ts
 */
import assert from 'node:assert/strict';

type Account = { connectionMode?: string };

function isCoexistenceConnected(accounts: Account[]): boolean {
  return accounts.some((a) => a.connectionMode === 'app_coexistence');
}

assert.equal(isCoexistenceConnected([]), false);
assert.equal(isCoexistenceConnected([{ connectionMode: 'business_api' }]), false);
assert.equal(isCoexistenceConnected([{ connectionMode: 'app_coexistence' }]), true);
assert.equal(
  isCoexistenceConnected([
    { connectionMode: 'business_api' },
    { connectionMode: 'app_coexistence' },
  ]),
  true
);

console.log('coexistenceCardVisibility check ok');
