import type { ErgScheduleCatalog } from "@/components/shared/erg-calendar-workspace";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import type { GraphQlPortal } from "@/lib/graphql-client";

import type {
  EducationUnitDTO,
  LmsEducationUnitListResponseDTO,
  OrganizationEducationUnitListResponseDTO,
  SessionCurrentResponseDTO,
} from "./teaching-calendar-transport-types";

export async function loadTeachingCalendarSessionCatalog(portal: GraphQlPortal = "lms", signal?: AbortSignal) {
  if (!hasApiBase()) return emptyErgScheduleCatalog();
  const session = await apiRequest<SessionCurrentResponseDTO>(API_ENDPOINTS.legacy.v1SessionsCurrent, { portal, signal });
  return mapSessionToErgScheduleCatalog(session);
}

export async function loadTeachingCalendarReferenceCatalog(portal: GraphQlPortal = "lms", signal?: AbortSignal) {
  if (!hasApiBase()) return emptyErgScheduleCatalog();
  const scopedSchools = await loadScopedEducationUnitSchools(portal, signal);
  if (scopedSchools.length) return mapSchoolsToErgScheduleCatalog(scopedSchools);
  const organizationSchools = await loadOrganizationEducationUnitSchools(portal, signal);
  if (organizationSchools.length) return mapSchoolsToErgScheduleCatalog(organizationSchools);
  return loadTeachingCalendarSessionCatalog(portal, signal);
}

function mapSessionToErgScheduleCatalog(session: SessionCurrentResponseDTO): ErgScheduleCatalog {
  const scopeLabels = new Map((session.availableScopeOptions ?? []).map((scope) => [scope.unitId, scope.label]));
  const units = session.manageableUnits ?? [];
  const schoolUnits = units.filter(isScheduleSchoolUnit);
  const fallbackUnits = schoolUnits.length ? schoolUnits : units.filter((unit) => !isSystemEducationUnit(unit));
  const schools = uniqueById(fallbackUnits.map((unit) => ({ id: unit.id, name: unit.name || scopeLabels.get(unit.id) || unit.id })));
  const classes = uniqueById((session.manageableClasses ?? []).map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    schoolId: classroom.unitId,
  })));
  return { assistantTeachers: [], classes, levels: [], rooms: [], schools, subjects: [], teachers: [] };
}

async function loadScopedEducationUnitSchools(portal: GraphQlPortal, signal?: AbortSignal) {
  try {
    const response = await apiRequest<LmsEducationUnitListResponseDTO>(API_ENDPOINTS.lms.educationUnits, { portal, signal });
    return mapEducationUnitsToScheduleSchools(response.items ?? []);
  } catch (error) {
    if (signal?.aborted) throw signal.reason ?? error;
    return [];
  }
}

async function loadOrganizationEducationUnitSchools(portal: GraphQlPortal, signal?: AbortSignal) {
  try {
    const response = await apiRequest<OrganizationEducationUnitListResponseDTO>(API_ENDPOINTS.legacy.v1EducationUnits, { portal, signal });
    return mapEducationUnitsToScheduleSchools(response.educationUnits ?? response.items ?? []);
  } catch (error) {
    if (signal?.aborted) throw signal.reason ?? error;
    return [];
  }
}

function mapSchoolsToErgScheduleCatalog(schools: ErgScheduleCatalog["schools"]): ErgScheduleCatalog {
  return { ...emptyErgScheduleCatalog(), schools };
}

function mapEducationUnitsToScheduleSchools(units: EducationUnitDTO[]): ErgScheduleCatalog["schools"] {
  const schoolUnits = units.filter(isScheduleEducationUnitSchool);
  const fallbackUnits = schoolUnits.length ? schoolUnits : units.filter((unit) => !isSystemLikeEducationUnit(unit));
  return uniqueById(fallbackUnits.map((unit) => ({
    id: unit.id,
    name: unit.name?.trim() || unit.label?.trim() || unit.id,
  }))).sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function emptyErgScheduleCatalog(): ErgScheduleCatalog {
  return { assistantTeachers: [], classes: [], levels: [], rooms: [], schools: [], subjects: [], teachers: [] };
}

function isScheduleSchoolUnit(unit: NonNullable<SessionCurrentResponseDTO["manageableUnits"]>[number]) {
  const normalizedType = (unit.type ?? unit.level ?? "").trim().toLowerCase();
  return normalizedType === "school" || normalizedType === "center";
}

function isScheduleEducationUnitSchool(unit: EducationUnitDTO) {
  const normalizedType = (unit.type ?? "").trim().toLowerCase();
  const normalizedStatus = (unit.status ?? "").trim().toLowerCase();
  return (normalizedType === "school" || normalizedType === "center") && normalizedStatus !== "inactive";
}

function isSystemEducationUnit(unit: NonNullable<SessionCurrentResponseDTO["manageableUnits"]>[number]) {
  const normalizedType = (unit.type ?? unit.level ?? "").trim().toLowerCase();
  const normalizedName = unit.name.trim().toLowerCase();
  return normalizedType === "system" || normalizedName.includes("erg system") || normalizedName.includes("hệ thống erg");
}

function isSystemLikeEducationUnit(unit: EducationUnitDTO) {
  const normalizedType = (unit.type ?? "").trim().toLowerCase();
  const normalizedName = (unit.name ?? unit.label ?? "").trim().toLowerCase();
  const normalizedCode = (unit.code ?? "").trim().toLowerCase();
  const normalizedStatus = (unit.status ?? "").trim().toLowerCase();
  return normalizedStatus === "inactive" || normalizedType === "system" || normalizedCode === "erg-system"
    || normalizedName.includes("erg system") || normalizedName.includes("hệ thống erg");
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
