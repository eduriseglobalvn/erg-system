import type { EditableCurriculumRow, TopicGroup } from "./types";

export function buildTopicGroups(rows: EditableCurriculumRow[]) {
  const groups: TopicGroup[] = [];
  rows.forEach((row, index) => {
    if (index === 0 || row.topic !== rows[index - 1]?.topic) {
      groups.push({ topic: row.topic, start: index, end: index + 1, count: 1 });
    } else {
      const current = groups[groups.length - 1];
      current.end = index + 1;
      current.count += 1;
    }
  });
  return groups;
}

export function generateTopicCode(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "topic"}-${Math.random().toString(36).substring(2, 6)}`;
}

export function cleanTaxonomyId(id: string): string {
  return id.replace(/^(lesson|topic|group-category|group|category|level)-/, "");
}
