import { describe, expect, test } from "vitest";

import type { Question } from "@/domain/quiz/types";

import { dropPiece, readBoard } from "./matching-board";

const rows = ["m1", "m2", "m3", "m4"];
const board = { order: ["r3", "r1", "r2", "r4"], connected: [] as string[] };

describe("dropPiece", () => {
  test("dropping on another row swaps the two pieces only", () => {
    expect(dropPiece(board, rows, 0, 2)).toEqual({ order: ["r2", "r1", "r3", "r4"], connected: ["m3"] });
  });

  test("dropping on its own row toggles the connection", () => {
    const once = dropPiece(board, rows, 1, 1);
    expect(once.connected).toEqual(["m2"]);
    expect(dropPiece(once, rows, 1, 1).connected).toEqual([]);
  });

  test("dropping outside detaches without moving pieces", () => {
    expect(dropPiece({ ...board, connected: ["m1"] }, rows, 0, null)).toEqual({ order: board.order, connected: [] });
  });
});

describe("readBoard", () => {
  const question = {
    id: "q",
    kind: "matching",
    title: "",
    points: 1,
    feedback: {},
    matching: [
      { id: "m1", prompt: "A" },
      { id: "m2", prompt: "B" },
    ],
    matchingResponses: [
      { id: "r1", response: "1" },
      { id: "r2", response: "2" },
    ],
  } as unknown as Question;

  test("assignments fill their rows and connect them", () => {
    expect(readBoard(question, { matchingAssignments: { m1: "r1" } })).toEqual({ order: ["r1", ""], connected: ["m1"] });
  });

  test("an old order without connected rows connects every row", () => {
    expect(readBoard(question, { matchingOrder: ["r2", "r1"] })).toEqual({ order: ["r2", "r1"], connected: ["m1", "m2"] });
  });

  test("no answer starts from the initial order, nothing connected", () => {
    expect(readBoard(question, {})).toEqual({ order: ["r1", "r2"], connected: [] });
  });
});
