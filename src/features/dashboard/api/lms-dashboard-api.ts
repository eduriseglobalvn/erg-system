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

type ListResponse<T> = {
  items: T[];
  total: number;
};

type SessionCurrentResponseDTO = {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  permissions: {
    canAccessGlobalErg: boolean;
    roles: string[];
    grantedPermissions: string[];
    deniedPermissions: string[];
  };
  currentScope: {
    level: "system" | "center" | "school" | "class";
    unitId: string;
    classId?: string;
  };
  availableScopeOptions?: Array<{
    level: "system" | "center" | "school" | "class";
    unitId: string;
    label: string;
  }>;
  manageableUnits: Array<{
    id: string;
    type?: EducationUnitType | string;
    level?: EducationUnitType | "class" | string;
    name: string;
    avatar?: string;
    avatarUrl?: string;
    parentId?: string | null;
  }>;
  manageableClasses?: Array<{
    id: string;
    name: string;
    unitId: string;
  }>;
};

export type LmsDashboardBootstrap = {
  classes: ClassroomSnapshot[];
  managementScope: ManagementScope;
  manageableUnits: LmsEducationUnitDTO[];
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

export async function loadCurrentSessionBootstrap() {
  if (!hasApiBase()) {
    return null;
  }

  return apiRequest<SessionCurrentResponseDTO>("/api/v1/sessions/current");
}

export async function listManageableUnits() {
  if (!hasApiBase()) {
    return mockBootstrap().systemUnits;
  }

  const session = await loadCurrentSessionBootstrap();
  return session ? normalizeManageableUnits(session) : [];
}

export async function listEducationUnits(params: Record<string, string | number | undefined> = {}) {
  if (!hasApiBase()) return { items: mockBootstrap().systemUnits, total: mockBootstrap().systemUnits.length };

  const session = await loadCurrentSessionBootstrap();
  if (!session) return { items: [], total: 0 };
  const limit = Number(params.limit ?? 100);
  const keyword = String(params.keyword ?? params.search ?? "").trim().toLowerCase();
  const typeFilter = String(params.type ?? "").trim();
  const items = normalizeManageableUnits(session)
    .filter((unit) => !typeFilter || unit.type === typeFilter)
    .filter((unit) => !keyword || unit.name.toLowerCase().includes(keyword) || unit.code?.toLowerCase().includes(keyword))
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : undefined);

  return { items, total: items.length } satisfies ListResponse<LmsEducationUnitDTO>;
}

export async function loadLmsDashboardBootstrap(): Promise<LmsDashboardBootstrap> {
  if (!hasApiBase()) return mockBootstrap();

  const session = await loadCurrentSessionBootstrap();
  if (!session) return mockBootstrap();

  const educationUnits = uniqueUnits(normalizeManageableUnits(session));
  const systemUnits = educationUnits.filter(isSystemUnit);
  const schoolUnits = educationUnits.filter((unit) => !isSystemUnit(unit));
  const snapshots = classesToSnapshots(normalizeManageableClasses(session.manageableClasses ?? [], educationUnits), schoolUnits);
  const schools = unitsToSchools(schoolUnits, snapshots);

  return {
    classes: snapshots,
    managementScope: sessionScopeToManagementScope(session.currentScope, snapshots, schoolUnits),
    manageableUnits: educationUnits,
    permissions: {
      canAccessGlobalErg: hasSystemScope(session, systemUnits),
      assignedCenterIds: schoolUnits.map((unit) => unit.id),
    },
    schools,
    systemUnits,
  };
}

export async function updateLmsCurrentScope(scope: ManagementScope) {
  void scope;
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
    manageableUnits: [
      { id: "erg-system", type: "system", name: "Hệ thống ERG", code: "ERG-SYSTEM", status: "active" },
      { id: "hoclieu-studio", type: "center", name: "Hoclieu Studio", code: "HOCLIEU-STUDIO", status: "active" },
      ...classroomSchools.map((school) => ({ id: school.id, type: "school", name: school.name, status: "active" })),
    ],
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

function normalizeManageableUnits(session: SessionCurrentResponseDTO): LmsEducationUnitDTO[] {
  const scopeOptions = session.availableScopeOptions ?? [];
  const levelByUnitId = new Map(scopeOptions.map((scope) => [scope.unitId, scope.level]));
  const labelByUnitId = new Map(scopeOptions.map((scope) => [scope.unitId, scope.label]));
  const units: LmsEducationUnitDTO[] = session.manageableUnits.map((unit) => {
    const inferredType = normalizeUnitType(unit.type ?? unit.level ?? levelByUnitId.get(unit.id));
    return {
      id: unit.id,
      type: inferredType,
      name: unit.name || labelByUnitId.get(unit.id) || unit.id,
      parentId: unit.parentId ?? undefined,
      avatarUrl: unit.avatarUrl || unit.avatar,
      code: getKnownUnitCode(unit.id, unit.name, inferredType),
    } satisfies LmsEducationUnitDTO;
  });

  const hasCurrentSystemUnit = session.currentScope.level === "system" && !units.some((unit) => unit.id === session.currentScope.unitId);
  if (hasCurrentSystemUnit) {
    units.unshift({
      id: session.currentScope.unitId,
      type: "system",
      name: labelByUnitId.get(session.currentScope.unitId) || "ERG System",
      code: "ERG-SYSTEM",
    });
  }

  return units;
}

function normalizeManageableClasses(
  classes: NonNullable<SessionCurrentResponseDTO["manageableClasses"]>,
  units: LmsEducationUnitDTO[],
): LmsClassDTO[] {
  return classes.map((classroom) => {
    const unit = units.find((item) => item.id === classroom.unitId);
    return {
      id: classroom.id,
      centerId: classroom.unitId,
      unitId: classroom.unitId,
      centerName: unit?.name,
      name: classroom.name,
      status: "active",
    };
  });
}

function isSystemUnit(unit: LmsEducationUnitDTO) {
  return unit.type === "system" || unit.code === "ERG-SYSTEM" || unit.code === "HOCLIEU-STUDIO";
}

function hasSystemScope(scope: SessionCurrentResponseDTO | undefined, systemUnits: LmsEducationUnitDTO[] = []) {
  return Boolean(
    systemUnits.length > 0 ||
      scope?.permissions?.canAccessGlobalErg ||
      scope?.currentScope?.level === "system" ||
      scope?.availableScopeOptions?.some((item) => item.level === "system"),
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

function sessionScopeToManagementScope(
  scope: SessionCurrentResponseDTO["currentScope"] | undefined,
  classes: ClassroomSnapshot[],
  schoolUnits: LmsEducationUnitDTO[],
): ManagementScope {
  if (!scope || scope.level === "system") {
    return { level: "global" };
  }

  if (scope.level === "class" && scope.unitId && scope.classId) {
    return { level: "class", centerId: scope.unitId, classId: scope.classId };
  }

  if (scope.level === "center" && scope.unitId) {
    return { level: "center", centerId: scope.unitId };
  }

  if (scope.level === "school" && scope.unitId) {
    const firstClass = classes.find((item) => item.schoolId === scope.unitId);
    if (firstClass) {
      return { level: "class", centerId: scope.unitId, classId: firstClass.id };
    }

    const matchingSchool = schoolUnits.find((item) => item.id === scope.unitId);
    if (matchingSchool) {
      return { level: "center", centerId: matchingSchool.id };
    }
  }

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

function normalizeUnitType(value: string | undefined): EducationUnitType | string | undefined {
  if (value === "system" || value === "center" || value === "school") return value;
  if (value === "class") return "school";
  return value;
}

function getKnownUnitCode(id: string, name: string, type: string | undefined) {
  const normalizedName = name.toLowerCase();
  if (id === "system" || (type === "system" && normalizedName.includes("hệ thống erg"))) return "ERG-SYSTEM";
  if (id === "ctr_hoclieu_001" || normalizedName.includes("học liệu studio") || normalizedName.includes("hoclieu studio")) {
    return "HOCLIEU-STUDIO";
  }
  return undefined;
}
