import { classroomSchools } from "@/features/classroom/api/mock-classroom-data";
import { listHocLieuSubjects, type HocLieuTaxonomyOption } from "@/features/admin-operations/api/hoclieu-authoring-api";
import { listManageableUnits, type LmsEducationUnitDTO } from "@/features/dashboard/api/lms-dashboard-api";
import type {
  HocLieuManagedSchool,
  HocLieuTeacherDashboardSubject,
  HocLieuTeacherProgressDetail,
  HocLieuTeacherRecentLecture,
  HocLieuTeacherSubjectTree,
} from "@/features/hoclieu/types/teacher-dashboard-types";
import { apiRequest, hasApiBase } from "@/lib/api-client";

const subjectProgressCache = new Map<string, Promise<HocLieuTeacherProgressDetail>>();
const subjectTreeCache = new Map<string, Promise<HocLieuTeacherSubjectTree>>();
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

function fallbackManagedSchools(): HocLieuManagedSchool[] {
  return classroomSchools.map((school) => ({
    id: school.id,
    name: school.name,
    principal: school.principal,
  }));
}

export function buildManagedSchoolsFromUnits(units: LmsEducationUnitDTO[] | null | undefined): HocLieuManagedSchool[] {
  const normalizedUnits = Array.isArray(units)
    ? units.filter((unit) => unit?.id && unit?.name && unit.type !== "system" && unit.code !== "ERG-SYSTEM" && unit.code !== "HOCLIEU-STUDIO")
    : [];

  if (!normalizedUnits.length) {
    return fallbackManagedSchools();
  }

  return normalizedUnits.map((unit) => ({
    id: unit.id,
    name: unit.name,
    principal: unit.type === "school" ? "Quản trị trường" : "Quản trị trung tâm",
  }));
}

export async function listHocLieuManagedSchools() {
  if (!hasApiBase()) {
    return fallbackManagedSchools();
  }

  try {
    const unitsResult = await listManageableUnits();
    return buildManagedSchoolsFromUnits(unitsResult);
  } catch {
    return fallbackManagedSchools();
  }
}

export async function listHocLieuTeacherSubjects(_: { schoolId: string; academicYear: string }) {
  if (!hasApiBase()) {
    return Object.entries(fallbackSubjectDescriptions).map(
      ([id, description]): HocLieuTeacherDashboardSubject => ({
        id,
        label: id.toUpperCase(),
        description,
        progress: { progressRate: 0, taughtCount: 0, totalCount: 0, pendingCount: 0 },
      }),
    );
  }

  const subjects = await listHocLieuSubjects();
  return subjects.map((subject): HocLieuTeacherDashboardSubject => ({
    id: subject.id,
    label: subject.label,
    description: subject.description || fallbackSubjectDescriptions[subject.id],
    progress: { progressRate: 0, taughtCount: 0, totalCount: 0, pendingCount: 0 },
  }));
}

export function loadHocLieuTeacherSubjectTree(input: { subjectId: string; schoolId: string; academicYear: string; parentId?: string }) {
  const cacheKey = [input.subjectId, input.parentId ?? "root", input.schoolId, input.academicYear].join("::");
  const inFlight = subjectTreeCache.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const search = new URLSearchParams();
  search.set("schoolId", input.schoolId);
  search.set("academicYear", input.academicYear);
  if (input.parentId) {
    search.set("parentId", input.parentId);
  }

  const request = withTeacherDashboardTimeout(
    apiRequest<HocLieuTeacherSubjectTree>(`/api/hoclieu/teacher/subjects/${encodeURIComponent(input.subjectId)}/tree?${search.toString()}`),
  ).finally(() => {
    subjectTreeCache.delete(cacheKey);
  });

  subjectTreeCache.set(cacheKey, request);
  return request;
}

export function listHocLieuRecentOpened(input: { schoolId: string; academicYear: string; limit?: number }) {
  const search = new URLSearchParams();
  search.set("schoolId", input.schoolId);
  search.set("academicYear", input.academicYear);
  search.set("limit", String(input.limit ?? 8));
  return withTeacherDashboardTimeout(apiRequest<HocLieuTeacherRecentLecture[]>(`/api/hoclieu/teacher/recent-opened?${search.toString()}`));
}

export function loadHocLieuTeacherProgress(input: { subjectId: string; schoolId: string; academicYear: string; nodeId?: string }) {
  const cacheKey = [input.subjectId, input.nodeId ?? "root", input.schoolId, input.academicYear].join("::");
  const inFlight = subjectProgressCache.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const search = new URLSearchParams();
  search.set("subjectId", input.subjectId);
  search.set("schoolId", input.schoolId);
  search.set("academicYear", input.academicYear);
  if (input.nodeId) {
    search.set("nodeId", input.nodeId);
  }

  const request = withTeacherDashboardTimeout(apiRequest<HocLieuTeacherProgressDetail>(`/api/hoclieu/teacher/progress?${search.toString()}`)).finally(() => {
    subjectProgressCache.delete(cacheKey);
  });

  subjectProgressCache.set(cacheKey, request);
  return request;
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

export function getSubjectFallbackDescription(subject: Pick<HocLieuTaxonomyOption, "id" | "description">) {
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
