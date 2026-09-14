"use client";

import { PanelLeftClose, SquarePen } from "lucide-react";

import { ConversationItem } from "@/components/layout/ConversationItem";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeId,
  isLoading,
  error,
  isOpen,
  onClose,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: SidebarProps) {
  return (
    <>
      {/* Mobile scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-hairline bg-surface",
          "transition-transform duration-200 ease-out md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="font-medium tracking-tight text-ink">Paro</span>
          <button
            aria-label="Close sidebar"
            onClick={onClose}
            className="rounded p-1 text-ink-muted hover:text-ink md:hidden"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="px-3">
          <Button variant="secondary" className="w-full justify-start" onClick={onCreate}>
            <SquarePen size={16} />
            New chat
          </Button>
        </div>

        <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Conversations">
          {isLoading && (
            <p className="px-2 py-2 text-sm text-ink-faint">Loading conversations…</p>
          )}
          {error && <p className="px-2 py-2 text-sm text-danger">{error}</p>}
          {!isLoading && !error && conversations.length === 0 && (
            <p className="px-2 py-2 text-sm text-ink-faint">
              No conversations yet. Start one above.
            </p>
          )}
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeId}
              onSelect={() => {
                onSelect(conversation.id);
                onClose();
              }}
              onRename={(title) => onRename(conversation.id, title)}
              onDelete={() => onDelete(conversation.id)}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
