from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


ENV_PATH = Path("/opt/dash/Dash-Server-Status-Dashboard-main/.env")


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def whatsapp_status_update(subject: str, status: str) -> None:
    """
    Send a WhatsApp status update.

    Uses the template:
        status_of_your_order_has_changed

    Expected template body parameters:
        1. subject
        2. status

    Example:
        whatsapp_status_update("Storage", "🔴 90%")

    Results in a WhatsApp message like:
        Hello, the status of your Storage has changed to 🔴 90% status.
    """

    load_dotenv(ENV_PATH, override=True)

    access_token = _required_env("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = _required_env("WHATSAPP_PHONE_NUMBER_ID")
    recipient = os.getenv("WHATSAPP_STATUS_RECIPIENT") or _required_env("WHATSAPP_TEST_RECIPIENT")

    api_version = os.getenv("WHATSAPP_API_VERSION", "v25.0")
    base_url = os.getenv("WHATSAPP_GRAPH_API_BASE_URL", "https://graph.facebook.com").rstrip("/")

    template_name = os.getenv(
        "WHATSAPP_STATUS_TEMPLATE_NAME",
        "status_of_your_order_has_changed",
    )
    template_language = os.getenv(
        "WHATSAPP_STATUS_TEMPLATE_LANGUAGE",
        "en",
    )

    url = f"{base_url}/{api_version}/{phone_number_id}/messages"

    payload: dict[str, Any] = {
        "messaging_product": "whatsapp",
        "to": recipient,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": template_language,
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {
                            "type": "text",
                            "text": subject,
                        },
                        {
                            "type": "text",
                            "text": status,
                        },
                    ],
                }
            ],
        },
    }

    response = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )

    if response.status_code >= 400:
        try:
            error_body = response.json()
        except ValueError:
            error_body = response.text

        raise RuntimeError(
            f"WhatsApp API request failed with HTTP {response.status_code}: {error_body}"
        )