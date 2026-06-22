import type { ReactNode } from 'react';

type GoogleToolsSplitLayoutProps = {
  header: ReactNode;
  subTabs?: ReactNode;
  banner?: ReactNode;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
};

export function GoogleToolsSplitLayout({
  header,
  subTabs,
  banner,
  leftPanel,
  rightPanel,
}: GoogleToolsSplitLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-160px)] w-full min-w-0 flex-col overflow-hidden bg-[#F8FAFC]">
      {header}
      {subTabs}
      {banner}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[320px] shrink-0 h-full overflow-y-auto border-r border-[#E2E8F0] bg-white">
          {leftPanel}
        </div>
        <div className="flex-1 min-w-0 h-full overflow-hidden bg-[#F8FAFC]">{rightPanel}</div>
      </div>
    </div>
  );
}
