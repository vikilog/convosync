/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pathForCrmEditTask } from '../../../routes';
import { updateTaskFields } from './store';

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'text-swiss-muted bg-slate-100',
  Medium: 'text-[#92400e] bg-[#fff3e6]',
  High: 'text-danger-red bg-red-50',
};

export function PrioritySelect({ taskId, value }: { taskId: string; value: string }) {
  const colorClass = PRIORITY_COLORS[value] ?? PRIORITY_COLORS.Medium;
  return (
    <select
      value={value || 'Medium'}
      onChange={(e) => updateTaskFields(taskId, { priority: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      className={`rounded-lg px-2 py-1 text-xs font-bold border-none outline-none cursor-pointer ${colorClass}`}
    >
      <option value="Low">Low</option>
      <option value="Medium">Medium</option>
      <option value="High">High</option>
    </select>
  );
}

export function EditTaskButton({ taskId }: { taskId: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigate(pathForCrmEditTask(taskId));
      }}
      title="Edit task"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border border-border-subtle text-swiss-muted hover:bg-black/[0.03]"
    >
      <Pencil className="w-3 h-3" />
      Edit
    </button>
  );
}

export function TaskImageThumbs({ images }: { images?: string[] }) {
  if (!images || images.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1.5">
      {images.slice(0, 5).map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="w-6 h-6 rounded object-cover border border-swiss-line"
        />
      ))}
    </div>
  );
}
