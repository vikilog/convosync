import { clubCommentsByUser } from './commentClub.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const clubs = clubCommentsByUser([
  { id: '1', username: 'aee_vikaswa', leadId: 'L1', timestamp: '2026-01-01T10:00:00Z' },
  { id: '2', username: 'Aee_Vikaswa', leadId: null, timestamp: '2026-01-01T11:00:00Z' },
  { id: '3', username: 'samy.boey', leadId: null, timestamp: '2026-01-01T09:00:00Z' },
]);

assert(clubs.length === 2, 'two clubs');
assert(clubs[0].comments.length === 2, 'vikaswa clubbed');
assert(clubs[0].leadId === 'L1', 'lead from sibling');
assert(clubs[1].key === 'u:samy.boey', 'other user');

console.log('commentClub.check: ok');
