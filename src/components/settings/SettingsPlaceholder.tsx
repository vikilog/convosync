import React from 'react';
import { Construction } from 'lucide-react';

export function SettingsPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mb-4">
        <Construction className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-400 mt-2 max-w-sm">
        This section is coming soon. Company info and team members are available now.
      </p>
    </div>
  );
}
