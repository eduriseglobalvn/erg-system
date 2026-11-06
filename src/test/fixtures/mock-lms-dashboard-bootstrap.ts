import {
  classroomSchools,
  classroomSnapshots,
  defaultClassId,
  defaultSchoolId,
} from "@/test/fixtures/mock-classroom-data";
import type { LmsDashboardBootstrap } from "@/features/lms/infrastructure/lms-dashboard-api";

export function mockBootstrap(): LmsDashboardBootstrap {
  return {
    classes: classroomSnapshots,
    managementScope: { level: "class", centerId: defaultSchoolId, classId: defaultClassId },
    manageableUnits: [
      { id: "erg-system", type: "system", name: "Hệ thống ERG", code: "ERG-SYSTEM", status: "active" },
      { id: "learning-resources", type: "center", name: "Studio học liệu", code: "LEARNING-RESOURCES", status: "active" },
      ...classroomSchools.map((school) => ({ id: school.id, type: "school", name: school.name, status: "active" })),
    ],
    permissions: {
      canAccessGlobalErg: true,
      assignedCenterIds: classroomSchools.map((school) => school.id),
      roles: ["teacher", "lms_teacher_standard"],
      grantedPermissions: ["lms.*", "account.self.*"],
      deniedPermissions: [],
    },
    schools: classroomSchools,
    systemUnits: [
      { id: "erg-system", type: "system", name: "Hệ thống ERG", code: "ERG-SYSTEM", status: "active" },
      { id: "learning-resources", type: "system", name: "Studio học liệu", code: "LEARNING-RESOURCES", status: "active" },
    ],
  };
}
