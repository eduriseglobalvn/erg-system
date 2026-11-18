import { expect, it } from "vitest";

import { assignSubjectToClasses, removeSubjectFromClasses } from "./school-class-subjects-allocation";

const classIds = ["8A", "8B", "9A"];

it("keeps the level stored for another class and subject when saving", () => {
  const base = [
    { classId: "8A", subjectIds: ["ic3", "math"], levelIds: { ic3: "l3" } },
    { classId: "8B", subjectIds: ["math"] },
  ];
  const next = assignSubjectToClasses(base, { classIds, selectedClassIds: ["8B", "9A"], subjectId: "py", levelId: "p1" });
  expect(next).toEqual([
    { classId: "8A", subjectIds: ["ic3", "math"], levelIds: { ic3: "l3" } },
    { classId: "8B", subjectIds: ["math", "py"], levelIds: { py: "p1" } },
    { classId: "9A", subjectIds: ["py"], levelIds: { py: "p1" } },
  ]);
});

it("moves only the selected classes to a new level", () => {
  const base = [
    { classId: "8A", subjectIds: ["ic3"], levelIds: { ic3: "l3" } },
    { classId: "8B", subjectIds: ["ic3", "math"], levelIds: { ic3: "l1" } },
  ];
  expect(assignSubjectToClasses(base, { classIds, selectedClassIds: ["8B"], subjectId: "ic3", levelId: "l2" })).toEqual([
    { classId: "8A", subjectIds: ["ic3"], levelIds: { ic3: "l3" } },
    { classId: "8B", subjectIds: ["ic3", "math"], levelIds: { ic3: "l2" } },
  ]);
});

const stored: Parameters<typeof removeSubjectFromClasses>[0] = [
  { classId: "8A", subjectIds: ["ic3", "math"], levelIds: { ic3: "l3", math: "m1" } },
  { classId: "8B", subjectIds: ["ic3"], levelIds: { ic3: "l1" } },
];

it("removes a subject from one class without touching the others", () => {
  expect(removeSubjectFromClasses(stored, { classIds: ["8B"], subjectId: "ic3" })).toEqual([stored[0]]);
});

it("drops the subject for good when it is removed from every class", () => {
  expect(removeSubjectFromClasses(stored, { classIds: classIds, subjectId: "ic3" })).toEqual([
    { classId: "8A", subjectIds: ["math"], levelIds: { math: "m1" } },
  ]);
});

it("keeps the level of the other subjects in the same class", () => {
  const [first] = removeSubjectFromClasses(stored, { classIds: ["8A"], subjectId: "math" });
  expect(first).toEqual({ classId: "8A", subjectIds: ["ic3"], levelIds: { ic3: "l3" } });
});
