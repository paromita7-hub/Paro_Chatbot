from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Chatbot API is running"}


def test_cors_headers():
    response = client.options(
        "/api/chat",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


@patch("app.routes.chatbot.chat_with_history")
def test_chat_api_endpoint_with_history(mock_chat):
    mock_chat.return_value = "Hello from AI!"

    payload = {
        "history": [
            {"role": "user", "content": "Hello"},
        ]
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    assert response.json() == {"response": "Hello from AI!"}
    mock_chat.assert_called_once_with([{"role": "user", "content": "Hello"}])


@patch("app.routes.chatbot.chat_with_history")
def test_chat_endpoint_with_message(mock_chat):
    mock_chat.return_value = "Hello from AI single message!"

    payload = {"message": "Tell me a joke"}
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    assert response.json() == {"response": "Hello from AI single message!"}
    mock_chat.assert_called_once_with([{"role": "user", "content": "Tell me a joke"}])


def test_chat_missing_body():
    response = client.post("/api/chat", json={})
    assert response.status_code == 422
