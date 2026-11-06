import type {
  PartnerSchool,
  SchoolStatus,
  SchoolType,
} from "@/features/lcms/school-management/types/school-management-types";
import type { DirectoryItem, OperationsWorkspace, SchoolCommandResponse } from "@/features/lcms/school-management/api/school-api/types";

export function mapDirectorySchool(item: DirectoryItem): PartnerSchool {
  return {
    id: item.id,
    code: item.id,
    name: item.name,
    address: "",
    district: item.district ?? "",
    principal: "",
    contactPhone: "",
    contactEmail: "",
    academicYear: item.academicYear ?? "",
    schoolType: fromApiSchoolType(item.schoolType),
    status: fromApiStatus(item.status),
    joinedAt: "",
    students: [],
    classes: [],
    grades: [],
    subjects: [],
    reviews: [],
    version: Number(item.version),
    studentCount: Number(item.studentCount),
    classCount: Number(item.classCount),
  };
}

export function mapOperations(workspace: OperationsWorkspace): PartnerSchool {
  const currentYear = workspace.academicYears.find((year) => year.id === workspace.school.currentAcademicYearId)
    ?? workspace.academicYears.find((year) => year.status.toUpperCase() === "ACTIVE")
    ?? workspace.academicYears[0];
  return {
    id: workspace.school.id,
    code: workspace.school.id,
    name: workspace.school.name,
    address: workspace.school.address ?? "",
    district: workspace.school.district ?? "",
    principal: workspace.school.principalName ?? "",
    contactPhone: workspace.school.contactPhone ?? "",
    contactEmail: workspace.school.contactEmail ?? "",
    academicYear: currentYear?.displayName ?? "",
    schoolType: fromApiSchoolType(workspace.school.schoolType),
    status: fromApiStatus(workspace.school.status),
    joinedAt: "",
    students: workspace.students.map((student) => ({
      id: student.id,
      code: student.code ?? "",
      fullName: student.fullName,
      birthDate: student.birthDate ?? "",
      grade: student.grade ?? "",
      className: student.className ?? "",
      guardianPhone: student.guardianPhone ?? "",
      subjectIds: student.subjectIds,
      status: student.status.toUpperCase() === "AT_RISK" ? "at-risk" : student.status.toUpperCase() === "ACTIVE" ? "studying" : "inactive",
      academicClassId: undefined,
    })),
    classes: workspace.classes.map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      grade: classroom.grade ?? "",
      homeroomTeacher: classroom.homeroomTeacher ?? "Chưa phân công",
      studentCount: classroom.studentCount,
      status: classroom.status ?? "",
      version: undefined,
    })),
    grades: workspace.grades.map((grade) => grade.gradeCode.replace(/^GRADE[-_]?/i, "")),
    subjects: workspace.subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code ?? "",
      studentCount: subject.studentCount,
      teacherCount: subject.teacherCount,
      status: "ACTIVE",
      version: undefined,
    })),
    reviews: [],
    version: Number(workspace.school.version),
    studentCount: Number(workspace.summary.studentCount),
    classCount: Number(workspace.summary.classCount),
    academicYears: workspace.academicYears.map((year) => ({ ...year, version: Number(year.version) })),
    gradeRecords: workspace.grades,
    permissions: workspace.permissions,
  };
}

export function mapCommandSchool(response: SchoolCommandResponse) {
  const currentYear = response.currentAcademicYear;
  return {
    id: response.id,
    version: Number(response.version),
    academicYear: currentYear?.displayName ?? "",
  };
}

export function toApiSchoolType(value: SchoolType) {
  return ({ primary: "PRIMARY", secondary: "SECONDARY", "high-school": "HIGH_SCHOOL", university: "UNIVERSITY", "training-center": "TRAINING_CENTER" } as const)[value];
}

export function fromApiSchoolType(value: string): SchoolType {
  return ({ PRIMARY: "primary", SECONDARY: "secondary", HIGH_SCHOOL: "high-school", UNIVERSITY: "university", TRAINING_CENTER: "training-center" } as const)[value.toUpperCase() as "PRIMARY"] ?? "training-center";
}

export function toApiStatus(value: SchoolStatus) {
  return ({ active: "ACTIVE", onboarding: "ONBOARDING", paused: "PAUSED" } as const)[value];
}

export function fromApiStatus(value: string): SchoolStatus {
  return ({ ACTIVE: "active", ONBOARDING: "onboarding", PAUSED: "paused", ARCHIVED: "paused" } as const)[value.toUpperCase() as "ACTIVE"] ?? "paused";
}

export function academicYearStart(value: string) {
  const year = Number(value.match(/\d{4}/)?.[0]);
  return Number.isFinite(year) && year >= 2000 ? year : new Date().getFullYear();
}
