/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Settings2 } from 'lucide-react';
import { pathForCrmAccount, pathForCrmContact, pathForCrmFieldBuilder } from '../../../routes';
import { DynamicField } from './DynamicField';
import { createContact, getAccount, getEntitySchema } from './store';
import type { CrmFieldValues } from './types';

export function ContactFormView({ accountId }: { accountId: string }) {
  const navigate = useNavigate();
  const account = getAccount(accountId);
  const fields = getEntitySchema('contact');
  const [values, setValues] = useState<CrmFieldValues>({});

  const handleChange = (key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const requiredMissing = fields.some((f) => f.required && !values[f.key]);
    if (requiredMissing) return;
    const contact = createContact(accountId, values);
    navigate(pathForCrmContact(accountId, contact.id));
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-12">
      <button
        type="button"
        onClick={() => navigate(pathForCrmAccount(accountId))}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-swiss-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {account ? String(account.fields.name) : 'Account'}
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-950">New Contact</h1>
          <p className="text-xs text-swiss-muted">Under {account ? String(account.fields.name) : '—'}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(pathForCrmFieldBuilder('contact'))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e6fcef] text-primary rounded-lg text-xs font-bold shrink-0"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Customize this form
        </button>
      </div>

      <div className="mt-3 bg-white rounded-2xl border border-swiss-line p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-start gap-2.5 rounded-xl bg-[#e6fcef] px-3.5 py-3 mb-5">
          <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-[#0aa347] leading-relaxed">
            Name, Phone and Email are locked to match your Contacts module — so this contact can be pushed there without a mismatch.
          </p>
        </div>

        {fields.map((field) => (
          <DynamicField key={field.id} field={field} values={values} onChange={handleChange} />
        ))}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => navigate(pathForCrmAccount(accountId))}
            className="px-4 py-2.5 rounded-xl border border-swiss-line text-sm font-bold text-swiss-muted hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl"
          >
            Create Contact
          </button>
        </div>
      </div>
    </div>
  );
}
