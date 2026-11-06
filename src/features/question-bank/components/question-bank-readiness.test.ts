import { describe, expect, test } from "vitest";

import { questionBankReadiness } from "./question-bank-readiness";

describe("questionBankReadiness", () => {
  test("choice questions need a correct choice", () => {
    expect(questionBankReadiness({ answer: "", choices: [{ id: "a", label: "A", correct: true }] })).toBe("ready");
    expect(questionBankReadiness({ answer: "a", choices: [{ id: "a", label: "A", correct: false }] })).toBe("missingCorrect");
  });

  test("other questions need an answer", () => {
    expect(questionBankReadiness({ answer: "42", choices: [] })).toBe("ready");
    expect(questionBankReadiness({ answer: "  ", choices: [] })).toBe("missingAnswer");
  });
});
