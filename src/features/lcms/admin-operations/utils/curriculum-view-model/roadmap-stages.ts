import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { LearningResourceTaxonomyOption } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import type { AttachedResourceItem, LocalContentItem, StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { CurriculumRoadmapStage, CurriculumRoadmapTopic } from "@/features/lcms/admin-operations/utils/curriculum-view-model/types";
import { buildTopicContentGroups } from "@/features/lcms/admin-operations/utils/curriculum-view-model/content-items";
import { nodeToFolder } from "@/features/lcms/admin-operations/utils/curriculum-view-model/folders";
import { compareCurriculumTopics, sortCurriculumLessons } from "@/features/lcms/admin-operations/utils/curriculum-view-model/lesson-ordering";
import { collectTopicNodes, getNodeFolderRole, localContentBelongsToNode, normalizeForMatch, resourceBelongsToNode } from "@/features/lcms/admin-operations/utils/curriculum-view-model/node-matching";
import { emptyContentSummary } from "@/features/lcms/admin-operations/utils/curriculum-view-model/summary";

export function buildCurriculumRoadmapStages({
  subject,
  levelNode,
  localContentItems,
  resources,
  taxonomyTopics,
  quizBankItems,
}: {
  subject: StudioSubject;
  levelNode?: StudioNode;
  localContentItems: LocalContentItem[];
  resources: AttachedResourceItem[];
  taxonomyTopics: LearningResourceTaxonomyOption[];
  quizBankItems: QuizBankItem[];
}): CurriculumRoadmapStage[] {
  const levelNodes = levelNode
    ? [levelNode]
    : subject.tree.filter((node) => getNodeFolderRole(node) === "level");

  return levelNodes.map((level) => {
    const topicGroups = new Map<string, CurriculumRoadmapTopic>();

    collectTopicNodes(level.children).forEach((lessonNode) => {
      const contentGroups = buildTopicContentGroups(subject, lessonNode, localContentItems, resources, quizBankItems);
      const content = [...contentGroups.lecture, ...contentGroups.resource, ...contentGroups.exercise];
      const matchingResources = resources.filter(
        (resource) => resource.subjectId === subject.id && resourceBelongsToNode(resource, lessonNode),
      );
      const matchingLocalItems = localContentItems.filter(
        (item) => item.subjectId === subject.id && localContentBelongsToNode(item, lessonNode),
      );
      const taxonomyTopicId = lessonNode.metadata?.topicId
        || lessonNode.location.topicId
        || matchingResources.find((resource) => resource.topicId)?.topicId;
      const localTopicLabel = matchingLocalItems.find((item) => item.topicLabel)?.topicLabel;
      const taxonomyTopic = taxonomyTopics.find((topic) =>
        topic.id === taxonomyTopicId || Boolean(localTopicLabel && normalizeForMatch(topic.label) === normalizeForMatch(localTopicLabel)),
      );
      const groupId = taxonomyTopic?.id || (localTopicLabel ? `label-${normalizeForMatch(localTopicLabel)}` : lessonNode.id);
      const groupTitle = taxonomyTopic?.label || localTopicLabel || lessonNode.label;
      const groupSortOrder = taxonomyTopic?.sortOrder ?? (lessonNode.metadata?.sortOrder ? parseInt(lessonNode.metadata.sortOrder, 10) : undefined);
      const group = topicGroups.get(groupId) ?? {
        id: groupId,
        title: groupTitle,
        sortOrder: groupSortOrder,
        folder: nodeToFolder({
          node: lessonNode,
          pathLabels: [subject.label, level.label, groupTitle],
          resources,
          localContentItems,
          subject,
        }),
        node: lessonNode,
        lessons: [],
      };

      if (lessonNode.children && lessonNode.children.length > 0) {
        lessonNode.children.forEach((childLesson) => {
          const childContentGroups = buildTopicContentGroups(subject, childLesson, localContentItems, resources, quizBankItems);
          const childContent = [...childContentGroups.lecture, ...childContentGroups.resource, ...childContentGroups.exercise];
          group.lessons.push({
            folder: nodeToFolder({
              node: childLesson,
              pathLabels: [subject.label, level.label, group.title],
              resources,
              localContentItems,
              subject,
            }),
            content: childContent,
          });
        });
      } else if (taxonomyTopic && taxonomyTopic.label !== lessonNode.label) {
        group.lessons.push({
          folder: nodeToFolder({
            node: lessonNode,
            pathLabels: [subject.label, level.label, group.title],
            resources,
            localContentItems,
            subject,
          }),
          content,
        });
      } else if (content.length > 0) {
        sortCurriculumLessons(content).forEach((item) => {
          group.lessons.push({
            folder: {
              id: item.id,
              role: "topic",
              title: item.title,
              description: item.description,
              status: item.status,
              target: item.target,
              pathLabels: [subject.label, level.label, group.title],
              summary: emptyContentSummary(),
            },
            content: [item],
          });
        });
      }
      group.lessons = sortCurriculumLessons(group.lessons);
      topicGroups.set(groupId, group);
      return;
    });

    const originalTopicIndexMap = new Map<string, number>();
    level.children.forEach((child, idx) => {
      originalTopicIndexMap.set(child.id, idx);
      if (child.optionId) originalTopicIndexMap.set(child.optionId, idx);
    });

    const initialTopics = [...topicGroups.values()].map((grp) => ({
      ...grp,
      lessons: sortCurriculumLessons(grp.lessons),
    }));

    const sortedTopics = [...initialTopics].sort((a, b) =>
      compareCurriculumTopics(a, b, originalTopicIndexMap),
    );

    return {
      level: nodeToFolder({
        node: level,
        pathLabels: [subject.label],
        resources,
        localContentItems,
        subject,
      }),
      topics: sortedTopics,
    };
  });
}
