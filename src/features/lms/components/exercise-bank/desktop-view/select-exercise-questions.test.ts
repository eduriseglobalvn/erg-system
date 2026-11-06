import { describe, expect, it } from "vitest";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import type { Exercise } from "../exercise-bank-model";
import { selectExerciseQuestions } from "./select-exercise-questions";

const q = (id: string, subjectLabel: string) => ({ id, subjectLabel, categoryLabel: "" }) as QuestionBankQuestion;
const ex = (over: Partial<Exercise>) =>
  ({ subject: "IC3", tags: [], questionCount: 2, questionIds: [], ...over }) as Exercise;
const bank = [q("1", "IC3 GS6"), q("2", "IC3 GS6"), q("3", "IC3 GS6"), q("4", "Toán")];

describe("selectExerciseQuestions", () => {
  it("returns [] when nothing is selected", () => {
    expect(selectExerciseQuestions(undefined, bank)).toEqual([]);
  });
  it("prefers explicit questionIds in order", () => {
    const r = selectExerciseQuestions(ex({ questionIds: ["4", "1", "zz"] }), bank);
    expect(r.map((x) => x.id)).toEqual(["4", "1"]);
  });
  it("falls back to subject match limited by questionCount", () => {
    const r = selectExerciseQuestions(ex({ questionIds: ["zz"] }), bank);
    expect(r.map((x) => x.id)).toEqual(["1", "2"]);
  });
  it("falls back to the first N bank questions when no subject matches", () => {
    const r = selectExerciseQuestions(ex({ subject: "Zzz", questionCount: 3 }), [q("a", "x"), q("b", "y")].map((x) => ({ ...x, subjectLabel: "" })));
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
  });
});
