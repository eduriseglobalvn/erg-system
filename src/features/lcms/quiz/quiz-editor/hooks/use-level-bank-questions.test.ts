import { describe, expect, it } from "vitest";

import type { QuestionListRow } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-table-row";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { bankEntryFor } from "./use-level-bank-questions";

const bank = (id: string, usageCount: number) => ({ id, usageCount }) as QuestionBankQuestion;
const row = (slide: Partial<QuestionListRow["slide"]>, quizId?: string) =>
  ({ slide: { id: "s1", title: "", kind: "multiple-choice", status: "draft", ...slide }, number: 1, groupId: null, topic: quizId ? { quizId } : null, onServer: true }) as QuestionListRow;

describe("bankEntryFor", () => {
  it("a slide made from a bank row: its own topic quiz is not a package", () => {
    const byId = new Map([["b1", bank("b1", 3)]]);
    expect(bankEntryFor(row({ bankQuestionId: "b1" }), "open", byId, new Map())).toEqual({ question: byId.get("b1"), packages: 2 });
  });

  it("a slide authored here is found by the quiz and slide it was copied from", () => {
    const mirrored = bank("m1", 1);
    const bySource = new Map([["q-t1:s1", mirrored], ["open:s1", bank("m2", 0)]]);
    expect(bankEntryFor(row({}, "q-t1"), "open", new Map(), bySource)).toEqual({ question: mirrored, packages: 1 });
    expect(bankEntryFor(row({}), "open", new Map(), bySource)?.question.id).toBe("m2");
    expect(bankEntryFor(row({}, "other"), "open", new Map(), bySource)).toBeNull();
  });
});
