import { describe, expect, it } from "vitest";

import { buildScheduleDraft, calculateInclusiveRepeatWeeks } from "./schedule-draft";

describe("schedule draft model", () => {
  it("maps a valid authoring form to the backend draft contract", () => {
    expect(buildScheduleDraft({
      applyFrom: "2026-07-13",
      note: "Tuần đầu",
      repeatWeeks: 1,
      rows: [{
        assistantTeacherId: "",
        classId: "class-a",
        endTime: "09:30",
        id: "row-1",
        mainTeacherId: "teacher-a",
        periodCount: "2",
        periodStart: "1",
        startTime: "08:00",
        subjectId: "subject-a",
        weekday: 1,
      }],
      schoolId: "school-a",
    }, {
      assistantTeachers: [], classes: [], levels: [], rooms: [],
      schools: [{ id: "school-a", name: "Trường A" }], subjects: [], teachers: [],
    })).toMatchObject({
      applyFrom: "2026-07-13",
      repeatWeeks: 1,
      rows: [{ clientRowId: "row-1", mainTeacherIds: ["teacher-a"], weekday: 1 }],
      schoolId: "school-a",
    });
  });

  it("rejects an unknown school and calculates inclusive weeks", () => {
    expect(() => buildScheduleDraft({ applyFrom: "2026-07-13", repeatWeeks: 1, rows: [], schoolId: "missing" }, {
      assistantTeachers: [], classes: [], levels: [], rooms: [], schools: [], subjects: [], teachers: [],
    })).toThrow("Dữ liệu lịch chưa đầy đủ.");
    expect(calculateInclusiveRepeatWeeks("2026-07-13", "2026-07-26")).toBe(2);
  });
});
