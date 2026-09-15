"use client";

import { ArrowUp, Loader2, Paperclip, Square, UploadCloud } from "lucide-react";
import React, { useRef, useState } from "react";

import { AttachmentItem, AttachmentLightbox } from "@/components/chat/AttachmentDisplay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { readFileAsAttachment } from "@/lib/attachments";
import { cn } from "@/lib/utils";
import type { FileAttachment } from "@/types";

const MAX_MESSAGE_LENGTH = 8000;
const ACCEPTED_FILE_TYPES = [
  "image/*",
  "application/pdf",
  ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  ".docx",
  ".doc",
  "text/*",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".html",
  ".css",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".cs",
  ".go",
  ".rs",
  ".rb",
  ".php",
  ".sh",
  ".sql",
  ".log",
].join(",");

interface MessageInputProps {
  disabled: boolean;
  isStreaming: boolean;
  onSend: (text: string, attachments?: FileAttachment[]) => void;
  onStop: () => void;
}

export function MessageInput({ disabled, isStreaming, onSend, onStop }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<FileAttachment | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || disabled) return;

    setIsProcessingFiles(true);
    setErrorMessage(null);

    const fileList = Array.from(files);
    const newAttachments: FileAttachment[] = [];
    const errors: string[] = [];

    for (const file of fileList) {
      try {
        const attachment = await readFileAsAttachment(file);
        newAttachments.push(attachment);
      } catch (err) {
        errors.push((err as Error).message || `Failed to process ${file.name}`);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(". "));
      setTimeout(() => setErrorMessage(null), 5000);
    }

    setIsProcessingFiles(false);
  };

  const handleSend = () => {
    const trimmed = value.trim();
    const hasAttachments = attachments.length > 0;
    if ((!trimmed && !hasAttachments) || disabled || isStreaming || isProcessingFiles) return;

    onSend(trimmed, hasAttachments ? attachments : undefined);
    setValue("");
    setAttachments([]);
    setErrorMessage(null);
    requestAnimationFrame(resize);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isStreaming) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (disabled || isStreaming) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (disabled || isStreaming) return;

    const items = Array.from(e.clipboardData.items || []);
    const files: File[] = [];

    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      await handleFiles(files);
    }
  };

  const canSend = !disabled && !isStreaming && !isProcessingFiles && (Boolean(value.trim()) || attachments.length > 0);

  return (
    <div className="border-t border-hairline bg-canvas px-4 py-4">
      {errorMessage && (
        <div className="mx-auto mb-2 max-w-prose rounded-md bg-danger/10 px-3 py-1.5 text-xs text-danger border border-danger/20 animate-in fade-in">
          {errorMessage}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative mx-auto max-w-prose rounded-lg border bg-surface transition-all",
          isDraggingOver
            ? "border-accent ring-2 ring-accent/30 bg-surface-raised"
            : "border-hairline",
        )}
      >
        {isDraggingOver && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface/90 backdrop-blur-sm border-2 border-dashed border-accent">
            <div className="flex items-center gap-2 text-sm font-medium text-accent-strong">
              <UploadCloud size={20} className="animate-bounce" />
              <span>Drop files or images to attach</span>
            </div>
          </div>
        )}

        {/* Attachment preview tray */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-hairline px-3 py-2.5">
            {attachments.map((att) => (
              <AttachmentItem
                key={att.id}
                attachment={att}
                variant="preview"
                onRemove={() => handleRemoveAttachment(att.id)}
                onImageClick={(img) => setPreviewImage(img)}
              />
            ))}
            {isProcessingFiles && (
              <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-raised/40 px-3 py-1.5 text-xs text-ink-faint">
                <Loader2 size={13} className="animate-spin text-accent" />
                <span>Reading files…</span>
              </div>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-end gap-2 px-3 py-2">
          {/* File Picker input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isStreaming || isProcessingFiles}
            aria-label="Attach images or documents"
            title="Attach images, PDFs, docs, or files"
            className="shrink-0 text-ink-muted hover:text-ink hover:bg-surface-raised"
          >
            <Paperclip size={18} />
          </Button>

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              resize();
            }}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              disabled
                ? "Select or start a conversation to begin…"
                : attachments.length > 0
                  ? "Add instructions or press Enter to analyze attachments…"
                  : "Message Paro… (Paste or drop files/images)"
            }
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={disabled}
            className="max-h-[200px] py-1.5"
          />

          {isStreaming ? (
            <Button
              variant="secondary"
              size="icon"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Square size={14} />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="icon"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
            >
              <ArrowUp size={16} />
            </Button>
          )}
        </div>
      </div>

      <AttachmentLightbox
        attachment={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
