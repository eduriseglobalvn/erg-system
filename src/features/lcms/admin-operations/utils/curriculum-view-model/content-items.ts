import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { AttachedResourceItem, LocalContentItem, StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { CurriculumContentItem, CurriculumContentKind } from "@/features/lcms/admin-operations/utils/curriculum-view-model/types";
import { normalizeForMatch, resourceBelongsToNode } from "@/features/lcms/admin-operations/utils/curriculum-view-model/node-matching";

export function classifyAttachedResource(resource: AttachedResourceItem): CurriculumContentKind {
  const type = `${resource.fileTypeBadge ?? ""} ${resource.selectedFileType ?? ""} ${resource.title ?? ""}`.toLowerCase();
  if (type.includes("quiz") || type.includes("bai tap") || type.includes("bài tập") || type.includes("html5")) return "exercise";
  if (type.includes("ppt") || type.includes("slide") || type.includes("presentation")) return "lecture";
  return "resource";
}

export function buildTopicContentGroups(
  subject: StudioSubject,
  topicNode: StudioNode,
  localContentItems: LocalContentItem[],
  resources: AttachedResourceItem[],
  quizBankItems: QuizBankItem[],
): Record<CurriculumContentKind, CurriculumContentItem[]> {
  const quizById = new Map(quizBankItems.map((quiz) => [quiz.id, quiz]));
  const topicOptionId = topicNode.optionId;
  const localItems = localContentItems.filter(
    (item) => item.subjectId === subject.id && item.parentOptionId === topicOptionId,
  );
  const attachedItems = resources.filter((resource) => resource.subjectId === subject.id && resourceBelongsToNode(resource, topicNode));
  const groups = emptyContentGroups();

  localItems.forEach((item) => {
    const quiz = item.sourceQuizId ? quizById.get(item.sourceQuizId) : findQuizForLocalContent(item, quizBankItems);
    const content = localContentToItem(item, quiz);
    groups[content.kind].push(content);
  });

  attachedItems.forEach((resource) => {
    const content = attachedResourceToItem(resource);
    groups[content.kind].push(content);
  });

  return groups;
}

function localContentToItem(item: LocalContentItem, quiz?: QuizBankItem): CurriculumContentItem {
  if (item.kind === "lecture") {
    return {
      id: `local-${item.id}`,
      kind: "lecture",
      title: item.title,
      description: item.description,
      sourceLabel: "Google Slides",
      typeLabel: "Bài giảng",
      status: item.status,
      href: item.slidesUrl,
      target: { type: "local-content", id: item.id },
      meta: compactMeta([item.topicLabel, item.durationMinutes ? `${item.durationMinutes} phút` : undefined]),
      actionLabel: "Mở bài",
      durationMinutes: item.durationMinutes,
      fileType: "PPTX",
    };
  }

  return {
    id: `local-${item.id}`,
    kind: "exercise",
    title: item.title,
    description: item.description || quiz?.topicLabels.join(", "),
    sourceLabel: "Quiz bank",
    typeLabel: quiz?.kind === "test" ? "Bài kiểm tra" : "Bài tập",
    status: item.status ?? quiz?.status,
    href: item.resourceUrl,
    target: { type: "local-content", id: item.id },
    meta: compactMeta([
      quiz?.scopeLabel,
      `${item.questionCount ?? quiz?.questionCount ?? 0} câu`,
      item.durationMinutes ? `${item.durationMinutes} phút` : quiz?.durationLabel,
    ]),
    actionLabel: "Xem quiz",
    questionCount: item.questionCount ?? quiz?.questionCount,
    durationMinutes: item.durationMinutes,
    fileType: "QUIZ",
  };
}

function attachedResourceToItem(resource: AttachedResourceItem): CurriculumContentItem {
  const kind = classifyAttachedResource(resource);
  const fileType = resource.fileTypeBadge || resource.selectedFileType || (kind === "resource" ? "FILE" : "PPTX");
  const sourceLabel = kind === "exercise" ? "Quiz bank" : resolveResourceSourceLabel(resource, kind);

  return {
    id: `resource-${resource.id}`,
    kind,
    title: resource.title,
    description: resource.subtitle,
    sourceLabel,
    typeLabel: kind === "lecture" ? "Bài giảng" : kind === "exercise" ? "Bài tập" : "Tài liệu",
    status: resource.status,
    href: resource.linkUrl,
    target: { type: "resource", id: resource.id },
    meta: compactMeta([fileType, resource.subtitle, resource.canDownload ? "Có tải về" : undefined]),
    actionLabel: kind === "lecture" ? "Mở bài" : kind === "exercise" ? "Xem quiz" : "Mở tài liệu",
    fileType,
  };
}

export function emptyContentGroups(): Record<CurriculumContentKind, CurriculumContentItem[]> {
  return {
    lecture: [],
    resource: [],
    exercise: [],
  };
}

function findQuizForLocalContent(item: LocalContentItem, quizBankItems: QuizBankItem[]) {
  const normalizedTitle = normalizeForMatch(item.title);
  return quizBankItems.find((quiz) => normalizeForMatch(quiz.title) === normalizedTitle || normalizedTitle.includes(normalizeForMatch(quiz.title)));
}

function resolveResourceSourceLabel(resource: AttachedResourceItem, kind: CurriculumContentKind) {
  const link = resource.linkUrl?.toLowerCase() ?? "";
  if (link.includes("docs.google.com/presentation")) return "Google Slides";
  if (link.includes("drive.google.com")) return "Google Drive";
  if (kind === "lecture") return "Slide";
  return "Học liệu";
}

function compactMeta(values: Array<string | number | undefined | null>) {
  return values
    .map((value) => (value === undefined || value === null ? "" : String(value).trim()))
    .filter(Boolean);
}
