#!/usr/bin/env python3
"""
Processes HSK vocabulary CSV file to generate JSON with translations.
- Reads Simplified Chinese words from CSV
- Translates to Traditional Chinese, Vietnamese, and English using Google Translate V3 API
- Adds Pinyin and Jyutping (Cantonese pronunciation) using pinyin-jyutping library
- Adds Han Viet readings from CSV lookup
- Processes words in configurable batches for faster execution
- Outputs JSON file with all translations and metadata

CONFIGURATION: Change HSK_LEVEL variable at top of script to process different levels
"""

import csv
import json
import pinyin_jyutping
import asyncio
import os
import re
from typing import TypedDict, List
from google.cloud import translate_v3 as translate
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


# --- CONFIGURATION VARIABLES (CHANGE THESE) ---
HSK_LEVEL = 3  # Change this to process different levels (1, 2, 3, 4, 5, 6)
INPUT_CSV = f"vocabCsv/HSK - Level {HSK_LEVEL}.csv"
OUTPUT_JSON = f"mobile/data/hsk_level{HSK_LEVEL}.json"
BATCH_SIZE = 5  # Number of words to process in parallel
BATCH_DELAY = 2  # Seconds to wait between batches

# --- SYSTEM VARIABLES (DO NOT CHANGE) ---
# Set the service account credentials path
CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), "..", "translateKey.json")
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH

# Validate credentials file exists
if not os.path.exists(CREDENTIALS_PATH):
    print(f"❌ Error: Credentials file not found at {CREDENTIALS_PATH}")
    print("Please ensure translateKey.json exists in the project root")
    exit(1)

# Initialize Google Cloud Translation client
try:
    with open(CREDENTIALS_PATH, "r") as f:
        creds_data = json.load(f)
        PROJECT_ID = creds_data["project_id"]
    PARENT = f"projects/{PROJECT_ID}/locations/global"
    translate_client = translate.TranslationServiceClient()
    print(
        f"✅ Google Cloud Translation V3 client initialized for project: {PROJECT_ID}"
    )
except Exception as e:
    print(f"❌ Error initializing Google Cloud Translation client: {e}")
    exit(1)


def translate_with_google_v3(text, target_lang):
    """Translate text using Google Cloud Translation V3 API (sync)"""
    try:
        # Map language codes
        lang_map = {
            "zh-Hant": "zh-TW",  # Traditional Chinese
            "vi": "vi",  # Vietnamese
        }
        target = lang_map.get(target_lang, target_lang)

        # Prepare the request
        request = {
            "parent": PARENT,
            "contents": [text],
            "mime_type": "text/plain",
            "source_language_code": "zh-CN",  # Simplified Chinese
            "target_language_code": target,
        }

        # Make the translation request
        response = translate_client.translate_text(request=request)

        # Return the first translation
        if response.translations:
            return response.translations[0].translated_text
        else:
            print(f"❌ No translation returned for: {text}")
            exit(1)

    except Exception as e:
        print(f"❌ Translation API Exception: {str(e)}")
        print(f"🛑 Stopping script due to error")
        exit(1)


async def translate_with_google_async(text, target_lang):
    """Translate text using Google Cloud Translation V3 API (async wrapper)"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, translate_with_google_v3, text, target_lang)


# Global Jyutping instance to avoid rebuilding dictionary
_jyutping_instance = None


def get_jyutping_romanization(text):
    """Get Jyutping romanization using pinyin-jyutping library (sync)"""
    global _jyutping_instance
    try:
        jyutping = _jyutping_instance.jyutping(text, tone_numbers=True, spaces=True)
        return jyutping
    except Exception as e:
        print(f"❌ Jyutping API Error: {str(e)}")
        print(f"🛑 Stopping script due to Jyutping error")
        exit(1)


async def get_jyutping_async(text):
    """Get Jyutping asynchronously"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, get_jyutping_romanization, text)


def count_chinese_characters(text):
    """Count Chinese characters (CJK unified ideographs) in text"""
    # Remove special characters like pipes, parentheses, etc.
    clean_text = text.split("｜")[0].split("|")[0]
    clean_text = re.sub(r"[（(].*?[）)]", "", clean_text)
    clean_text = clean_text.strip()

    # Count Chinese characters (CJK unified ideographs)
    chinese_chars = re.findall(r"[\u4e00-\u9fff]", clean_text)
    return len(chinese_chars)


async def process_single_word(row, word_index):
    """Process a single word: ALL operations in parallel"""
    no = row["No"]
    chinese = row["Chinese"]
    pinyin = row["Pinyin"]
    english = row["English"]

    print(f"{word_index:3d}. Processing: {chinese} ({pinyin})")

    # Run ALL operations in parallel: Traditional + Vietnamese + Jyutping
    traditional_task = translate_with_google_async(chinese, "zh-Hant")
    vietnamese_task = translate_with_google_async(chinese, "vi")
    jyutping_task = get_jyutping_async(chinese)

    # Wait for ALL operations to complete simultaneously
    traditional, vietnamese, jyutping = await asyncio.gather(
        traditional_task, vietnamese_task, jyutping_task
    )

    print(f"     Traditional: {traditional}")
    print(f"     Jyutping: {jyutping}")
    print(f"     Vietnamese: {vietnamese}")

    # Count Chinese characters
    character_count = count_chinese_characters(chinese)
    print(f"     Character Count: {character_count}")

    # Create entry
    entry = {
        "id": int(no),
        "simplifiedChinese": chinese,
        "traditionalChinese": traditional,
        "pinyin": pinyin,
        "jyutping": jyutping,
        "english": english,
        "vietnamese": vietnamese,
        "characterCount": character_count,
    }

    print()
    return entry


async def process_batch_parallel(batch_data, batch_num, start_idx):
    """Process a batch of words: ALL translations happen simultaneously"""
    print(
        f"🚀 Batch {batch_num + 1}: Processing {len(batch_data)} words - ALL TRANSLATIONS IN PARALLEL..."
    )

    # Create tasks for ALL words in the batch
    tasks = []
    for i, row in enumerate(batch_data, start_idx + 1):
        task = process_single_word(row, i)
        tasks.append(task)

    # Process ALL words in the batch simultaneously
    print(
        f"⚡ Starting {len(tasks)} words × 2 translations = {len(tasks) * 2} parallel API calls..."
    )
    batch_results = await asyncio.gather(*tasks)
    print(
        f"✅ Batch {batch_num + 1} completed - all {len(tasks)} words processed simultaneously!"
    )
    print()

    return batch_results


async def process_hsk_csv():
    """Process HSK CSV with TRUE PARALLEL translations"""

    print(f"🔄 Processing HSK Level {HSK_LEVEL} CSV with Google Translation V3 API...")
    print("=" * 60)
    print(f"📂 Input:  {INPUT_CSV}")
    print(f"📂 Output: {OUTPUT_JSON}")
    print("=" * 60)

    # Initialize Jyutping library ONCE at the start
    print("🔧 Initializing Jyutping/Pinyin library (one-time setup)...")
    global _jyutping_instance
    _jyutping_instance = pinyin_jyutping.PinyinJyutping()
    print("✅ Jyutping/Pinyin library ready!")

    # Read CSV file
    csv_path = os.path.join(os.path.dirname(__file__), "..", INPUT_CSV)
    csv_data = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_data.append(row)

    print(f"📊 Found {len(csv_data)} entries in CSV")

    # Process entries
    print(f"🚀 Processing {len(csv_data)} entries")

    # Process entries in batches (TRUE PARALLEL)
    processed_data = []
    total_batches = (len(csv_data) + BATCH_SIZE - 1) // BATCH_SIZE
    print(
        f"🚀 Processing {len(csv_data)} entries in {total_batches} batches of {BATCH_SIZE}"
    )
    print(
        f"⚡ Each batch: {BATCH_SIZE} words × 2 translations = {BATCH_SIZE * 2} parallel API calls!"
    )
    print()

    for batch_num in range(total_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(csv_data))
        batch_data = csv_data[start_idx:end_idx]

        # Process entire batch in parallel
        batch_results = await process_batch_parallel(batch_data, batch_num, start_idx)
        processed_data.extend(batch_results)

        # Delay between batches
        if batch_num < total_batches - 1:
            print(f"⏳ Waiting {BATCH_DELAY} seconds before next batch...")
            await asyncio.sleep(BATCH_DELAY)
            print()

    # Add Han Viet readings to all entries
    print("📖 Adding Han Viet readings...")
    hanviet_path = os.path.join(
        os.path.dirname(__file__), "..", "vocabCsv", "hanviet.csv"
    )
    hanviet_data = load_hanviet_csv(hanviet_path)

    for entry in processed_data:
        hanviet_reading = find_hanviet_reading_with_multiple(entry, hanviet_data)
        entry["hanviet"] = hanviet_reading if hanviet_reading else ""

    print("✅ Han Viet readings added!")

    # Save the complete JSON
    output_file = os.path.join(os.path.dirname(__file__), "..", OUTPUT_JSON)
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Successfully created complete HSK Level {HSK_LEVEL} JSON!")
    print(f"📁 Output file: {output_file}")
    print(f"📊 Total entries: {len(processed_data)}")

    # Show sample of first few entries
    print("\n📋 Sample entries:")
    for i, entry in enumerate(processed_data[:3]):
        print(f"  {i+1}. {entry['simplifiedChinese']} → {entry['traditionalChinese']}")
        print(f"     Pinyin: {entry['pinyin']}")
        print(f"     Jyutping: {entry['jyutping']}")
        print(f"     English: {entry['english']}")
        print(f"     Vietnamese: {entry['vietnamese']}")
        print()


if __name__ == "__main__":
    asyncio.run(process_hsk_csv())
