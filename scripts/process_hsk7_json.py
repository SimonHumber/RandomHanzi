#!/usr/bin/env python3
"""
Processes HSK 7 vocabulary JSON file to generate JSON with translations.
- Reads Simplified Chinese, Traditional Chinese, Pinyin, and English from JSON (REUSES existing data)
- Translates to Vietnamese using Google Translate V3 API (only new translation)
- Adds Jyutping (Cantonese pronunciation) using pinyin-jyutping library
- Adds Han Viet readings from CSV lookup
- Processes words in configurable batches for faster execution
- Outputs JSON file with all translations and metadata

CONFIGURATION: Change BATCH_SIZE and BATCH_GAP variables at top of script
"""

import json
import pinyin_jyutping
import time
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
INPUT_JSON = "vocabCsv/hsk7.json"
OUTPUT_JSON = "mobile/data/hsk_level7.json"
BATCH_SIZE = 200  # Number of words to process per batch
BATCH_GAP = 0.5  # Seconds to wait between batches

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


def translate_batch(texts, target_lang):
    """Translate multiple texts using Google Cloud Translation V3 API (batch)"""
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
            "contents": texts,
            "mime_type": "text/plain",
            "source_language_code": "zh-CN",  # Simplified Chinese
            "target_language_code": target,
        }

        # Make the translation request
        response = translate_client.translate_text(request=request)

        # Return all translations
        if response.translations:
            return [trans.translated_text for trans in response.translations]
        else:
            print(f"❌ No translations returned for batch")
            return [""] * len(texts)

    except Exception as e:
        print(f"❌ Translation API Exception: {str(e)}")
        print(f"🛑 Stopping script due to error")
        exit(1)


# Global Jyutping instance to avoid rebuilding dictionary
_jyutping_instance = None


def get_jyutping_romanization(text):
    """Get Jyutping romanization using pinyin-jyutping library"""
    global _jyutping_instance
    try:
        jyutping = _jyutping_instance.jyutping(text, tone_numbers=True, spaces=True)
        return jyutping
    except Exception as e:
        print(f"❌ Jyutping API Error: {str(e)}")
        print(f"🛑 Stopping script due to Jyutping error")
        exit(1)


def count_chinese_characters(text):
    """Count Chinese characters (CJK unified ideographs) in text"""
    # Remove special characters like pipes, parentheses, etc.
    clean_text = text.split("｜")[0].split("|")[0]
    clean_text = re.sub(r"[（(].*?[）)]", "", clean_text)
    clean_text = clean_text.strip()

    # Count Chinese characters (CJK unified ideographs)
    chinese_chars = re.findall(r"[\u4e00-\u9fff]", clean_text)
    return len(chinese_chars)


def translate_batch_from_traditional(texts, target_lang):
    """Translate multiple Traditional Chinese texts using Google Cloud Translation V3 API (batch)"""
    try:
        # Map language codes
        lang_map = {
            "vi": "vi",  # Vietnamese
        }
        target = lang_map.get(target_lang, target_lang)

        # Prepare the request
        request = {
            "parent": PARENT,
            "contents": texts,
            "mime_type": "text/plain",
            "source_language_code": "zh-TW",  # Traditional Chinese
            "target_language_code": target,
        }

        # Make the translation request
        response = translate_client.translate_text(request=request)

        # Return all translations
        if response.translations:
            return [trans.translated_text for trans in response.translations]
        else:
            print(f"❌ No translations returned for batch")
            return [""] * len(texts)

    except Exception as e:
        print(f"❌ Translation API Exception: {str(e)}")
        print(f"🛑 Stopping script due to error")
        exit(1)


def process_batch(batch_data, batch_num, total_batches):
    """Process a batch of words using batch API calls - reuses simplified, traditional, and pinyin from JSON"""
    print(
        f"🚀 Batch {batch_num + 1}/{total_batches}: Processing {len(batch_data)} words..."
    )

    # Extract data from JSON (reusing existing simplified, traditional, pinyin, english)
    simplified_list = []
    traditional_list = []
    pinyin_list = []
    english_list = []

    for item in batch_data:
        # Reuse simplified Chinese from JSON
        simplified = item["simplified"]
        simplified_list.append(simplified)

        # Reuse traditional Chinese from JSON
        traditional = (
            item["forms"][0]["traditional"]
            if item["forms"] and item["forms"][0].get("traditional")
            else simplified
        )
        traditional_list.append(traditional)

        # Reuse pinyin from JSON
        pinyin = (
            item["forms"][0]["transcriptions"]["pinyin"]
            if item["forms"]
            and item["forms"][0].get("transcriptions")
            and item["forms"][0]["transcriptions"].get("pinyin")
            else ""
        )
        pinyin_list.append(pinyin)

        # Reuse English meanings from JSON (join array)
        meanings = (
            item["forms"][0]["meanings"]
            if item["forms"] and item["forms"][0].get("meanings")
            else []
        )
        english = ", ".join(meanings) if meanings else ""
        english_list.append(english)

    # Batch translate to Vietnamese (1 API call) - using traditional Chinese as source
    vietnamese_texts = translate_batch_from_traditional(traditional_list, "vi")

    # Process jyutping for all traditional texts (local, no API calls)
    jyutping_results = [get_jyutping_romanization(text) for text in traditional_list]

    # Create entries for all words in batch
    batch_results = []
    for i, item in enumerate(batch_data):
        # Count Chinese characters
        character_count = count_chinese_characters(simplified_list[i])

        # Create entry - reusing simplified, traditional, pinyin, english from JSON
        entry = {
            "id": i + 1 + (batch_num * BATCH_SIZE),  # Sequential ID across batches
            "simplifiedChinese": simplified_list[i],  # Reused from JSON
            "traditionalChinese": traditional_list[i],  # Reused from JSON
            "pinyin": pinyin_list[i],  # Reused from JSON
            "jyutping": jyutping_results[i],  # Generated locally
            "english": english_list[i],  # Reused from JSON
            "vietnamese": vietnamese_texts[i],  # Translated via API
            "characterCount": character_count,
        }

        batch_results.append(entry)

        print(f"  ✅ [{i+1}/{len(batch_data)}] {simplified_list[i]}")

    print(f"✅ Batch {batch_num + 1}/{total_batches} completed!\n")
    return batch_results


def process_hsk7_json():
    """Process HSK 7 JSON with batch translations"""

    print(f"🔄 Processing HSK 7 JSON with Google Translation V3 API...")
    print("=" * 60)
    print(f"📂 Input:  {INPUT_JSON}")
    print(f"📂 Output: {OUTPUT_JSON}")
    print("=" * 60)

    # Initialize Jyutping library ONCE at the start
    print("🔧 Initializing Jyutping/Pinyin library (one-time setup)...")
    global _jyutping_instance
    _jyutping_instance = pinyin_jyutping.PinyinJyutping()
    print("✅ Jyutping/Pinyin library ready!")

    # Read JSON file
    json_path = os.path.join(os.path.dirname(__file__), "..", INPUT_JSON)
    with open(json_path, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    print(f"📊 Found {len(json_data)} entries in JSON")

    # Process entries in batches
    processed_data = []
    total_batches = (len(json_data) + BATCH_SIZE - 1) // BATCH_SIZE
    print(
        f"🚀 Processing {len(json_data)} entries in {total_batches} batches of {BATCH_SIZE}"
    )
    print(f"⚡ Each batch: 1 API call (Vietnamese) for {BATCH_SIZE} words!")
    print()

    for batch_num in range(total_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(json_data))
        batch_data = json_data[start_idx:end_idx]

        # Process entire batch
        batch_results = process_batch(batch_data, batch_num, total_batches)
        processed_data.extend(batch_results)

        # Delay between batches
        if batch_num < total_batches - 1:
            time.sleep(BATCH_GAP)

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

    print(f"✅ Successfully created complete HSK Level 7 JSON!")
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
    process_hsk7_json()
