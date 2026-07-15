import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import type { LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import type { ManagementScope } from "@/types/scope-types";

export interface DashboardContextBarProps {
  activePortal: "lms";
  canAccessGlobalErg: boolean;
  classes: ClassroomSnapshot[];
  manageableUnits: LmsEducationUnitDTO[];
  managementScope: ManagementScope;
  onLogout: () => void;
  onOpenLeaf: (leafId: DashboardLeaf["id"]) => void;
  onSelectClass: (classId: string) => void;
  onSelectScopeRoot: (schoolId: string | "global") => void;
  schools: ClassroomSchool[];
  selectedClassId?: string;
  selectedSchoolId?: string;
  systemUnits: LmsEducationUnitDTO[];
}
