import { parseContactCsv } from './parseContactCsv.ts';

const sample = `name,phone,email,source,tags
Alice,+919876543210,alice@example.com,csv,Hot;Lead
Bob,9876543211,,website,Student
,911,,csv,
Charlie,+1-555-0100,bad-email,csv,A|B
`;

const { rows, skipped } = parseContactCsv(sample);
if (rows.length !== 3) throw new Error(`expected 3 rows, got ${rows.length}`);
if (skipped.length !== 1) throw new Error(`expected 1 skipped, got ${skipped.length}`);
if (rows[0].phone !== '+919876543210') throw new Error(`phone0 ${rows[0].phone}`);
if (rows[0].tags.join(',') !== 'Hot,Lead') throw new Error(`tags0 ${rows[0].tags}`);
if (rows[1].phone !== '+9876543211') throw new Error(`phone1 ${rows[1].phone}`);
if (rows[2].tags.join(',') !== 'A,B') throw new Error(`tags2 ${rows[2].tags}`);

let threw = false;
try {
  parseContactCsv('foo,bar\n1,2\n');
} catch {
  threw = true;
}
if (!threw) throw new Error('expected missing name/phone headers to throw');

// A quoted field containing an embedded newline (common when a CSV is
// exported from Excel/Google Contacts with a multi-line name/notes value)
// must stay part of that one row/cell, not get split into two garbage rows.
const withEmbeddedNewline = `name,phone,tags
"Smith, John\nJr.",+919876543210,VIP
Dana,+15550100,`;
const embedded = parseContactCsv(withEmbeddedNewline);
if (embedded.rows.length !== 2) {
  throw new Error(`expected 2 rows with embedded newline intact, got ${embedded.rows.length}`);
}
if (embedded.rows[0].name !== 'Smith, John\nJr.') {
  throw new Error(`embedded-newline name corrupted: ${JSON.stringify(embedded.rows[0].name)}`);
}
if (embedded.rows[1].phone !== '+15550100') {
  throw new Error(`next row misaligned after embedded newline: ${embedded.rows[1].phone}`);
}

console.log('parseContactCsv.check.ts: ok');
