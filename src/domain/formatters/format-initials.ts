const BRACKET_TAG = /\[[^\]]*\]|\([^)]*\)/gu;
const FIRST_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** Name without a "[TEST]" style tag, whitespace collapsed. */
export function nameWithoutTags(name: string | null | undefined): string {
  return (name ?? "").replace(BRACKET_TAG, " ").replace(/\s+/g, " ").trim();
}

/** Initials of the last two words, as the account page shows them ("Lê Tuấn Kiệt" -> "TK"). A "[TEST]" style tag and punctuation never become an initial. Empty when the name has none. */
export function nameInitials(name: string | null | undefined): string {
  const all = (name ?? "").replace(BRACKET_TAG, " ").split(/\s+/).filter((word) => FIRST_LETTER_OR_DIGIT.test(word));
  // A number is an initial only when the name has no word: "Học sinh 03" -> "HS", not "S0" (BUG-A-042).
  const lettered = all.filter((word) => /\p{L}/u.test(word));
  const words = lettered.length ? lettered : all;
  return words.slice(-2).map((word) => word.match(FIRST_LETTER_OR_DIGIT)?.[0] ?? "").join("").toLocaleUpperCase("vi");
}
