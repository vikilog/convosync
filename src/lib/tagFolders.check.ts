/**
 * Run: npx tsx src/lib/tagFolders.check.ts
 */
import assert from 'node:assert/strict';
import {
  groupTagsByFolder,
  normalizeTagFolder,
  sortTagNamesByFolder,
  UNCATEGORIZED_TAG_FOLDER,
} from './tagFolders.ts';

assert.equal(normalizeTagFolder('  Instagram  '), 'Instagram');
assert.equal(normalizeTagFolder(''), null);
assert.equal(normalizeTagFolder('   '), null);
assert.equal(normalizeTagFolder(null), null);
assert.equal(normalizeTagFolder(undefined), null);

const tags = [
  { name: 'vip', folder: 'Sales' },
  { name: 'hot', folder: null },
  { name: 'lead', folder: 'Sales' },
  { name: 'ig_dm', folder: 'Instagram' },
  { name: 'cold', folder: null },
];

const grouped = groupTagsByFolder(tags);
assert.deepEqual(
  grouped.map((g) => g.folder),
  ['Instagram', 'Sales', UNCATEGORIZED_TAG_FOLDER]
);
assert.deepEqual(grouped.find((g) => g.folder === 'Sales')?.items.map((i) => i.name), ['lead', 'vip']);

assert.deepEqual(sortTagNamesByFolder(tags), ['ig_dm', 'lead', 'vip', 'cold', 'hot']);

console.log('tagFolders.check: ok');
