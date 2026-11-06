/** A word of `text` in [start, end); empty (start === end) only transiently, after a delete inside it. */
export type SentenceBlank = { id: string; start: number; end: number };
export type BlankSentence = { text: string; blanks: SentenceBlank[] };

export const blankWord = (s: BlankSentence, b: SentenceBlank): string => s.text.slice(b.start, b.end);

export function sentenceParts(s: BlankSentence): string[] {
  const parts: string[] = [];
  let at = 0;
  for (const b of s.blanks) {
    parts.push(s.text.slice(at, b.start));
    at = b.end;
  }
  parts.push(s.text.slice(at));
  return parts;
}

/** Locates the edit as P[a, pEnd) -> N, preferring the caret-based reading. */
function locateEdit(P: string, N: string, caret: number): { a: number; pEnd: number } {
  const d = N.length - P.length;
  const a = caret - Math.max(d, 0);
  const pEnd = a + Math.max(-d, 0);
  if (a >= 0 && pEnd <= P.length && N.slice(0, a) === P.slice(0, a) && N.slice(caret) === P.slice(pEnd)) {
    return { a, pEnd };
  }
  const min = Math.min(P.length, N.length);
  let prefix = 0;
  while (prefix < min && P[prefix] === N[prefix]) prefix++;
  let suffix = 0;
  while (suffix < min - prefix && P[P.length - 1 - suffix] === N[N.length - 1 - suffix]) suffix++;
  return { a: prefix, pEnd: P.length - suffix };
}

const LETTERS = /^[\p{L}\p{M}\p{N}]+$/u;

/**
 * Moves the blanks through one edit of the text. An edit inside a blank resizes it; letters typed at its end edge
 * grow it (so retyping a selected word keeps the blank), while spaces and punctuation there stay outside.
 * A blank emptied by a delete inside it survives empty, so the next letter refills it; one left whitespace-only,
 * or cut by an edit across its edge, is dropped.
 */
export function rebaseBlanks(prev: BlankSentence, nextText: string, caret: number): BlankSentence {
  const d = nextText.length - prev.text.length;
  const { a, pEnd } = locateEdit(prev.text, nextText, caret);
  const typedLetters = d > 0 && pEnd === a && LETTERS.test(nextText.slice(a, a + d));
  // Only one blank grows, so two blanks never overlap. The word being typed wins over an empty blank after it:
  // guessing wrong leaves that blank empty, which readiness flags, instead of moving its answer to another word.
  const atCaret = typedLetters ? prev.blanks.filter((b) => b.end === a) : [];
  const grows = atCaret.find((b) => b.start < b.end) ?? atCaret[0];
  const blanks: SentenceBlank[] = [];
  for (const b of prev.blanks) {
    if (b === grows) blanks.push({ ...b, end: b.end + d });
    // An empty blank rides after text inserted at its spot, so a retyped space or a refilled blank before it never strands it.
    else if (b.start === b.end && b.start === a && pEnd === a && d > 0) blanks.push({ ...b, start: a + d, end: a + d });
    else if (a >= b.end) blanks.push(b);
    else if (pEnd <= b.start) blanks.push({ ...b, start: b.start + d, end: b.end + d });
    else if (b.start <= a && pEnd <= b.end) {
      const end = b.end + d;
      if (end === b.start || nextText.slice(b.start, end).trim()) blanks.push({ ...b, end });
    }
  }
  return { text: nextText, blanks };
}

export function addBlank(s: BlankSentence, start: number, end: number, id: string): BlankSentence | null {
  const lo = Math.max(0, Math.min(start, s.text.length));
  const hi = Math.max(lo, Math.min(end, s.text.length));
  const raw = s.text.slice(lo, hi);
  const from = lo + (raw.length - raw.trimStart().length);
  const to = hi - (raw.length - raw.trimEnd().length);
  if (to <= from || s.blanks.some((b) => from < b.end && b.start < to)) return null;
  const blanks = [...s.blanks, { id, start: from, end: to }].sort((x, y) => x.start - y.start);
  return { text: s.text, blanks };
}

export const removeBlank = (s: BlankSentence, id: string): BlankSentence => ({
  text: s.text,
  blanks: s.blanks.filter((b) => b.id !== id),
});

export function setBlankText(s: BlankSentence, id: string, text: string): BlankSentence {
  const target = s.blanks.find((b) => b.id === id);
  if (!target) return s;
  const blank = text.trim() !== "";
  const next = blank ? text : "";
  const d = next.length - (target.end - target.start);
  return {
    text: s.text.slice(0, target.start) + next + s.text.slice(target.end),
    blanks: s.blanks.flatMap((b) => {
      if (b.id === id) return blank ? [{ ...b, end: b.end + d }] : [];
      return b.start >= target.end ? [{ ...b, start: b.start + d, end: b.end + d }] : [b];
    }),
  };
}
