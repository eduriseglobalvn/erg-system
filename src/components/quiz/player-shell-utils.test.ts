import { describe, expect, test } from "vitest";

import { attemptDeadlineMs, serverNowMs } from "@/components/quiz/player-shell-utils";

describe("quiz player server clock policy", () => {
  test("derives current server time from the persisted response offset", () => {
    expect(serverNowMs({ serverClockOffsetMs: 2_000 }, 10_000)).toBe(12_000);
    expect(serverNowMs({ serverClockOffsetMs: Number.NaN }, 10_000)).toBeNull();
  });

  test("prefers the backend deadline and only derives from a server start timestamp", () => {
    expect(attemptDeadlineMs({
      deadlineAt: "2026-06-19T01:30:00.000Z",
      serverStartedAt: "2026-06-19T01:00:00.000Z",
      serverClockOffsetMs: 0,
    }, 600)).toBe(Date.parse("2026-06-19T01:30:00.000Z"));
    expect(attemptDeadlineMs({
      serverStartedAt: "2026-06-19T01:00:00.000Z",
      serverClockOffsetMs: 0,
    }, 600)).toBe(Date.parse("2026-06-19T01:10:00.000Z"));
    expect(attemptDeadlineMs({ serverClockOffsetMs: 0 }, 600)).toBeNull();
  });
});

describe("portable/offline local timer", () => {
  const session = { startedAt: "2026-06-19T01:00:00.000Z" };

  test("uses the locally stored start time only when asked to", () => {
    expect(attemptDeadlineMs(session, 600)).toBeNull();
    expect(attemptDeadlineMs(session, 600, true)).toBe(Date.parse("2026-06-19T01:10:00.000Z"));
  });

  test("server data still wins over the local start", () => {
    expect(attemptDeadlineMs({ ...session, deadlineAt: "2026-06-19T01:30:00.000Z" }, 600, true)).toBe(Date.parse("2026-06-19T01:30:00.000Z"));
  });

  test("no deadline without a time limit or with a corrupt start", () => {
    expect(attemptDeadlineMs(session, 0, true)).toBeNull();
    expect(attemptDeadlineMs({ startedAt: "nope" }, 600, true)).toBeNull();
  });

  test("local clock is opt-in; a server offset always wins", () => {
    expect(serverNowMs({}, 5_000)).toBeNull();
    expect(serverNowMs({}, 5_000, true)).toBe(5_000);
    expect(serverNowMs({ serverClockOffsetMs: 100 }, 5_000, true)).toBe(5_100);
  });
});
