#!/usr/bin/env python3
"""Quick diagnostic script to test which APIs are configured and working."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.config import settings

print("\n" + "="*70)
print("🔍 API CONFIGURATION DIAGNOSTIC")
print("="*70)

# Check each API
apis = {
    "Groq": (settings.GROQ_API_KEY, "https://console.groq.com/keys", "FREE"),
    "HuggingFace": (settings.HUGGINGFACE_API_KEY, "https://huggingface.co/settings/tokens", "FREE"),
    "Anthropic Claude": (settings.ANTHROPIC_API_KEY, "https://console.anthropic.com/", "PAID"),
}

for name, (key, url, cost) in apis.items():
    is_placeholder = key in ["", "your_groq_api_key_here", "your_huggingface_api_key_here"]
    status = "❌ NOT CONFIGURED" if is_placeholder else "✅ CONFIGURED"
    print(f"\n{name} ({cost})")
    print(f"  Status: {status}")
    if is_placeholder:
        print(f"  Action: Get API key from {url}")
        print(f"  Then: Add to .env file as appropriate key name")

print("\n" + "="*70)

# Try imports
print("\n📦 CHECKING DEPENDENCIES")
print("="*70)

deps = [
    ("Groq SDK", "groq"),
    ("Anthropic SDK", "anthropic"),
    ("HuggingFace Transformers", "transformers"),
    ("Requests", "requests"),
    ("Torch", "torch"),
]

for name, module in deps:
    try:
        __import__(module)
        print(f"✅ {name} - installed")
    except ImportError:
        print(f"❌ {name} - NOT installed")

print("\n" + "="*70)
print("📋 NEXT STEPS:")
print("="*70)
print("1. Edit .env file with your API keys")
print("2. For fastest results, get a FREE Groq API key:")
print("   https://console.groq.com/keys")
print("3. Restart the backend: python backend/app/main.py")
print("4. Run analysis again from the UI")
print("="*70 + "\n")
