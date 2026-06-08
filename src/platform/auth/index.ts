export { AuthWorkspace } from "@/platform/auth/components/auth-workspace";
export { AccessDeniedPage } from "@/platform/auth/components/access-denied-page";
export {
  AUTH_ACCOUNT_CHANGED_EVENT,
  getCurrentAccount,
  providerLabel,
  roleLabel,
} from "@/platform/auth/api/auth-storage";
export { authApi } from "@/platform/auth/api/auth-api";
export type {
  AccountRole,
  AccountTab,
  AuthMode,
  AuthProvider,
  Notice,
  TeacherAccount,
} from "@/platform/auth/types/auth-types";
