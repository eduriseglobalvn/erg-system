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
  // Only the password change gates a first login; profile and recovery email are optional (an older BE may still list them).
  return lifecycle.mustChangePassword || lifecycle.nextSteps.includes("CHANGE_PASSWORD");
}
