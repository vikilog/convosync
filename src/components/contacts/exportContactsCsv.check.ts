import {
  buildContactsCsv,
  defaultExportColumnIds,
  EXPORT_COLUMNS,
  type ExportColumnId,
} from './exportContactsCsv.ts';
import type { Contact } from '../../types';

const sample: Contact[] = [
  {
    id: 'c1',
    name: 'Alice',
    phone: '+9198',
    phoneRaw: '9198',
    email: 'a@x.com',
    lastActive: '',
    unreadCount: 0,
    lastMessage: '',
    status: 'Open',
    assignedAgent: '',
    source: 'web',
    channel: 'whatsapp',
    handle: '+9198',
    courseInterest: 'MBA',
    location: 'Delhi',
    tags: ['Hot', 'Lead'],
    journeyStatus: 'Ad Clicked',
    journeyDates: {},
  },
];

const csv = buildContactsCsv(sample, ['name', 'phone', 'tags']);
if (!csv.startsWith('name,phone,tags\n')) throw new Error(`header: ${csv}`);
if (!csv.includes('"Alice"') || !csv.includes('"Hot;Lead"')) throw new Error(csv);

const empty = buildContactsCsv(sample, []);
if (empty !== '') throw new Error('expected empty csv');

const defaults = defaultExportColumnIds();
if (defaults.join(',') !== 'name,phone,email,source,tags') throw new Error(String(defaults));

if (EXPORT_COLUMNS.length !== 5) throw new Error('expected 5 columns');

// CSV/formula-injection defense — a name/tag starting with =, +, -, @, or a
// tab must be prefixed with a single quote so Excel/Sheets render it as
// text instead of evaluating it as a formula on open.
const malicious: Contact[] = [
  {
    ...sample[0],
    id: 'c2',
    name: '=cmd|\'/C calc\'!A0',
    tags: ['+HYPERLINK("http://evil.test")'],
  },
];
const maliciousCsv = buildContactsCsv(malicious, ['name', 'tags']);
if (!maliciousCsv.includes('"\'=cmd')) throw new Error(`name not defused: ${maliciousCsv}`);
if (!maliciousCsv.includes('"\'+HYPERLINK')) throw new Error(`tag not defused: ${maliciousCsv}`);
// A normal name must be untouched (no stray leading quote).
if (!csv.includes('"Alice"')) throw new Error('normal name should not be prefixed');

console.log('exportContactsCsv.check.ts: ok');
