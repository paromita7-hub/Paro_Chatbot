"use client";

import { PanelLeft } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  onOpenSidebar: () => void;
}

export function MobileHeader({ title, onOpenSidebar }: MobileHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 md:hidden">
      <button
        aria-label="Open sidebar"
        onClick={onOpenSidebar}
        className="rounded p-1 text-ink-muted hover:text-ink"
      >
        <PanelLeft size={20} />
      </button>
      <span className="truncate text-sm font-medium text-ink">{title}</span>
    </div>
  );
}
