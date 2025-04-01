const fs = require("fs");
const path = require("path");

/**
 * Analyzes the testProxyOutput.log file to find recording mismatches and applied sanitizers.
 * @param {string} logFilePath - Path to the testProxyOutput.log file.
 * @returns {string[]} - Array of grouped log lines containing mismatches and sanitizers.
 */
export function parseLogFile(logContent: string) {
  // More lenient regex that captures URI blocks followed by any content until a mismatch message
  const mismatchRegex =
    /[\s\S]*?URI:[\s\S]*?Unable to find a record[\s\S]*?(?:No records to match\.?|Remaining Entries:[\s\S]*?)(?=\n\[|$)/gm;

  // Debug logging
  const matches = [...logContent.matchAll(mismatchRegex)];

  return matches;
}
