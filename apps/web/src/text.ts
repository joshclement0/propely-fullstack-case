/** Converts legacy description markup to safe, plain text with line breaks. */
export function htmlTagsToNewlines(value: string): string {
  return value
    .replace(/<[^>]*>/g, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/\n[\t ]*\n+/g, '\n')
    .trim();
}
