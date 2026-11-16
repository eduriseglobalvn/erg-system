import { describe, expect, it, vi } from "vitest";

import { createOfflineTeachingCommandAdapter } from "@/features/lms/offline-teaching";
import { MemoryOfflineOutboxStore } from "@/platform/offline";

import { attendanceRows } from "./attendance-export";
import { attendanceCommand, attendanceOfflinePolicy, classifyReplayError } from "./attendance-offline";
import {
  buildSaveInput,
  countMarks,
  groupPeriods,
  initialMarks,
  markFromKey,
  periodRangeLabel,
  ppctLag,
  shortDateLabel,
  saveIdempotencyKey,
  type LessonLogPeriod,
} from "./attendance-model";

const period = (periodNo: number, over: Partial<LessonLogPeriod> = {}): LessonLogPeriod => ({
  absentees: [],
  actualPeriod: 10 + periodNo,
  classId: "c1",
  className: "6A4",
  comment: null,
  date: "2026-11-12",
  eventId: "e1",
  happened: true,
  late: false,
  lessonTitle: null,
  periodNo,
  ppctPeriod: 10 + periodNo,
  status: "PENDING",
  subjectName: "Tin học",
  version: 0,
  ...over,
});

const students = [{ id: "s1", name: "An" }, { id: "s2", name: "Bình" }, { id: "s3", name: "Chi" }];

describe("attendance model", () => {
  it("maps keys 1-4 to the four marks and ignores the rest", () => {
    expect(["1", "2", "3", "4"].map(markFromKey)).toEqual(["present", "late", "absentUnexcused", "absentExcused"]);
    expect(markFromKey("5")).toBeNull();
    expect(markFromKey("a")).toBeNull();
  });

  it("defaults to present and reads absences back from the log", () => {
    const marks = initialMarks(students, [{ excused: true, shortName: "An", studentId: "s1" }, { excused: false, shortName: "Chi", studentId: "s3" }]);
    expect(marks).toEqual({ s1: "absentExcused", s2: "present", s3: "absentUnexcused" });
    expect(countMarks(students, marks)).toEqual({ absentExcused: 1, absentUnexcused: 1, late: 0, present: 1 });
  });

  it("merges consecutive periods of one event into a rail card", () => {
    const groups = groupPeriods([period(2), period(1), period(5, { eventId: "e2" }), period(4, { eventId: "e1" })]);
    expect(groups.map((group) => group.periods.map((item) => item.periodNo))).toEqual([[1, 2], [4], [5]]);
    expect(periodRangeLabel(groups[0].periods)).toBe("Tiết 1–2");
    expect(periodRangeLabel(groups[1].periods)).toBe("Tiết 4");
  });

  it("builds the save input with API statuses, trimmed comment and the loaded version", () => {
    const input = buildSaveInput(period(1, { version: 3 }), students, { s1: "late", s2: "absentExcused" }, { actualPeriod: 8, comment: "  ok  " });
    expect(input).toMatchObject({ actualPeriod: 8, comment: "ok", expectedVersion: 3, periodNo: 1 });
    expect(input.records).toEqual([
      { status: "LATE", studentId: "s1" },
      { status: "EXCUSED", studentId: "s2" },
      { status: "PRESENT", studentId: "s3" },
    ]);
    expect(buildSaveInput(period(1), students, {}, { actualPeriod: 1, comment: " " })).not.toHaveProperty("comment");
  });

  it("reports PPCT lag as positive when teaching behind", () => {
    expect(ppctLag({ actualPeriod: 8, ppctPeriod: 10 })).toBe(2);
    expect(ppctLag({ actualPeriod: 10, ppctPeriod: 10 })).toBe(0);
  });

  it("keys the outbox by event+date+period and changes only when the content does", () => {
    const base = buildSaveInput(period(1), students, {}, { actualPeriod: 1, comment: "" });
    const same = saveIdempotencyKey(base);
    expect(same.startsWith("attendance-log:e1:2026-11-12:1:")).toBe(true);
    expect(saveIdempotencyKey({ ...base })).toBe(same);
    expect(saveIdempotencyKey({ ...base, actualPeriod: 2 })).not.toBe(same);
  });
});

describe("attendance labels and export", () => {
  it("labels the weekday without shifting the day", () => {
    expect(shortDateLabel("2026-11-12")).toBe("Thứ 5 12/11");
    expect(shortDateLabel("2026-11-15")).toBe("Chủ nhật 15/11");
    expect(shortDateLabel("bad")).toBe("");
  });

  it("exports one row per student with the board labels and neutralises formulas", () => {
    const rows = attendanceRows([{ id: "a", name: "=cmd" }, { id: "b", name: "Bình" }], { a: "absentUnexcused" });
    expect(rows[0]).toEqual(["STT", "Học sinh", "Trạng thái"]);
    expect(rows[1]).toEqual([1, "'=cmd", "Vắng K"]);
    expect(rows[2]).toEqual([2, "Bình", "Có mặt"]);
  });
});

describe("attendance offline outbox", () => {
  const scope = { accountId: "teacher-a", tenantId: "tenant-a" };
  const input = buildSaveInput(period(1), students, { s2: "absentUnexcused" }, { actualPeriod: 11, comment: "" });
  const make = (online: boolean) => createOfflineTeachingCommandAdapter({
    capability: attendanceOfflinePolicy(scope),
    isOnline: () => online,
    scope: { ...scope, workspace: "TEACHER" },
    store: new MemoryOfflineOutboxStore(),
  });

  it("queues the save when offline and does not call the server", async () => {
    const adapter = make(false);
    const send = vi.fn();
    const result = await adapter.execute({ ...attendanceCommand(input), send });
    expect(result.status).toBe("pending");
    expect(send).not.toHaveBeenCalled();
    expect(await adapter.list()).toHaveLength(1);
  });

  it("sends once online and replays a queued save exactly once", async () => {
    const adapter = make(false);
    await adapter.execute({ ...attendanceCommand(input), send: vi.fn() });
    const send = vi.fn().mockResolvedValue({ kind: "succeeded" });
    await adapter.replay(send, { isOnline: () => true });
    await adapter.replay(send, { isOnline: () => true });
    expect(send).toHaveBeenCalledTimes(1);

    const online = make(true);
    const direct = vi.fn().mockResolvedValue({ version: 1 });
    expect(await online.execute({ ...attendanceCommand(input), send: direct })).toMatchObject({ status: "confirmed" });
    expect(direct).toHaveBeenCalledTimes(1);
    expect(await online.list()).toHaveLength(0);
  });

  it("stops queued saves that the server will never accept", () => {
    const mutation = { entityId: "e", entityType: "t", idempotencyKey: "k", operationId: "o" };
    expect(classifyReplayError(new Error("net"), mutation).kind).toBe("retry");
  });
});
