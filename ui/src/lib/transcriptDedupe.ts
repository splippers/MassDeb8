/** Collapse whitespace for comparing transcript blocks. */
export function normalizeTranscriptText(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

const DEDUPE_WINDOW = 14

/** Skip adding a line if an identical block already appears among the newest entries. */
export function isDuplicateTranscriptLine(text: string, newestFirstLines: { text: string }[]): boolean {
  const n = normalizeTranscriptText(text)
  if (!n) return true
  const windowLines = newestFirstLines.slice(0, DEDUPE_WINDOW)
  return windowLines.some((l) => normalizeTranscriptText(l.text) === n)
}
