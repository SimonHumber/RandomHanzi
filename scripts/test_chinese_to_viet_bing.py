#!/usr/bin/env python3
"""
Simple script to test Chinese to Vietnamese translation using Bing Translator API.
Easy to change the character/text to translate at the top of the file.
"""

import requests
import os
from pathlib import Path
from dotenv import load_dotenv

# ===== CONFIGURATION =====
# Change this to test different Chinese characters/text
CHINESE_TEXT = "字"

# Bing Translator API endpoint
TRANSLATE_URL = "https://api.cognitive.microsofttranslator.com/translate"

# Load API key from .env file (look in project root)
script_dir = Path(__file__).parent
project_root = script_dir.parent
env_path = project_root / ".env"
load_dotenv(env_path)
BING_API_KEY = os.getenv("MICROSOFT_TRANSLATOR_API_KEY") or os.getenv(
    "BING_TRANSLATE_KEY"
)

if not BING_API_KEY:
    print(
        "❌ Error: MICROSOFT_TRANSLATOR_API_KEY or BING_TRANSLATE_KEY not found in .env file!"
    )
    print("Please add your Microsoft Translator API key to .env file:")
    print("MICROSOFT_TRANSLATOR_API_KEY=your_api_key_here")
    exit(1)

# Translation parameters
params = {
    "api-version": "3.0",
    "from": "zh-Hant",  # Traditional Chinese (use "zh-Hans" for Simplified)
    "to": "vi",  # Vietnamese
}

# Location/region for Bing Translator (e.g., "global", "canadaeast", "eastus", etc.)
# Required for regional Azure Translator resources - check your Azure Portal
BING_REGION = os.getenv("BING_TRANSLATOR_REGION", "canadaeast")

headers = {
    "Ocp-Apim-Subscription-Key": BING_API_KEY,
    "Ocp-Apim-Subscription-Region": BING_REGION,
    "Content-Type": "application/json",
}

body = [{"text": CHINESE_TEXT}]

# Translate
print(f"🔄 Translating: {CHINESE_TEXT}")
print(f"   From: Traditional Chinese (zh-Hant)")
print(f"   To: Vietnamese (vi)")
print()

try:
    response = requests.post(TRANSLATE_URL, params=params, headers=headers, json=body)

    if response.status_code == 200:
        result = response.json()
        translation = result[0]["translations"][0]["text"]
        print(f"✅ Result: {translation}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Exception: {str(e)}")
