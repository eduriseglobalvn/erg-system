import { describe, expect, it } from "vitest";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { repeatSummary } from "../schedule-grid/schedule-info-bar";
import { daysInRange, deleteImpact, rangeChunks, teacherList } from "./bulk-delete-model";
import { rangeError } from "./range-delete-dialog";

describe("bulk delete model", () => {
  it("splits a range into workspace-sized pieces with both ends included", () => {
    const chunks = rangeChunks("2026-01-01", "2026-03-01");
    expect(chunks).toEqual([{ from: "2026-01-01", to: "2026-02-11" }, { from: "2026-02-12", to: "2026-03-01" }]);
    expect(chunks.every((chunk) => daysInRange(chunk.from, chunk.to) <= 42)).toBe(true);
    expect(rangeChunks("2026-05-05", "2026-05-05")).toEqual([{ from: "2026-05-05", to: "2026-05-05" }]);
  });

  it("counts past periods and lists each teacher once", () => {
    const event = (id: string, startAt: string, names: string[]) => ({ id, startAt, teachers: names.map((displayName, index) => ({ displayName, role: index ? "ASSISTANT" : "MAIN", userId: displayName })) }) as unknown as TeachingCalendarEvent;
    const impact = deleteImpact([event("1", "2026-11-01T01:00:00Z", ["Cô B", "Thầy A"]), event("2", "2026-12-01T01:00:00Z", ["Cô B"])], Date.parse("2026-11-26T00:00:00Z"));
    expect(impact).toEqual({ past: 1, teachers: ["Cô B", "Thầy A"], total: 2 });
    expect(teacherList(["A", "B", "C", "D", "E"])).toBe("A, B, C và 2 người khác");
  });

  it("rejects ranges the backend refuses", () => {
    expect(rangeError("2026-12-01", "2026-11-01")).not.toBe("");
    expect(rangeError("2026-01-01", "2027-01-02")).toBe("Mỗi lần xoá tối đa 1 năm.");
    expect(rangeError("2026-01-01", "2026-12-31")).toBe("");
  });

  it("spells out the repeat weeks and the session count", () => {
    expect(repeatSummary("2026-11-30", "2026-12-06", 12)).toBe("Lặp 1 tuần: Thứ 2, 30/11 → Chủ nhật, 06/12/2026 · 12 tiết/tuần → 12 buổi");
    expect(repeatSummary("2026-11-30", "2026-12-20", 4)).toContain("Lặp 3 tuần");
    expect(repeatSummary("", "2026-12-20", 4)).toBe("");
  });
});
