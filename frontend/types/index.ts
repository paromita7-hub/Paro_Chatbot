export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface ChatRequest {
  history: ChatMessage[];
}

export interface ChatResponse {
  response: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

/** A message still being generated on the client or with error status. */
export interface DraftMessage {
  id: string;
  role: MessageRole;
  content: string;
  streaming?: boolean;
  isError?: boolean;
}

export type ApiError = {
  detail?: string | Array<{ msg?: string }>;
  error?: string;
};

