import base64
import io
import mimetypes
from typing import Any, Dict, List, Optional, Tuple, Union
import pypdf
import docx


IMAGE_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/svg+xml",
}

TEXT_MIME_PREFIXES = (
    "text/",
    "application/json",
    "application/javascript",
    "application/typescript",
    "application/xml",
    "application/x-yaml",
    "application/x-sh",
    "application/sql",
    "application/csv",
)

TEXT_FILE_EXTENSIONS = {
    ".txt",
    ".md",
    ".markdown",
    ".csv",
    ".json",
    ".yaml",
    ".yml",
    ".xml",
    ".html",
    ".htm",
    ".css",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".go",
    ".rs",
    ".rb",
    ".php",
    ".sh",
    ".bash",
    ".zsh",
    ".sql",
    ".env",
    ".ini",
    ".cfg",
    ".conf",
    ".log",
}


def decode_data_url(data_url: str) -> Tuple[str, bytes]:
    """
    Decodes a base64 Data URL into (mime_type, raw_bytes).
    Format: data:<mime_type>;base64,<encoded_data>
    """
    if not data_url or not data_url.startswith("data:"):
        raise ValueError("Invalid data URL format")

    try:
        header, encoded = data_url.split(",", 1)
        mime_part = header[len("data:") :]
        mime_type = mime_part.split(";")[0].strip().lower()
        raw_bytes = base64.b64decode(encoded)
        return mime_type, raw_bytes
    except Exception as exc:
        raise ValueError(f"Failed to decode base64 data URL: {exc}") from exc


def is_image_attachment(name: str, mime_type: str) -> bool:
    """Check if the attachment is an image supported by multimodal vision models."""
    if mime_type.lower() in IMAGE_MIME_TYPES:
        return True
    guessed_type, _ = mimetypes.guess_type(name)
    return bool(guessed_type and guessed_type.lower() in IMAGE_MIME_TYPES)


def is_pdf_attachment(name: str, mime_type: str) -> bool:
    """Check if attachment is a PDF document."""
    if mime_type.lower() == "application/pdf":
        return True
    return name.lower().endswith(".pdf")


def is_docx_attachment(name: str, mime_type: str) -> bool:
    """Check if attachment is a Microsoft Word DOCX document."""
    docx_mimes = {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    }
    if mime_type.lower() in docx_mimes:
        return True
    return name.lower().endswith(".docx")


def is_text_attachment(name: str, mime_type: str) -> bool:
    """Check if attachment is a plain text, code, config, or data file."""
    if any(mime_type.lower().startswith(prefix) for prefix in TEXT_MIME_PREFIXES):
        return True
    return any(name.lower().endswith(ext) for ext in TEXT_FILE_EXTENSIONS)


def extract_pdf_text(raw_bytes: bytes, max_pages: int = 100) -> str:
    """Extract text from PDF byte content page by page."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
        pages_text = []
        total_pages = len(reader.pages)
        pages_to_read = min(total_pages, max_pages)

        for idx in range(pages_to_read):
            page = reader.pages[idx]
            text = page.extract_text() or ""
            if text.strip():
                pages_text.append(f"--- Page {idx + 1} ---\n{text.strip()}")

        if total_pages > max_pages:
            pages_text.append(f"[Note: Truncated after {max_pages} of {total_pages} pages]")

        return "\n\n".join(pages_text) if pages_text else "[PDF contains no readable text or consists entirely of scanned images]"
    except Exception as exc:
        return f"[Error extracting text from PDF: {str(exc)}]"


def extract_docx_text(raw_bytes: bytes) -> str:
    """Extract text from Microsoft Word (.docx) byte content."""
    try:
        doc = docx.Document(io.BytesIO(raw_bytes))
        text_parts = []

        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text.strip())

        for table in doc.tables:
            table_rows = []
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells]
                table_rows.append(" | ".join(row_cells))
            if table_rows:
                text_parts.append("\n".join(table_rows))

        return "\n\n".join(text_parts) if text_parts else "[Document is empty]"
    except Exception as exc:
        return f"[Error extracting text from DOCX: {str(exc)}]"


def extract_text_content(raw_bytes: bytes) -> str:
    """Decode raw bytes into a string using UTF-8 or common fallback encodings."""
    for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            return raw_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    return "[Could not decode file content as text]"


def process_attachment(attachment: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process an attachment dict:
    {
        "name": str,
        "size": int,
        "type": str,
        "dataUrl": Optional[str],
        "extractedText": Optional[str],
    }

    Returns a dict with:
    - kind: "image" or "document"
    - if kind == "image": { "data_url": str, "name": str }
    - if kind == "document": { "name": str, "size": int, "text": str }
    """
    name = attachment.get("name", "Untitled")
    mime_type = attachment.get("type", "application/octet-stream")
    size = attachment.get("size", 0)
    data_url = attachment.get("dataUrl")
    extracted_text = attachment.get("extractedText")

    if is_image_attachment(name, mime_type) and data_url:
        return {
            "kind": "image",
            "name": name,
            "data_url": data_url,
        }

    # If client already pre-extracted plain text, use it
    if extracted_text is not None:
        doc_text = extracted_text
    elif data_url:
        try:
            decoded_mime, raw_bytes = decode_data_url(data_url)
            effective_mime = mime_type if mime_type != "application/octet-stream" else decoded_mime

            if is_pdf_attachment(name, effective_mime):
                doc_text = extract_pdf_text(raw_bytes)
            elif is_docx_attachment(name, effective_mime):
                doc_text = extract_docx_text(raw_bytes)
            else:
                # Treat as text / code / CSV / etc.
                doc_text = extract_text_content(raw_bytes)
        except Exception as exc:
            doc_text = f"[Failed to process file {name}: {str(exc)}]"
    else:
        doc_text = "[No file data provided]"

    return {
        "kind": "document",
        "name": name,
        "size": size,
        "text": doc_text,
    }


def format_message_content(
    content: str,
    attachments: Optional[List[Dict[str, Any]]] = None,
) -> Union[str, List[Dict[str, Any]]]:
    """
    Formats the message content for OpenRouter / OpenAI API.
    If image attachments are present, returns a list of content parts:
    [
        {"type": "text", "text": prompt_with_documents},
        {"type": "image_url", "image_url": {"url": data_url}},
        ...
    ]
    If only documents or text are present, returns a combined string.
    """
    if not attachments:
        return content

    doc_blocks = []
    image_parts = []

    for att in attachments:
        processed = process_attachment(att)
        if processed["kind"] == "image":
            image_parts.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": processed["data_url"],
                    },
                }
            )
        elif processed["kind"] == "document":
            doc_name = processed["name"]
            doc_size = processed["size"]
            doc_text = processed["text"]
            doc_blocks.append(
                f"[Attached Document: {doc_name} ({doc_size} bytes)]\n"
                f"{doc_text}\n"
                f"[End of Document: {doc_name}]"
            )

    full_text_parts = []
    if doc_blocks:
        full_text_parts.append("\n\n".join(doc_blocks))

    user_prompt = content.strip() if content else ""
    if user_prompt:
        full_text_parts.append(user_prompt)
    elif not full_text_parts and image_parts:
        full_text_parts.append("Please analyze the attached image(s).")
    elif not full_text_parts:
        full_text_parts.append("Please review the attached document(s).")

    combined_text = "\n\n".join(full_text_parts)

    if image_parts:
        return [{"type": "text", "text": combined_text}] + image_parts

    return combined_text
