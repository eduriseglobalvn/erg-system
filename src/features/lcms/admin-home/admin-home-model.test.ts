import { describe, expect, it } from "vitest";

import type { EmployeeItem } from "@/lib/api/models/employee-management";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

import { buildAdminHomeSummary } from "./admin-home-model";

const school = (patch: Partial<PartnerSchool>): PartnerSchool => ({
  id: "s", code: "", name: "Trường", address: "", district: "", principal: "", contactPhone: "", contactEmail: "",
  academicYear: "", schoolType: "secondary", status: "active", joinedAt: "", classes: [], grades: [],
  subjects: [], reviews: [], ...patch,
});

const stats = (total: number, assigned: number) => ({ total, assigned, atRisk: 0, studying: total, profileComplete: total });

const person = (id: string, last: string | null): EmployeeItem => ({
  id, email: `${id}@erg`, fullName: id, status: "ACTIVE", roles: [], isProfileCompleted: true, last_login_at: last, createdAt: "",
});

describe("buildAdminHomeSummary", () => {
  it("leaves paused and archived schools out of counts and tasks", () => {
    const summary = buildAdminHomeSummary([school({ id: "a" }), school({ id: "p", status: "paused" }), school({ id: "x", status: "archived" })], new Map(), null);

    expect(summary.schools.map((row) => row.id)).toEqual(["a"]);
    expect(summary.schoolCount).toBe(1);
    expect(summary.tasks.some((task) => task.id.endsWith("-p") || task.id.endsWith("-x"))).toBe(false);
  });

  it("counts from the loaded detail and lists only real gaps", () => {
    const tcd = school({ id: "tcd", name: "THCS A", studentCount: 3, classCount: 1 });
    const vd = school({ id: "vd", name: "THCS B", status: "onboarding", studentCount: 0, classCount: 0 });
    const detail = school({
      ...tcd,
      studentStats: stats(3, 1),
      classes: [{ id: "c1", name: "9A1", grade: "9", homeroomTeacher: "Chưa phân công", studentCount: 3 }],
    });

    const summary = buildAdminHomeSummary([tcd, vd], new Map([["tcd", detail]]), { users: [person("a", null), person("b", "2026-11-03")], total: 14 });

    expect(summary).toMatchObject({ schoolCount: 2, activeSchoolCount: 1, studentCount: 3, classCount: 1, placedStudents: 1, staffCount: 14, staffNeverSignedIn: 1 });
    expect(summary.schools[0].placedRate).toBeCloseTo(1 / 3);
    expect(summary.schools[1].placedRate).toBeNull();
    expect(summary.tasks.map((task) => task.id)).toEqual(["empty-vd", "unplaced", "no-teacher", "staff-idle"]);
    expect(summary.tasks[1].title).toBe("2 học sinh chưa được xếp môn");
  });

  it("has no tasks when everything is in place", () => {
    const ready = school({ id: "r", studentStats: stats(1, 1), classes: [{ id: "c", name: "6A", grade: "6", homeroomTeacher: "Cô Mai", studentCount: 1 }] });
    const summary = buildAdminHomeSummary([ready], new Map([["r", ready]]), { users: [person("a", "2026-11-01")], total: 1 });
    expect(summary.tasks).toEqual([]);
  });
});
