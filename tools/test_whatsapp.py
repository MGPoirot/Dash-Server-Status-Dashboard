#!/usr/bin/env python3
"""
test_whatsapp.py

Sends a WhatsApp notification for a metric, bypassing alert-state logic.
Useful for verifying credentials and template configuration.

Usage:
  python3 -m tools.test_whatsapp --metric updates_watchtower_up
  python3 -m tools.test_whatsapp --metric updates_watchtower_up --status "🔴 Dead"
  python3 -m tools.test_whatsapp --subject "Custom Subject" --status "🔴 Test"
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src" / "whatsapp_integration"))


def _load_label(metric_id: str) -> str:
    config_path = ROOT / "content" / "configs" / f"{metric_id}.json"
    if config_path.exists():
        try:
            return json.loads(config_path.read_text(encoding="utf-8")).get("label", metric_id)
        except Exception:
            pass
    return metric_id


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Send a test WhatsApp notification.")
    ap.add_argument("--metric", help="metric_id whose config label becomes the subject")
    ap.add_argument("--subject", help="Override the subject line directly")
    ap.add_argument("--status", default="🔴 CRITICAL (test)", help="Status string (default: '🔴 CRITICAL (test)')")
    args = ap.parse_args(argv)

    if not args.metric and not args.subject:
        ap.error("Provide --metric or --subject (or both)")

    subject = args.subject or _load_label(args.metric)

    from whatsapp_notification import whatsapp_status_update
    print(f"Sending WhatsApp: subject={subject!r}, status={args.status!r} …")
    whatsapp_status_update(subject, args.status)
    print("Sent successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
