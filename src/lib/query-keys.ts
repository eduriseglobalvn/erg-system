import { getDefaultTenantId } from "@/lib/graphql-client";
import { scopedQueryKey, tenantQueryKey } from "@/lib/query-key-scope";

export const queryKeys = {
  account: {
    loginSessions: (tenantId: string, accountId: string | undefined) => tenantQueryKey("account", "login-sessions", tenantId, accountId ?? "anonymous"),
  },
  adminOperations: {
    educationUnits: (keyword?: string, typeFilter?: string, tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
      keyword === undefined && typeFilter === undefined
        ? (["admin-operations", "education-units", tenantId, accountId] as const)
        : (["admin-operations", "education-units", tenantId, accountId, keyword, typeFilter] as const),
    learningResourcesV2: (tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
      ["admin-operations", "learning-resources-v2", tenantId, accountId] as const,
    learningResourcesWorkspace: (limit: number, tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
      ["admin-operations", "learning-resources-v2", tenantId, accountId, "workspace", limit] as const,
    userAccess: {
      detailAccess: (selectedUserId: string | null, tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
        ["admin-operations", "user-access", tenantId, accountId, "detail", selectedUserId, "access"] as const,
      detailUser: (selectedUserId: string | null, tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
        ["admin-operations", "user-access", tenantId, accountId, "detail", selectedUserId, "user"] as const,
      options: (tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
        ["admin-operations", "user-access", tenantId, accountId, "options"] as const,
      provision: (tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
        ["admin-operations", "user-access", tenantId, accountId, "provision"] as const,
      preview: (policies: unknown, tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
        ["admin-operations", "user-access", tenantId, accountId, "preview", policies] as const,
      scopes: (scopeType: string, query: string, tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
        ["admin-operations", "user-access", tenantId, accountId, "scopes", scopeType, query] as const,
      users: (query: string, status: string, tenantId: string = getDefaultTenantId(), accountId = "anonymous") =>
        ["admin-operations", "user-access", tenantId, accountId, "users", query, status] as const,
    },
  },
  dashboard: {
    bootstrap: (portal: string, tenantId: string, accountId: string | undefined) =>
      scopedQueryKey("dashboard", "bootstrap", { portal, tenantId, accountId }),
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
