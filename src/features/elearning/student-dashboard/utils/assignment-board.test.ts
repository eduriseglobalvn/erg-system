import { describe, expect, it } from "vitest";

import {
  beforeDueLabel, dueChip, dueClock, groupSummary, groupTodo, overdueAgo, percentBand, pickResume, scoreBand, submittedStats, todoHeadline,
} from "@/features/elearning/student-dashboard/utils/assignment-board";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

// Thursday 12/11/2026 16:00 local.
const NOW = new Date(2026, 10, 12, 16, 0).getTime();
const at = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m).toISOString();
const make = (id: string, extra: Partial<StudentDashboardAssignment> = {}): StudentDashboardAssignment => ({
  id, title: id, status: "not_started", statusLabel: "", progressRate: null, answeredCount: null, totalQuestions: null, score: null, maxScore: null, dueLabel: "", attempts: [], ...extra,
});

describe("assignment board", () => {
  const todo = [
    make("a", { dueAt: at(12, 20), xpReward: 50, status: "in_progress", answeredCount: 12, totalQuestions: 20 }),
    make("b", { dueAt: at(12, 20), xpReward: 40 }),
    make("c", { dueAt: at(13, 21), xpReward: 30 }),
    make("d", { dueAt: at(16, 21), xpReward: 25 }),
    make("e", { dueAt: at(30, 21), xpReward: 10 }),
    make("f", { xpReward: 5 }),
  ];

  it("groups into HÔM NAY / TUẦN NÀY / SAU NÀY with XP totals", () => {
    const groups = groupTodo(todo, NOW);
    expect(groups.map((g) => [g.label, g.items.map((a) => a.id), g.xp])).toEqual([
      ["HÔM NAY", ["a", "b"], 90], ["TUẦN NÀY", ["c", "d"], 55], ["SAU NÀY", ["e", "f"], 15],
    ]);
    expect(groupSummary(groups[0])).toBe("2 bài · +90 XP");
    expect(groupSummary({ items: [todo[1]], xp: 40 })).toBe("+40 XP");
  });

  it("writes the page headline and picks the resume card", () => {
    expect(todoHeadline(todo.slice(0, 4), NOW)).toBe("Thứ Năm, 12/11 · 4 bài cần làm · làm xong nhận tới +145 XP");
    expect(pickResume(todo)?.id).toBe("a");
    expect(pickResume([todo[1]])).toBeUndefined();
  });

  it("formats due chips and clocks", () => {
    expect(dueChip(todo[0], NOW)).toEqual({ text: "Còn 4 giờ", tone: "warn" });
    expect(dueChip(todo[2], NOW)).toEqual({ text: "Còn 1 ngày", tone: "muted" });
    expect(dueChip(todo[3], NOW)).toEqual({ text: "Còn 4 ngày", tone: "muted" });
    expect(dueClock(todo[0], NOW)).toBe("20:00 hôm nay");
    expect(dueClock(todo[2], NOW)).toBe("21:00 ngày mai");
    expect(dueClock(todo[3], NOW)).toBe("Thứ Hai 16/11");
  });

  it("bands scores: >=8 ok, 5-8 primary, <5 error", () => {
    expect(scoreBand(95, 100)).toBe("ok");
    expect(scoreBand(80, 100)).toBe("ok");
    expect(scoreBand(72.5, 100)).toBe("primary");
    expect(scoreBand(5, 10)).toBe("primary");
    expect(scoreBand(45, 100)).toBe("error");
    expect([95, 73, 45].map(percentBand)).toEqual(["ok", "primary", "warning"]);
  });

  it("formats before-due and overdue spans", () => {
    expect(beforeDueLabel({ onTime: true, minutesBeforeDue: 5760 })).toEqual({ late: false, text: "Trước hạn 4 ngày" });
    expect(beforeDueLabel({ onTime: true, minutesBeforeDue: 60 })?.text).toBe("Trước hạn 1 giờ");
    expect(beforeDueLabel({ onTime: true, minutesBeforeDue: 20 })?.text).toBe("Trước hạn 20 phút");
    expect(beforeDueLabel({ onTime: false, minutesBeforeDue: -30 })).toEqual({ late: true, text: "Trễ 30 phút" });
    expect(beforeDueLabel({ onTime: null, minutesBeforeDue: null })).toBeNull();
    expect(overdueAgo(make("x", { dueAt: at(10, 21) }), NOW)).toBe("Quá 1 ngày");
    expect(overdueAgo(make("x", { dueAt: at(7, 8) }), NOW)).toBe("Quá 5 ngày");
  });

  it("summarises submitted work and hides what the server did not send", () => {
    const rows = [
      make("s1", { score: 95, maxScore: 100, correctCount: 19, totalQuestions: 20, onTime: true }),
      make("s2", { score: 45, maxScore: 100, correctCount: 9, totalQuestions: 20, onTime: true }),
    ];
    const stats = submittedStats(rows);
    expect(stats).toMatchObject({ averageTen: "7", count: 2, correct: { right: 28, total: 40 }, onTime: { done: 2, total: 2 } });
    expect(stats.best?.id).toBe("s1");
    const hidden = submittedStats([make("s3", { score: 8, maxScore: 10 })]);
    expect(hidden.correct).toBeNull();
    expect(hidden.onTime).toBeNull();
  });
});
