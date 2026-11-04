import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { PlayerCountdown } from "@/components/quiz/player-countdown";
import type { LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";

const session = { serverClockOffsetMs: 0 } as LocalQuizAttemptSession;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 4, 10, 0, 0));
});
afterEach(() => vi.useRealTimers());

test("counts down each second and reports expiry exactly once", () => {
  const onExpiredChange = vi.fn();
  render(
    <PlayerCountdown active deadlineAt={Date.now() + 3000} onExpiredChange={onExpiredChange} session={session}>
      {(s) => <span data-testid="t">{s}</span>}
    </PlayerCountdown>,
  );
  expect(screen.getByTestId("t").textContent).toBe("3");
  act(() => { vi.advanceTimersByTime(2000); });
  expect(screen.getByTestId("t").textContent).toBe("1");
  expect(onExpiredChange).not.toHaveBeenLastCalledWith(true);
  act(() => { vi.advanceTimersByTime(5000); });
  expect(screen.getByTestId("t").textContent).toBe("0");
  expect(onExpiredChange.mock.calls.filter(([expired]) => expired === true)).toHaveLength(1);
});

test("renders nothing when inactive", () => {
  render(
    <PlayerCountdown active={false} deadlineAt={Date.now() + 3000} onExpiredChange={() => {}} session={session}>
      {(s) => <span data-testid="t">{s}</span>}
    </PlayerCountdown>,
  );
  expect(screen.queryByTestId("t")).toBeNull();
});

test("localClock counts down from the device clock when the session has no server offset", () => {
  const onExpiredChange = vi.fn();
  const offline = {} as LocalQuizAttemptSession;
  const { rerender } = render(
    <PlayerCountdown active deadlineAt={Date.now() + 3000} onExpiredChange={onExpiredChange} session={offline}>
      {(s) => <span data-testid="t">{s}</span>}
    </PlayerCountdown>,
  );
  expect(screen.queryByTestId("t")).toBeNull();
  rerender(
    <PlayerCountdown active localClock deadlineAt={Date.now() + 3000} onExpiredChange={onExpiredChange} session={offline}>
      {(s) => <span data-testid="t">{s}</span>}
    </PlayerCountdown>,
  );
  expect(screen.getByTestId("t").textContent).toBe("3");
  act(() => { vi.advanceTimersByTime(4000); });
  expect(screen.getByTestId("t").textContent).toBe("0");
  expect(onExpiredChange).toHaveBeenLastCalledWith(true);
});
