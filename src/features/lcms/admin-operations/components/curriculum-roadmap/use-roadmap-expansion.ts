import { useCallback, useEffect, useState } from "react";

import { targetsEqual } from "@/features/lcms/admin-operations/components/learning-resource-curriculum-explorer";
import type {
  CurriculumRoadmapStage,
  CurriculumTarget,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export function useRoadmapExpansion(
  stages: CurriculumRoadmapStage[],
  subjectTitle: string,
  selectedTarget: CurriculumTarget | null,
) {
  const stageIds = stages.map((stage) => stage.level.id).join("|");
  const [expandedLevelIds, setExpandedLevelIds] = useState<Set<string>>(
    () => new Set(stages.map((stage) => stage.level.id)),
  );

  useEffect(() => {
    setExpandedLevelIds(new Set(stageIds ? stageIds.split("|") : []));
  }, [stageIds, subjectTitle]);

  useEffect(() => {
    if (!selectedTarget) return;
    for (const stage of stages) {
      const matchInLevel = targetsEqual(selectedTarget, stage.level.target);
      const matchInTopic = stage.topics.some(
        (t) =>
          (t.folder && targetsEqual(selectedTarget, t.folder.target)) ||
          t.lessons.some((l) => targetsEqual(selectedTarget, l.folder.target)),
      );
      if (matchInLevel || matchInTopic) {
        setExpandedLevelIds((current) => {
          if (current.has(stage.level.id)) return current;
          const next = new Set(current);
          next.add(stage.level.id);
          return next;
        });
        break;
      }
    }
  }, [selectedTarget, stages]);

  const toggleLevel = useCallback((levelId: string) => {
    setExpandedLevelIds((current) => {
      const next = new Set(current);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedLevelIds(new Set(stages.map((s) => s.level.id)));
  }, [stages]);

  const handleCollapseAll = useCallback(() => {
    setExpandedLevelIds(new Set());
  }, []);

  return { expandedLevelIds, toggleLevel, handleExpandAll, handleCollapseAll };
}
