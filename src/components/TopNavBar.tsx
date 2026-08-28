/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { useSidebar, useSidebarOffset } from '../contexts/SidebarContext';
import { Input } from './ui/input';

interface TopNavBarProps {
  title: string;
  searchPlaceholder?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hideSearch?: boolean;
  hideTitle?: boolean;
  hidden?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  title,
  searchPlaceholder = 'Search for messages, contacts or settings...',
  searchQuery,
  setSearchQuery,
  hideSearch = false,
  hideTitle = false,
  hidden = false,
}) => {
  const sidebarOffset = useSidebarOffset();
  const { toggleMobile, isLargeScreen } = useSidebar();

  if (hidden) return null;

  return (
    <header
      className="h-16 fixed top-0 right-0 left-0 lg:left-auto bg-white/90 backdrop-blur-sm border-b border-gray-200/80 flex items-center gap-3 px-4 md:px-6 z-40 selection:bg-emerald-100 transition-[left] duration-200 ease-out"
      style={isLargeScreen ? { left: sidebarOffset } : undefined}
    >
      {!isLargeScreen && (
        <button
          type="button"
          onClick={toggleMobile}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-swiss-muted hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="min-w-0 flex-1 text-left">
        {!hideTitle && (
          <h2 className="font-sans font-bold text-swiss-ink leading-tight truncate text-sm md:text-base min-w-0">
            {title}
          </h2>
        )}
      </div>

      {!hideSearch && (
        <div className="hidden md:flex flex-1 max-w-md min-w-0">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-swiss-faint">
              <Search className="w-4 h-4" />
            </span>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-auto rounded-lg border-gray-200 bg-white py-1.5 pl-9 pr-4 text-xs font-medium text-swiss-ink placeholder:text-swiss-faint transition-all focus-visible:border-channel-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 text-swiss-muted hover:bg-emerald-50 hover:text-emerald-700 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-danger-red rounded-full border-2 border-white animate-pulse" />
        </button>
      </div>
    </header>
  );
};
