/**
 * Analyzes the testProxyOutput.log file to find recording mismatches and applied sanitizers.
 * @param {string} logContent - the raw text from the log file.
 */
export function parseLogFile(logContent: string) {
  // Please do not judge me on these regex, AI generated for a proof-of-concept :)
  // Structured logging would help a lot here
  const sanitizerRegex =
    /[\s\S]*?URI:[\s\S]*?Unable to find a record[\s\S]*?(?:No records to match\.?|Remaining Entries:[\s\S]*?)(?=\n\[|$)/gm;

  const mismatchRegex =
    /^\[\d{2}:\d{2}:\d{2}\] fail: Azure\.Sdk\.Tools\.TestProxy\[0\]\s+Unable to find a record for the request .+?(?:\n\s+.+?)+/gm;

  return {
    recordingMismatches: [...logContent.matchAll(mismatchRegex)],
    sanitizerInfo: [...logContent.matchAll(sanitizerRegex)],
  };
}
