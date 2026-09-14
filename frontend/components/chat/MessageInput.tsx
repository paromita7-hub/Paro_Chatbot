"use client";

import { ArrowUp, Square } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_MESSAGE_LENGTH = 8000;

interface MessageInputProps {
  disabled: boolean;
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function MessageInput({ disabled, isStreaming, onSend, onStop }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(resize);
  };

  return (
    <div className="border-t border-hairline bg-canvas px-4 py-4">
      <div className="mx-auto flex max-w-prose items-end gap-2 rounded-lg border border-hairline bg-surface px-3 py-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={disabled ? "Select or start a conversation to begin…" : "Message Paro…"}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled}
          className="max-h-[200px] py-1.5"
        />

        {isStreaming ? (
          <Button variant="secondary" size="icon" onClick={onStop} aria-label="Stop generating">
            <Square size={14} />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="icon"
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
          >
            <ArrowUp size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
