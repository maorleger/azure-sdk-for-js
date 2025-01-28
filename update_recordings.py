#!/usr/bin/env python3

import os
import sys
import json
import re

OLD_VALUE = "application/json; charset=UTF-8"
NEW_VALUE = "application/json"

def scan_directory(dir_path):
    """
    Recursively scans a directory for .json files, then processes each.
    """
    for root, dirs, files in os.walk(dir_path):
        for file_name in files:
            if file_name.lower().endswith('.json'):
                full_path = os.path.join(root, file_name)
                handle_file(full_path)

def handle_file(file_path):
    """
    1) Reads the file text.
    2) Parses it as JSON (to confirm validity and find if an update is needed).
    3) If an update is needed, does a careful text replacement (only within the
       'RequestHeaders' block for 'Content-Type': 'application/json; charset=UTF-8').
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_text = f.read()
        
        data = json.loads(original_text)  # Confirm it's valid JSON.

        # Check if we actually need to update anything:
        if not needs_updating(data):
            return  # Nothing to change => keep file untouched (no diff).

        # Attempt a minimal text-based patch:
        updated_text = replace_request_headers_content_type(original_text)

        # If the text actually changed, write it back out:
        if updated_text != original_text:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_text)
            print(f"Updated: {file_path}")

    except (json.JSONDecodeError, OSError) as e:
        # JSON invalid or file cannot be read -- skip safely
        print(f"Skipping invalid or unreadable JSON file: {file_path}\nError: {e}")

def needs_updating(json_data):
    """
    Returns True if there's at least one 'RequestHeaders.Content-Type'
    with the OLD_VALUE in the data, False otherwise.
    """
    if not isinstance(json_data, dict):
        return False
    
    entries = json_data.get("Entries")
    if not isinstance(entries, list):
        return False

    for entry in entries:
        if (
            isinstance(entry, dict) and
            "RequestHeaders" in entry and
            isinstance(entry["RequestHeaders"], dict) and
            entry["RequestHeaders"].get("Content-Type") == OLD_VALUE
        ):
            return True

    return False

def replace_request_headers_content_type(text):
    """
    Performs a localized replacement in the JSON text:
      - Finds blocks that look like `"RequestHeaders": { ... }`
      - Within that block, replaces `"Content-Type": "application/json; charset=UTF-8"`
        with `"Content-Type": "application/json"`.
    
    Caveat: This only properly handles a single-level of braces in the RequestHeaders object.
    If you have deeply nested braces inside RequestHeaders, you'll need a more robust approach.
    """
    # Regex to capture `"RequestHeaders": { ... }` in a non-greedy way.
    #
    #  - We use DOTALL so that `.` matches line breaks as well.
    #  - We capture the entire block (group(1)) including the opening `"RequestHeaders": {`
    #    and the closing `}`. Then inside the function `replace_headers_block`, 
    #    we'll carefully replace just the OLD_VALUE for "Content-Type".
    #
    # WARNING: If there are nested curly braces in "RequestHeaders", this naive approach may fail.
    pattern = r'("RequestHeaders"\s*:\s*\{.*?\})'

    def replace_headers_block(match):
        entire_block = match.group(1)  # e.g. `"RequestHeaders": { ... }`
        # Identify the inside portion between the first '{' and the matching '}'
        start_brace_index = entire_block.find('{')
        end_brace_index = entire_block.rfind('}')
        if start_brace_index == -1 or end_brace_index == -1 or end_brace_index <= start_brace_index:
            return entire_block  # Should not happen in valid JSON, just return as-is

        # Everything inside { ... }
        inside = entire_block[start_brace_index + 1:end_brace_index]

        # Now replace ONLY occurrences of "Content-Type": "application/json; charset=UTF-8"
        # with "Content-Type": "application/json" within that chunk:
        inside_replaced = re.sub(
            # "Content-Type": "<old_value>"
            rf'("Content-Type"\s*:\s*"){re.escape(OLD_VALUE)}(")', 
            rf'\1{NEW_VALUE}\2',
            inside
        )
        # Reconstruct the block: the substring up to '{', plus the replaced inside, plus the trailing '}'
        return entire_block[:start_brace_index + 1] + inside_replaced + entire_block[end_brace_index:]

    # Perform the block replacement across the entire file text
    return re.sub(pattern, replace_headers_block, text, flags=re.DOTALL)

if __name__ == "__main__":
    # Get directory from command line or default to current dir
    directory = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    scan_directory(directory)
