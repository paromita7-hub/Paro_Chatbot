import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MessageBubble } from "@/components/chat/MessageBubble";

describe("MessageBubble", () => {
  it("renders user messages as plain text, right-aligned", () => {
    render(<MessageBubble message={{ id: "1", role: "user", content: "Hello there" }} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("renders assistant messages through the markdown pipeline", () => {
    render(
      <MessageBubble
        message={{ id: "2", role: "assistant", content: "**bold** text" }}
      />,
    );
    expect(screen.getByText("bold")).toBeInTheDocument();
  });

  it("shows a placeholder while an empty assistant message is streaming", () => {
    render(
      <MessageBubble message={{ id: "3", role: "assistant", content: "", streaming: true }} />,
    );
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
  });

  it("does not show the copy button while streaming", () => {
    render(
      <MessageBubble
        message={{ id: "4", role: "assistant", content: "partial", streaming: true }}
      />,
    );
    expect(screen.queryByLabelText("Copy message")).not.toBeInTheDocument();
  });
});
