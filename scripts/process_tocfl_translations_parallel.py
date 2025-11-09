#!/usr/bin/env python3
"""
Processes TOCFL Level 1 vocabulary CSV file to generate JSON with translations.
- Reads Simplified Chinese words from CSV
- Translates to Traditional Chinese and Vietnamese using Google Translate API
- Adds Jyutping (Cantonese pronunciation) using pinyin-jyutping library
- Adds Han Viet readings from CSV lookup
- Processes 5 words simultaneously for faster execution
- Outputs JSON file with all translations and metadata
"""

import csv
import json
import pinyin_jyutping
import asyncio
import aiohttp
import os
import re
from typing import TypedDict, List
from dotenv import load_dotenv
from add_hanviet_from_csv import load_hanviet_csv, find_hanviet_reading_with_multiple


class VocabEntry(TypedDict):
    id: int
    simplifiedChinese: str
    traditionalChinese: str
    pinyin: str
    jyutping: str
    english: str
    vietnamese: str
    characterCount: int
    hanviet: str


load_dotenv()

# Configuration
CSV_FILENAME = "TOCFL - 入門級.csv"
OUTPUT_FILE = "mobile/data/tocfl_level1.json"

API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"

if not API_KEY:
    print("❌ Error: GOOGLE_API_KEY not found in .env file!")
    exit(1)


async def translate_with_google_async(session, text, target_lang):
    """Translate text using Google Translation API"""
    lang_map = {
        "zh-CN": "zh-CN",
        "vi": "vi",
        "en": "en",
    }  # Traditional to Simplified, Vietnamese, English
    target = lang_map.get(target_lang, target_lang)

    params = {
        "key": API_KEY,
        "q": text,
        "source": "zh-TW",  # Source is Traditional Chinese
        "target": target,
        "format": "text",
    }

    async with session.get(GOOGLE_TRANSLATE_URL, params=params) as response:
        if response.status == 200:
            result = await response.json()
            return result["data"]["translations"][0]["translatedText"]
        else:
            print(f"❌ Translation API Error: {response.status}")
            exit(1)


_jyutping_instance = None


def get_jyutping_romanization(text):
    """Get Jyutping romanization using pinyin-jyutping library"""
    global _jyutping_instance
    return _jyutping_instance.jyutping(text, tone_numbers=True, spaces=True)


async def get_jyutping_async(text):
    """Get Jyutping asynchronously"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, get_jyutping_romanization, text)


def count_chinese_characters(text):
    """Count Chinese characters in text"""
    clean_text = text.split("｜")[0].split("|")[0]
    clean_text = re.sub(r"[（(].*?[）)]", "", clean_text).strip()
    return len(re.findall(r"[\u4e00-\u9fff]", clean_text))


def clean_word_type(text):
    """Remove word type annotations like (N), (VA), etc."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", text).strip()


async def process_single_word(session, row, word_index):
    """Process a single word with parallel operations"""
    chinese = clean_word_type(row["詞彙"])  # Remove word type annotations
    pinyin = row["漢語拼音"].strip()

    print(f"{word_index:3d}. Processing: {chinese} ({pinyin})")

    # Run operations in parallel
    simplified_task = translate_with_google_async(
        session, chinese, "zh-CN"
    )  # Traditional to Simplified
    vietnamese_task = translate_with_google_async(
        session, chinese, "vi"
    )  # Traditional to Vietnamese
    english_task = translate_with_google_async(
        session, chinese, "en"
    )  # Traditional to English
    jyutping_task = get_jyutping_async(chinese)

    simplified, vietnamese, english, jyutping = await asyncio.gather(
        simplified_task, vietnamese_task, english_task, jyutping_task
    )

    print(f"     Simplified: {simplified}")
    print(f"     Vietnamese: {vietnamese}")
    print(f"     English: {english}")
    print(f"     Jyutping: {jyutping}")

    return {
        "id": word_index,
        "simplifiedChinese": simplified,  # Converted from Traditional
        "traditionalChinese": chinese,  # Original Traditional
        "pinyin": pinyin,
        "jyutping": jyutping,
        "english": english,  # Translated from Traditional Chinese
        "vietnamese": vietnamese,
        "characterCount": count_chinese_characters(chinese),
    }


async def process_batch_parallel(session, batch_data, batch_num, start_idx):
    """Process a batch of words in parallel"""
    print(f"🚀 Batch {batch_num + 1}: Processing {len(batch_data)} words...")

    tasks = []
    for i, row in enumerate(batch_data, start_idx + 1):
        tasks.append(process_single_word(session, row, i))

    batch_results = await asyncio.gather(*tasks)
    print(f"✅ Batch {batch_num + 1} completed!")
    print()
    return batch_results


async def process_tocfl_csv():
    """Process TOCFL CSV with parallel translations and add Han Viet readings"""
    print("🔄 Processing TOCFL Level 1 CSV...")

    # Initialize Jyutping library
    global _jyutping_instance
    _jyutping_instance = pinyin_jyutping.PinyinJyutping()

    # Read CSV file
    csv_data = []
    with open(CSV_FILENAME, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        csv_data = list(reader)

    print(f"📝 Processing {len(csv_data)} entries from {CSV_FILENAME}")

    # Process entries in batches
    processed_data = []
    batch_size = 5
    total_batches = (len(csv_data) + batch_size - 1) // batch_size

    async with aiohttp.ClientSession() as session:
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(csv_data))
            batch_data = csv_data[start_idx:end_idx]

            batch_results = await process_batch_parallel(
                session, batch_data, batch_num, start_idx
            )
            processed_data.extend(batch_results)

            if batch_num < total_batches - 1:
                await asyncio.sleep(2)

    # Add Han Viet readings
    print("📖 Adding Han Viet readings...")
    hanviet_data = load_hanviet_csv("hanviet.csv")

    for entry in processed_data:
        hanviet_reading = find_hanviet_reading_with_multiple(entry, hanviet_data)
        entry["hanviet"] = hanviet_reading if hanviet_reading else ""

    # Save JSON to mobile project
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Complete! Output: {OUTPUT_FILE} ({len(processed_data)} entries)")


if __name__ == "__main__":
    asyncio.run(process_tocfl_csv())
