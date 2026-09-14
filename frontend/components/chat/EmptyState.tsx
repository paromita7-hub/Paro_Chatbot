export function EmptyState({ hasConversation = true }: { hasConversation?: boolean }) {
  if (!hasConversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-medium text-ink">Paro</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Start a new chat from the sidebar, or pick up a conversation you've already begun.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="text-lg font-medium text-ink">What are you working on?</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        Ask a question, paste something to think through, or pick up an old thread from the
        sidebar.
      </p>
    </div>
  );
}
