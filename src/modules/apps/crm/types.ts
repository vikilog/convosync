/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CrmEntityKind = 'account' | 'contact' | 'task';

export type FieldType = 'text' | 'phone' | 'email' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';

export type FieldDef = {
  id: string;
  /** Storage key inside a record's `fields` map. Locked fields use fixed keys: name/phone/email. */
  key: string;
  label: string;
  type: FieldType;
  /** Standard field required for cross-module matching — can't be removed or renamed. */
  locked?: boolean;
  required?: boolean;
  options?: string[];
};

export type CrmSchema = Record<CrmEntityKind, FieldDef[]>;

export type CrmFieldValues = Record<string, string | boolean>;

export type Account = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fields: CrmFieldValues;
};

export type Contact = {
  id: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  fields: CrmFieldValues;
  /** Set once "Push to Contacts" has been actioned — id of the matched/created core contact. */
  pushedToContactId?: string | null;
};

export type TaskLink =
  | { type: 'account'; id: string }
  | { type: 'contact'; id: string };

export type CrmTask = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fields: CrmFieldValues;
  link: TaskLink | null;
  done: boolean;
  /** Up to 5 compressed base64 images attached to this task's notes. */
  images?: string[];
};

export type TimelineEntryKind = 'meeting' | 'note';

export type TimelineEntry = {
  id: string;
  contactId: string;
  kind: TimelineEntryKind;
  text: string;
  author: string;
  createdAt: string;
};
