import { describe, expect, it } from "vitest";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-api";
import { focusLessonId, periodLabel } from "./lms-home-mobile";

const lesson = (id: string, startTime: string, endTime: string) => ({ id, startTime, endTime }) as TeachingCalendarEvent;

describe("teacher mobile home helpers", () => {
  it("labels single and multi-period lessons and skips unknown periods", () => {
    expect(periodLabel({ periodStart: 1, periodCount: 2 })).toBe("T1–2");
    expect(periodLabel({ periodStart: 3, periodCount: 1 })).toBe("T3");
    expect(periodLabel({ periodStart: 0, periodCount: 0 })).toBe("");
  });

  it("focuses the running lesson, then the next one, then the last one", () => {
    const lessons = [lesson("a", "07:30", "09:00"), lesson("b", "09:35", "10:20")];
    expect(focusLessonId(lessons, "08:00")).toBe("a");
    expect(focusLessonId(lessons, "09:10")).toBe("b");
    expect(focusLessonId(lessons, "15:00")).toBe("b");
    expect(focusLessonId([], "08:00")).toBeUndefined();
  });
});
