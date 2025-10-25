#!/usr/bin/env python3
"""
Process HSK Level 1 CSV with TRUE PARALLEL translations:
- 5 words processed simultaneously
- Each word's translations (Traditional + Vietnamese) happen in parallel
- Jyutping done sequentially after translations
"""

import csv
import json
import pinyin_jyutping
import asyncio
import aiohttp
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- VARIABLES ---
API_KEY = os.getenv("MICROSOFT_TRANSLATOR_API_KEY")
ENDPOINT = os.getenv(
    "MICROSOFT_TRANSLATOR_ENDPOINT", "https://api.cognitive.microsofttranslator.com"
)
REGION = os.getenv("MICROSOFT_TRANSLATOR_REGION", "canadaeast")

# Validate API key
if not API_KEY:
    print("❌ Error: MICROSOFT_TRANSLATOR_API_KEY not found in .env file!")
    print("Please add your API key to .env file:")
    print("MICROSOFT_TRANSLATOR_API_KEY=your_api_key_here")
    exit(1)


async def translate_with_microsoft_async(session, text, target_lang):
    """Translate text using Microsoft Translator API (async)"""
    try:
        url = f"{ENDPOINT}/translate?api-version=3.0&from=zh-Hans&to={target_lang}&category=generalnn"

        headers = {
            "Ocp-Apim-Subscription-Key": API_KEY,
            "Ocp-Apim-Subscription-Region": REGION,
            "Content-Type": "application/json",
        }

        body = [{"text": text}]

        async with session.post(url, headers=headers, json=body) as response:
            if response.status == 200:
                result = await response.json()
                return result[0]["translations"][0]["text"]
            else:
                error_text = await response.text()
                print(f"❌ Translation API Error: {response.status} - {error_text}")
                print(f"🛑 Stopping script due to API error")
                exit(1)

    except Exception as e:
        print(f"❌ Translation API Exception: {str(e)}")
        print(f"🛑 Stopping script due to error")
        exit(1)


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


async def process_single_word(session, row, word_index):
    """Process a single word: ALL operations in parallel"""
    no = row["No"]
    chinese = row["Chinese"]
    pinyin = row["Pinyin"]
    english = row["English"]

    print(f"{word_index:3d}. Processing: {chinese} ({pinyin})")

    # Run ALL operations in parallel: Traditional + Vietnamese + Jyutping
    traditional_task = translate_with_microsoft_async(session, chinese, "zh-Hant")
    vietnamese_task = translate_with_microsoft_async(session, chinese, "vi")
    jyutping_task = get_jyutping_async(chinese)

    # Wait for ALL operations to complete simultaneously
    traditional, vietnamese, jyutping = await asyncio.gather(
        traditional_task, vietnamese_task, jyutping_task
    )

    print(f"     Traditional: {traditional}")
    print(f"     Vietnamese: {vietnamese}")
    print(f"     Jyutping: {jyutping}")

    # Create entry
    entry = {
        "id": int(no),
        "simplifiedChinese": chinese,
        "traditionalChinese": traditional,
        "pinyin": pinyin,
        "jyutping": jyutping,
        "english": english,
        "vietnamese": vietnamese,
    }

    print()
    return entry


async def process_batch_parallel(session, batch_data, batch_num, start_idx):
    """Process a batch of 5 words: ALL translations happen simultaneously"""
    print(
        f"🚀 Batch {batch_num + 1}: Processing {len(batch_data)} words - ALL TRANSLATIONS IN PARALLEL..."
    )

    # Create tasks for ALL words in the batch
    tasks = []
    for i, row in enumerate(batch_data, start_idx + 1):
        task = process_single_word(session, row, i)
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

    print("🔄 Processing HSK Level 1 CSV with generalnn model...")
    print("=" * 60)

    # Initialize Jyutping library ONCE at the start
    print("🔧 Initializing Jyutping library (one-time setup)...")
    global _jyutping_instance
    _jyutping_instance = pinyin_jyutping.PinyinJyutping()
    print("✅ Jyutping library ready!")

    # Read CSV file
    csv_data = []
    with open("src/Level 1 HSK - Sheet1.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_data.append(row)

    print(f"📊 Found {len(csv_data)} entries in CSV")

    # Process ALL entries
    print(f"🚀 Processing ALL {len(csv_data)} entries")

    # Process entries in batches of 5 (TRUE PARALLEL)
    processed_data = []
    batch_size = 5
    total_batches = (len(csv_data) + batch_size - 1) // batch_size
    print(
        f"🚀 Processing {len(csv_data)} entries in {total_batches} batches of {batch_size}"
    )
    print(f"⚡ Each batch: 5 words × 2 translations = 10 parallel API calls!")
    print()

    async with aiohttp.ClientSession() as session:
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(csv_data))
            batch_data = csv_data[start_idx:end_idx]

            # Process entire batch in parallel
            batch_results = await process_batch_parallel(
                session, batch_data, batch_num, start_idx
            )
            processed_data.extend(batch_results)

            # Delay between batches
            if batch_num < total_batches - 1:
                print(f"⏳ Waiting 2 seconds before next batch...")
                await asyncio.sleep(2)
                print()

    # Save the complete JSON
    output_file = "src/hsk_level1_generalnn.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)

    print("✅ Successfully created complete HSK Level 1 JSON!")
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
