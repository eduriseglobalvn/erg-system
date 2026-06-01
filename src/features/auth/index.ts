export { AuthWorkspace } from "@/features/auth/components/auth-workspace";
export { AccessDeniedPage } from "@/features/auth/components/access-denied-page";
export {
  AUTH_ACCOUNT_CHANGED_EVENT,
  getCurrentAccount,
  providerLabel,
  roleLabel,
} from "@/features/auth/api/auth-storage";
export { authApi } from "@/features/auth/api/auth-api";
export type {
  AccountRole,
  AccountTab,
  AuthMode,
  AuthProvider,
  Notice,
  TeacherAccount,
} from "@/features/auth/types/auth-types";
