import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, ApiRequestError } from "@/lib/api";

describe("api.chat", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends chat history to /api/chat and returns response", async () => {
    const mockResponse = { response: "Hello! I am Paro." };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const history = [{ role: "user" as const, content: "Hi" }];
    const result = await api.chat(history);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it("handles FastAPI error detail format", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: "Failed to generate response: OpenRouter timeout" }),
    } as Response);

    await expect(
      api.chat([{ role: "user" as const, content: "Hi" }]),
    ).rejects.toThrow(ApiRequestError);
  });
});
