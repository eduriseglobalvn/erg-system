import type { CurriculumRoadmapTopic } from "@/features/lcms/admin-operations/utils/curriculum-view-model/types";

export function extractTopicTitleOrder(title: string): number {
  const normalized = title.trim().toLowerCase();
  const match = normalized.match(/(?:chủ đề|chu de|topic|chương|chuong|phần|phan)\s*(\d+)/i);
  if (match) return parseInt(match[1], 10);
  const anyNum = normalized.match(/^(\d+)[\.:\-\s]/);
  if (anyNum) return parseInt(anyNum[1], 10);
  return 999999;
}

export function extractTopicLessonOrder(topic: { lessons?: Array<{ folder?: { title?: string }; title?: string }> }): number {
  if (!topic.lessons || topic.lessons.length === 0) return 999999;
  let minOrder = 999999;
  for (const lesson of topic.lessons) {
    const key = extractLessonSortKey(lesson.folder?.title || lesson.title || "");
    const lessonVal = key.typeOrder * 10000 + key.num * 10 + key.subNum;
    if (lessonVal < minOrder) {
      minOrder = lessonVal;
    }
  }
  return minOrder;
}

export function compareCurriculumTopics(
  a: CurriculumRoadmapTopic,
  b: CurriculumRoadmapTopic,
  originalIndexMap: Map<string, number>,
): number {
  // Tier 0: Explicit DB / Taxonomy sortOrder (positive integer)
  const sortA = a.sortOrder ?? (a.node?.metadata?.sortOrder ? parseInt(a.node.metadata.sortOrder, 10) : undefined);
  const sortB = b.sortOrder ?? (b.node?.metadata?.sortOrder ? parseInt(b.node.metadata.sortOrder, 10) : undefined);
  if (sortA != null && sortB != null && !isNaN(sortA) && !isNaN(sortB) && sortA > 0 && sortB > 0 && sortA !== sortB) {
    return sortA - sortB;
  }

  // Tier 1: Lesson progression order (starts with Bài 1 vs Bài 8 vs Bài 15)
  const lessonOrderA = extractTopicLessonOrder(a);
  const lessonOrderB = extractTopicLessonOrder(b);
  if (lessonOrderA !== 999999 && lessonOrderB !== 999999 && lessonOrderA !== lessonOrderB) {
    return lessonOrderA - lessonOrderB;
  }

  // Tier 2: Topic title number (Chủ đề 1 vs Chủ đề 2)
  const titleOrderA = extractTopicTitleOrder(a.title);
  const titleOrderB = extractTopicTitleOrder(b.title);
  if (titleOrderA !== 999999 && titleOrderB !== 999999 && titleOrderA !== titleOrderB) {
    return titleOrderA - titleOrderB;
  }

  // Tier 3: If one has lessons and the other doesn't
  if (lessonOrderA !== lessonOrderB) {
    return lessonOrderA - lessonOrderB;
  }

  // Tier 4: Original DB tree insertion order
  const idxA = originalIndexMap.get(a.id) ?? 999999;
  const idxB = originalIndexMap.get(b.id) ?? 999999;
  if (idxA !== idxB) {
    return idxA - idxB;
  }

  // Tier 5: Natural Vietnamese title comparison
  return a.title.localeCompare(b.title, "vi", { numeric: true });
}

export function extractLessonSortKey(title: string): { typeOrder: number; num: number; subNum: number; raw: string } {
  const normalized = title.trim().toLowerCase();

  // 1. Regular lessons: "Bài X", "Tiết X", "Lesson X"
  const baiMatch = normalized.match(/(?:bài|tiết|bai|tiet|lesson)\s*(\d+)/i);
  if (baiMatch) {
    const subMatch = normalized.match(/\((\d+)\)/);
    return {
      typeOrder: 1,
      num: parseInt(baiMatch[1], 10),
      subNum: subMatch ? parseInt(subMatch[1], 10) : 0,
      raw: normalized,
    };
  }

  // 2. Review lessons: "Ôn tập X"
  const onTapMatch = normalized.match(/(?:ôn tập|on tap|review)\s*(\d+)?/i);
  if (onTapMatch) {
    return {
      typeOrder: 2,
      num: onTapMatch[1] ? parseInt(onTapMatch[1], 10) : 1,
      subNum: 0,
      raw: normalized,
    };
  }

  // 3. Practice / Exam lessons: "Luyện thi X", "Kiểm tra X", "Practice X"
  const luyenThiMatch = normalized.match(/(?:luyện thi|luyen thi|kiểm tra|kiem tra|practice|exam)\s*(\d+)?/i);
  if (luyenThiMatch) {
    return {
      typeOrder: 3,
      num: luyenThiMatch[1] ? parseInt(luyenThiMatch[1], 10) : 1,
      subNum: 0,
      raw: normalized,
    };
  }

  // 4. Any other with numbers
  const anyNumMatch = normalized.match(/(\d+)/);
  if (anyNumMatch) {
    return {
      typeOrder: 4,
      num: parseInt(anyNumMatch[1], 10),
      subNum: 0,
      raw: normalized,
    };
  }

  return {
    typeOrder: 5,
    num: 999999,
    subNum: 0,
    raw: normalized,
  };
}

export function sortCurriculumLessons<T extends { title?: string; folder?: { title?: string } }>(lessons: T[]): T[] {
  return [...lessons].sort((a, b) => {
    const titleA = a.folder?.title || a.title || "";
    const titleB = b.folder?.title || b.title || "";
    const keyA = extractLessonSortKey(titleA);
    const keyB = extractLessonSortKey(titleB);

    if (keyA.typeOrder !== keyB.typeOrder) {
      return keyA.typeOrder - keyB.typeOrder;
    }
    if (keyA.num !== keyB.num) {
      return keyA.num - keyB.num;
    }
    if (keyA.subNum !== keyB.subNum) {
      return keyA.subNum - keyB.subNum;
    }
    return titleA.localeCompare(titleB, "vi", { numeric: true });
  });
}
