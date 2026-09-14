"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";

import { EmptyState } from "@/components/chat/EmptyState";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Button } from "@/components/ui/button";
import type { DraftMessage } from "@/types";

interface MessageListProps {
  messages: DraftMessage[];
  isLoadingHistory: boolean;
  isStreaming: boolean;
  hasConversation: boolean;
  onRetry: () => void;
}

export function MessageList({
  messages,
  isLoadingHistory,
  isStreaming,
  hasConversation,
  onRetry,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (wasNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    wasNearBottomRef.current = distanceFromBottom < 120;
  };

  if (isLoadingHistory) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-faint">
        Loading conversation…
      </div>
    );
  }

  if (messages.length === 0) {
    return <EmptyState hasConversation={hasConversation} />;
  }

  const lastMessage = messages[messages.length - 1];
  const lastFailed = lastMessage?.role === "assistant" && lastMessage.isError && !isStreaming;

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto">
      <div className="mx-auto max-w-prose space-y-5 px-4 py-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {lastFailed && (
          <div className="flex justify-start">
            <Button variant="secondary" size="sm" onClick={onRetry}>
              <RotateCcw size={14} />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
