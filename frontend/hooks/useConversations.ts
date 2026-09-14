"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import type { Conversation } from "@/types";

const STORAGE_KEY = "paro_conversations";

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        setConversations(parsed);
      }
    } catch {
      setError("Failed to load local conversations.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const saveConversations = useCallback((list: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore storage quota errors
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConversations(JSON.parse(stored));
      }
    } catch {
      setError("Failed to refresh conversations.");
    }
  }, []);

  const createConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      const newConv: Conversation = {
        id: uuidv4(),
        title: "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations((prev) => {
        const updated = [newConv, ...prev];
        saveConversations(updated);
        return updated;
      });
      return newConv;
    } catch {
      setError("Couldn't start a new conversation. Try again.");
      return null;
    }
  }, [saveConversations]);

  const renameConversation = useCallback(
    async (conversationId: string, title: string) => {
      setConversations((prev) => {
        const updated = prev.map((c) => (c.id === conversationId ? { ...c, title } : c));
        saveConversations(updated);
        return updated;
      });
    },
    [saveConversations],
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== conversationId);
        saveConversations(updated);
        return updated;
      });
      try {
        localStorage.removeItem(`paro_messages_${conversationId}`);
      } catch {
        // ignore
      }
    },
    [saveConversations],
  );

  /** Move a conversation to the top and bump it locally after a new message. */
  const touchConversation = useCallback(
    (conversationId: string, title?: string) => {
      setConversations((prev) => {
        const target = prev.find((c) => c.id === conversationId);
        if (!target) return prev;
        const updatedConv = {
          ...target,
          title: title ?? target.title,
          updated_at: new Date().toISOString(),
        };
        const updatedList = [updatedConv, ...prev.filter((c) => c.id !== conversationId)];
        saveConversations(updatedList);
        return updatedList;
      });
    },
    [saveConversations],
  );

  return {
    conversations,
    isLoading,
    error,
    refresh,
    createConversation,
    renameConversation,
    deleteConversation,
    touchConversation,
  };
}

