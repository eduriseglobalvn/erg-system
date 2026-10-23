import type { LmsLearningResourceCard } from "@/features/lms/api/lms-graphql-api";
import type {
  LearningResourceFileType,
  LearningResourceResource,
  LearningResourceResourceSection,
} from "@/features/lms/learning-resources/api/learning-resource-domain-types";
import { mapLibraryResourceToLearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-mapper";
import type { GraphQlLearningResourceLibrarySnapshot } from "@/features/lms/learning-resources/api/learning-resource-graphql-transport";
import type {
  LearningResourceLibraryBootstrapDTO,
  LearningResourceLibraryBootstrapResourceDTO,
  LearningResourceLibraryBootstrapSubjectDTO,
  LearningResourceLibraryProgressDTO,
} from "@/features/lms/learning-resources/api/learning-resource-types";

function mapGraphQlLearningResourceToBootstrapResource(resource: LmsLearningResourceCard) {
  const title = resource.title || resource.slug || resource.id;
  const fileType = inferGraphQlFileType({
    slug: resource.slug,
    subtitle: resource.subtitle,
    title,
  });
  const type = inferGraphQlResourceType(fileType, title);

  return {
    id: resource.id,
    title,
    type,
    fileType,
    thumbnailUrl: resource.thumbnailUrl ?? undefined,
  } satisfies LearningResourceLibraryBootstrapResourceDTO;
}

export function mapGraphQlLearningResourceToResource(
  resource: LmsLearningResourceCard,
  context: {
    subjectId: string;
    groupId: string;
    lessonId: string;
    sortOrder: number;
  },
): LearningResourceResource {
  return mapLibraryResourceToLearningResourceResource(mapGraphQlLearningResourceToBootstrapResource(resource), context);
}

function inferGraphQlFileType(resource: Pick<LmsLearningResourceCard, "slug" | "subtitle" | "title">): LearningResourceFileType {
  const haystack = [resource.title, resource.subtitle, resource.slug].filter(Boolean).join(" ").toLowerCase();

  if (/(quiz|test|đề|de thi|trac nghiem|trắc nghiệm)/i.test(haystack)) return "QUIZ";
  if (/(video|clip|movie)/i.test(haystack)) return "VIDEO";
  if (/(audio|mp3|sound)/i.test(haystack)) return "AUDIO";
  if (/(ppt|slide|bai giang|bài giảng|presentation)/i.test(haystack)) return "PPTX";
  if (/(image|anh|ảnh|poster|infographic)/i.test(haystack)) return "IMAGE";
  if (/(zip|package|thuc hanh|thực hành)/i.test(haystack)) return "ZIP";
  if (/(link|external|url)/i.test(haystack)) return "LINK";
  if (/(html5|interactive)/i.test(haystack)) return "HTML5";
  if (/(docx|word|tai lieu|tài liệu)/i.test(haystack)) return "DOCX";
  if (/(xlsx|excel|spreadsheet)/i.test(haystack)) return "XLSX";
  return "PDF";
}

function inferGraphQlResourceType(fileType: LearningResourceFileType, title: string): "lecture" | "exercise" {
  if (fileType === "QUIZ") return "exercise";
  if (/(quiz|test|đề|de thi|trac nghiem|trắc nghiệm|bài tập|bai tap)/i.test(title)) return "exercise";
  return "lecture";
}

function buildGraphQlResourceLabelMap(library: GraphQlLearningResourceLibrarySnapshot) {
  const labels = new Map<string, string>();
  const subjectLabels = new Map<string, string>();
  const categoryLabels = new Map<string, string>();
  const sectionLabels = new Map<string, string>();

  for (const node of library.taxonomyTree ?? []) {
    if (node.id && node.label) {
      labels.set(node.id, node.label);
    }
    if (node.subjectId && node.label && !subjectLabels.has(node.subjectId)) {
      subjectLabels.set(node.subjectId, node.label);
    }
    if (node.categoryId && node.label && !categoryLabels.has(node.categoryId)) {
      categoryLabels.set(node.categoryId, node.label);
    }
    if ((node.kind === "section" || node.kind === "topic") && node.id && node.label && !sectionLabels.has(node.id)) {
      sectionLabels.set(node.id, node.label);
    }
  }

  return { labels, subjectLabels, categoryLabels, sectionLabels };
}

function fallbackLabelFor(value?: string | null, prefix = "Hoc lieu") {
  if (!value) return prefix;
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapGraphQlLibraryToBootstrap(
  library: GraphQlLearningResourceLibrarySnapshot,
  input: { schoolId: string; academicYear: string },
): LearningResourceLibraryBootstrapDTO {
  const labels = buildGraphQlResourceLabelMap(library);
  const subjects = new Map<string, LearningResourceLibraryBootstrapSubjectDTO>();
  const sortedResources = [...(library.resources.items ?? [])].sort((left, right) => {
    const leftKey = [left.subjectId ?? "", left.categoryId ?? "", left.sectionId ?? "", left.topicId ?? "", left.title ?? ""].join("::");
    const rightKey = [right.subjectId ?? "", right.categoryId ?? "", right.sectionId ?? "", right.topicId ?? "", right.title ?? ""].join("::");
    return leftKey.localeCompare(rightKey, "vi");
  });

  sortedResources.forEach((resource) => {
    const subjectId = resource.subjectId || library.educationUnitId || "hoc-lieu";
    const groupId = resource.categoryId || subjectId;
    const lessonId = resource.sectionId || resource.topicId || groupId;
    const subject = subjects.get(subjectId) ?? {
      id: subjectId,
      label: labels.subjectLabels.get(subjectId) ?? labels.labels.get(subjectId) ?? fallbackLabelFor(subjectId, "Hoc lieu"),
      groups: [],
    };

    const group = subject.groups.find((item) => item.id === groupId) ?? {
      id: groupId,
      label: labels.categoryLabels.get(groupId) ?? labels.labels.get(groupId) ?? fallbackLabelFor(groupId, "Nhom hoc lieu"),
      lessons: [],
    };

    const lesson = group.lessons.find((item) => item.id === lessonId) ?? {
      id: lessonId,
      label: labels.sectionLabels.get(lessonId) ?? labels.labels.get(lessonId) ?? fallbackLabelFor(lessonId, "Bai hoc"),
      resources: [],
    };

    lesson.resources.push(
      mapGraphQlLearningResourceToBootstrapResource(resource),
    );

    if (!group.lessons.some((item) => item.id === lesson.id)) {
      group.lessons.push(lesson);
    }
    if (!subject.groups.some((item) => item.id === group.id)) {
      subject.groups.push(group);
    }
    subjects.set(subjectId, subject);
  });

  return {
    schoolId: input.schoolId,
    academicYear: input.academicYear,
    subjects: [...subjects.values()].map((subject) => ({
      ...subject,
      groups: subject.groups.map((group) => ({
        ...group,
        lessons: group.lessons.map((lesson) => ({
          ...lesson,
          resources: [...lesson.resources],
        })),
      })),
    })),
  };
}

export function mapGraphQlLibraryToProgress(
  library: GraphQlLearningResourceLibrarySnapshot,
  input: { schoolId: string; academicYear: string },
): LearningResourceLibraryProgressDTO {
  const progressByLesson = new Map<string, number[]>();
  const resourceById = new Map((library.resources.items ?? []).map((resource) => [resource.id, resource]));

  for (const entry of library.progress ?? []) {
    const resource = resourceById.get(entry.resourceId);
    const lessonId = resource?.sectionId || resource?.topicId || resource?.categoryId || resource?.subjectId || entry.resourceId;
    const values = progressByLesson.get(lessonId) ?? [];
    values.push(Number(entry.progressRate ?? 0));
    progressByLesson.set(lessonId, values);
  }

  return {
    schoolId: input.schoolId,
    academicYear: input.academicYear,
    lessons: [...progressByLesson.entries()].map(([lessonId, values]) => ({
      lessonId,
      progressRate: average(values),
    })),
  };
}

export function mapGraphQlLibraryToSections(library: GraphQlLearningResourceLibrarySnapshot): LearningResourceResourceSection[] {
  const labels = buildGraphQlResourceLabelMap(library);
  const sectionMap = new Map<string, LearningResourceResourceSection>();

  [...(library.resources.items ?? [])].forEach((resource, index) => {
    const subjectId = resource.subjectId || library.educationUnitId || "hoc-lieu";
    const categoryId = resource.categoryId || subjectId;
    const sectionId = resource.sectionId || resource.topicId || categoryId;
    const mappedResource = mapGraphQlLearningResourceToResource(resource, {
      subjectId,
      groupId: categoryId,
      lessonId: sectionId,
      sortOrder: index + 1,
    });
    const current = sectionMap.get(sectionId);
    const title =
      labels.sectionLabels.get(sectionId) ??
      labels.labels.get(sectionId) ??
      mappedResource.viewer.title ??
      fallbackLabelFor(sectionId, "Tai lieu");

    if (current) {
      current.resources.push(mappedResource);
      return;
    }

    sectionMap.set(sectionId, {
      id: sectionId,
      title,
      subtitle: mappedResource.subtitle || labels.categoryLabels.get(categoryId) || labels.labels.get(categoryId),
      gradeId: mappedResource.gradeId,
      subjectId,
      categoryId,
      resources: [mappedResource],
    });
  });

  return [...sectionMap.values()].map((section) => ({
    ...section,
    resources: section.resources.sort((left, right) => left.sortOrder - right.sortOrder),
  }));
}

function average(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) return 0;
  return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
}
