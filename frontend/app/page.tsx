"use client";

import { useCallback, useState } from "react";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { useConversations } from "@/hooks/useConversations";
import { useUserId } from "@/hooks/useUserId";

export default function HomePage() {
  const userId = useUserId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    conversations,
    isLoading,
    error,
    createConversation,
    renameConversation,
    deleteConversation,
    touchConversation,
  } = useConversations(userId);

  const handleCreate = useCallback(async () => {
    const conversation = await createConversation();
    if (conversation) {
      setActiveId(conversation.id);
      setSidebarOpen(false);
    }
  }, [createConversation]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteConversation(id);
      if (activeId === id) setActiveId(null);
    },
    [deleteConversation, activeId],
  );

  const handleFirstMessage = useCallback(
    (conversationId: string, firstMessage: string) => {
      const title = firstMessage.length <= 60 ? firstMessage : firstMessage.slice(0, 57) + "...";
      touchConversation(conversationId, title);
    },
    [touchConversation],
  );

  const handleMessageSettled = useCallback(
    (conversationId: string) => {
      touchConversation(conversationId);
    },
    [touchConversation],
  );

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        isLoading={isLoading}
        error={error}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onRename={renameConversation}
        onDelete={handleDelete}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader
          title={activeConversation?.title ?? "Paro"}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <ChatWindow
          userId={userId}
          conversation={activeConversation}
          onFirstMessage={handleFirstMessage}
          onMessageSettled={handleMessageSettled}
        />
      </div>
    </div>
  );
}
