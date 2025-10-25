#!/usr/bin/env python3
"""
Test script for Chinese text conversion:
1. Simplified Chinese → Pinyin (Microsoft API)
2. Simplified Chinese → Vietnamese (Microsoft API)
3. Simplified Chinese → English (Microsoft API)
4. Simplified Chinese → Jyutping (pinyin-jyutping library)
"""

import requests
import json
import pinyin_jyutping
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- VARIABLES ---
API_KEY = os.getenv("MICROSOFT_TRANSLATOR_API_KEY")
ENDPOINT = "https://api.cognitive.microsofttranslator.com"
REGION = "canadaeast"

# Test text
TEST_TEXT = "晚上"


def translate_with_microsoft(text, target_lang):
    """Translate text using Microsoft Translator API"""
    try:
        url = f"{ENDPOINT}/translate?api-version=3.0&from=zh-Hans&to={target_lang}"

        headers = {
            "Ocp-Apim-Subscription-Key": API_KEY,
            "Ocp-Apim-Subscription-Region": REGION,
            "Content-Type": "application/json",
        }

        body = [{"text": text}]

        response = requests.post(url, headers=headers, json=body)

        if response.status_code == 200:
            result = response.json()
            return result[0]["translations"][0]["text"]
        else:
            return f"Error: {response.status_code} - {response.text}"

    except Exception as e:
        return f"Error: {str(e)}"


def get_pinyin_romanization(text):
    """Get Pinyin romanization using Microsoft API"""
    try:
        url = f"{ENDPOINT}/transliterate?api-version=3.0&language=zh-Hans&fromScript=Hans&toScript=Latn"

        headers = {
            "Ocp-Apim-Subscription-Key": API_KEY,
            "Ocp-Apim-Subscription-Region": REGION,
            "Content-Type": "application/json",
        }

        body = [{"text": text}]

        response = requests.post(url, headers=headers, json=body)

        if response.status_code == 200:
            result = response.json()
            return result[0]["text"]
        else:
            return f"Error: {response.status_code} - {response.text}"

    except Exception as e:
        return f"Error: {str(e)}"


def get_jyutping_romanization(text):
    """Get Jyutping romanization using pinyin-jyutping library"""
    try:
        j = pinyin_jyutping.PinyinJyutping()
        jyutping = j.jyutping(text, tone_numbers=True, spaces=True)
        return jyutping
    except Exception as e:
        return f"Error: {str(e)}"


def main():
    print("🧪 Testing Chinese Text Conversions")
    print("=" * 50)
    print(f"Input (Simplified Chinese): {TEST_TEXT}")
    print()

    # 1. Microsoft API - Pinyin
    print("1️⃣ Microsoft API - Pinyin:")
    pinyin = get_pinyin_romanization(TEST_TEXT)
    print(f"   Pinyin: {pinyin}")
    print()

    # 2. Microsoft API - Vietnamese
    print("2️⃣ Microsoft API - Vietnamese:")
    vietnamese = translate_with_microsoft(TEST_TEXT, "vi")
    print(f"   Vietnamese: {vietnamese}")
    print()

    # 3. Microsoft API - English
    print("3️⃣ Microsoft API - English:")
    english = translate_with_microsoft(TEST_TEXT, "en")
    print(f"   English: {english}")
    print()

    # 4. pinyin-jyutping library - Jyutping
    print("4️⃣ pinyin-jyutping library - Jyutping:")
    jyutping = get_jyutping_romanization(TEST_TEXT)
    print(f"   Jyutping: {jyutping}")
    print()

    # Summary
    print("📊 Summary:")
    print(f"   Original: {TEST_TEXT}")
    print(f"   Pinyin: {pinyin}")
    print(f"   Vietnamese: {vietnamese}")
    print(f"   English: {english}")
    print(f"   Jyutping: {jyutping}")


if __name__ == "__main__":
    main()