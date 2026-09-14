import { API_URL } from "@/lib/api";

export type ChatStreamEvent =
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * POSTs to /api/chat and yields parsed SSE events as they arrive.
 *
 * `fetch` + a manual reader is used instead of `EventSource` because
 * EventSource only supports GET requests, and the chat payload needs to be
 * sent as a POST body.
 */
export async function* streamChat(
  userId: string,
  conversationId: string,
  message: string,
  signal: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
    signal,
  });

  if (!response.ok || !response.body) {
    let detail = `Request failed with status ${response.status}.`;
    try {
      const body = await response.json();
      if (body?.error) detail = body.error;
    } catch {
      // ignore - fall back to generic message
    }
    yield { type: "error", message: detail };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const parsed = parseSseEvent(rawEvent);
      if (parsed) yield parsed;
    }
  }
}

function parseSseEvent(raw: string): ChatStreamEvent | null {
  let eventType = "message";
  let data = "";

  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) {
      eventType = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice("data:".length).trim();
    }
  }

  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    if (eventType === "chunk") return { type: "chunk", text: parsed.text ?? "" };
    if (eventType === "done") return { type: "done" };
    if (eventType === "error") return { type: "error", message: parsed.message ?? "Unknown error." };
  } catch {
    return null;
  }
  return null;
}
