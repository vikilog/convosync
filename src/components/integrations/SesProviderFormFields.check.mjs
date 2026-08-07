/**
 * Self-check: SES sender split / From composition helpers.
 * Run: node src/components/integrations/SesProviderFormFields.check.mjs
 */
import assert from 'node:assert/strict';

function splitSenderAgainstIdentities(senderEmail, identities) {
  const from = senderEmail.trim().toLowerCase();
  if (!from) return { selectedIdentity: '', localPart: '' };
  const emailMatch = identities.find(
    (i) => i.type === 'email' && i.identity.toLowerCase() === from
  );
  if (emailMatch) return { selectedIdentity: emailMatch.identity, localPart: '' };
  const domain = from.includes('@') ? from.split('@')[1] : '';
  const domainMatch = identities.find(
    (i) => i.type === 'domain' && i.identity.toLowerCase() === domain
  );
  if (domainMatch) {
    return {
      selectedIdentity: domainMatch.identity,
      localPart: from.split('@')[0] ?? '',
    };
  }
  return { selectedIdentity: '', localPart: '' };
}

function computeSesSenderEmail(selectedIdentity, domainLocalPart, identities) {
  if (!selectedIdentity) return '';
  const meta = identities.find((i) => i.identity === selectedIdentity);
  if (meta?.type === 'domain') {
    const local = domainLocalPart.trim();
    return local ? `${local}@${selectedIdentity}` : '';
  }
  return selectedIdentity;
}

const identities = [
  { identity: 'example.com', type: 'domain' },
  { identity: 'alerts@example.com', type: 'email' },
];

assert.deepEqual(splitSenderAgainstIdentities('alerts@example.com', identities), {
  selectedIdentity: 'alerts@example.com',
  localPart: '',
});
assert.deepEqual(splitSenderAgainstIdentities('noreply@example.com', identities), {
  selectedIdentity: 'example.com',
  localPart: 'noreply',
});
assert.equal(
  computeSesSenderEmail('example.com', 'noreply', identities),
  'noreply@example.com'
);
assert.equal(computeSesSenderEmail('alerts@example.com', '', identities), 'alerts@example.com');
assert.equal(computeSesSenderEmail('example.com', '', identities), '');

console.log('SesProviderFormFields.check.mjs: ok');
