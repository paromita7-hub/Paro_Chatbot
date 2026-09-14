import os

import requests
from dotenv import load_dotenv

load_dotenv()


API_KEY = os.getenv("OPEN_ROUTER_API_KEY")

BASE_URL = os.getenv(
    "OPEN_ROUTER_BASE_URL",
    "https://openrouter.ai/api/v1",
)

MODEL = os.getenv(
    "OPEN_ROUTER_MODEL",
    "openai/gpt-5.6-luna",
)


def chat_with_history(history: list[dict[str, str]]) -> str:
    """
    Send chat history to OpenRouter and return the assistant response
    as a single string.

    Args:
        history: List of chat messages in the format:
            [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi!"},
                {"role": "user", "content": "Explain Docker"},
            ]

    Returns:
        The assistant's response as a string.
    """

    if not API_KEY:
        raise RuntimeError("OPEN_ROUTER_API_KEY is not set.")

    if not history:
        raise ValueError("Chat history cannot be empty.")

    url = f"{BASE_URL.rstrip('/')}/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }

    payload = {
        "model": MODEL,
        "messages": history,
        "stream": False,
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=60,
        )

        response.raise_for_status()

        data = response.json()

        return data["choices"][0]["message"]["content"]

    except requests.RequestException as exc:
        raise RuntimeError(f"OpenRouter request failed: {exc}") from exc

    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise RuntimeError(
            f"Unexpected OpenRouter response: {response.text}"
        ) from exc


def main():
    """
    Simple test for the chat_with_history wrapper.
    """

    history = [
        {
            "role": "user",
            "content": "Hello!",
        },
        {
            "role": "assistant",
            "content": "Hello! How can I help you?",
        },
        {
            "role": "user",
            "content": "What is Docker in simple terms?",
        },
    ]

    print(f"Testing model: {MODEL}")
    print(f"Endpoint: {BASE_URL.rstrip('/')}/chat/completions")
    print("\nChat history:")

    for message in history:
        print(f'{message["role"]}: {message["content"]}')

    print("\nSending request...")

    try:
        result = chat_with_history(history)

        print("\nAssistant response:")
        print(result)

    except Exception as exc:
        print(f"\nError: {exc}")


if __name__ == "__main__":
    main()