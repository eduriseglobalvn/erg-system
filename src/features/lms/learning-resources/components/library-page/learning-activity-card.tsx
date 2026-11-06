import { LearningResourceSquareCard } from "@/components/learning-resources/explorer-ui";
import type { LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-data";
import { displayText } from "@/features/lms/learning-resources/components/learning-resource-library-utils";
import { getLearningCardMeta } from "@/features/lms/learning-resources/components/library-page/library-model";

export function LearningActivityCard({ resource, onOpen }: { resource: LearningResourceResource; onOpen: (resource: LearningResourceResource) => void }) {
  const meta = getLearningCardMeta(resource);

  return (
    <LearningResourceSquareCard
      actionLabel={meta.action}
      heading={meta.heading}
      minutes={meta.minutes}
      questions={meta.questions}
      tag={meta.tag}
      title={displayText(resource.title)}
      unit={meta.unit}
      onOpen={() => onOpen(resource)}
    />
  );
}
