"use client";

import { Code2, Download, FileSpreadsheet, FileText, File as GenericFile, Image as ImageIcon, X } from "lucide-react";
import React from "react";

import { formatFileSize, getFileBadgeInfo, getFileCategory } from "@/lib/attachments";
import { cn } from "@/lib/utils";
import type { FileAttachment } from "@/types";

interface AttachmentItemProps {
  attachment: FileAttachment;
  onRemove?: () => void;
  variant?: "preview" | "bubble";
  onImageClick?: (attachment: FileAttachment) => void;
}

export function AttachmentItem({
  attachment,
  onRemove,
  variant = "preview",
  onImageClick,
}: AttachmentItemProps) {
  const category = getFileCategory(attachment.name, attachment.type);
  const badge = getFileBadgeInfo(attachment.name, attachment.type);
  const isImage = category === "image" && Boolean(attachment.dataUrl);

  const getIcon = () => {
    switch (category) {
      case "image":
        return <ImageIcon size={16} className="text-emerald-400" />;
      case "pdf":
        return <FileText size={16} className="text-rose-400" />;
      case "docx":
        return <FileText size={16} className="text-blue-400" />;
      case "code":
        return <Code2 size={16} className="text-purple-400" />;
      case "csv":
        return <FileSpreadsheet size={16} className="text-teal-400" />;
      default:
        return <GenericFile size={16} className="text-ink-muted" />;
    }
  };

  if (isImage && variant === "bubble") {
    return (
      <div className="group relative overflow-hidden rounded-lg border border-hairline bg-surface-raised transition-all hover:border-ink-faint">
        <button
          type="button"
          onClick={() => onImageClick?.(attachment)}
          className="block w-full text-left focus:outline-none"
          aria-label={`View image ${attachment.name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.dataUrl}
            alt={attachment.name}
            className="max-h-64 max-w-full rounded-t-lg object-contain bg-canvas/60 transition-transform group-hover:scale-[1.02]"
          />
        </button>
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs text-ink-muted bg-surface/90">
          <span className="truncate font-mono" title={attachment.name}>
            {attachment.name}
          </span>
          <span className="shrink-0 text-[11px] text-ink-faint">
            {formatFileSize(attachment.size)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 transition-colors",
        variant === "preview" ? "max-w-[220px] bg-surface-raised/80" : "bg-surface-raised/40",
      )}
    >
      {isImage ? (
        <button
          type="button"
          onClick={() => onImageClick?.(attachment)}
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-hairline bg-canvas focus:outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.dataUrl}
            alt={attachment.name}
            className="h-full w-full object-cover"
          />
        </button>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-hairline bg-canvas/60">
          {getIcon()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="truncate text-xs font-medium text-ink"
            title={attachment.name}
          >
            {attachment.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span
            className={cn(
              "rounded border px-1 py-0.2 text-[9px] font-mono font-semibold uppercase leading-tight",
              badge.colorClass,
            )}
          >
            {badge.label}
          </span>
          <span>{formatFileSize(attachment.size)}</span>
        </div>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${attachment.name}`}
          className="shrink-0 rounded-full p-1 text-ink-faint transition-colors hover:bg-hairline hover:text-ink"
        >
          <X size={13} />
        </button>
      )}

      {variant === "bubble" && attachment.dataUrl && (
        <a
          href={attachment.dataUrl}
          download={attachment.name}
          aria-label={`Download ${attachment.name}`}
          className="shrink-0 rounded-full p-1 text-ink-faint transition-colors hover:bg-hairline hover:text-ink"
        >
          <Download size={13} />
        </a>
      )}
    </div>
  );
}

export function AttachmentLightbox({
  attachment,
  onClose,
}: {
  attachment: FileAttachment | null;
  onClose: () => void;
}) {
  if (!attachment || !attachment.dataUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl border border-hairline bg-surface p-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-ink">
              {attachment.name}
            </span>
            <span className="text-xs text-ink-faint">
              ({formatFileSize(attachment.size)})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={attachment.dataUrl}
              download={attachment.name}
              aria-label="Download image"
              className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex max-h-[calc(90vh-60px)] items-center justify-center p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.dataUrl}
            alt={attachment.name}
            className="max-h-[75vh] max-w-full rounded object-contain"
          />
        </div>
      </div>
    </div>
  );
}
