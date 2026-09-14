"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { MarkdownContent } from "@/components/chat/MarkdownContent";
import { cn } from "@/lib/utils";
import type { DraftMessage } from "@/types";

export function MessageBubble({ message }: { message: DraftMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-surface-raised px-4 py-2.5 text-[15px] leading-6 text-ink whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex justify-start">
      <div className="w-full max-w-full">
        <div
          className={cn(
            "text-[15px] leading-7",
            message.isError && "text-danger",
          )}
        >
          {message.content ? (
            <MarkdownContent content={message.content} />
          ) : (
            <span className="text-ink-faint">Thinking…</span>
          )}
          {message.streaming && message.content && (
            <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse-cursor bg-accent" />
          )}
        </div>

        {!message.streaming && message.content && (
          <button
            aria-label="Copy message"
            onClick={handleCopy}
            className="mt-1.5 flex items-center gap-1 text-xs text-ink-faint opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}
