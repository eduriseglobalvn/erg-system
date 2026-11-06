import type { StoredAuthIdentity } from "@/platform/auth/api/auth-token-storage";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";
import type { StudentSession } from "@/platform/auth/api/student-auth-storage";

/**
 * Global authentication bypass flag for UI preview, offline testing, and deployment.
 * Only honoured in the Vite dev server (import.meta.env.DEV) and only when VITE_AUTH_BYPASS=true,
 * so a production build can never ship with the bypass on. The fixtures below are DEV-gated so they are dropped from production bundles (CI greps dist/).
 */
export const AUTH_BYPASS_ENABLED = import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === "true";

export const DEFAULT_BYPASS_ACCOUNT = (import.meta.env.DEV
  ? {
    id: "dev-admin-id",
    fullName: "Quản trị viên ERG",
    email: "admin@erg.edu.vn",
    role: "admin",
    provider: "password",
    department: "Ban Giám hiệu",
    title: "Quản trị viên Hệ thống",
    features: ["*"],
    isProfileCompleted: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: "2026-01-01T00:00:00.000Z",
    lifecycle: {
      status: "ACTIVE",
      isProfileCompleted: true,
      recoveryEmailMasked: "a***@erg.edu.vn",
      recoveryEmailVerified: true,
      mustChangePassword: false,
      nextSteps: [],
    },
    }
  : null) as unknown as TeacherAccount;

export const DEFAULT_BYPASS_SESSION = (import.meta.env.DEV
  ? {
    accountId: "dev-admin-id",
    accountEmail: "admin@erg.edu.vn",
    portal: "lms",
    tenantId: "default",
    accessToken: "dev-bypass-access-token",
    permissions: ["*"],
    portals: ["lms", "lcms", "crm", "elearning"],
    workspaces: ["ADMIN", "TEACHER", "STUDENT", "CRM"],
    expiresAt: "2099-12-31T23:59:59.000Z",
    loggedInAt: "2026-01-01T00:00:00.000Z",
    rememberMe: true,
    }
  : null) as unknown as StoredAuthIdentity;

export const DEFAULT_BYPASS_STUDENT_SESSION = (import.meta.env.DEV
  ? {
    id: "dev-student-id",
    accessToken: "dev-bypass-student-token",
    name: "Học viên ERG",
    email: "student@erg.edu.vn",
    className: "12A1",
    schoolName: "THPT Chuyên ERG",
    portal: "elearning",
    permissions: ["*"],
    loggedInAt: "2026-01-01T00:00:00.000Z",
    rememberMe: true,
    }
  : null) as unknown as StudentSession;
