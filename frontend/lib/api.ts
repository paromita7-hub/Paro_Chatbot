import type { ChatMessage, ChatResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiRequestError";
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body?.detail)) {
        message = body.detail
          .map((e: { msg?: string }) => e.msg || JSON.stringify(e))
          .join(", ");
      } else if (body?.error) {
        message = body.error;
      }
    } catch {
      // response wasn't JSON - keep the generic message
    }
    throw new ApiRequestError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  /**
   * Send chat history to backend endpoint POST /api/chat
   * Request body: { history: [{ role: "user" | "assistant" | "system", content: "..." }] }
   * Response body: { response: string }
   */
  chat: (history: ChatMessage[], signal?: AbortSignal) =>
    request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ history }),
      signal,
    }),
};

export { API_URL };

