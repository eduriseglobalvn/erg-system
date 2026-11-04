type SearchableItem = {
  title: string;
  activityLabel: string;
  topicLabel: string;
  kind: string;
  durationLabel: string;
};

export function filterResourceTopics<T extends { items: SearchableItem[] }>(
  topics: T[] | undefined,
  resourceSearchTerm: string,
): T[] {
  return (
    topics
      ?.map((topic) => ({
        ...topic,
        items: topic.items.filter((item) =>
          [item.title, item.activityLabel, item.topicLabel, item.kind, item.durationLabel]
            .join(" ")
            .toLowerCase()
            .includes(resourceSearchTerm),
        ) as T["items"],
      }))
      .filter((topic) => topic.items.length > 0) ?? []
  );
}

export function formatSelectedResourceLabel(selectedResourceCount: number) {
  return selectedResourceCount === 0
    ? "Chưa chọn bài"
    : selectedResourceCount === 1
      ? "1 bài đã chọn"
      : `${selectedResourceCount} bài đã chọn`;
}
