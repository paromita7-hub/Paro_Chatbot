import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MessageBubble } from "@/components/chat/MessageBubble";

describe("MessageBubble", () => {
  it("renders user messages as plain text, right-aligned", () => {
    render(<MessageBubble message={{ id: "1", role: "user", content: "Hello there" }} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("renders user message with document attachments", () => {
    render(
      <MessageBubble
        message={{
          id: "1",
          role: "user",
          content: "Please check this report",
          attachments: [
            {
              id: "att-1",
              name: "quarterly_report.pdf",
              size: 204800,
              type: "application/pdf",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("Please check this report")).toBeInTheDocument();
    expect(screen.getByText("quarterly_report.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("200 KB")).toBeInTheDocument();
  });

  it("renders user message with image attachments", () => {
    render(
      <MessageBubble
        message={{
          id: "1",
          role: "user",
          content: "What is this image?",
          attachments: [
            {
              id: "att-2",
              name: "screenshot.png",
              size: 51200,
              type: "image/png",
              dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("What is this image?")).toBeInTheDocument();
    expect(screen.getByText("screenshot.png")).toBeInTheDocument();
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
