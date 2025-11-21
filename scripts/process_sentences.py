#!/usr/bin/env python3
"""
Process sentences.csv and add jyutping, hanviet, Vietnamese, English, and Cantonese translations.
Outputs JSON with: traditionalChinese, simplifiedChinese, writtenCantonese, pinyin, jyutping (standard),
cantoneseJyutping, hanviet, viet, english
Only processes first 100 rows.
Converts simplified Chinese to traditional Chinese using Google Translate.
"""

# TODO rerun this script to add cantonese translations

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
CSV_FILE = "vocabCsv/sentences.csv"
HANVIET_CSV = "vocabCsv/hanviet.csv"
OUTPUT_FILE = "mobile/data/sentances.json"
SERVICE_ACCOUNT_FILE = "translateKey.json"
PROJECT_ID = "first-presence-465319-p7"
LOCATION = "global"
MAX_ROWS = None  # Set to None to process all matching rows
FILTER_TOCFL_LEVEL = 1  # Only process TOCFL Level 1 sentences

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


def translate_simplified_to_traditional_sync(text):
    """Convert Simplified Chinese to Traditional Chinese using Google Translate v3 (synchronous)"""
    try:
        response = translate_client.translate_text(
            request={
                "parent": parent,
                "contents": [text],
                "mime_type": "text/plain",
                "source_language_code": "zh-CN",  # Simplified Chinese
                "target_language_code": "zh-TW",  # Traditional Chinese
            }
        )
        return response.translations[0].translated_text
    except Exception as e:
        print(
            f"  ⚠️  Simplified->Traditional conversion error for '{text[:20]}...': {e}"
        )
        return ""


async def translate_simplified_to_traditional_async(text, executor):
    """Convert Simplified Chinese to Traditional Chinese asynchronously"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor, translate_simplified_to_traditional_sync, text
    )


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


def translate_to_cantonese_sync(text):
    """Translate Traditional Chinese to Written Cantonese using Google Translate v3 (synchronous)"""
    try:
        response = translate_client.translate_text(
            request={
                "parent": parent,
                "contents": [text],
                "mime_type": "text/plain",
                "source_language_code": "zh-TW",  # Traditional Chinese
                "target_language_code": "yue",  # Cantonese (Written)
            }
        )
        return response.translations[0].translated_text
    except Exception as e:
        print(f"  ⚠️  Cantonese translation error for '{text[:20]}...': {e}")
        return ""


async def translate_to_cantonese_async(text, executor):
    """Translate Traditional Chinese to Written Cantonese asynchronously"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, translate_to_cantonese_sync, text)


async def process_batch_async(batch_items, executor, batch_num, total_batches):
    """Process a batch of items asynchronously - convert to traditional, jyutping, Vietnamese, English, and Cantonese translations in parallel"""
    print(
        f"🚀 Batch {batch_num + 1}/{total_batches}: Processing {len(batch_items)} items..."
    )

    # Create tasks for conversion and translations
    tasks = []
    for item in batch_items:
        # Convert simplified to traditional first
        traditional_task = translate_simplified_to_traditional_async(
            item["simplified"], executor
        )
        tasks.append((item, traditional_task))

    # Wait for traditional conversion
    traditional_results = []
    for item, traditional_task in tasks:
        traditional = await traditional_task
        item["traditional"] = traditional
        # Generate hanviet now that we have traditional
        item["hanviet"] = get_hanviet_with_preserved_chars(traditional, hanviet_data)
        traditional_results.append(item)

    # Now process jyutping and translations with traditional text
    translation_tasks = []
    for item in traditional_results:
        jyutping_task = get_jyutping_async(
            item["traditional"]
        )  # Standard jyutping for Traditional Chinese
        vietnamese_task = translate_to_vietnamese_async(item["traditional"], executor)
        english_task = translate_to_english_async(item["traditional"], executor)
        cantonese_task = translate_to_cantonese_async(item["traditional"], executor)
        translation_tasks.append(
            (item, jyutping_task, vietnamese_task, english_task, cantonese_task)
        )

    # Wait for all tasks to complete
    results = []
    for (
        item,
        jyutping_task,
        vietnamese_task,
        english_task,
        cantonese_task,
    ) in translation_tasks:
        jyutping, vietnamese, english, written_cantonese = await asyncio.gather(
            jyutping_task, vietnamese_task, english_task, cantonese_task
        )

        # Get Jyutping for written Cantonese if we have it
        cantonese_jyutping = ""
        if written_cantonese:
            cantonese_jyutping_task = get_jyutping_async(written_cantonese)
            cantonese_jyutping = await cantonese_jyutping_task
            cantonese_jyutping = cantonese_jyutping if cantonese_jyutping else ""

        # Store all fields in output with new structure
        item["traditionalChinese"] = item["traditional"]
        item["simplifiedChinese"] = item["simplified"]
        item["writtenCantonese"] = written_cantonese if written_cantonese else ""
        item["jyutping"] = (
            jyutping if jyutping else ""
        )  # Standard jyutping for Traditional Chinese
        item["cantoneseJyutping"] = cantonese_jyutping  # Jyutping for written Cantonese
        item["viet"] = vietnamese if vietnamese else ""
        item["english"] = english if english else ""

        # Remove old field names
        del item["traditional"]
        del item["simplified"]

        results.append(item)
        print(
            f"  ✅ [{item['index']}/{MAX_ROWS}] {item['simplifiedChinese'][:20]}... -> EN: {english[:30] if english else 'ERROR'}... | VI: {vietnamese[:30] if vietnamese else 'ERROR'}... | Cantonese: {written_cantonese[:20] if written_cantonese else 'ERROR'}..."
        )

    print(f"✅ Batch {batch_num + 1}/{total_batches} completed!\n")
    return results


print(f"\n📖 Reading CSV file: {CSV_FILE}...")
if FILTER_TOCFL_LEVEL:
    print(f"🔍 Filtering for TOCFL Level {FILTER_TOCFL_LEVEL} sentences only...\n")
elif MAX_ROWS:
    print(f"🔄 Processing first {MAX_ROWS} rows...\n")
else:
    print(f"🔄 Processing all rows...\n")

# Step 1: Read all rows and process hanviet (fast synchronous lookup)
items_to_process = []
row_count = 0
total_rows = 0

with open(CSV_FILE, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        total_rows += 1

        # Read from new CSV structure: Characters, Pinyin, Meaning, HSK Level, TOCFL Level
        simplified = row.get("Characters", "").strip()
        pinyin = row.get("Pinyin", "").strip()
        meaning = row.get("Meaning", "").strip()
        hsk_level = row.get("HSK Level", "").strip()
        tocfl_level = row.get("TOCFL Level", "").strip()

        # Filter by TOCFL level if specified
        if FILTER_TOCFL_LEVEL and tocfl_level != str(FILTER_TOCFL_LEVEL):
            continue

        row_count += 1

        # Check MAX_ROWS limit
        if MAX_ROWS and row_count > MAX_ROWS:
            break

        # Traditional will be generated via Google Translate
        # Store item for async batch processing (traditional conversion + jyutping + translations)
        item_data = {
            "index": total_rows,
            "simplified": simplified,
            "traditional": "",  # Will be filled by async conversion
            "pinyin": pinyin,
            "hanviet": "",  # Will be filled after we have traditional
            "jyutping": "",  # Will be filled by async processing (standard jyutping for Traditional Chinese)
            "writtenCantonese": "",  # Will be filled by async translation
            "cantoneseJyutping": "",  # Will be filled by async processing (jyutping for written Cantonese)
            "viet": "",  # Will be filled by async translation
            "english": meaning,  # Use existing meaning from CSV
            "hsk_level": hsk_level,
            "tocfl_level": tocfl_level,
        }
        items_to_process.append(item_data)

print(
    f"✅ Found {row_count} TOCFL Level {FILTER_TOCFL_LEVEL} sentences out of {total_rows} total sentences"
)

print(
    f"\n🌐 Starting async processing (jyutping + Vietnamese + English + Cantonese translations) in batches of 5..."
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
