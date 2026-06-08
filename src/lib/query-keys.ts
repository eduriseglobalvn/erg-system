export const queryKeys = {
  account: {
    loginSessions: () => ["account", "login-sessions"] as const,
  },
  adminOperations: {
    educationUnits: (keyword?: string, typeFilter?: string) =>
      keyword === undefined && typeFilter === undefined
        ? (["admin-operations", "education-units"] as const)
        : (["admin-operations", "education-units", keyword, typeFilter] as const),
    learningResourcesV2: () => ["admin-operations", "learning-resources-v2"] as const,
    learningResourcesWorkspace: (limit: number) => ["admin-operations", "learning-resources-v2", "workspace", limit] as const,
    userAccess: {
      detailAccess: (selectedUserId: string | null) => ["admin-operations", "user-access", "detail", selectedUserId, "access"] as const,
      detailUser: (selectedUserId: string | null) => ["admin-operations", "user-access", "detail", selectedUserId, "user"] as const,
      options: () => ["admin-operations", "user-access", "options"] as const,
      preview: (policies: unknown) => ["admin-operations", "user-access", "preview", policies] as const,
      scopes: (scopeType: string, query: string) => ["admin-operations", "user-access", "scopes", scopeType, query] as const,
      users: (query: string, status: string) => ["admin-operations", "user-access", "users", query, status] as const,
    },
  },
  dashboard: {
    bootstrap: () => ["dashboard", "bootstrap"] as const,
  },
  lmsTeacherShell: {
    bootstrap: () => ["lms-teacher-shell", "bootstrap"] as const,
  },
  questionBank: {
    workspace: () => ["question-bank", "workspace"] as const,
  },
  studentDashboard: {
    workspace: (accountId: string | undefined) => ["student-dashboard", accountId ?? "anonymous"] as const,
  },
};
