"use client";

import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { useChat } from "@/hooks/useChat";
import type { Conversation } from "@/types";

interface ChatWindowProps {
  userId: string | null;
  conversation: Conversation | null;
  onFirstMessage: (conversationId: string, firstMessage: string) => void;
  onMessageSettled: (conversationId: string) => void;
}

export function ChatWindow({
  userId,
  conversation,
  onFirstMessage,
  onMessageSettled,
}: ChatWindowProps) {
  const { messages, isLoadingHistory, isStreaming, loadError, send, stopGeneration, retry } =
    useChat(userId, conversation?.id ?? null, {
      onFirstMessage,
      onMessageSettled,
    });

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        {loadError ? (
          <div className="flex h-full items-center justify-center text-sm text-danger">
            {loadError}
          </div>
        ) : (
          <MessageList
            messages={messages}
            isLoadingHistory={isLoadingHistory}
            isStreaming={isStreaming}
            hasConversation={!!conversation}
            onRetry={retry}
          />
        )}
      </div>
      <MessageInput
        disabled={!conversation}
        isStreaming={isStreaming}
        onSend={send}
        onStop={stopGeneration}
      />
    </div>
  );
}
