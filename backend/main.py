# app/main.py

from fastapi import FastAPI

from app.routes.chatbot import router as chatbot_router


app = FastAPI(
    title="Chatbot API",
)


app.include_router(chatbot_router)


@app.get("/")
async def root():
    return {"message": "Chatbot API is running"}