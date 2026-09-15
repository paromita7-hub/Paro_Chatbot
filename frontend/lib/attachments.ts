import { v4 as uuidv4 } from "uuid";
import type { FileAttachment } from "@/types";

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const num = bytes / Math.pow(1024, i);
  const formatted = (i === 0 ? num.toFixed(0) : num.toFixed(1)).replace(/\.0$/, "");
  return `${formatted} ${units[i]}`;
}

export type FileCategory = "image" | "pdf" | "docx" | "code" | "csv" | "text" | "other";

const CODE_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "py", "html", "css", "scss", "json", "yaml", "yml",
  "xml", "sql", "sh", "bash", "zsh", "rs", "go", "java", "c", "cpp", "h", "hpp",
  "cs", "php", "rb", "env", "ini", "cfg", "conf", "log"
]);

export function getFileCategory(name: string, mimeType: string): FileCategory {
  const mime = (mimeType || "").toLowerCase();
  const ext = (name.split(".").pop() || "").toLowerCase();

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext)) {
    return "image";
  }
  if (mime === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    ["docx", "doc"].includes(ext)
  ) {
    return "docx";
  }
  if (mime === "text/csv" || ext === "csv") {
    return "csv";
  }
  if (CODE_EXTENSIONS.has(ext) || mime.includes("json") || mime.includes("javascript") || mime.includes("typescript")) {
    return "code";
  }
  if (mime.startsWith("text/") || ext === "txt" || ext === "md" || ext === "markdown") {
    return "text";
  }
  return "other";
}

export function getFileBadgeInfo(name: string, mimeType: string): { label: string; colorClass: string } {
  const ext = (name.split(".").pop() || "").toUpperCase();
  const category = getFileCategory(name, mimeType);

  switch (category) {
    case "image":
      return { label: ext || "IMG", colorClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    case "pdf":
      return { label: "PDF", colorClass: "bg-rose-500/15 text-rose-400 border-rose-500/30" };
    case "docx":
      return { label: "DOCX", colorClass: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
    case "code":
      return { label: ext || "CODE", colorClass: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
    case "csv":
      return { label: "CSV", colorClass: "bg-teal-500/15 text-teal-400 border-teal-500/30" };
    case "text":
      return { label: ext || "TXT", colorClass: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    default:
      return { label: ext || "FILE", colorClass: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" };
  }
}

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function readFileAsAttachment(file: File): Promise<FileAttachment> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File "${file.name}" exceeds maximum allowed size of 20 MB.`);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.readAsDataURL(file);
  });

  const category = getFileCategory(file.name, file.type);
  let extractedText: string | undefined = undefined;

  // For small plain text / code files, also extract plain text on the client
  if ((category === "text" || category === "code" || category === "csv") && file.size < 2 * 1024 * 1024) {
    try {
      extractedText = await file.text();
    } catch {
      // Fall back to backend decode if client text read fails
    }
  }

  return {
    id: uuidv4(),
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    dataUrl,
    extractedText,
  };
}
