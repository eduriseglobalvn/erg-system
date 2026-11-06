import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";
import { LiveSubmitDialog } from "./player-ready-parts";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 4, 10, 0, 0));
});
afterEach(() => vi.useRealTimers());

it("shows the time left on the very first render of the submit dialog", () => {
  render(
    <LiveSubmitDialog
      attemptsLeft={null}
      countdown={{ active: true, deadlineAt: Date.now() + 192_000, session: { serverClockOffsetMs: 0 } as LocalQuizAttemptSession }}
      onCancel={vi.fn()}
      onConfirm={vi.fn()}
      onJump={vi.fn()}
      submitting={false}
      summary={{ unanswered: [], flagged: [], answeredCount: 5 }}
    />,
  );
  expect(screen.getByText("Còn 03:12. Sau khi nộp không sửa được nữa.")).toBeInTheDocument();
});
