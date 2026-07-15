import { getDefaultTenantId } from "@/lib/graphql-client";

export const queryKeys = {
  account: {
    loginSessions: (tenantId: string, accountId: string | undefined) => ["account", "login-sessions", tenantId, accountId ?? "anonymous"] as const,
  },
  adminOperations: {
    educationUnits: (keyword?: string, typeFilter?: string, tenantId: string = getDefaultTenantId()) =>
      keyword === undefined && typeFilter === undefined
        ? (["admin-operations", "education-units", tenantId] as const)
        : (["admin-operations", "education-units", tenantId, keyword, typeFilter] as const),
    learningResourcesV2: (tenantId: string = getDefaultTenantId()) => ["admin-operations", "learning-resources-v2", tenantId] as const,
    learningResourcesWorkspace: (limit: number, tenantId: string = getDefaultTenantId()) =>
      ["admin-operations", "learning-resources-v2", tenantId, "workspace", limit] as const,
    userAccess: {
      detailAccess: (selectedUserId: string | null, tenantId: string = getDefaultTenantId()) =>
        ["admin-operations", "user-access", tenantId, "detail", selectedUserId, "access"] as const,
      detailUser: (selectedUserId: string | null, tenantId: string = getDefaultTenantId()) =>
        ["admin-operations", "user-access", tenantId, "detail", selectedUserId, "user"] as const,
      options: (tenantId: string = getDefaultTenantId()) => ["admin-operations", "user-access", tenantId, "options"] as const,
      provision: (tenantId: string = getDefaultTenantId()) => ["admin-operations", "user-access", tenantId, "provision"] as const,
      preview: (policies: unknown, tenantId: string = getDefaultTenantId()) =>
        ["admin-operations", "user-access", tenantId, "preview", policies] as const,
      scopes: (scopeType: string, query: string, tenantId: string = getDefaultTenantId()) =>
        ["admin-operations", "user-access", tenantId, "scopes", scopeType, query] as const,
      users: (query: string, status: string, tenantId: string = getDefaultTenantId()) =>
        ["admin-operations", "user-access", tenantId, "users", query, status] as const,
    },
  },
  dashboard: {
    bootstrap: (portal: string, tenantId: string, accountId: string | undefined) =>
      ["dashboard", "bootstrap", portal, tenantId, accountId ?? "anonymous"] as const,
  },
  lmsTeacherShell: {
    bootstrap: (tenantId: string, accountId: string | undefined) => queryKeys.dashboard.bootstrap("lms", tenantId, accountId),
    homeworkWorkspace: (tenantId: string) => ["lms-teacher-shell", "teacher-homework-workspace", tenantId] as const,
  },
  questionBank: {
    workspace: (tenantId: string = getDefaultTenantId()) => ["question-bank", "workspace", tenantId] as const,
  },
  studentDashboard: {
    workspace: (accountId: string | undefined, tenantId: string) => ["student-dashboard", tenantId, accountId ?? "anonymous"] as const,
  },
};
