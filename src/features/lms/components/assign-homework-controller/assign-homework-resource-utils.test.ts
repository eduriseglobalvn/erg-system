import { describe, expect, it } from "vitest";

import {
  filterResourceTopics,
  formatSelectedResourceLabel,
} from "@/features/lms/components/assign-homework-controller/assign-homework-resource-utils";

const item = (title: string, topicLabel = "T") => ({
  title,
  activityLabel: "Luyện tập",
  topicLabel,
  kind: "train",
  durationLabel: "30 phút",
});

describe("filterResourceTopics", () => {
  const topics = [
    { id: "a", items: [item("Present simple"), item("Past tense")] },
    { id: "b", items: [item("Vocabulary", "Words")] },
  ];

  it("returns [] for undefined topics", () => {
    expect(filterResourceTopics(undefined, "")).toEqual([]);
  });
  it("keeps everything for an empty term", () => {
    expect(filterResourceTopics(topics, "")).toHaveLength(2);
  });
  it("filters items case-insensitively on the lowered term and drops empty topics", () => {
    const result = filterResourceTopics(topics, "past");
    expect(result.map((t) => t.id)).toEqual(["a"]);
    expect(result[0].items.map((i) => i.title)).toEqual(["Past tense"]);
  });
});

describe("formatSelectedResourceLabel", () => {
  it("formats 0, 1 and many", () => {
    expect(formatSelectedResourceLabel(0)).toBe("Chưa chọn bài");
    expect(formatSelectedResourceLabel(1)).toBe("1 bài đã chọn");
    expect(formatSelectedResourceLabel(3)).toBe("3 bài đã chọn");
  });
});
