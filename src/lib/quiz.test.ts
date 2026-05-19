import { describe, expect, test } from "vitest";

import { isAnswerComplete } from "@/lib/quiz";
import type { Question } from "@/lib/types";

const matchingQuestion: Question = {
  id: "matching-1",
  kind: "matching",
  title: "Match ports",
  points: 4,
  feedback: {
    correct: "Correct",
    incorrect: "Incorrect",
    partial: "Partial",
  },
  matching: [
    { id: "pair-1", prompt: "USB-C", response: "USB-C connector" },
    { id: "pair-2", prompt: "HDMI", response: "HDMI connector" },
  ],
};

describe("isAnswerComplete", () => {
  test("treats matching assignments as a complete answer when every row is selected", () => {
    expect(
      isAnswerComplete(matchingQuestion, {
        matchingAssignments: {
          "pair-1": "pair-1",
          "pair-2": "pair-2",
        },
      }),
    ).toBe(true);
  });
});
