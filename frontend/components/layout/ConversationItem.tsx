"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== conversation.title) onRename(trimmed);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 rounded-md bg-surface-raised px-2 py-1.5">
        <input
          ref={inputRef}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraftTitle(conversation.title);
              setIsEditing(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink focus:outline-none"
        />
        <button
          aria-label="Save title"
          onClick={commitRename}
          className="rounded p-1 text-ink-muted hover:text-accent-strong"
        >
          <Check size={14} />
        </button>
        <button
          aria-label="Cancel rename"
          onClick={() => {
            setDraftTitle(conversation.title);
            setIsEditing(false);
          }}
          className="rounded p-1 text-ink-muted hover:text-ink"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer",
        isActive ? "bg-surface-raised text-ink" : "text-ink-muted hover:bg-surface-hover hover:text-ink",
      )}
      onClick={onSelect}
    >
      <span className="min-w-0 flex-1 truncate">{conversation.title}</span>

      {confirmingDelete ? (
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            aria-label="Confirm delete"
            onClick={onDelete}
            className="rounded p-1 text-danger hover:bg-danger/10"
          >
            <Check size={14} />
          </button>
          <button
            aria-label="Cancel delete"
            onClick={() => setConfirmingDelete(false)}
            className="rounded p-1 text-ink-muted hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <button
            aria-label="Rename conversation"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="rounded p-1 text-ink-faint hover:text-ink"
          >
            <Pencil size={13} />
          </button>
          <button
            aria-label="Delete conversation"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            className="rounded p-1 text-ink-faint hover:text-danger"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
