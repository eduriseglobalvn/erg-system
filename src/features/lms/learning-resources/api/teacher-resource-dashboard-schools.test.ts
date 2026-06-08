import { expect, test } from "vitest";

import type { LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import { buildManagedSchoolsFromUnits } from "@/features/lms/learning-resources/api/teacher-resource-dashboard-api";

test("falls back to mock schools when api units are missing", () => {
  const schools = buildManagedSchoolsFromUnits([]);

  expect(schools.length).toBeGreaterThan(0);
  expect((schools[0]?.name.length ?? 0) > 0).toBe(true);
});

test("maps non-system education units into managed schools", () => {
  const units: LmsEducationUnitDTO[] = [
    { id: "erg-system", type: "system", name: "ERG System" },
    { id: "school-1", type: "school", name: "Truong A" },
    { id: "center-1", type: "center", name: "Trung tam B" },
  ];

  const schools = buildManagedSchoolsFromUnits(units);

  expect(schools.map((item) => ({ id: item.id, name: item.name, principal: item.principal }))).toEqual([
    { id: "school-1", name: "Truong A", principal: "Quản trị trường" },
    { id: "center-1", name: "Trung tam B", principal: "Quản trị trung tâm" },
  ]);
});
