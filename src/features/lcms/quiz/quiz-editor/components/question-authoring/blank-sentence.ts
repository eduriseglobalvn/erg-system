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

export function rebaseBlanks(prev: BlankSentence, nextText: string, caret: number): BlankSentence {
  const d = nextText.length - prev.text.length;
  const { a, pEnd } = locateEdit(prev.text, nextText, caret);
  const blanks: SentenceBlank[] = [];
  for (const b of prev.blanks) {
    if (pEnd <= b.start) blanks.push({ ...b, start: b.start + d, end: b.end + d });
    else if (a >= b.end) blanks.push(b);
    else if (b.start <= a && pEnd <= b.end) {
      if (b.end + d > b.start) blanks.push({ ...b, end: b.end + d });
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
