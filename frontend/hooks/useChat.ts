"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { api, ApiRequestError } from "@/lib/api";
import type { ChatMessage, DraftMessage } from "@/types";

interface UseChatOptions {
  onFirstMessage?: (conversationId: string, firstMessage: string) => void;
  onMessageSettled?: (conversationId: string) => void;
}

function getStorageKey(conversationId: string) {
  return `paro_messages_${conversationId}`;
}

export function useChat(
  userId: string | null,
  conversationId: string | null,
  options: UseChatOptions = {},
) {
  const [messages, setMessages] = useState<DraftMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);

  // Load message history from local storage when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setIsLoadingHistory(true);
    setLoadError(null);
    try {
      const stored = localStorage.getItem(getStorageKey(conversationId));
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        setMessages([]);
      }
    } catch {
      setLoadError("Couldn't load this conversation's messages.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [conversationId]);

  const saveMessages = useCallback(
    (targetConversationId: string, updatedMessages: DraftMessage[]) => {
      try {
        // Only persist non-streaming, successfully formatted messages
        const toSave = updatedMessages
          .filter((m) => !m.streaming && m.content.trim())
          .map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            isError: m.isError,
          }));
        localStorage.setItem(getStorageKey(targetConversationId), JSON.stringify(toSave));
      } catch {
        // ignore storage errors
      }
    },
    [],
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!conversationId || !text.trim()) return;

      const isFirstMessage = messages.length === 0;
      lastUserMessageRef.current = text;

      const userMessage: DraftMessage = { id: uuidv4(), role: "user", content: text };
      const assistantId = uuidv4();
      const assistantMessage: DraftMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
      };

      // Construct history payload for backend POST /api/chat
      const validPriorMessages: ChatMessage[] = messages
        .filter((m) => !m.isError && m.content.trim())
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const history: ChatMessage[] = [
        ...validPriorMessages,
        { role: "user", content: text },
      ];

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      if (isFirstMessage) {
        options.onFirstMessage?.(conversationId, text);
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await api.chat(history, controller.signal);

        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: result.response, streaming: false }
              : m,
          );
          saveMessages(conversationId, updated);
          return updated;
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const errorMessage =
            err instanceof ApiRequestError
              ? err.message
              : (err as Error).message || "Failed to generate response.";

          setMessages((prev) => {
            const updated = prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: errorMessage,
                    isError: true,
                    streaming: false,
                  }
                : m,
            );
            saveMessages(conversationId, updated);
            return updated;
          });
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
        );
        setIsStreaming(false);
        abortRef.current = null;
        options.onMessageSettled?.(conversationId);
      }
    },
    [conversationId, messages, options, saveMessages],
  );

  const retry = useCallback(() => {
    if (!lastUserMessageRef.current) return;
    // Drop the trailing user+assistant pair before resending.
    setMessages((prev) => prev.slice(0, -2));
    send(lastUserMessageRef.current);
  }, [send]);

  return {
    messages,
    isLoadingHistory,
    isStreaming,
    loadError,
    send,
    stopGeneration,
    retry,
  };
}

export { ApiRequestError };

