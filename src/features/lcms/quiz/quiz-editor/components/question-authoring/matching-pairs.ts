import type { MatchingPair, Question } from "@/domain/quiz/types";

/** Pairs as the editor shows them: a new-shape question is read through its key, or by index without one. */
export function readPairs(question: Question): MatchingPair[] {
  const pairs = question.matching ?? [];
  const responses = question.matchingResponses;
  if (!responses) return pairs;
  return pairs.map((pair, index) => {
    const key = question.matchingKey?.[pair.id];
    const linked = key === undefined ? responses[index] : responses.find((response) => response.id === key);
    return { ...pair, response: linked?.response ?? "", responseIcon: linked?.responseIcon, responseImage: linked?.responseImage };
  });
}

/** The editor always writes the old shape: each pair carries its own response. */
export const writePairs = (question: Question, pairs: MatchingPair[]): Question =>
  ({ ...question, matching: pairs, matchingResponses: undefined, matchingKey: undefined });

export function swapRight(pairs: MatchingPair[], a: number, b: number): MatchingPair[] {
  const right = (pair: MatchingPair) => ({ response: pair.response, responseIcon: pair.responseIcon, responseImage: pair.responseImage });
  return pairs.map((pair, index) => (index === a ? { ...pair, ...right(pairs[b]) } : index === b ? { ...pair, ...right(pairs[a]) } : pair));
}
