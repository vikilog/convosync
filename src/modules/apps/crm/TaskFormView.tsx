/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Settings2, X } from 'lucide-react';
import { pathForCrmAccount, pathForCrmContact, pathForCrmFieldBuilder, pathForCrmTasks } from '../../../routes';
import { compressImageFile } from '../../../lib/imageUpload';
import { DynamicField } from './DynamicField';
import { createTask, getEntitySchema, getTask, listAccounts, listContacts, updateTask } from './store';
import type { CrmFieldValues, TaskLink } from './types';

const MAX_TASK_IMAGES = 5;

export function TaskFormView({ taskId }: { taskId?: string } = {}) {
  const navigate = useNavigate();
  const fields = getEntitySchema('task');
  const existing = taskId ? getTask(taskId) : undefined;
  const isEditing = Boolean(taskId);

  const [values, setValues] = useState<CrmFieldValues>(() => existing?.fields ?? {});
  const [linkType, setLinkType] = useState<'account' | 'contact'>(() => existing?.link?.type ?? 'account');
  const [linkId, setLinkId] = useState<string>(() => existing?.link?.id ?? '');
  const [images, setImages] = useState<string[]>(() => existing?.images ?? []);
  const [imageError, setImageError] = useState('');

  const accounts = listAccounts();
  const contacts = listContacts();

  if (isEditing && !existing) {
    return (
      <div className="w-full max-w-xl mx-auto pt-16 text-center text-sm font-semibold text-swiss-faint">
        Task not found.
      </div>
    );
  }

  const handleChange = (key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddImages = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setImageError('');
    const remaining = MAX_TASK_IMAGES - images.length;
    if (remaining <= 0) {
      setImageError(`You can attach up to ${MAX_TASK_IMAGES} images.`);
      return;
    }
    try {
      const compressed = await Promise.all(
        Array.from(fileList)
          .slice(0, remaining)
          .map((file) => compressImageFile(file, 480))
      );
      setImages((prev) => [...prev, ...compressed].slice(0, MAX_TASK_IMAGES));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to add image');
    }
  };

  const goToLinkedRecord = (link: TaskLink | null) => {
    if (link?.type === 'account') {
      navigate(pathForCrmAccount(link.id));
      return;
    }
    if (link?.type === 'contact') {
      const contact = contacts.find((c) => c.id === link.id);
      if (contact) {
        navigate(pathForCrmContact(contact.accountId, contact.id));
        return;
      }
    }
    navigate(pathForCrmTasks());
  };

  const handleSubmit = () => {
    const requiredMissing = fields.some((f) => f.required && !values[f.key]);
    if (requiredMissing) return;
    const link: TaskLink | null = linkId ? { type: linkType, id: linkId } : null;
    if (isEditing && taskId) {
      updateTask(taskId, values, link, images);
    } else {
      createTask(values, link, images);
    }
    goToLinkedRecord(link);
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-swiss-muted hover:text-primary hover:bg-black/[0.03] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-950">{isEditing ? 'Edit Task' : 'New Task'}</h1>
        <button
          type="button"
          onClick={() => navigate(pathForCrmFieldBuilder('task'))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e6fcef] text-primary rounded-lg text-xs font-bold shrink-0"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Customize this form
        </button>
      </div>

      <div className="mt-3 bg-white rounded-2xl border border-swiss-line p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {fields.map((field) => (
          <DynamicField key={field.id} field={field} values={values} onChange={handleChange} />
        ))}

        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-swiss-ink">
            Attach images to notes
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-swiss-muted">
              {images.length}/{MAX_TASK_IMAGES}
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative w-16 h-16">
                <img src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-swiss-line" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-black/10 text-swiss-muted flex items-center justify-center hover:text-danger-red"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < MAX_TASK_IMAGES ? (
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-swiss-line flex items-center justify-center text-swiss-faint cursor-pointer hover:border-primary/40 hover:text-primary transition-colors">
                <ImagePlus className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void handleAddImages(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            ) : null}
          </div>
          {imageError && <p className="mt-1.5 text-xs font-bold text-danger-red">{imageError}</p>}
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-bold text-swiss-ink">Link to</label>
          <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1 mb-2.5">
            <button
              type="button"
              onClick={() => {
                setLinkType('account');
                setLinkId('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                linkType === 'account' ? 'bg-white text-primary ' : 'text-swiss-muted'
              }`}
            >
              Account
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkType('contact');
                setLinkId('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                linkType === 'contact' ? 'bg-white text-primary ' : 'text-swiss-muted'
              }`}
            >
              Contact
            </button>
          </div>
          <select
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            className="w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select {linkType === 'account' ? 'an account' : 'a contact'}…</option>
            {linkType === 'account'
              ? accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {String(a.fields.name ?? 'Untitled')}
                  </option>
                ))
              : contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {String(c.fields.name ?? 'Untitled')}
                  </option>
                ))}
          </select>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => goToLinkedRecord(existing?.link ?? null)}
            className="px-4 py-2.5 rounded-xl border border-swiss-line text-sm font-bold text-swiss-muted hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl"
          >
            {isEditing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
