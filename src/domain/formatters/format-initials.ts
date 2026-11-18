const BRACKET_TAG = /\[[^\]]*\]|\([^)]*\)/gu;
const FIRST_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** Name without a "[TEST]" style tag, whitespace collapsed. */
export function nameWithoutTags(name: string | null | undefined): string {
  return (name ?? "").replace(BRACKET_TAG, " ").replace(/\s+/g, " ").trim();
}

/** Initials of the last two words, as the account page shows them ("Lê Tuấn Kiệt" -> "TK"). A "[TEST]" style tag and punctuation never become an initial. Empty when the name has none. */
export function nameInitials(name: string | null | undefined): string {
  const words = (name ?? "").replace(BRACKET_TAG, " ").split(/\s+/).filter((word) => FIRST_LETTER_OR_DIGIT.test(word));
  return words.slice(-2).map((word) => word.match(FIRST_LETTER_OR_DIGIT)?.[0] ?? "").join("").toLocaleUpperCase("vi");
}
