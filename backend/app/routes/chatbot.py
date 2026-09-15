# app/routes/chatbot.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Literal, Optional
from starlette.concurrency import run_in_threadpool

from app.utils.openrouter_client import chat_with_history
from app.utils.attachment_parser import format_message_content


router = APIRouter(
    tags=["Chat"],
)


class FileAttachment(BaseModel):
    id: Optional[str] = None
    name: str
    size: int = 0
    type: str = "application/octet-stream"
    dataUrl: Optional[str] = None
    extractedText: Optional[str] = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    attachments: Optional[List[FileAttachment]] = None


class ChatRequest(BaseModel):
    history: Optional[List[ChatMessage]] = None
    message: Optional[str] = None
    attachments: Optional[List[FileAttachment]] = None


class ChatResponse(BaseModel):
    response: str


@router.post("/api/chat", response_model=ChatResponse)
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if request.history:
            history = []
            for msg in request.history:
                attachments_list = (
                    [att.model_dump() for att in msg.attachments]
                    if msg.attachments
                    else None
                )
                formatted_content = format_message_content(msg.content, attachments_list)
                history.append(
                    {
                        "role": msg.role,
                        "content": formatted_content,
                    }
                )
        elif request.message or request.attachments:
            attachments_list = (
                [att.model_dump() for att in request.attachments]
                if request.attachments
                else None
            )
            formatted_content = format_message_content(
                request.message or "",
                attachments_list,
            )
            history = [
                {
                    "role": "user",
                    "content": formatted_content,
                }
            ]
        else:
            raise HTTPException(
                status_code=422,
                detail="Either 'history' or 'message' must be provided in the request body.",
            )

        result = await run_in_threadpool(chat_with_history, history)

        return ChatResponse(response=result)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(exc)}",
        )