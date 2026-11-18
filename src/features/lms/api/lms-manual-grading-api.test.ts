import { expect, test } from "vitest";

import type { LmsAssignmentProgressWorkspace } from "@/features/lms/api/lms-assignment-progress-api";
import { manualAnswerText, reviewAttemptsByStudent } from "@/features/lms/api/lms-manual-grading-api";
import { parseManualPoints } from "@/features/lms/components/manual-grading-dialog";

test("an essay answer shows the text the learner typed", () => {
  expect(manualAnswerText({ essayText: "bài làm" })).toBe("bài làm");
  expect(manualAnswerText("chữ thường")).toBe("chữ thường");
  expect(manualAnswerText(null)).toBe("");
});

test("only attempts waiting for a teacher are offered for grading, under the student id and the account id", () => {
  const workspace = {
    recipients: {
      items: [
        { id: "stu-1", authUserId: "usr-1", latestAttempt: { id: "att-1", status: "NEEDS_REVIEW", studentId: "stu-1" } },
        { id: "stu-2", authUserId: "usr-2", latestAttempt: { id: "att-2", status: "graded", studentId: "stu-2" }, bestAttempt: { id: "att-0", status: "needs_review", studentId: "stu-2" } },
      ],
    },
  } as unknown as LmsAssignmentProgressWorkspace;

  const attempts = reviewAttemptsByStudent(workspace);

  expect(attempts.get("stu-1")).toBe("att-1");
  expect(attempts.get("usr-1")).toBe("att-1");
  expect(attempts.has("stu-2")).toBe(false);
  expect(reviewAttemptsByStudent(undefined).size).toBe(0);
});

test("a score must be a number from 0 to the question's maximum; a comma decimal is accepted", () => {
  expect(parseManualPoints("7,5", 10)).toBe(7.5);
  expect(parseManualPoints("0", 10)).toBe(0);
  expect(parseManualPoints("11", 10)).toBeNull();
  expect(parseManualPoints("-1", 10)).toBeNull();
  expect(parseManualPoints("abc", 10)).toBeNull();
  expect(parseManualPoints("", 10)).toBeNull();
});
