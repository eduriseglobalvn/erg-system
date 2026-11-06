import type {
  CurriculumRoadmapStage,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export function normalizeRoadmapQuery(query: string): string {
  return query.trim().toLocaleLowerCase("vi");
}

export function filterRoadmapStages(
  stages: CurriculumRoadmapStage[],
  normalizedQuery: string,
): CurriculumRoadmapStage[] {
  return stages
    .map((stage) => ({
      ...stage,
      topics: stage.topics
        .map((topic) => ({
          ...topic,
          lessons: normalizedQuery
            ? topic.lessons.filter((lesson) =>
                `${lesson.folder.title} ${lesson.folder.description ?? ""}`
                  .toLocaleLowerCase("vi")
                  .includes(normalizedQuery),
              )
            : topic.lessons,
        }))
        .filter(
          (topic) =>
            !normalizedQuery ||
            topic.title.toLocaleLowerCase("vi").includes(normalizedQuery) ||
            topic.lessons.length > 0,
        ),
    }))
    .filter(
      (stage) =>
        !normalizedQuery ||
        `${stage.level.title} ${stage.level.description ?? ""}`.toLocaleLowerCase("vi").includes(normalizedQuery) ||
        stage.topics.length > 0,
    );
}

export function countRoadmapTotals(stages: CurriculumRoadmapStage[]): { topics: number; lessons: number } {
  return {
    topics: stages.reduce((total, stage) => total + stage.topics.length, 0),
    lessons: stages.reduce(
      (total, stage) => total + stage.topics.reduce((count, topic) => count + topic.lessons.length, 0),
      0,
    ),
  };
}
