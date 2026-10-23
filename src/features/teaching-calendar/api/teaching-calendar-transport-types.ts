export type SessionCurrentResponseDTO = {
  availableScopeOptions?: Array<{ label: string; level: "system" | "center" | "school" | "class" | string; unitId: string }>;
  currentScope?: { classId?: string; level: "system" | "center" | "school" | "class" | string; unitId: string };
  manageableClasses?: Array<{ id: string; name: string; unitId: string }>;
  manageableUnits?: Array<{
    id: string;
    level?: "system" | "center" | "school" | "class" | string;
    name: string;
    parentId?: string | null;
    type?: "system" | "center" | "school" | string;
  }>;
};

export type EducationUnitDTO = {
  code?: string | null;
  id: string;
  label?: string | null;
  name?: string | null;
  status?: string | null;
  type?: "system" | "center" | "school" | string | null;
};

export type LmsEducationUnitListResponseDTO = { items?: EducationUnitDTO[] };
export type OrganizationEducationUnitListResponseDTO = { educationUnits?: EducationUnitDTO[]; items?: EducationUnitDTO[] };
