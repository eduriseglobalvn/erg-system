export const teacherOnboardingSteps = [
  "COMPLETE_PROFILE",
  "VERIFY_RECOVERY_EMAIL",
  "CHANGE_PASSWORD",
] as const;

export type TeacherOnboardingStep = (typeof teacherOnboardingSteps)[number];

export type TeacherAccountLifecycleStatus =
  | "PROVISIONED"
  | "FIRST_LOGIN_RESTRICTED"
  | "ACTIVE"
  | "INACTIVE"
  | "BLOCKED";

export type TeacherAccountLifecycle = {
  status: TeacherAccountLifecycleStatus;
  isProfileCompleted: boolean;
  recoveryEmailMasked: string | null;
  recoveryEmailVerified: boolean;
  mustChangePassword: boolean;
  nextSteps: TeacherOnboardingStep[];
};

export function requiresTeacherOnboarding(lifecycle?: TeacherAccountLifecycle | null) {
  if (!lifecycle) return false;
  return lifecycle.status === "PROVISIONED" || lifecycle.status === "FIRST_LOGIN_RESTRICTED" || lifecycle.nextSteps.length > 0;
}
