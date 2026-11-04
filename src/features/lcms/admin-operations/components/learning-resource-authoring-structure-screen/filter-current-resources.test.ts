import { describe, expect, it } from "vitest";

import { filterCurrentResources } from "@/features/lcms/admin-operations/components/learning-resource-authoring-structure-screen/filter-current-resources";
import type { LearningResourceResourceCard } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import type { StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

const card = (o: Record<string, string | undefined>) => ({ id: "r", ...o }) as unknown as LearningResourceResourceCard;
const subject = { id: "s1" } as unknown as StudioSubject;
const node = (o: Record<string, unknown>) => ({ location: { sectionId: "x", topicId: "t" }, ...o }) as unknown as StudioNode;

describe("filterCurrentResources", () => {
  const all = [
    card({ id: "a", subjectId: "s1" }),
    card({ id: "b", subjectId: "s1", categoryId: "c1" }),
    card({ id: "c", subjectId: "s1", sectionId: "sec1" }),
    card({ id: "d", subjectId: "s2", sectionId: "sec1" }),
  ];
  const ids = (list: LearningResourceResourceCard[]) => list.map((r) => r.id);

  it("returns nothing without a subject", () => {
    expect(filterCurrentResources(all, undefined, undefined)).toEqual([]);
  });
  it("without node keeps only uncategorised subject resources", () => {
    expect(ids(filterCurrentResources(all, subject, undefined))).toEqual(["a"]);
  });
  it("lesson/section/topic match by section option id", () => {
    expect(ids(filterCurrentResources(all, subject, node({ kind: "lesson", optionId: "sec1" })))).toEqual(["c"]);
  });
  it("group matches category without section", () => {
    expect(ids(filterCurrentResources(all, subject, node({ kind: "group", optionId: "c1" })))).toEqual(["b"]);
  });
  it("other kinds match nothing", () => {
    expect(filterCurrentResources(all, subject, node({ kind: "category" }))).toEqual([]);
  });
});
