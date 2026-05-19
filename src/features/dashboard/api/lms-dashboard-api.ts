import {
  classroomSchools,
  classroomSnapshots,
  defaultClassId,
  defaultSchoolId,
} from "@/features/classroom/api/mock-classroom-data";
import type { ClassroomClusterId, ClassroomSchool, ClassroomSnapshot } from "@/features/classroom/types/classroom-types";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import type { DashboardUserPermissions, ManagementScope } from "@/types/scope-types";

type EducationUnitType = "system" | "school" | "center";

export type LmsEducationUnitDTO = {
  id: string;
  type?: EducationUnitType | string;
  name: string;
  code?: string;
  parentId?: string;
  avatarUrl?: string;
  address?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  status?: string;
  managerUserId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LmsClassDTO = {
  id: string;
  centerId: string;
  unitId?: string;
  centerName?: string;
  name: string;
  grade?: string;
  academicYear?: string;
  status?: string;
};

type LmsScopeDTO = {
  level: "global" | "system" | "center" | "class";
  type?: string;
  unitType?: string;
  centerId?: string;
  centerName?: string;
  classId?: string;
  className?: string;
};

type LmsScopeResponseDTO = {
  canAccessGlobalErg: boolean;
  assignedCenters: LmsEducationUnitDTO[];
  assignedClasses: LmsClassDTO[];
  currentScope: LmsScopeDTO;
  availableScopes?: LmsScopeDTO[];
};

type ListResponse<T> = {
  items: T[];
  total: number;
};

export type LmsDashboardBootstrap = {
  classes: ClassroomSnapshot[];
  managementScope: ManagementScope;
  permissions: DashboardUserPermissions;
  schools: ClassroomSchool[];
  systemUnits: LmsEducationUnitDTO[];
};

export type CreateEducationUnitInput = {
  address?: string;
  avatarUrl?: string;
  code: string;
  description?: string;
  email?: string;
  name: string;
  parentId?: string;
  phone?: string;
  type: EducationUnitType;
  website?: string;
};

export type UpdateEducationUnitInput = Partial<Omit<CreateEducationUnitInput, "code">> & {
  status?: string;
  managerUserId?: string;
};

export async function listEducationUnits(params: Record<string, string | number | undefined> = {}) {
  if (!hasApiBase()) return { items: mockBootstrap().systemUnits, total: mockBootstrap().systemUnits.length };

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  if (!search.has("limit")) search.set("limit", "100");
  return apiRequest<ListResponse<LmsEducationUnitDTO>>(`/api/lms/education-units?${search.toString()}`);
}

export async function loadLmsDashboardBootstrap(): Promise<LmsDashboardBootstrap> {
  if (!hasApiBase()) return mockBootstrap();

  const [scopeResult, unitsResult, classesResult] = await Promise.allSettled([
    apiRequest<LmsScopeResponseDTO>("/api/lms/scopes/me"),
    apiRequest<ListResponse<LmsEducationUnitDTO>>("/api/lms/education-units?limit=100"),
    apiRequest<ListResponse<LmsClassDTO>>("/api/lms/classes?limit=100"),
  ]);

  const scope = scopeResult.status === "fulfilled" ? scopeResult.value : undefined;
  const units = unitsResult.status === "fulfilled" ? unitsResult.value : undefined;
  const classes = classesResult.status === "fulfilled" ? classesResult.value : undefined;
  const educationUnits = uniqueUnits([...(scope?.assignedCenters ?? []), ...(units?.items ?? [])]);
  const systemUnits = educationUnits.filter(isSystemUnit);
  const schoolUnits = educationUnits.filter((unit) => !isSystemUnit(unit));
  const snapshots = classesToSnapshots(classes?.items ?? scope?.assignedClasses ?? [], schoolUnits);
  const schools = unitsToSchools(schoolUnits, snapshots);

  return {
    classes: snapshots,
    managementScope: scopeToManagementScope(scope?.currentScope, snapshots),
    permissions: {
      canAccessGlobalErg: hasSystemScope(scope, systemUnits),
      assignedCenterIds: schoolUnits.map((unit) => unit.id),
    },
    schools,
    systemUnits,
  };
}

export async function updateLmsCurrentScope(scope: ManagementScope) {
  if (!hasApiBase()) return;

  await apiRequest("/api/lms/scopes/current", {
    method: "PUT",
    body: JSON.stringify({
      level: scope.level,
      centerId: scope.level === "global" ? undefined : scope.centerId,
      classId: scope.level === "class" ? scope.classId : undefined,
    }),
  });
}

export async function createEducationUnit(input: CreateEducationUnitInput) {
  if (!hasApiBase()) {
    return {
      id: `unit-${Math.random().toString(36).slice(2, 9)}`,
      name: input.name,
      type: input.type,
      code: input.code,
      status: "active",
    } satisfies LmsEducationUnitDTO;
  }

  return apiRequest<LmsEducationUnitDTO>("/api/lms/education-units", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateEducationUnit(id: string, input: UpdateEducationUnitInput) {
  if (!hasApiBase()) {
    return {
      id,
      name: input.name || "Cơ sở giáo dục",
      type: input.type || "school",
      code: "LOCAL",
      status: input.status || "active",
      ...input,
    } satisfies LmsEducationUnitDTO;
  }

  return apiRequest<LmsEducationUnitDTO>(`/api/lms/education-units/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

function mockBootstrap(): LmsDashboardBootstrap {
  return {
    classes: classroomSnapshots,
    managementScope: { level: "class", centerId: defaultSchoolId, classId: defaultClassId },
    permissions: {
      canAccessGlobalErg: true,
      assignedCenterIds: classroomSchools.map((school) => school.id),
    },
    schools: classroomSchools,
    systemUnits: [
      { id: "erg-system", type: "system", name: "Hệ thống ERG", code: "ERG-SYSTEM", status: "active" },
      { id: "hoclieu-studio", type: "system", name: "Hoclieu Studio", code: "HOCLIEU-STUDIO", status: "active" },
    ],
  };
}

function isSystemUnit(unit: LmsEducationUnitDTO) {
  return unit.type === "system" || unit.code === "ERG-SYSTEM" || unit.code === "HOCLIEU-STUDIO";
}

function hasSystemScope(scope: LmsScopeResponseDTO | undefined, systemUnits: LmsEducationUnitDTO[] = []) {
  return Boolean(
    systemUnits.length > 0 ||
      scope?.canAccessGlobalErg ||
      scope?.currentScope?.level === "global" ||
      scope?.currentScope?.type === "system" ||
      scope?.availableScopes?.some((item) => item.level === "global" || item.type === "system"),
  );
}

function uniqueUnits(units: LmsEducationUnitDTO[]) {
  const seen = new Set<string>();
  return units.filter((unit) => {
    if (!unit.id || seen.has(unit.id)) return false;
    seen.add(unit.id);
    return true;
  });
}

function unitsToSchools(units: LmsEducationUnitDTO[], snapshots: ClassroomSnapshot[]): ClassroomSchool[] {
  return units.map((unit, index) => {
    const unitClasses = snapshots.filter((snapshot) => snapshot.schoolId === unit.id);
    return {
      id: unit.id,
      name: unit.name,
      clusterId: clusterByIndex(index),
      principal: unit.type === "school" ? "Quản trị trường" : "Quản trị trung tâm",
      activeStudents: unitClasses.reduce((sum, item) => sum + item.studentCount, 0),
      activeClasses: unitClasses.length,
      completionRate: average(unitClasses.map((item) => item.completionRate), 84),
      averageScore: average(unitClasses.map((item) => item.averageScore), 82),
      overdueAssignments: 0,
      flaggedStudents: unitClasses.reduce((sum, item) => sum + item.riskStudents, 0),
    };
  });
}

function classesToSnapshots(classes: LmsClassDTO[], units: LmsEducationUnitDTO[]): ClassroomSnapshot[] {
  return classes.map((classroom, index) => {
    const unit = units.find((item) => item.id === classroom.centerId || item.id === classroom.unitId);
    const grade = classroom.grade?.replace(/^grade-?/i, "") || classroom.name.match(/\d+/)?.[0] || "6";
    return {
      id: classroom.id,
      schoolId: classroom.centerId || classroom.unitId || unit?.id || defaultSchoolId,
      schoolName: classroom.centerName || unit?.name || "ERG Learning",
      clusterId: clusterByIndex(index),
      className: classroom.name,
      gradeLabel: `Khối ${grade}`,
      homeroomTeacher: "Giáo viên chủ nhiệm",
      studentCount: 0,
      activeAssignments: 0,
      completionRate: 0,
      averageScore: 0,
      riskStudents: 0,
      competitionPoints: 0,
      lastSubmissionAt: "Chưa có dữ liệu",
    };
  });
}

function scopeToManagementScope(scope: LmsScopeDTO | undefined, classes: ClassroomSnapshot[]): ManagementScope {
  if (!scope || scope.level === "global" || scope.level === "system" || scope.type === "system") {
    return { level: "global" };
  }

  if (scope.level === "class" && scope.centerId && scope.classId) {
    return { level: "class", centerId: scope.centerId, classId: scope.classId };
  }

  if (scope.centerId) return { level: "center", centerId: scope.centerId };

  const firstClass = classes[0];
  return firstClass ? { level: "class", centerId: firstClass.schoolId, classId: firstClass.id } : { level: "global" };
}

function average(values: number[], fallback: number) {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!filtered.length) return fallback;
  return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
}

function clusterByIndex(index: number): ClassroomClusterId {
  return index % 3 === 0 ? "central" : index % 3 === 1 ? "east" : "south";
}
