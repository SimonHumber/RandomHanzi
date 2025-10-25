#!/usr/bin/env python3
"""
Script to count characters in HSK Level 1 data and add character count to each entry.
"""

import json
import re
from typing import Dict, List, Any


def count_chinese_characters(text: str) -> int:
    """
    Count the number of Chinese characters in a text.
    Removes punctuation, spaces, and other non-Chinese characters.
    """
    if not text:
        return 0

    # Remove common punctuation and formatting characters
    # Keep only Chinese characters (CJK Unified Ideographs)
    chinese_chars = re.findall(r"[\u4e00-\u9fff]", text)
    return len(chinese_chars)


def process_hsk_data(input_file: str, output_file: str) -> None:
    """
    Process HSK Level 1 data to add character counts.
    """
    print(f"📖 Reading HSK Level 1 data from {input_file}...")

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: File {input_file} not found!")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in {input_file}: {e}")
        return

    print(f"📊 Processing {len(data)} entries...")

    processed_data = []
    total_characters = 0

    for i, entry in enumerate(data, 1):
        # Create a copy of the entry
        processed_entry = entry.copy()

        # Count characters in simplifiedChinese field
        simplified_text = entry.get("simplifiedChinese", "")
        char_count = count_chinese_characters(simplified_text)

        # Add character count to the entry
        processed_entry["characterCount"] = char_count
        total_characters += char_count

        # Add some statistics
        if i <= 10:  # Show first 10 entries as examples
            print(f"   Entry {i}: '{simplified_text}' → {char_count} characters")

        processed_data.append(processed_entry)

    # Save the processed data
    print(f"💾 Saving processed data to {output_file}...")
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(processed_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return

    # Print summary statistics
    print("\n📈 SUMMARY STATISTICS:")
    print(f"   Total entries processed: {len(processed_data)}")
    print(f"   Total Chinese characters: {total_characters}")
    print(
        f"   Average characters per entry: {total_characters / len(processed_data):.2f}"
    )

    # Find entries with most/least characters
    sorted_by_count = sorted(
        processed_data, key=lambda x: x["characterCount"], reverse=True
    )
    print(f"\n🔝 Top 5 entries with most characters:")
    for i, entry in enumerate(sorted_by_count[:5], 1):
        print(
            f"   {i}. '{entry['simplifiedChinese']}' → {entry['characterCount']} characters"
        )

    print(f"\n🔻 Top 5 entries with least characters:")
    for i, entry in enumerate(sorted_by_count[-5:], 1):
        print(
            f"   {i}. '{entry['simplifiedChinese']}' → {entry['characterCount']} characters"
        )

    print(f"\n✅ Processing completed! Data saved to {output_file}")


def main():
    input_file = "src/hsk_level1.json"
    output_file = "src/hsk_level1_with_counts.json"

    print("🔢 HSK Level 1 Character Counter")
    print("=" * 40)

    process_hsk_data(input_file, output_file)


if __name__ == "__main__":
    main()
