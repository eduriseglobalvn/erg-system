import { classroomSchools } from "@/features/lms/classroom/api/mock-classroom-data";
import {
  listLearningResourceResources,
  listLearningResourceSubjects,
  loadLearningResourceTaxonomies,
  type LearningResourceResourceCard,
  type LearningResourceTaxonomyOption,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { listManageableUnits, type LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import type {
  LearningResourceManagedSchool,
  LearningResourceTeacherDashboardNode,
  LearningResourceTeacherDashboardSubject,
  LearningResourceTeacherProgressDetail,
  LearningResourceTeacherProgressSummary,
  LearningResourceTeacherRecentLecture,
  LearningResourceTeacherSubjectTree,
} from "@/features/lms/learning-resources/types/teacher-resource-dashboard-types";
import { hasApiBase } from "@/lib/api-client";
import { getStoredAccessToken } from "@/platform/auth/api/auth-token-storage";

const subjectProgressCache = new Map<string, Promise<LearningResourceTeacherProgressDetail>>();
const subjectTreeCache = new Map<string, Promise<LearningResourceTeacherSubjectTree>>();
const TEACHER_DASHBOARD_TIMEOUT_MS = 8000;

const fallbackSubjectDescriptions: Record<string, string> = {
  toan: "Theo dõi tiến độ dạy học và tài liệu đang dùng cho môn Toán.",
  "tieng-viet": "Danh sách nội dung Tiếng Việt đang triển khai trong năm học hiện tại.",
  "tu-nhien-xa-hoi": "Chủ đề và học liệu Tự nhiên và Xã hội phục vụ dạy học hằng tuần.",
  "ngu-van": "Theo dõi chương trình, chủ đề và bài học Ngữ văn theo trường.",
  "tieng-anh": "Học liệu SGK, sách mềm và bài giảng cho giáo viên Tiếng Anh.",
  "khoa-hoc-tu-nhien": "Tiến độ dạy học Khoa học tự nhiên theo từng chủ đề và bài học.",
  "lich-su-dia-li": "Nội dung Lịch sử và Địa lí đang dạy trong trường.",
  "giao-duc-stem": "Lesson kit, dự án STEM và nội dung minh họa theo chủ đề.",
  "giao-duc-ki-nang-cong-dan-so": "Tài nguyên kỹ năng số và công dân số cho giáo viên.",
  "tin-hoc": "Bài giảng, thực hành và kho tài nguyên Tin học.",
  ic3: "Tài nguyên giảng dạy và luyện thi chứng chỉ IC3.",
  mos: "Lộ trình bài dạy, file thực hành và bài kiểm tra MOS.",
};

function getTeacherDashboardCacheScope() {
  const tenantId = import.meta.env.VITE_TENANT_ID?.trim() || "erg";
  return [tenantId, "lms", getStoredAccessToken("lms") ?? "anonymous"].join(":");
}
function fallbackManagedSchools(): LearningResourceManagedSchool[] {
  return classroomSchools.map((school) => ({
    id: school.id,
    name: school.name,
    principal: school.principal,
  }));
}

export function buildManagedSchoolsFromUnits(units: LmsEducationUnitDTO[] | null | undefined): LearningResourceManagedSchool[] {
  const normalizedUnits = Array.isArray(units)
    ? units.filter((unit) => unit?.id && unit?.name && unit.type !== "system" && unit.code !== "ERG-SYSTEM" && unit.code !== "HOCLIEU-STUDIO")
    : [];

  if (!normalizedUnits.length) return [];

  return normalizedUnits.map((unit) => ({
    id: unit.id,
    name: unit.name,
    principal: unit.type === "school" ? "Quản trị trường" : "Quản trị trung tâm",
  }));
}

export async function listLearningResourceManagedSchools() {
  if (!hasApiBase()) {
    return fallbackManagedSchools();
  }

  try {
    const unitsResult = await listManageableUnits();
    return buildManagedSchoolsFromUnits(unitsResult);
  } catch (error) {
    if (hasApiBase()) throw error;
    return fallbackManagedSchools();
  }
}

export async function listLearningResourceTeacherSubjects(input: { schoolId: string; academicYear: string }) {
  void input;
  if (!hasApiBase()) {
    return Object.entries(fallbackSubjectDescriptions).map(
      ([id, description]): LearningResourceTeacherDashboardSubject => ({
        id,
        label: id.toUpperCase(),
        description,
        progress: { progressRate: 0, taughtCount: 0, totalCount: 0, pendingCount: 0 },
      }),
    );
  }

  const subjects = await listLearningResourceSubjects();
  return subjects.map((subject): LearningResourceTeacherDashboardSubject => ({
    id: subject.id,
    label: subject.label,
    description: subject.description || fallbackSubjectDescriptions[subject.id],
    progress: { progressRate: 0, taughtCount: 0, totalCount: 0, pendingCount: 0 },
  }));
}

export function loadLearningResourceTeacherSubjectTree(input: { subjectId: string; schoolId: string; academicYear: string; parentId?: string }) {
  const cacheKey = [getTeacherDashboardCacheScope(), input.subjectId, input.parentId ?? "root", input.schoolId, input.academicYear].join("::");
  const inFlight = subjectTreeCache.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = withTeacherDashboardTimeout(buildTeacherSubjectTree(input)).finally(() => {
    subjectTreeCache.delete(cacheKey);
  });

  subjectTreeCache.set(cacheKey, request);
  return request;
}

export function listLearningResourceRecentOpened(input: { schoolId: string; academicYear: string; limit?: number }) {
  return withTeacherDashboardTimeout(buildRecentOpened(input));
}

export function loadLearningResourceTeacherProgress(input: { subjectId: string; schoolId: string; academicYear: string; nodeId?: string }) {
  const cacheKey = [getTeacherDashboardCacheScope(), input.subjectId, input.nodeId ?? "root", input.schoolId, input.academicYear].join("::");
  const inFlight = subjectProgressCache.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = withTeacherDashboardTimeout(buildTeacherProgress(input)).finally(() => {
    subjectProgressCache.delete(cacheKey);
  });

  subjectProgressCache.set(cacheKey, request);
  return request;
}

async function buildTeacherSubjectTree(input: { subjectId: string; schoolId: string; academicYear: string; parentId?: string }): Promise<LearningResourceTeacherSubjectTree> {
  const [taxonomy, resourceList] = await Promise.all([
    loadLearningResourceTaxonomies(),
    listLearningResourceResources({ subjectId: input.subjectId, limit: 100 }),
  ]);
  const subject = taxonomy.subjects.find((item) => item.id === input.subjectId);
  const resources = resourceList.data.filter((resource) => resource.subjectId === input.subjectId);
  const children = input.parentId
    ? childNodesForParent(input.parentId, taxonomy.categories, taxonomy.topics, resources, subject)
    : taxonomy.categories
        .filter((category) => category.subjectId === input.subjectId || category.parentId === input.subjectId)
        .map((category) => taxonomyNodeToTeacherNode(category, "group", "category", subject, countResources(resources, category.id)));

  return {
    subjectId: input.subjectId,
    subjectLabel: subject?.label || input.subjectId,
    schoolId: input.schoolId,
    academicYear: input.academicYear,
    parentId: input.parentId,
    breadcrumbs: [
      {
        id: input.subjectId,
        label: subject?.label || input.subjectId,
        kind: "folder",
      },
    ],
    children,
    progress: progressSummary(children.length),
  };
}

function childNodesForParent(
  parentId: string,
  categories: LearningResourceTaxonomyOption[],
  topics: LearningResourceTaxonomyOption[],
  resources: LearningResourceResourceCard[],
  subject?: LearningResourceTaxonomyOption,
) {
  const topicChildren = topics
    .filter((topic) => topic.categoryId === parentId || topic.parentId === parentId)
    .map((topic) => taxonomyNodeToTeacherNode(topic, "lesson", "topic", subject, countResources(resources, topic.id)));
  if (topicChildren.length) return topicChildren;

  const resourceChildren = resources
    .filter((resource) => resource.topicId === parentId || resource.sectionId === parentId || resource.categoryId === parentId)
    .map((resource) => resourceToTeacherNode(resource, subject));
  if (resourceChildren.length) return resourceChildren;

  return categories
    .filter((category) => category.parentId === parentId)
    .map((category) => taxonomyNodeToTeacherNode(category, "group", "category", subject, countResources(resources, category.id)));
}

async function buildRecentOpened(input: { schoolId: string; academicYear: string; limit?: number }): Promise<LearningResourceTeacherRecentLecture[]> {
  const [subjects, resourceList] = await Promise.all([listLearningResourceSubjects(), listLearningResourceResources({ limit: input.limit ?? 8 })]);
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  return resourceList.data
    .slice(0, input.limit ?? 8)
    .map((resource): LearningResourceTeacherRecentLecture => {
      const subject = subjectById.get(resource.subjectId);
      return {
        id: `recent-${resource.id}`,
        subjectId: resource.subjectId,
        subjectLabel: subject?.label || resource.subjectId,
        nodeId: resource.topicId || resource.sectionId || resource.categoryId,
        nodeLabel: resource.title,
        nodeKind: "resource",
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourceType: resource.selectedFileType,
        openedAt: resource.updatedAt || new Date(0).toISOString(),
      };
    });
}

async function buildTeacherProgress(input: { subjectId: string; schoolId: string; academicYear: string; nodeId?: string }): Promise<LearningResourceTeacherProgressDetail> {
  const resourceList = await listLearningResourceResources({ subjectId: input.subjectId, limit: 100 });
  const resources = resourceList.data.filter((resource) => {
    if (!input.nodeId) return resource.subjectId === input.subjectId;
    return resource.categoryId === input.nodeId || resource.sectionId === input.nodeId || resource.topicId === input.nodeId;
  });
  return {
    subjectId: input.subjectId,
    nodeId: input.nodeId,
    schoolId: input.schoolId,
    academicYear: input.academicYear,
    summary: progressSummary(resources.length),
    items: resources.map((resource) => ({
      id: resource.id,
      label: resource.title,
      kind: "resource",
      status: "pending",
      progressRate: 0,
    })),
  };
}

function taxonomyNodeToTeacherNode(
  node: LearningResourceTaxonomyOption,
  kind: "group" | "lesson",
  sourceKind: "category" | "topic",
  subject: LearningResourceTaxonomyOption | undefined,
  totalCount: number,
): LearningResourceTeacherDashboardNode {
  return {
    id: node.id,
    label: node.label,
    kind,
    sourceKind,
    parentId: node.parentId,
    subjectId: subject?.id || node.subjectId,
    subjectLabel: subject?.label,
    description: node.description,
    hasChildren: totalCount > 0,
    progress: progressSummary(totalCount),
    updatedAt: undefined,
  };
}

function resourceToTeacherNode(resource: LearningResourceResourceCard, subject?: LearningResourceTaxonomyOption): LearningResourceTeacherDashboardNode {
  return {
    id: resource.id,
    label: resource.title,
    kind: "resource",
    parentId: resource.topicId || resource.sectionId || resource.categoryId,
    subjectId: resource.subjectId,
    subjectLabel: subject?.label,
    resourceId: resource.id,
    resourceType: resource.selectedFileType,
    thumbnailUrl: resource.thumbnailUrl,
    fileTypeBadge: resource.fileTypeBadge || resource.selectedFileType,
    hasChildren: false,
    progress: progressSummary(1),
    updatedAt: resource.updatedAt,
  };
}

function countResources(resources: LearningResourceResourceCard[], nodeId: string) {
  return resources.filter((resource) => resource.categoryId === nodeId || resource.sectionId === nodeId || resource.topicId === nodeId).length;
}

function progressSummary(totalCount: number): LearningResourceTeacherProgressSummary {
  return {
    progressRate: 0,
    taughtCount: 0,
    totalCount,
    pendingCount: totalCount,
  };
}

export function getCurrentAcademicYear(now = new Date()) {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export function toVietnameseRelativeTime(value?: string) {
  if (!value) return "Chưa có dữ liệu";

  const diffMs = Date.now() - Date.parse(value);
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

export function getSubjectFallbackDescription(subject: Pick<LearningResourceTaxonomyOption, "id" | "description">) {
  return subject.description || fallbackSubjectDescriptions[subject.id] || "Theo dõi tiến độ môn học, chủ đề và bài học đang được dạy.";
}

function withTeacherDashboardTimeout<T>(promise: Promise<T>, timeoutMs = TEACHER_DASHBOARD_TIMEOUT_MS) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("Teacher dashboard request timed out.")), timeoutMs);
    }),
  ]);
}
