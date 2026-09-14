# app/routes/chatbot.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal, Optional
from starlette.concurrency import run_in_threadpool

from app.utils.openrouter_client import chat_with_history


router = APIRouter(
    tags=["Chat"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    history: Optional[List[ChatMessage]] = None
    message: Optional[str] = None


class ChatResponse(BaseModel):
    response: str


@router.post("/api/chat", response_model=ChatResponse)
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if request.history:
            history = [
                {
                    "role": message.role,
                    "content": message.content,
                }
                for message in request.history
            ]
        elif request.message:
            history = [
                {
                    "role": "user",
                    "content": request.message,
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