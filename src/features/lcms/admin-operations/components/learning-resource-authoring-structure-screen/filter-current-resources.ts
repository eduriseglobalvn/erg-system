import type { LearningResourceResourceCard } from "@/features/lms/learning-resources/api/learning-resource-authoring-api";
import type { StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

export function filterCurrentResources(
  resources: LearningResourceResourceCard[],
  selectedSubject: StudioSubject | undefined,
  selectedNode: StudioNode | undefined,
): LearningResourceResourceCard[] {
  if (!selectedSubject) return [];
  if (!selectedNode) {
    return resources.filter((resource) => resource.subjectId === selectedSubject.id && !resource.categoryId && !resource.sectionId);
  }
  return resources.filter((resource) => {
    if (resource.subjectId !== selectedSubject.id) return false;
    if (selectedNode.kind === "lesson" || selectedNode.kind === "section" || selectedNode.kind === "topic") {
      return (
        resource.sectionId === selectedNode.optionId ||
        resource.sectionId === selectedNode.location.sectionId ||
        resource.topicId === selectedNode.location.topicId
      );
    }
    if (selectedNode.kind === "group") {
      return resource.categoryId === selectedNode.optionId && !resource.sectionId;
    }
    return false;
  });
}
