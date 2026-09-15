import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessageInput } from "@/components/chat/MessageInput";

describe("MessageInput", () => {
  it("sends the trimmed message on Enter and clears the field", () => {
    const onSend = vi.fn();
    render(
      <MessageInput disabled={false} isStreaming={false} onSend={onSend} onStop={vi.fn()} />,
    );

    const textarea = screen.getByPlaceholderText(/Message Paro…/i);
    fireEvent.change(textarea, { target: { value: "  hi there  " } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(onSend).toHaveBeenCalledWith("hi there", undefined);
    expect(textarea).toHaveValue("");
  });

  it("inserts a newline instead of sending on Shift+Enter", () => {
    const onSend = vi.fn();
    render(
      <MessageInput disabled={false} isStreaming={false} onSend={onSend} onStop={vi.fn()} />,
    );

    const textarea = screen.getByPlaceholderText(/Message Paro…/i);
    fireEvent.change(textarea, { target: { value: "line one" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("shows a Stop button instead of Send while streaming", () => {
    render(<MessageInput disabled={false} isStreaming={true} onSend={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByLabelText("Stop generating")).toBeInTheDocument();
    expect(screen.queryByLabelText("Send message")).not.toBeInTheDocument();
  });

  it("has an attach button for uploading images or documents", () => {
    render(<MessageInput disabled={false} isStreaming={false} onSend={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByLabelText("Attach images or documents")).toBeInTheDocument();
  });

  it("disables the textarea and shows a hint when no conversation is selected", () => {
    render(<MessageInput disabled={true} isStreaming={false} onSend={vi.fn()} onStop={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("Select or start a conversation to begin…"),
    ).toBeDisabled();
  });
});
