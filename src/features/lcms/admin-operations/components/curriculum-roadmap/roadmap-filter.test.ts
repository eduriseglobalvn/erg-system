import { describe, expect, it } from "vitest";

import {
  countRoadmapTotals,
  filterRoadmapStages,
  normalizeRoadmapQuery,
} from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-filter";
import type {
  CurriculumFolder,
  CurriculumRoadmapStage,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

const folder = (id: string, title: string): CurriculumFolder => ({
  id,
  role: "topic",
  title,
  target: { type: "node", id },
  pathLabels: [],
  summary: {
    levels: 0, topics: 0, lectures: 0, documents: 0, exercises: 0, totalContent: 0, published: 0, draft: 0, hidden: 0,
  },
});

const stages: CurriculumRoadmapStage[] = [
  {
    level: folder("l1", "Chặng Một"),
    topics: [
      { id: "t1", title: "Khí hậu", lessons: [{ folder: folder("a", "Bài 1 Gió mùa"), content: [] }, { folder: folder("b", "Bài 2 Bão"), content: [] }] },
      { id: "t2", title: "Sông ngòi", lessons: [] },
    ],
  },
  { level: folder("l2", "Chặng Hai"), topics: [] },
];

describe("roadmap filter", () => {
  it("normalizes the query with trim and Vietnamese lowercase", () => {
    expect(normalizeRoadmapQuery("  KHÍ Hậu ")).toBe("khí hậu");
  });

  it("returns every stage for an empty query", () => {
    expect(filterRoadmapStages(stages, "")).toEqual(stages);
  });

  it("keeps only matching lessons and prunes empty topics and stages", () => {
    const result = filterRoadmapStages(stages, "bão");
    expect(result).toHaveLength(1);
    expect(result[0].topics.map((t) => t.id)).toEqual(["t1"]);
    expect(result[0].topics[0].lessons.map((l) => l.folder.id)).toEqual(["b"]);
  });

  it("keeps a topic whose own title matches even with no matching lessons", () => {
    const result = filterRoadmapStages(stages, "sông");
    expect(result[0].topics.map((t) => t.id)).toEqual(["t2"]);
  });

  it("keeps a stage whose title matches", () => {
    expect(filterRoadmapStages(stages, "chặng hai").map((s) => s.level.id)).toEqual(["l2"]);
  });

  it("counts topics and lessons", () => {
    expect(countRoadmapTotals(stages)).toEqual({ topics: 2, lessons: 2 });
  });
});
