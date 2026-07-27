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

console.log('exportContactsCsv.check.ts: ok');
