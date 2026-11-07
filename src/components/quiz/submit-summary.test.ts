import { describe, expect, it } from "vitest";

import { buildSubmitSummary, submitLeadText } from "@/components/quiz/submit-summary";

describe("buildSubmitSummary", () => {
  it("lists 1-based numbers of unanswered and flagged questions", () => {
    const answered = new Set(Array.from({ length: 20 }, (_, i) => i).filter((i) => i !== 6 && i !== 14));
    expect(buildSubmitSummary(20, answered, new Set([11]))).toEqual({ unanswered: [7, 15], flagged: [12], answeredCount: 18 });
  });

  it("sorts flagged numbers and reports everything answered", () => {
    expect(buildSubmitSummary(3, new Set([0, 1, 2]), new Set([2, 0]))).toEqual({ unanswered: [], flagged: [1, 3], answeredCount: 3 });
  });
});

describe("submitLeadText", () => {
  it("shows the time left and the retries left", () => {
    expect(submitLeadText(192, 1)).toBe("Còn 03:12. Sau khi nộp không sửa được nữa, bạn còn 1 lần làm lại.");
  });

  it("drops the unknown clauses", () => {
    expect(submitLeadText(null, null)).toBe("Sau khi nộp không sửa được nữa.");
    expect(submitLeadText(59, 0)).toBe("Còn 00:59. Sau khi nộp không sửa được nữa.");
  });
});
