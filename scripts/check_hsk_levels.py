#!/usr/bin/env python3
"""
Cross-check HSK levels 3-7 to verify processed JSON files match source CSV/JSON files.
Checks: simplified, traditional, pinyin, english
"""

import csv
import json
import os
from pathlib import Path

# Base paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
VOCAB_CSV_DIR = PROJECT_ROOT / "vocabCsv"
MOBILE_DATA_DIR = PROJECT_ROOT / "mobile" / "data"

def check_hsk_csv_level(level):
    """Check HSK level 3-6: Compare CSV source with processed JSON"""
    csv_file = VOCAB_CSV_DIR / f"HSK - Level {level}.csv"
    json_file = MOBILE_DATA_DIR / f"hsk_level{level}.json"
    
    print(f"\n{'='*60}")
    print(f"Checking HSK Level {level}")
    print(f"{'='*60}")
    print(f"Source CSV: {csv_file}")
    print(f"Processed JSON: {json_file}")
    
    if not csv_file.exists():
        print(f"❌ Source CSV not found: {csv_file}")
        return False
    
    if not json_file.exists():
        print(f"❌ Processed JSON not found: {json_file}")
        return False
    
    # Read CSV
    csv_data = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_data.append({
                "no": row["No"],
                "chinese": row["Chinese"],
                "pinyin": row["Pinyin"],
                "english": row["English"]
            })
    
    # Read JSON
    with open(json_file, "r", encoding="utf-8") as f:
        json_data = json.load(f)
    
    print(f"📊 CSV entries: {len(csv_data)}")
    print(f"📊 JSON entries: {len(json_data)}")
    
    if len(csv_data) != len(json_data):
        print(f"⚠️  WARNING: Entry count mismatch!")
        print(f"   CSV: {len(csv_data)}, JSON: {len(json_data)}")
    
    # Compare entries
    mismatches = []
    min_len = min(len(csv_data), len(json_data))
    
    for i in range(min_len):
        csv_entry = csv_data[i]
        json_entry = json_data[i]
        
        issues = []
        
        # Check simplified Chinese
        if csv_entry["chinese"] != json_entry["simplifiedChinese"]:
            issues.append(f"simplified: '{csv_entry['chinese']}' != '{json_entry['simplifiedChinese']}'")
        
        # Check pinyin (normalize spaces)
        csv_pinyin = csv_entry["pinyin"].strip()
        json_pinyin = json_entry["pinyin"].strip()
        if csv_pinyin != json_pinyin:
            issues.append(f"pinyin: '{csv_pinyin}' != '{json_pinyin}'")
        
        # Check English (normalize - CSV might have different formatting)
        csv_english = csv_entry["english"].strip()
        json_english = json_entry["english"].strip()
        # Normalize: remove extra spaces, compare case-insensitive
        csv_english_norm = " ".join(csv_english.split()).lower()
        json_english_norm = " ".join(json_english.split()).lower()
        if csv_english_norm != json_english_norm:
            # Check if JSON English contains CSV English (since JSON might have multiple meanings)
            if csv_english_norm not in json_english_norm and json_english_norm not in csv_english_norm:
                issues.append(f"english: '{csv_english}' != '{json_english}'")
        
        if issues:
            mismatches.append({
                "index": i + 1,
                "csv_no": csv_entry["no"],
                "json_id": json_entry["id"],
                "chinese": csv_entry["chinese"],
                "issues": issues
            })
    
    # Report results
    if mismatches:
        print(f"\n❌ Found {len(mismatches)} mismatches:")
        for mismatch in mismatches[:10]:  # Show first 10
            print(f"\n  Entry {mismatch['index']} (CSV No: {mismatch['csv_no']}, JSON ID: {mismatch['json_id']}):")
            print(f"    Chinese: {mismatch['chinese']}")
            for issue in mismatch["issues"]:
                print(f"    - {issue}")
        if len(mismatches) > 10:
            print(f"\n  ... and {len(mismatches) - 10} more mismatches")
        return False
    else:
        print(f"\n✅ All entries match!")
        return True


def check_hsk7_json():
    """Check HSK level 7: Compare JSON source with processed JSON"""
    source_json = VOCAB_CSV_DIR / "hsk7.json"
    processed_json = MOBILE_DATA_DIR / "hsk_level7.json"
    
    print(f"\n{'='*60}")
    print(f"Checking HSK Level 7")
    print(f"{'='*60}")
    print(f"Source JSON: {source_json}")
    print(f"Processed JSON: {processed_json}")
    
    if not source_json.exists():
        print(f"❌ Source JSON not found: {source_json}")
        return False
    
    if not processed_json.exists():
        print(f"❌ Processed JSON not found: {processed_json}")
        return False
    
    # Read source JSON
    with open(source_json, "r", encoding="utf-8") as f:
        source_data = json.load(f)
    
    # Read processed JSON
    with open(processed_json, "r", encoding="utf-8") as f:
        processed_data = json.load(f)
    
    print(f"📊 Source entries: {len(source_data)}")
    print(f"📊 Processed entries: {len(processed_data)}")
    
    if len(source_data) != len(processed_data):
        print(f"⚠️  WARNING: Entry count mismatch!")
        print(f"   Source: {len(source_data)}, Processed: {len(processed_data)}")
    
    # Compare entries
    mismatches = []
    min_len = min(len(source_data), len(processed_data))
    
    for i in range(min_len):
        source_entry = source_data[i]
        processed_entry = processed_data[i]
        
        issues = []
        
        # Check simplified Chinese
        source_simplified = source_entry["simplified"]
        processed_simplified = processed_entry["simplifiedChinese"]
        if source_simplified != processed_simplified:
            issues.append(f"simplified: '{source_simplified}' != '{processed_simplified}'")
        
        # Check traditional Chinese
        if source_entry.get("forms") and source_entry["forms"][0].get("traditional"):
            source_traditional = source_entry["forms"][0]["traditional"]
            processed_traditional = processed_entry["traditionalChinese"]
            if source_traditional != processed_traditional:
                issues.append(f"traditional: '{source_traditional}' != '{processed_traditional}'")
        
        # Check pinyin
        if source_entry.get("forms") and source_entry["forms"][0].get("transcriptions"):
            source_pinyin = source_entry["forms"][0]["transcriptions"].get("pinyin", "")
            processed_pinyin = processed_entry["pinyin"]
            # Normalize spaces
            source_pinyin_norm = " ".join(source_pinyin.split())
            processed_pinyin_norm = " ".join(processed_pinyin.split())
            if source_pinyin_norm != processed_pinyin_norm:
                issues.append(f"pinyin: '{source_pinyin}' != '{processed_pinyin}'")
        
        # Check English (meanings)
        if source_entry.get("forms") and source_entry["forms"][0].get("meanings"):
            source_meanings = source_entry["forms"][0]["meanings"]
            source_english = ", ".join(source_meanings)
            processed_english = processed_entry["english"]
            # Normalize
            source_english_norm = " ".join(source_english.split()).lower()
            processed_english_norm = " ".join(processed_english.split()).lower()
            if source_english_norm != processed_english_norm:
                issues.append(f"english: '{source_english}' != '{processed_english}'")
        
        if issues:
            mismatches.append({
                "index": i + 1,
                "simplified": source_simplified,
                "issues": issues
            })
    
    # Report results
    if mismatches:
        print(f"\n❌ Found {len(mismatches)} mismatches:")
        for mismatch in mismatches[:10]:  # Show first 10
            print(f"\n  Entry {mismatch['index']}:")
            print(f"    Chinese: {mismatch['simplified']}")
            for issue in mismatch["issues"]:
                print(f"    - {issue}")
        if len(mismatches) > 10:
            print(f"\n  ... and {len(mismatches) - 10} more mismatches")
        return False
    else:
        print(f"\n✅ All entries match!")
        return True


def main():
    """Check all HSK levels 3-7"""
    print("🔍 Cross-checking HSK Levels 3-7")
    print("=" * 60)
    
    results = {}
    
    # Check HSK 3-6 (CSV sources)
    for level in range(3, 7):
        results[f"HSK{level}"] = check_hsk_csv_level(level)
    
    # Check HSK 7 (JSON source)
    results["HSK7"] = check_hsk7_json()
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    
    all_passed = True
    for level, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{level}: {status}")
        if not passed:
            all_passed = False
    
    print(f"\n{'='*60}")
    if all_passed:
        print("✅ All levels match!")
    else:
        print("❌ Some levels have mismatches")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

