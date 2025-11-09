#!/usr/bin/env python3
"""
Add Han Viet readings from CSV to HSK JSON data.
Matches Traditional Chinese + pinyin to find corresponding Han Viet readings.
https://github.com/ph0ngp/hanviet-pinyin-wordlist
"""

import json
import csv
import re
import os
import sys


def load_hanviet_csv(csv_file):
    """Load Han Viet CSV data into a lookup dictionary"""
    hanviet_data = {}
    char_pinyin_counts = {}

    if not os.path.exists(csv_file):
        print(f"❌ Han Viet CSV file not found: {csv_file}")
        return hanviet_data

    print(f"📖 Loading Han Viet data from: {csv_file}")

    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            char = row.get("char", "").strip()
            pinyin = row.get("pinyin", "").strip()
            hanviet = row.get("hanviet", "").strip()

            if char and hanviet:
                # Clean hanviet (remove brackets and quotes)
                hanviet_clean = (
                    hanviet.replace("['", "").replace("']", "").replace("'", "")
                )

                # Track pinyin count for this character
                if char not in char_pinyin_counts:
                    char_pinyin_counts[char] = set()
                if pinyin and pinyin != "*":
                    char_pinyin_counts[char].add(pinyin)

                # Create lookup key: char + pinyin (use * if no pinyin)
                pinyin_key = pinyin if pinyin and pinyin != "*" else "*"
                key = f"{char}|{pinyin_key}"
                hanviet_data[key] = hanviet_clean

    # Add character-only entries for all characters
    for char, pinyin_set in char_pinyin_counts.items():
        char_only_key = f"{char}|*"
        if char_only_key not in hanviet_data:
            # Find any entry for this character to get the hanviet
            for key, value in hanviet_data.items():
                if key.startswith(f"{char}|") and key != char_only_key:
                    hanviet_data[char_only_key] = value
                    break

    print(f"✅ Loaded {len(hanviet_data)} Han Viet entries")
    return hanviet_data


def get_all_hanviet_readings(char, hanviet_data):
    """Get all Han Viet readings for a character"""
    readings = []
    for key, value in hanviet_data.items():
        if key.startswith(f"{char}|") and key != f"{char}|*":
            readings.append(value)
    return readings


def find_hanviet_reading_with_multiple(entry, hanviet_data):
    """Find Han Viet reading for an entry - includes multiple readings"""
    traditional = entry.get("traditionalChinese", "")

    if not traditional:
        return None

    # Clean the Chinese text
    traditional_clean = traditional.split("｜")[0].split("|")[0]
    traditional_clean = re.sub(r"[（(].*?[）)]", "", traditional_clean).strip()

    # For single characters, collect all readings
    if len(traditional_clean) == 1:
        all_readings = get_all_hanviet_readings(traditional_clean, hanviet_data)
        if all_readings:
            # Remove duplicates and join with forward slash
            unique_readings = list(dict.fromkeys(all_readings))
            return "/".join(unique_readings)

    # For multi-character words, try whole word first
    char_only_key = f"{traditional_clean}|*"
    if char_only_key in hanviet_data:
        return hanviet_data[char_only_key]

    # For multi-character words, try character by character
    hanviet_readings = []
    for char in traditional_clean:
        char_only_key = f"{char}|*"
        if char_only_key in hanviet_data:
            hanviet_readings.append(hanviet_data[char_only_key])
        else:
            hanviet_readings.append("_")

    if any(reading != "_" for reading in hanviet_readings):
        return " ".join(hanviet_readings)

    return None


def process_hsk_with_hanviet(input_file, hanviet_csv, output_file):
    """Process HSK JSON and add Han Viet readings from CSV"""
    # Load Han Viet CSV
    hanviet_data = load_hanviet_csv(hanviet_csv)

    # Load HSK JSON
    print(f"📖 Loading HSK data from: {input_file}")
    with open(input_file, "r", encoding="utf-8") as f:
        hsk_data = json.load(f)

    print(f"📊 Processing {len(hsk_data)} HSK entries...")

    matches_found = 0
    no_match_entries = []

    for i, entry in enumerate(hsk_data, 1):
        hanviet_reading = find_hanviet_reading_with_multiple(entry, hanviet_data)

        if hanviet_reading:
            entry["hanviet"] = hanviet_reading
            matches_found += 1
            print(f"  {i:3d}. {entry.get('simplifiedChinese', '')} → {hanviet_reading}")
        else:
            entry["hanviet"] = ""
            no_match_entries.append(entry)
            print(f"  {i:3d}. {entry.get('simplifiedChinese', '')} → No match")

    # Save updated JSON
    print(f"\n💾 Saving updated data to: {output_file}")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(hsk_data, f, ensure_ascii=False, indent=2)

    # Save entries with no matches to separate file
    no_match_file = output_file.replace(".json", "_no_matches.json")
    print(f"💾 Saving entries with no matches to: {no_match_file}")
    with open(no_match_file, "w", encoding="utf-8") as f:
        json.dump(no_match_entries, f, ensure_ascii=False, indent=2)

    print(f"✅ Completed!")
    print(f"📊 Total entries: {len(hsk_data)}")
    print(f"🎯 Han Viet matches found: {matches_found}")
    print(f"❌ No matches: {len(no_match_entries)}")
    print(f"📁 Output file: {output_file}")
    print(f"📁 No matches file: {no_match_file}")


if __name__ == "__main__":
    # Default file paths
    input_file = "src/hsk_level1.json"
    hanviet_csv = "hanviet.csv"
    output_file = "src/hsk_level1_with_hanviet.json"

    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        print("Available JSON files:")
        for file in os.listdir("src"):
            if file.endswith(".json"):
                print(f"  - src/{file}")
        sys.exit(1)

    # Check if Han Viet CSV exists
    if not os.path.exists(hanviet_csv):
        print(f"❌ Han Viet CSV file not found: {hanviet_csv}")
        sys.exit(1)

    process_hsk_with_hanviet(input_file, hanviet_csv, output_file)
