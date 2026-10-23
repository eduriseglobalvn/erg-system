import type {
  CurriculumTaxonomyImpact,
  LearningResourceResourceCard,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import type {
  LocalContentItem,
  StudioNode,
  StudioSubject,
  TaxonomyDeleteTarget,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

export function estimateTaxonomyImpact({
  target,
  subjects,
  localContentItems,
  resources,
  quizBankItems,
}: {
  target: TaxonomyDeleteTarget | null;
  subjects: StudioSubject[];
  localContentItems: LocalContentItem[];
  resources: LearningResourceResourceCard[];
  quizBankItems: QuizBankItem[];
}): CurriculumTaxonomyImpact | null {
  if (!target) return null;

  const subject = target.kind === "subject"
    ? subjects.find((item) => item.id === target.id)
    : subjects.find((item) => findNodeByOptionId(item.tree, target.id));
  const node = target.kind === "subject" ? undefined : subject ? findNodeByOptionId(subject.tree, target.id) : undefined;
  const nodeType = target.kind === "subject" ? "subject" : node && isLevelLikeNode(node) ? "level" : "topic";
  const descendantOptionIds = node ? collectNodeOptionIds(node) : new Set<string>();
  if (target.kind !== "subject") descendantOptionIds.add(target.id);

  const matchingLocalContent = localContentItems.filter((item) => {
    if (target.kind === "subject") return item.subjectId === target.id;
    return descendantOptionIds.has(item.parentOptionId);
  });
  const matchingResources = resources.filter((resource) => {
    if (target.kind === "subject") return resource.subjectId === target.id;
    if (nodeType === "level") return resource.categoryId === target.id || Boolean(resource.sectionId && descendantOptionIds.has(resource.sectionId));
    return resource.sectionId === target.id || resource.topicId === target.id;
  });
  const matchingQuizzes = quizBankItems.filter((quiz) => {
    if (target.kind === "subject") return quiz.subjectId === target.id || quiz.subjectLabel === target.label;
    if (nodeType === "level") return quiz.levelId === target.id || quiz.levelLabel === target.label;
    return quiz.topicLabels.some((label) => normalizeImpactLabel(label) === normalizeImpactLabel(target.label));
  });
  const contentItems = matchingLocalContent.length + matchingResources.length;
  const questions = matchingQuizzes.reduce((total, quiz) => total + (quiz.questionCount ?? quiz.questionIds.length), 0);
  const dependencyCount = contentItems + matchingQuizzes.length + questions;
  const isDraft = target.status === "draft" || target.status === "reviewing";

  return {
    nodeId: target.id,
    nodeType,
    canHardDelete: dependencyCount === 0 && isDraft,
    canArchive: true,
    impact: {
      questions,
      quizzes: matchingQuizzes.length,
      publishedQuizVersions: matchingQuizzes.filter((quiz) => quiz.status === "ready").length,
      contentItems,
      assignments: 0,
      studentAttempts: 0,
    },
    recommendedActions: dependencyCount === 0 && isDraft ? ["HARD_DELETE", "ARCHIVE"] : ["ARCHIVE", "REASSIGN", "MERGE"],
    source: "estimated",
  };
}

function findNodeByOptionId(nodes: StudioNode[], optionId: string): StudioNode | undefined {
  for (const node of nodes) {
    if (node.optionId === optionId) return node;
    const child = findNodeByOptionId(node.children, optionId);
    if (child) return child;
  }
  return undefined;
}

function collectNodeOptionIds(node: StudioNode): Set<string> {
  const ids = new Set<string>();
  const visit = (current: StudioNode) => {
    if (current.optionId) ids.add(current.optionId);
    current.children.forEach(visit);
  };
  visit(node);
  return ids;
}

function isLevelLikeNode(node: StudioNode) {
  return node.metadata?.taxonomyRole === "level" || node.kind === "group" || node.kind === "category" || node.kind === "bookSeries";
}

function normalizeImpactLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
