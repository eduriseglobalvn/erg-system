import { classroomSchools } from "@/features/classroom/api/mock-classroom-data";
import { listHocLieuSubjects, type HocLieuTaxonomyOption } from "@/features/admin-operations/api/learning-resource-authoring-api";
import { listManageableUnits, type LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import type {
  HocLieuManagedSchool,
  HocLieuTeacherDashboardSubject,
  HocLieuTeacherProgressDetail,
  HocLieuTeacherRecentLecture,
  HocLieuTeacherSubjectTree,
} from "@/features/lms/learning-resources/types/teacher-resource-dashboard-types";
import { apiRequest, hasApiBase } from "@/lib/api-client";

const subjectProgressCache = new Map<string, Promise<HocLieuTeacherProgressDetail>>();
const subjectTreeCache = new Map<string, Promise<HocLieuTeacherSubjectTree>>();
const TEACHER_DASHBOARD_TIMEOUT_MS = 8000;

const fallbackSubjectDescriptions: Record<string, string> = {
  toan: "Theo dÃµi tiáº¿n Ä‘á»™ dáº¡y há»c vÃ  tÃ i liá»‡u Ä‘ang dÃ¹ng cho mÃ´n ToÃ¡n.",
  "tieng-viet": "Danh sÃ¡ch ná»™i dung Tiáº¿ng Viá»‡t Ä‘ang triá»ƒn khai trong nÄƒm há»c hiá»‡n táº¡i.",
  "tu-nhien-xa-hoi": "Chá»§ Ä‘á» vÃ  há»c liá»‡u Tá»± nhiÃªn vÃ  XÃ£ há»™i phá»¥c vá»¥ dáº¡y há»c háº±ng tuáº§n.",
  "ngu-van": "Theo dÃµi chÆ°Æ¡ng trÃ¬nh, chá»§ Ä‘á» vÃ  bÃ i há»c Ngá»¯ vÄƒn theo trÆ°á»ng.",
  "tieng-anh": "Há»c liá»‡u SGK, sÃ¡ch má»m vÃ  bÃ i giáº£ng cho giÃ¡o viÃªn Tiáº¿ng Anh.",
  "khoa-hoc-tu-nhien": "Tiáº¿n Ä‘á»™ dáº¡y há»c Khoa há»c tá»± nhiÃªn theo tá»«ng chá»§ Ä‘á» vÃ  bÃ i há»c.",
  "lich-su-dia-li": "Ná»™i dung Lá»‹ch sá»­ vÃ  Äá»‹a lÃ­ Ä‘ang dáº¡y trong trÆ°á»ng.",
  "giao-duc-stem": "Lesson kit, dá»± Ã¡n STEM vÃ  ná»™i dung minh há»a theo chá»§ Ä‘á».",
  "giao-duc-ki-nang-cong-dan-so": "TÃ i nguyÃªn ká»¹ nÄƒng sá»‘ vÃ  cÃ´ng dÃ¢n sá»‘ cho giÃ¡o viÃªn.",
  "tin-hoc": "BÃ i giáº£ng, thá»±c hÃ nh vÃ  kho tÃ i nguyÃªn Tin há»c.",
  ic3: "TÃ i nguyÃªn giáº£ng dáº¡y vÃ  luyá»‡n thi chá»©ng chá»‰ IC3.",
  mos: "Lá»™ trÃ¬nh bÃ i dáº¡y, file thá»±c hÃ nh vÃ  bÃ i kiá»ƒm tra MOS.",
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
    principal: unit.type === "school" ? "Quáº£n trá»‹ trÆ°á»ng" : "Quáº£n trá»‹ trung tÃ¢m",
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
  if (!value) return "ChÆ°a cÃ³ dá»¯ liá»‡u";

  const diffMs = Date.now() - Date.parse(value);
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) return `${diffMinutes} phÃºt trÆ°á»›c`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giá» trÆ°á»›c`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngÃ y trÆ°á»›c`;
}

export function getSubjectFallbackDescription(subject: Pick<HocLieuTaxonomyOption, "id" | "description">) {
  return subject.description || fallbackSubjectDescriptions[subject.id] || "Theo dÃµi tiáº¿n Ä‘á»™ mÃ´n há»c, chá»§ Ä‘á» vÃ  bÃ i há»c Ä‘ang Ä‘Æ°á»£c dáº¡y.";
}

function withTeacherDashboardTimeout<T>(promise: Promise<T>, timeoutMs = TEACHER_DASHBOARD_TIMEOUT_MS) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("Teacher dashboard request timed out.")), timeoutMs);
    }),
  ]);
}
