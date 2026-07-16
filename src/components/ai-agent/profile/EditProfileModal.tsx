import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AgentProfileData } from '../types';

type Props = {
  profile: AgentProfileData;
  onClose: () => void;
  onSave: (patch: Partial<AgentProfileData>) => void;
  saving?: boolean;
};

export const EditProfileModal: React.FC<Props> = ({ profile, onClose, onSave, saving }) => {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#E5E7EB] shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-base font-bold text-[#111827]">Edit profile</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-[#E5E7EB] rounded-xl py-2.5 px-3 text-sm resize-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#6B7280] hover:text-[#111827]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-channel-green hover:bg-[#20bd5a] disabled:opacity-60 text-white rounded-xl text-sm font-bold"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
