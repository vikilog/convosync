import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { LG_BREAKPOINT, useMediaQuery } from '../hooks/useBreakpoint';

const STORAGE_KEY = 'wabiz:sidebar-collapsed';

export const SIDEBAR_WIDTH_EXPANDED = 220;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  toggleMobile: () => void;
  isLargeScreen: boolean;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* ignore */
  }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(readStoredCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLargeScreen = useMediaQuery(LG_BREAKPOINT);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    persistCollapsed(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      persistCollapsed(next);
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      toggleCollapsed,
      setCollapsed,
      mobileOpen,
      setMobileOpen,
      toggleMobile,
      isLargeScreen,
    }),
    [collapsed, toggleCollapsed, setCollapsed, mobileOpen, toggleMobile, isLargeScreen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return ctx;
}

export function useSidebarOffset(): number {
  const { collapsed, isLargeScreen } = useSidebar();
  if (!isLargeScreen) return 0;
  return collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
}
