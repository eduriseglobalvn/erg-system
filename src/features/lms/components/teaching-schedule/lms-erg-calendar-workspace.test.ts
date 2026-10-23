import { describe, expect, it } from "vitest";

import type { ErgCalendarVisibleRange } from "@/components/shared/erg-calendar-workspace";

import { createLmsCalendarWorkspaceInput } from "./lms-erg-calendar-workspace";

const baseRange: ErgCalendarVisibleRange = {
  activeLane: "Tất cả",
  from: "2026-08-01",
  mode: "schedule",
  selectedScopeId: "",
  selectedScopeLabel: "",
  to: "2026-08-31",
};

describe("createLmsCalendarWorkspaceInput", () => {
  it("uses the selected class only for the aggregate calendar", () => {
    expect(createLmsCalendarWorkspaceInput({
      selectedClass: { id: "class-alpha", schoolId: "school-alpha" },
      tenantId: "tenant-erg",
      visibleRange: baseRange,
    })).toMatchObject({
      classIds: ["class-alpha"],
      schoolIds: ["school-alpha"],
      subjectIds: undefined,
      viewMode: "ALL",
    });
  });

  it("does not combine a school filter with an unrelated selected class", () => {
    expect(createLmsCalendarWorkspaceInput({
      selectedClass: { id: "class-alpha", schoolId: "school-alpha" },
      tenantId: "tenant-erg",
      visibleRange: {
        ...baseRange,
        activeLane: "Lịch theo trường",
        selectedScopeId: "school-beta",
        selectedScopeLabel: "Trường Beta",
      },
    })).toMatchObject({
      classIds: undefined,
      schoolIds: ["school-beta"],
      subjectIds: undefined,
      viewMode: "BY_SCHOOL",
    });
  });

  it("does not combine a subject filter with class or school constraints", () => {
    expect(createLmsCalendarWorkspaceInput({
      selectedClass: { id: "class-alpha", schoolId: "school-alpha" },
      tenantId: "tenant-erg",
      visibleRange: {
        ...baseRange,
        activeLane: "Lịch theo môn",
        selectedScopeId: "subject-it",
        selectedScopeLabel: "Tin học",
      },
    })).toMatchObject({
      classIds: undefined,
      schoolIds: undefined,
      subjectIds: ["subject-it"],
      viewMode: "BY_SUBJECT",
    });
  });
});
