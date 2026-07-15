import { lmsPaths } from "@/app/portal-route-registry";

export const LMS_PERMISSION_CATALOG = [
  "lms.portal.access",
  "lms.dashboard.read",
  "lms.class.read",
  "lms.class.manage",
  "lms.student.read",
  "lms.student_group.read",
  "lms.student_group.create",
  "lms.student_group.update",
  "lms.student_group.delete",
  "lms.assignment.read",
  "lms.assignment.create",
  "lms.assignment.update",
  "lms.assignment.delete",
  "lms.assignment.assign",
  "lms.assignment.progress.read",
  "lms.exercise.read",
  "lms.exercise.create",
  "lms.exercise.update",
  "lms.exercise.delete",
  "lms.exercise.assign",
  "lms.grade.read",
  "lms.grade.write",
  "lms.grade.finalize",
  "lms.grade.export",
  "lms.attendance.read",
  "lms.attendance.write",
  "lms.attendance.export",
  "lms.schedule.read",
  "lms.schedule.create",
  "lms.schedule.update",
  "lms.schedule.delete",
  "lms.schedule.publish",
  "lms.schedule.import",
  "lms.class_log.read",
  "lms.class_log.write",
  "lms.resource.read",
  "lms.resource.create",
  "lms.resource.update",
  "lms.resource.delete",
  "lms.resource.share",
  "lms.report.read",
  "lms.report.export",
  "lms.notification.read",
  "lms.notification.preferences.update",
  "account.self.read",
  "account.self.update",
  "account.self.recovery_email.update",
  "account.self.password.change",
  "account.self.sessions.read",
] as const;

export type LmsPermission = (typeof LMS_PERMISSION_CATALOG)[number];

export const LMS_PROTECTED_ROUTES = [...lmsPaths, "resources", "homework/class"] as const;

export type LmsProtectedRoute = (typeof LMS_PROTECTED_ROUTES)[number];

export const LMS_ROUTE_PERMISSIONS = {
  home: "lms.dashboard.read",
  dashboard: "lms.dashboard.read",
  homework: "lms.assignment.read",
  "homework/assign": "lms.assignment.create",
  "homework/exercise-bank": "lms.exercise.read",
  "homework/progress": "lms.assignment.progress.read",
  "homework/student-groups": "lms.student_group.read",
  "homework/class": "lms.class.read",
  notifications: "lms.notification.read",
  account: "account.self.read",
  "account/login-logs": "account.self.sessions.read",
  score: "lms.grade.read",
  attendance: "lms.attendance.read",
  calendar: "lms.schedule.read",
  "class-log": "lms.class_log.read",
  reports: "lms.report.read",
  resources: "lms.resource.read",
} as const satisfies Record<LmsProtectedRoute, LmsPermission>;

type LmsRoleGroupTemplate = {
  name: string;
  permissions: readonly LmsPermission[];
};

const readonlyPermissions = [
  "lms.portal.access",
  "lms.dashboard.read",
  "lms.class.read",
  "lms.student.read",
  "lms.assignment.read",
  "lms.assignment.progress.read",
  "lms.exercise.read",
  "lms.grade.read",
  "lms.attendance.read",
  "lms.schedule.read",
  "lms.class_log.read",
  "lms.resource.read",
  "lms.report.read",
  "lms.notification.read",
] as const satisfies readonly LmsPermission[];

const standardPermissions = [
  ...readonlyPermissions,
  "lms.student_group.read",
  "lms.student_group.create",
  "lms.student_group.update",
  "lms.assignment.create",
  "lms.assignment.update",
  "lms.assignment.assign",
  "lms.exercise.create",
  "lms.exercise.update",
  "lms.schedule.create",
  "lms.schedule.update",
  "lms.resource.create",
  "lms.resource.update",
  "lms.resource.share",
] as const satisfies readonly LmsPermission[];

export const LMS_ROLE_GROUP_TEMPLATES = {
  lms_teacher_standard: {
    name: "Giáo viên tiêu chuẩn",
    permissions: standardPermissions,
  },
  lms_homeroom_teacher: {
    name: "Giáo viên chủ nhiệm",
    permissions: [...standardPermissions, "lms.class.manage", "lms.student_group.delete"],
  },
  lms_subject_teacher: {
    name: "Giáo viên bộ môn",
    permissions: standardPermissions,
  },
  lms_teacher_assistant: {
    name: "Trợ giảng",
    permissions: [
      ...readonlyPermissions,
      "lms.student_group.read",
      "lms.assignment.update",
    ],
  },
  lms_teacher_readonly: {
    name: "Giáo viên chỉ xem",
    permissions: readonlyPermissions,
  },
  lms_teacher_lead: {
    name: "Tổ trưởng chuyên môn",
    permissions: [
      ...standardPermissions,
      "lms.schedule.publish",
      "lms.schedule.import",
    ],
  },
} as const satisfies Record<string, LmsRoleGroupTemplate>;
