# app/routes/chatbot.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal

from app.utils.openrouter_client import chat_with_history


router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    history: List[ChatMessage]


class ChatResponse(BaseModel):
    response: str


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Convert Pydantic models into the dictionary format
        # expected by chat_with_history()
        history = [
            {
                "role": message.role,
                "content": message.content,
            }
            for message in request.history
        ]

        result = chat_with_history(history)

        return ChatResponse(response=result)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(exc)}",
        )