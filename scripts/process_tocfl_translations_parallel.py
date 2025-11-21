#!/usr/bin/env python3
"""
THIS SCRIPT IS REALLY SLOW IF YOU USE IT FIX IT LIKE HSK SCRIPT
Processes TOCFL vocabulary CSV files to generate JSON with translations using
Google Cloud Translate v3. Includes:
  - Simplified Chinese conversion
  - English and Vietnamese translations
  - Jyutping (Cantonese) romanization
  - Han Viet readings
"""

import argparse
import csv
import json
import os
import re
from pathlib import Path
from typing import TypedDict

import pinyin_jyutping
from dotenv import load_dotenv
from google.cloud import translate_v3 as translate
from google.oauth2 import service_account

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

# Get script directory and project root
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

# Defaults (can be overridden via CLI)
DEFAULT_CSV_FILENAME = PROJECT_ROOT / "vocabCsv/TOCFL - 流利級.csv"
DEFAULT_OUTPUT_FILE = PROJECT_ROOT / "mobile/data/tocfl_level5.json"
HANVIET_FILE = PROJECT_ROOT / "vocabCsv/hanviet.csv"

SERVICE_ACCOUNT_FILE = os.getenv(
    "GOOGLE_SERVICE_ACCOUNT_FILE", str(PROJECT_ROOT / "translateKey.json")
)
PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID", "first-presence-465319-p7")
LOCATION = os.getenv("GOOGLE_TRANSLATE_LOCATION", "global")

if not Path(SERVICE_ACCOUNT_FILE).exists():
    print(f"❌ Error: Service account file '{SERVICE_ACCOUNT_FILE}' not found!")
    print(f"   Looking in: {Path(SERVICE_ACCOUNT_FILE).absolute()}")
    exit(1)

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=["https://www.googleapis.com/auth/cloud-translation"]
)
translate_client = translate.TranslationServiceClient(credentials=credentials)
parent = f"projects/{PROJECT_ID}/locations/{LOCATION}"

_jyutping_instance = pinyin_jyutping.PinyinJyutping()


def translate_text(text: str, target_language: str) -> str:
    """Translate text using Google Translate v3."""
    if not text:
        return ""

    response = translate_client.translate_text(
        request={
            "parent": parent,
            "contents": [text],
            "mime_type": "text/plain",
            "source_language_code": "zh-TW",
            "target_language_code": target_language,
        }
    )

    if response.translations:
        return response.translations[0].translated_text
    return ""


def get_jyutping(text: str) -> str:
    if not text:
        return ""
    return _jyutping_instance.jyutping(text, tone_numbers=True, spaces=True)


def count_chinese_characters(text: str) -> int:
    clean_text = text.split("｜")[0].split("|")[0]
    clean_text = re.sub(r"[（(].*?[）)]", "", clean_text).strip()
    return len(re.findall(r"[\u4e00-\u9fff]", clean_text))


def clean_word_type(text: str) -> str:
    """Remove word type annotations like (N), (VA), etc."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", text).strip()


def process_csv(csv_filename: str) -> list[VocabEntry]:
    csv_path = (
        Path(csv_filename) if not isinstance(csv_filename, Path) else csv_filename
    )
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"📝 Processing {len(rows)} entries from {csv_filename}")

    processed_entries: list[VocabEntry] = []

    for idx, row in enumerate(rows, 1):
        chinese = clean_word_type(row["詞彙"])
        pinyin = row["漢語拼音"].strip()

        if not chinese:
            continue

        print(f"{idx:3d}. Processing: {chinese} ({pinyin})")

        simplified = translate_text(chinese, "zh-CN")
        vietnamese = translate_text(chinese, "vi")
        english = translate_text(chinese, "en")
        jyutping = get_jyutping(chinese)

        print(f"     Simplified: {simplified}")
        print(f"     Vietnamese: {vietnamese}")
        print(f"     English: {english}")
        print(f"     Jyutping: {jyutping}")

        processed_entries.append(
            {
                "id": len(processed_entries) + 1,
                "simplifiedChinese": simplified,
                "traditionalChinese": chinese,
                "pinyin": pinyin,
                "jyutping": jyutping,
                "english": english,
                "vietnamese": vietnamese,
                "characterCount": count_chinese_characters(chinese),
                "hanviet": "",
            }
        )

    return processed_entries


def add_hanviet(entries: list[VocabEntry]):
    print("📖 Adding Han Viet readings...")
    hanviet_data = load_hanviet_csv(HANVIET_FILE)

    for entry in entries:
        hanviet_reading = find_hanviet_reading_with_multiple(entry, hanviet_data)
        entry["hanviet"] = hanviet_reading if hanviet_reading else ""


def save_output(entries: list[VocabEntry], output_file: str):
    output_path = (
        Path(output_file) if not isinstance(output_file, Path) else output_file
    )
    os.makedirs(output_path.parent, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print(f"✅ Complete! Output: {output_file} ({len(entries)} entries)")


def main():
    parser = argparse.ArgumentParser(
        description="Process TOCFL CSV and generate translated JSON using Google Translate v3."
    )
    parser.add_argument(
        "--csv",
        default=str(DEFAULT_CSV_FILENAME),
        help="Path to TOCFL CSV file (default: %(default)s)",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_FILE),
        help="Output JSON path (default: %(default)s)",
    )
    args = parser.parse_args()

    entries = process_csv(args.csv)
    add_hanviet(entries)
    save_output(entries, args.output)


if __name__ == "__main__":
    main()
