import type { MatchingPair, MatchingResponse, Question } from "@/domain/quiz/types";

/** Responses without a key: the pairing is a guess until the teacher confirms it. */
export const isUnconfirmed = (question: Question) => Boolean(question.matchingResponses) && !question.matchingKey;

/** Pairs as the editor shows them: a new-shape question is read through its key, or by index without one. */
export function readPairs(question: Question): MatchingPair[] {
  const pairs = question.matching ?? [];
  const responses = question.matchingResponses;
  if (!responses) return pairs;
  // Responses no pair reaches are dropped: the old shape the editor writes cannot hold them (plan ruling).
  return pairs.map((pair, index) => {
    const keyed = question.matchingKey?.[pair.id];
    const linked = keyed === undefined ? undefined : responses.find((response) => response.id === keyed);
    if (!linked && question.matchingKey && (pair.response || pair.responseImage)) return pair;
    const source = linked ?? responses[index];
    return { ...pair, response: source?.response ?? "", responseIcon: source?.responseIcon, responseImage: source?.responseImage };
  });
}

/** The old shape: each pair carries its own response. Written only for confirmed pairs. */
export const writePairs = (question: Question, pairs: MatchingPair[]): Question =>
  ({ ...question, matching: pairs, matchingResponses: undefined, matchingKey: undefined });

/** Every edit: an unconfirmed question stays keyless (responses in row order, ids kept by index); others get the old shape. */
export function savePairs(question: Question, pairs: MatchingPair[]): Question {
  if (!isUnconfirmed(question)) return writePairs(question, pairs);
  const ids = question.matchingResponses!.map((response) => response.id);
  const matchingResponses: MatchingResponse[] = pairs.map((pair, index) =>
    ({ id: ids[index] ?? `${pair.id}-r`, response: pair.response ?? "", responseIcon: pair.responseIcon, responseImage: pair.responseImage }));
  const matching = pairs.map(({ response: _r, responseIcon: _i, responseImage: _m, ...prompt }) => prompt);
  return { ...question, matching, matchingResponses };
}

export function swapRight(pairs: MatchingPair[], a: number, b: number): MatchingPair[] {
  const right = (pair: MatchingPair) => ({ response: pair.response, responseIcon: pair.responseIcon, responseImage: pair.responseImage });
  return pairs.map((pair, index) => (index === a ? { ...pair, ...right(pairs[b]) } : index === b ? { ...pair, ...right(pairs[a]) } : pair));
}

/** The row now holding `snapshot`'s right side: a swap moves a response to another row, and its image follows it. */
export function rightOwner(pairs: MatchingPair[], snapshot: MatchingPair): string {
  const same = (pair: MatchingPair) =>
    pair.response === snapshot.response && pair.responseIcon === snapshot.responseIcon && pair.responseImage === snapshot.responseImage;
  const own = pairs.find((pair) => pair.id === snapshot.id);
  return own && same(own) ? own.id : (pairs.find(same)?.id ?? snapshot.id);
}
