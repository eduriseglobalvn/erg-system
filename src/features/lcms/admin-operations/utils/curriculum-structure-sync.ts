export interface ExistingLessonInfo {
  id: string;
  title: string;
}

export interface ExistingTopicInfo {
  id: string;
  title: string;
  lessons?: ExistingLessonInfo[];
}

export interface CurriculumRowInput {
  topic: string;
  title: string;
  period: number;
  sessions?: number;
}

export interface CurriculumSyncPlan {
  topicsToCreate: string[];
  topicsExisting: string[];
  lessonsToCreate: Array<{
    topic: string;
    title: string;
  }>;
  alreadyExistingLessonCount: number;
}

function normalizeTitle(t: string): string {
  return t.trim().toLowerCase();
}

/**
 * Compares rows from curriculum program against the current subject roadmap/topics.
 * Identifies which topics and lessons are missing and need to be created.
 */
export function planCurriculumSync(
  rows: CurriculumRowInput[],
  existingTopics: ExistingTopicInfo[],
): CurriculumSyncPlan {
  const existingTopicMap = new Map<string, ExistingTopicInfo>();
  existingTopics.forEach((t) => {
    existingTopicMap.set(normalizeTitle(t.title), t);
  });

  const topicsToCreateSet = new Set<string>();
  const topicsExistingSet = new Set<string>();
  const lessonsToCreate: Array<{ topic: string; title: string }> = [];
  let alreadyExistingLessonCount = 0;

  // Track unique lesson titles per topic in rows
  const seenLessonsInRows = new Set<string>();

  for (const row of rows) {
    const rawTopic = row.topic?.trim() || "Chủ đề chung";
    const rawTitle = row.title?.trim();
    if (!rawTitle) continue;

    const topicKey = normalizeTitle(rawTopic);
    const existingTopic = existingTopicMap.get(topicKey);

    if (existingTopic) {
      topicsExistingSet.add(rawTopic);
      const existingLessonTitles = new Set(
        (existingTopic.lessons || []).map((l) => normalizeTitle(l.title)),
      );

      const lessonKey = `${topicKey}:::${normalizeTitle(rawTitle)}`;
      if (!seenLessonsInRows.has(lessonKey)) {
        seenLessonsInRows.add(lessonKey);
        if (existingLessonTitles.has(normalizeTitle(rawTitle))) {
          alreadyExistingLessonCount++;
        } else {
          lessonsToCreate.push({
            topic: rawTopic,
            title: rawTitle,
          });
        }
      }
    } else {
      topicsToCreateSet.add(rawTopic);
      const lessonKey = `${topicKey}:::${normalizeTitle(rawTitle)}`;
      if (!seenLessonsInRows.has(lessonKey)) {
        seenLessonsInRows.add(lessonKey);
        lessonsToCreate.push({
          topic: rawTopic,
          title: rawTitle,
        });
      }
    }
  }

  return {
    topicsToCreate: Array.from(topicsToCreateSet),
    topicsExisting: Array.from(topicsExistingSet),
    lessonsToCreate,
    alreadyExistingLessonCount,
  };
}
