/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { pathForCrmAccount, pathForCrmAccounts, pathForCrmFieldBuilder } from '../../../routes';
import { DynamicField } from './DynamicField';
import { createAccount, getEntitySchema } from './store';
import type { CrmFieldValues } from './types';

export function AccountFormView() {
  const navigate = useNavigate();
  const fields = getEntitySchema('account');
  const [values, setValues] = useState<CrmFieldValues>({});

  const handleChange = (key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const requiredMissing = fields.some((f) => f.required && !values[f.key]);
    if (requiredMissing) return;
    const account = createAccount(values);
    navigate(pathForCrmAccount(account.id));
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-12">
      <button
        type="button"
        onClick={() => navigate(pathForCrmAccounts())}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-swiss-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Accounts
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-950">New Account</h1>
        <button
          type="button"
          onClick={() => navigate(pathForCrmFieldBuilder('account'))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e6fcef] text-primary rounded-lg text-xs font-bold"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Customize this form
        </button>
      </div>

      <div className="mt-3 bg-white rounded-2xl border border-swiss-line p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {fields.map((field) => (
          <DynamicField key={field.id} field={field} values={values} onChange={handleChange} />
        ))}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => navigate(pathForCrmAccounts())}
            className="px-4 py-2.5 rounded-xl border border-swiss-line text-sm font-bold text-swiss-muted hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
