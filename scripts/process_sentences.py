#!/usr/bin/env python3
"""
Process sentences.csv and add jyutping, hanviet, Vietnamese, English, and Cantonese translations.
Outputs JSON with: traditionalChinese, simplifiedChinese, writtenCantonese, pinyin, jyutping (standard),
cantoneseJyutping, hanviet, viet, english
Only processes first 100 rows.
Converts simplified Chinese to traditional Chinese using Google Translate.
source: https://github.com/Destaq/chinese-sentence-miner
"""

# TODO rerun this script to add cantonese translations

import csv
import json
import re
import time
import pinyin_jyutping
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
FILTER_TOCFL_LEVEL = (
    None  # Set to None to process all rows, or specify a level number to filter
)
BATCH_SIZE = 50  # Number of sentences to process per batch
BATCH_GAP = 0.5  # Delay in seconds between batches

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


def get_jyutping(text):
    """Get Jyutping romanization"""
    try:
        return jyutping_instance.jyutping(text, tone_numbers=True, spaces=True)
    except Exception as e:
        print(f"  ⚠️  Jyutping error for '{text[:20]}...': {e}")
        return ""


def translate_to_vietnamese_batch(texts):
    """Translate multiple Traditional Chinese texts to Vietnamese using Google Translate v3 (batch)"""
    try:
        response = translate_client.translate_text(
            request={
                "parent": parent,
                "contents": texts,
                "mime_type": "text/plain",
                "source_language_code": "zh-TW",  # Traditional Chinese
                "target_language_code": "vi",  # Vietnamese
            }
        )
        return [trans.translated_text for trans in response.translations]
    except Exception as e:
        print(f"  ⚠️  Vietnamese batch translation error: {e}")
        return [""] * len(texts)


def translate_simplified_to_traditional_batch(texts):
    """Convert multiple Simplified Chinese texts to Traditional Chinese using Google Translate v3 (batch)"""
    try:
        response = translate_client.translate_text(
            request={
                "parent": parent,
                "contents": texts,
                "mime_type": "text/plain",
                "source_language_code": "zh-CN",  # Simplified Chinese
                "target_language_code": "zh-TW",  # Traditional Chinese
            }
        )
        return [trans.translated_text for trans in response.translations]
    except Exception as e:
        print(f"  ⚠️  Simplified->Traditional batch conversion error: {e}")
        return [""] * len(texts)


def translate_to_english_batch(texts):
    """Translate multiple Traditional Chinese texts to English using Google Translate v3 (batch)"""
    try:
        response = translate_client.translate_text(
            request={
                "parent": parent,
                "contents": texts,
                "mime_type": "text/plain",
                "source_language_code": "zh-TW",  # Traditional Chinese
                "target_language_code": "en",  # English
            }
        )
        return [trans.translated_text for trans in response.translations]
    except Exception as e:
        print(f"  ⚠️  English batch translation error: {e}")
        return [""] * len(texts)


def translate_to_cantonese_batch(texts):
    """Translate multiple Traditional Chinese texts to Written Cantonese using Google Translate v3 (batch)"""
    try:
        response = translate_client.translate_text(
            request={
                "parent": parent,
                "contents": texts,
                "mime_type": "text/plain",
                "source_language_code": "zh-TW",  # Traditional Chinese
                "target_language_code": "yue",  # Cantonese (Written)
            }
        )
        return [trans.translated_text for trans in response.translations]
    except Exception as e:
        print(f"  ⚠️  Cantonese batch translation error: {e}")
        return [""] * len(texts)


def process_batch(batch_items, batch_num, total_batches):
    """Process a batch of items - convert to traditional, jyutping, Vietnamese, English, and Cantonese translations using batch API calls"""
    print(
        f"🚀 Batch {batch_num + 1}/{total_batches}: Processing {len(batch_items)} items..."
    )

    # Step 1: Batch convert simplified to traditional (1 API call for all)
    simplified_texts = [item["simplified"] for item in batch_items]
    traditional_texts = translate_simplified_to_traditional_batch(simplified_texts)

    # Step 2: Process hanviet for all traditional texts
    for i, item in enumerate(batch_items):
        item["traditional"] = traditional_texts[i]
        item["hanviet"] = get_hanviet_with_preserved_chars(
            traditional_texts[i], hanviet_data
        )

    # Step 3: Batch translate to Vietnamese, English, and Cantonese (3 API calls total)
    vietnamese_texts = translate_to_vietnamese_batch(traditional_texts)
    english_texts = translate_to_english_batch(traditional_texts)
    written_cantonese_texts = translate_to_cantonese_batch(traditional_texts)

    # Step 4: Process jyutping for traditional texts (local)
    jyutping_results = [get_jyutping(item["traditional"]) for item in batch_items]

    # Step 5: Process jyutping for written Cantonese texts (local)
    cantonese_jyutping_results = [
        get_jyutping(written_cantonese) if written_cantonese else ""
        for written_cantonese in written_cantonese_texts
    ]

    # Step 6: Combine all results
    results = []
    for i, item in enumerate(batch_items):
        # Store all fields in output with new structure
        item["traditionalChinese"] = item["traditional"]
        item["simplifiedChinese"] = item["simplified"]
        item["writtenCantonese"] = (
            written_cantonese_texts[i] if written_cantonese_texts[i] else ""
        )
        item["jyutping"] = jyutping_results[i] if jyutping_results[i] else ""
        item["cantoneseJyutping"] = (
            cantonese_jyutping_results[i] if cantonese_jyutping_results[i] else ""
        )
        item["viet"] = vietnamese_texts[i] if vietnamese_texts[i] else ""
        item["english"] = english_texts[i] if english_texts[i] else ""

        # Remove old field names
        del item["traditional"]
        del item["simplified"]

        results.append(item)
        print(
            f"  ✅ [{item['index']}] {item['simplifiedChinese'][:20]}... -> EN: {english_texts[i][:30] if english_texts[i] else 'ERROR'}... | VI: {vietnamese_texts[i][:30] if vietnamese_texts[i] else 'ERROR'}... | Cantonese: {written_cantonese_texts[i][:20] if written_cantonese_texts[i] else 'ERROR'}..."
        )

    print(f"✅ Batch {batch_num + 1}/{total_batches} completed!\n")
    return results


print(f"\n📖 Reading CSV file: {CSV_FILE}...")
if FILTER_TOCFL_LEVEL is not None:
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
        if FILTER_TOCFL_LEVEL is not None and tocfl_level != str(FILTER_TOCFL_LEVEL):
            continue

        row_count += 1

        # Check MAX_ROWS limit
        if MAX_ROWS and row_count > MAX_ROWS:
            break

        # Traditional will be generated via Google Translate
        # Store item for batch processing (traditional conversion + jyutping + translations)
        item_data = {
            "index": total_rows,
            "simplified": simplified,
            "traditional": "",  # Will be filled by conversion
            "pinyin": pinyin,
            "hanviet": "",  # Will be filled after we have traditional
            "jyutping": "",  # Will be filled by processing (standard jyutping for Traditional Chinese)
            "writtenCantonese": "",  # Will be filled by translation
            "cantoneseJyutping": "",  # Will be filled by processing (jyutping for written Cantonese)
            "viet": "",  # Will be filled by translation
            "english": meaning,  # Use existing meaning from CSV
            "hsk_level": hsk_level,
            "tocfl_level": tocfl_level,
        }
        items_to_process.append(item_data)

if FILTER_TOCFL_LEVEL is not None:
    print(
        f"✅ Found {row_count} TOCFL Level {FILTER_TOCFL_LEVEL} sentences out of {total_rows} total sentences"
    )
else:
    print(
        f"✅ Found {row_count} sentences to process out of {total_rows} total sentences"
    )

print(
    f"\n🌐 Starting processing (jyutping + Vietnamese + English + Cantonese translations) in batches of {BATCH_SIZE}..."
)
print(f"   Total items to process: {len(items_to_process)}\n")


# Step 2: Process jyutping and translations in batches
total_batches = (len(items_to_process) + BATCH_SIZE - 1) // BATCH_SIZE

# Process batches
processed_data = []
for batch_num in range(total_batches):
    start_idx = batch_num * BATCH_SIZE
    end_idx = min(start_idx + BATCH_SIZE, len(items_to_process))
    batch = items_to_process[start_idx:end_idx]

    batch_results = process_batch(batch, batch_num, total_batches)
    processed_data.extend(batch_results)

    # Add delay between batches (except after the last batch)
    if batch_num < total_batches - 1:
        time.sleep(BATCH_GAP)

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
