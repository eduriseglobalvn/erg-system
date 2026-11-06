import { useMemo } from "react";

import type { CurriculumRoadmapActions } from "@/features/lcms/admin-operations/components/curriculum-roadmap-view";
import { findNode } from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import type { StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { CurriculumFolder } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export function useRoadmapActions({
  onCreateChild,
  onCreateRoot,
  onCreateTopic,
  onDeleteNodeSelection,
  onDeleteSubject,
  onEditNodeSelection,
  onEditSubject,
  onSelectNode,
  selectedSubject,
}: {
  onCreateChild: (option?: "section" | "lecture" | "exercise" | "resource") => void;
  onCreateRoot: () => void;
  onCreateTopic: () => void;
  onDeleteNodeSelection: (node: StudioNode) => void;
  onDeleteSubject: () => void;
  onEditNodeSelection: (node: StudioNode) => void;
  onEditSubject: () => void;
  onSelectNode: (id: string) => void;
  selectedSubject?: StudioSubject;
}): CurriculumRoadmapActions {
  return useMemo(
    () => ({
      onCreateLevel: onCreateRoot,
      onCreateTopic: (levelFolder: CurriculumFolder) => {
        if (levelFolder.target.type === "node") {
          onSelectNode(levelFolder.target.id);
        }
        onCreateTopic();
      },
      onCreateLesson: (topicFolder: CurriculumFolder) => {
        if (topicFolder.target.type === "node") {
          onSelectNode(topicFolder.target.id);
        }
        onCreateChild("lecture");
      },
      onAddExercise: (lessonFolder: CurriculumFolder) => {
        if (lessonFolder.target.type === "node") {
          onSelectNode(lessonFolder.target.id);
        }
        onCreateChild("exercise");
      },
      onAddResource: (lessonFolder: CurriculumFolder) => {
        if (lessonFolder.target.type === "node") {
          onSelectNode(lessonFolder.target.id);
        }
        onCreateChild("resource");
      },
      onEditFolder: (folder: CurriculumFolder) => {
        if (folder.target.type === "node") {
          const node = selectedSubject ? findNode(selectedSubject.tree, folder.target.id) : undefined;
          if (node) {
            onEditNodeSelection(node);
            return;
          }
        }
        if (folder.target.type === "subject") {
          onEditSubject();
        }
      },
      onDeleteFolder: (folder: CurriculumFolder) => {
        if (folder.target.type === "node") {
          const node = selectedSubject ? findNode(selectedSubject.tree, folder.target.id) : undefined;
          if (node) {
            onDeleteNodeSelection(node);
            return;
          }
        }
        if (folder.target.type === "subject") {
          onDeleteSubject();
        }
      },
    }),
    [
      onCreateChild,
      onCreateRoot,
      onCreateTopic,
      onDeleteNodeSelection,
      onDeleteSubject,
      onEditNodeSelection,
      onEditSubject,
      onSelectNode,
      selectedSubject,
    ],
  );
}
