#!/usr/bin/env python3
"""
Process cmn_sen_db_2.csv and add jyutping, hanviet, Vietnamese, and English translations.
Outputs JSON with: simplified, traditional, pinyin, english, hanviet, viet, jyutping
Only processes first 100 rows.
Note: English translation is generated via Google Translate (ignores CSV English column).
"""

import csv
import json
import asyncio
import re
import pinyin_jyutping
from concurrent.futures import ThreadPoolExecutor
from google.cloud import translate_v3 as translate
from google.oauth2 import service_account
from add_hanviet_from_csv import load_hanviet_csv, find_hanviet_reading_with_multiple

# Configuration
CSV_FILE = "vocabCsv/cmn_sen_db_2.csv"
HANVIET_CSV = "vocabCsv/hanviet.csv"
OUTPUT_FILE = "mobile/data/sentances.json"
SERVICE_ACCOUNT_FILE = "translateKey.json"
PROJECT_ID = "first-presence-465319-p7"
LOCATION = "global"
MAX_ROWS = 100

print("🔧 Initializing components...")

# Load Han Viet data
print(f"📖 Loading Han Viet data from {HANVIET_CSV}...")
hanviet_data = load_hanviet_csv(HANVIET_CSV)
print(f"✅ Loaded Han Viet data")

# Initialize Jyutping library
print("🔧 Initializing Jyutping library...")
jyutping_instance = pinyin_jyutping.PinyinJyutping()
print("✅ Jyutping library ready")

# Initialize Google Translate v3 client
print("🔧 Initializing Google Translate v3 client...")
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=["https://www.googleapis.com/auth/cloud-translation"]
)
translate_client = translate.TranslationServiceClient(credentials=credentials)
parent = f"projects/{PROJECT_ID}/locations/{LOCATION}"
print("✅ Google Translate client ready")


def is_punctuation_or_latin(char):
    """Check if character is punctuation, Latin, number, or whitespace"""
    # Must be a single character
    if len(char) != 1:
        return False
    # Check if it's a Chinese character
    if "\u4e00" <= char <= "\u9fff":
        return False
    # Check if it's punctuation (common punctuation marks)
    if char in '，。！？；：、""' "（）【】《》〈〉「」『』〔〕…—–·～":
        return True
    # Check if it's Latin, number, or whitespace
    if char.isalnum() or char.isspace() or ord(char) < 128:
        return True
    return False


def is_punctuation_or_latin_string(text):
    """Check if a string (single or multi-char) contains only punctuation/Latin characters"""
    if not text:
        return False
    # If single character, use the single char function
    if len(text) == 1:
        return is_punctuation_or_latin(text)
    # For multi-character strings, check if ALL characters are punctuation/Latin
    # (e.g., "Muiriel", "123", etc.)
    return all(is_punctuation_or_latin(c) for c in text)


def get_hanviet_with_preserved_chars(traditional, hanviet_data):
    """
    Get hanviet reading while preserving punctuation and Latin characters from original text.
    Processes character-by-character to properly handle mixed punctuation/Latin with Chinese.
    """
    if not traditional:
        return ""

    # Clean traditional text (same as find_hanviet_reading_with_multiple)
    traditional_clean = traditional.split("｜")[0].split("|")[0]
    traditional_clean = re.sub(r"[（(].*?[）)]", "", traditional_clean).strip()

    if not traditional_clean:
        return ""

    # Check if we have only Chinese characters (no punctuation/Latin mixed in)
    has_punctuation_or_latin = any(
        is_punctuation_or_latin(c) for c in traditional_clean
    )

    # If no punctuation/Latin, try whole-word lookup first
    if not has_punctuation_or_latin and len(traditional_clean) > 1:
        char_only_key = f"{traditional_clean}|*"
        if char_only_key in hanviet_data:
            return hanviet_data[char_only_key]

    # Process character by character, preserving punctuation/Latin
    # Group consecutive Latin/numeral characters together
    # Store tuples: (part, is_punct_or_latin_flag, is_latin_or_numeral_flag)
    result_parts = []
    current_latin_group = []

    for char in traditional_clean:
        if is_punctuation_or_latin(char):
            # Check if it's a Latin character or Arabic numeral
            is_latin_or_numeral = char.isalnum() and ord(char) < 128

            if is_latin_or_numeral:
                # Group consecutive Latin/numeral characters
                current_latin_group.append(char)
            else:
                # This is punctuation - flush any accumulated Latin group first
                if current_latin_group:
                    latin_group = "".join(current_latin_group)
                    result_parts.append((latin_group, True, True))
                    current_latin_group = []
                # Add punctuation
                result_parts.append((char, True, False))
        else:
            # This is a Chinese character - flush any accumulated Latin group first
            if current_latin_group:
                latin_group = "".join(current_latin_group)
                result_parts.append((latin_group, True, True))
                current_latin_group = []

            # Look up hanviet for Chinese character
            char_only_key = f"{char}|*"
            if char_only_key in hanviet_data:
                result_parts.append((hanviet_data[char_only_key], False, False))
            else:
                result_parts.append(("_", False, False))

    # Flush any remaining Latin group
    if current_latin_group:
        latin_group = "".join(current_latin_group)
        result_parts.append((latin_group, True, True))

    # Join with spaces: between hanviet readings, and around Latin/numeral groups (entire words)
    # Only add spaces "before" each part to avoid duplicates
    final_parts = []
    for i, (part, is_punct_or_latin, is_latin_or_numeral) in enumerate(result_parts):
        if i > 0:
            prev_part, prev_is_punct_or_latin, prev_is_latin_or_numeral = result_parts[
                i - 1
            ]

            # Space between two hanviet readings
            if (
                part != "_"
                and not is_punct_or_latin
                and prev_part != "_"
                and not prev_is_punct_or_latin
            ):
                final_parts.append(" ")
            # Space before Latin/numeral group (previous is hanviet reading)
            elif (
                is_latin_or_numeral and prev_part != "_" and not prev_is_punct_or_latin
            ):
                final_parts.append(" ")
            # Space after Latin/numeral group (current is hanviet reading, previous is Latin/numeral)
            elif prev_is_latin_or_numeral and part != "_" and not is_punct_or_latin:
                final_parts.append(" ")
            # Space before Latin/numeral (previous is punctuation - only for non-Chinese punctuation)
            elif is_latin_or_numeral and prev_is_punct_or_latin:
                # Don't add space after Chinese punctuation marks
                chinese_punct = '，。！？；：、""' "（）【】《》〈〉「」『』〔〕…—–·～"
                if prev_part not in chinese_punct:
                    final_parts.append(" ")

        final_parts.append(part)

    return "".join(final_parts)


def get_jyutping_sync(text):
    """Get Jyutping romanization (synchronous)"""
    try:
        return jyutping_instance.jyutping(text, tone_numbers=True, spaces=True)
    except Exception as e:
        print(f"  ⚠️  Jyutping error for '{text[:20]}...': {e}")
        return ""


async def get_jyutping_async(text):
    """Get Jyutping romanization asynchronously"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, get_jyutping_sync, text)


def translate_to_vietnamese_sync(text):
    """Translate Traditional Chinese to Vietnamese using Google Translate v3 (synchronous)"""
    try:
        response = translate_client.translate_text(
            request={
                "parent": parent,
                "contents": [text],
                "mime_type": "text/plain",
                "source_language_code": "zh-TW",  # Traditional Chinese
                "target_language_code": "vi",  # Vietnamese
            }
        )
        return response.translations[0].translated_text
    except Exception as e:
        print(f"  ⚠️  Translation error for '{text[:20]}...': {e}")
        return ""


async def translate_to_vietnamese_async(text, executor):
    """Translate Traditional Chinese to Vietnamese asynchronously"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, translate_to_vietnamese_sync, text)


def translate_to_english_sync(text):
    """Translate Traditional Chinese to English using Google Translate v3 (synchronous)"""
    try:
        response = translate_client.translate_text(
            request={
                "parent": parent,
                "contents": [text],
                "mime_type": "text/plain",
                "source_language_code": "zh-TW",  # Traditional Chinese
                "target_language_code": "en",  # English
            }
        )
        return response.translations[0].translated_text
    except Exception as e:
        print(f"  ⚠️  English translation error for '{text[:20]}...': {e}")
        return ""


async def translate_to_english_async(text, executor):
    """Translate Traditional Chinese to English asynchronously"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, translate_to_english_sync, text)


async def process_batch_async(batch_items, executor, batch_num, total_batches):
    """Process a batch of items asynchronously - jyutping, Vietnamese, and English translations in parallel"""
    print(
        f"🚀 Batch {batch_num + 1}/{total_batches}: Processing {len(batch_items)} items..."
    )

    # Create tasks for jyutping and translations (Vietnamese and English)
    tasks = []
    for item in batch_items:
        jyutping_task = get_jyutping_async(item["traditional"])
        vietnamese_task = translate_to_vietnamese_async(item["traditional"], executor)
        english_task = translate_to_english_async(item["traditional"], executor)
        tasks.append((item, jyutping_task, vietnamese_task, english_task))

    # Wait for all tasks to complete
    results = []
    for item, jyutping_task, vietnamese_task, english_task in tasks:
        jyutping, vietnamese, english = await asyncio.gather(
            jyutping_task, vietnamese_task, english_task
        )

        # Store jyutping, vietnamese, and english in output
        item["jyutping"] = jyutping if jyutping else ""
        item["viet"] = vietnamese if vietnamese else ""
        item["english"] = english if english else ""

        results.append(item)
        print(
            f"  ✅ [{item['index']}/{MAX_ROWS}] {item['simplified'][:20]}... -> EN: {english[:30] if english else 'ERROR'}... | VI: {vietnamese[:30] if vietnamese else 'ERROR'}..."
        )

    print(f"✅ Batch {batch_num + 1}/{total_batches} completed!\n")
    return results


print(f"\n📖 Reading CSV file: {CSV_FILE}...")
print(f"🔄 Processing first {MAX_ROWS} rows...\n")

# Step 1: Read all rows and process hanviet (fast synchronous lookup)
items_to_process = []
row_count = 0

with open(CSV_FILE, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        row_count += 1

        if row_count > MAX_ROWS:
            break

        simplified = row.get("simplified", "").strip()
        traditional = row.get("traditional", "").strip()
        pinyin = row.get("pinyin", "").strip()
        # Note: Ignoring English from CSV - will be generated via Google Translate

        # Get Han Viet with preserved punctuation and Latin characters
        hanviet = get_hanviet_with_preserved_chars(traditional, hanviet_data)

        # Store item for async batch processing (jyutping + translations)
        item_data = {
            "index": row_count,
            "simplified": simplified,
            "traditional": traditional,
            "pinyin": pinyin,
            "hanviet": hanviet,
            "jyutping": "",  # Will be filled by async processing
            "viet": "",  # Will be filled by async translation
            "english": "",  # Will be filled by async translation (ignoring CSV English)
        }
        items_to_process.append(item_data)

print(
    f"\n🌐 Starting async processing (jyutping + Vietnamese + English translations) in batches of 5..."
)
print(f"   Total items to process: {len(items_to_process)}\n")


# Step 2: Process jyutping and translations in batches of 5 asynchronously
async def process_all_items():
    """Process all items in batches - jyutping and translations in parallel"""
    # Create thread pool executor for synchronous translate calls
    with ThreadPoolExecutor(max_workers=5) as executor:
        batch_size = 5
        total_batches = (len(items_to_process) + batch_size - 1) // batch_size

        # Process batches
        all_results = []
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(items_to_process))
            batch = items_to_process[start_idx:end_idx]

            batch_results = await process_batch_async(
                batch, executor, batch_num, total_batches
            )
            all_results.extend(batch_results)

        return all_results


# Run async processing
processed_data = asyncio.run(process_all_items())

# Sort by index to maintain original order
processed_data.sort(key=lambda x: x["index"])

# Remove internal fields from final output
for item in processed_data:
    del item["index"]

print(f"💾 Saving to {OUTPUT_FILE}...")
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(processed_data, f, ensure_ascii=False, indent=2)

print(f"✅ Processing complete!")
print(f"   Processed: {len(processed_data)} rows")
print(f"   Output: {OUTPUT_FILE}")
