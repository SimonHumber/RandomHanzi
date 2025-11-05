#!/usr/bin/env python3
"""
Processes Kyoiku Kanji Grade 1 CSV file to generate JSON with translations.
- Reads kanji data from CSV (kanji, onyomi, kunyomi, english)
- Translates English to Vietnamese using Google Translate API
- Adds Han Viet readings using hanviet CSV lookup
- Outputs JSON file with all translations and metadata
"""

import csv
import json
import asyncio
import aiohttp
import os
import re
from typing import TypedDict, List
from dotenv import load_dotenv
from add_hanviet_from_csv import load_hanviet_csv, find_hanviet_reading_with_multiple


class KanjiEntry(TypedDict):
    kanji: str
    onyomi: str
    kunyomi: str
    hanviet: str
    viet: str
    english: str


load_dotenv()

# Configuration
CSV_FILENAME = "Kyoiku Kanji - Grade 1.csv"
OUTPUT_FILE = "mobile/data/kanji_grade1.json"

API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"

if not API_KEY:
    print("❌ Error: GOOGLE_API_KEY not found in .env file!")
    exit(1)


async def translate_with_google_async(session, text, target_lang):
    """Translate text using Google Translation API"""
    params = {
        "key": API_KEY,
        "q": text,
        "source": "en",
        "target": target_lang,
        "format": "text",
    }

    async with session.get(GOOGLE_TRANSLATE_URL, params=params) as response:
        if response.status == 200:
            result = await response.json()
            return result["data"]["translations"][0]["translatedText"]
        else:
            print(f"❌ Translation API Error: {response.status}")
            exit(1)


async def process_single_kanji(session, row, hanviet_data):
    """Process a single kanji with parallel operations"""
    kanji = row["Kanji"].strip()
    english = row["English"].strip()
    onyomi = row["On'yomi"].strip()
    kunyomi = row["Kun'yomi"].strip()

    print(f"Processing: {kanji} ({english})")

    # Translate English to Vietnamese
    vietnamese = await translate_with_google_async(session, english, "vi")
    print(f"     Vietnamese: {vietnamese}")

    # Find Han Viet reading
    # Create a temporary entry structure for the hanviet lookup function
    temp_entry = {"traditionalChinese": kanji}
    hanviet_reading = find_hanviet_reading_with_multiple(temp_entry, hanviet_data)
    hanviet = hanviet_reading if hanviet_reading else ""
    print(f"     Han Viet: {hanviet}")

    return {
        "kanji": kanji,
        "onyomi": onyomi,
        "kunyomi": kunyomi,
        "hanviet": hanviet,
        "viet": vietnamese,
        "english": english,
    }


async def process_batch_parallel(session, batch_data, batch_num, hanviet_data):
    """Process a batch of kanji in parallel"""
    print(f"🚀 Batch {batch_num + 1}: Processing {len(batch_data)} kanji...")

    tasks = []
    for row in batch_data:
        tasks.append(process_single_kanji(session, row, hanviet_data))

    batch_results = await asyncio.gather(*tasks)
    print(f"✅ Batch {batch_num + 1} completed!")
    print()
    return batch_results


async def process_kanji_csv():
    """Process Kanji CSV with parallel translations and add Han Viet readings"""
    print("🔄 Processing Kyoiku Kanji Grade 1 CSV...")

    # Load Han Viet data
    print("📖 Loading Han Viet data...")
    hanviet_data = load_hanviet_csv("hanviet.csv")

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
                session, batch_data, batch_num, hanviet_data
            )
            processed_data.extend(batch_results)

            if batch_num < total_batches - 1:
                await asyncio.sleep(2)

    # Save JSON to mobile project
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Complete! Output: {OUTPUT_FILE} ({len(processed_data)} entries)")


if __name__ == "__main__":
    asyncio.run(process_kanji_csv())
