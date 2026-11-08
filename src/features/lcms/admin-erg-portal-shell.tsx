"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import ErgPortalLayout from "@/components/portal/ErgPortalLayout";
import { hasApiBase } from "@/lib/api-client";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import {
  createQuizFromBankQuestions as runCreateQuizFromBankQuestions,
  type CreateQuizFromBankOptions,
} from "@/features/lcms/create-quiz-from-bank";
import {
  useCreateQuizEditorQuizMutation,
  useSaveQuizEditorDraftMutation,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { ADMIN_MENU_GROUPS } from "@/features/lcms/admin-content/admin-content-menu";
import {
  adminContentPathForSection,
  canonicalAdminWorkspacePath,
  legacyAdminWorkspacePath,
} from "@/features/lcms/admin-content/admin-content-route";
import { usePendingApprovalCount } from "@/features/timekeeping/api/timekeeping-query";
import { withTimekeepingMenuState } from "@/features/lcms/admin-menu";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { AdminAllFunctionsSheet } from "@/features/lcms/admin-all-functions-sheet";
import {
  canNavigateToAdminPath,
  resolveAdminMobileSection,
  visibleAdminDockItems,
} from "@/features/lcms/admin-mobile-dock-config";
import { AdminShellContext, type AdminShellModel } from "@/features/lcms/admin-shell-context";
import {
  createClientIdempotencyKey,
  FLAT_MENU_ITEMS,
  resolveActiveMenuItem,
  toDashboardLeaf,
} from "@/features/lcms/admin-portal-shell-helpers";

const BYPASS_PERMISSIONS = ["*"];
const PRESERVED_WORKSPACE_VARIANTS = new Set(["question-bank", "quiz-bank", "quiz-editor", "admin-internal-docs"]);

export default function AdminErgPortalShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const adminAuth = useAuthSession("lcms");
  const teacherAuth = useAuthSession("lms");
  const account = adminAuth.account ?? teacherAuth.account;
  const session = adminAuth.session ?? teacherAuth.session;
  const [pendingQuestionImports, setPendingQuestionImports] = useState<QuestionBankQuestion[]>([]);
  const createQuizMutation = useCreateQuizEditorQuizMutation();
  const saveDraftMutation = useSaveQuizEditorDraftMutation();

  const pathname = canonicalAdminWorkspacePath(location.pathname || "/");
  const legacyPathname = legacyAdminWorkspacePath(pathname);
  const quizEditorQuizId = useMemo(() => {
    const value = new URLSearchParams(location.searchStr).get("quizId")?.trim();
    return value || null;
  }, [location.searchStr]);
  const quizEditorThemeRequested = new URLSearchParams(location.searchStr).get("panel") === "theme";
  const activeItem = useMemo(() => resolveActiveMenuItem(pathname), [pathname]);
  const activeLeaf = useMemo(() => (activeItem ? toDashboardLeaf(activeItem) : null), [activeItem]);
  const isPreservedWorkspace = Boolean(
    activeLeaf?.variant && PRESERVED_WORKSPACE_VARIANTS.has(activeLeaf.variant),
  );
  const isSchoolManagement = legacyPathname === "/schools" || legacyPathname.startsWith("/schools/");
  const tenantId = session?.tenantId ?? import.meta.env.VITE_TENANT_ID ?? "erg";

  const portalInfo = useMemo(
    () => ({
      name: "Admin",
      plan: "ADVANCED",
      centerName: "ERG Education",
      userName: account?.fullName || account?.email?.split("@")[0] || "ERG Super Admin",
      userEmail: account?.email || "",
      workspaceCapabilities: session?.workspaces,
      workspacePortals: session?.portals ?? ["lcms"],
    }),
    [account, session?.portals, session?.workspaces],
  );

  // Dev bypass grants every permission but routes that do not exist yet stay hidden.
  const granted = AUTH_BYPASS_ENABLED ? BYPASS_PERMISSIONS : session?.permissions;
  const deniedPermissions = session?.deniedPermissions;
  const canAccess = useCallback((path: string) => canNavigateToAdminPath(path, granted, deniedPermissions), [granted, deniedPermissions]);
  const canApprove = canAccess(adminPath("/employees/teacher-absence"));
  const pendingApprovals = usePendingApprovalCount(canApprove && !AUTH_BYPASS_ENABLED && hasApiBase()).data;
  const menuGroups = useMemo(
    () => withTimekeepingMenuState(ADMIN_MENU_GROUPS, canAccess, pendingApprovals),
    [canAccess, pendingApprovals],
  );

  const mobileDock = useMemo(() => {
    return {
      ariaLabel: "Điều hướng admin",
      activeId: resolveAdminMobileSection(pathname),
      items: visibleAdminDockItems(canAccess),
      renderSheet: (sheet: { open: boolean; onClose: () => void; onNavigate: (path: string) => void }) => (
        <AdminAllFunctionsSheet
          account={{ email: portalInfo.userEmail, name: portalInfo.userName }}
          canAccess={canAccess}
          menuGroups={menuGroups}
          onSignOut={() => {
            logoutStudentSession();
            logoutAccount();
            window.location.reload();
          }}
          workspaces={[
            { active: true, label: "Admin", path: adminPath("/") },
            ...(session?.workspaces?.includes("TEACHER") ? [{ label: "Giáo viên", path: "/teacher", shortLabel: "GV" }] : []),
            ...(session?.workspaces?.includes("STUDENT") ? [{ label: "Học sinh", path: "/student", shortLabel: "HS" }] : []),
          ]}
          {...sheet}
        />
      ),
    };
  }, [canAccess, menuGroups, pathname, portalInfo.userEmail, portalInfo.userName, session?.workspaces]);

  function openLeaf(leafId: string) {
    if (leafId === "admin-learning-structure") {
      void navigate({ href: adminContentPathForSection("structure") });
      return;
    }

    if (leafId === "admin-learning-resources" || leafId === "admin-learning-resource-list") {
      void navigate({ href: adminContentPathForSection("resources") });
      return;
    }

    const target = FLAT_MENU_ITEMS.find((item) => item.id === leafId || item.variant === leafId);
    void navigate({ href: target?.path ?? "/admin" });
  }

  async function createQuizFromBankQuestions(questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) {
    await runCreateQuizFromBankQuestions(questions, {
      createIdempotencyKey: createClientIdempotencyKey,
      createQuiz: createQuizMutation.mutateAsync,
      hasApiBase,
      navigate: (path) => void navigate({ href: canonicalAdminWorkspacePath(path) }),
      saveDraft: saveDraftMutation.mutateAsync,
      setPendingQuestionImports,
      toastError: toast.error,
      toastSuccess: toast.success,
    }, options);
  }

  const model: AdminShellModel = {
    activeItem,
    activeLeaf,
    canAccess,
    isPreservedWorkspace,
    legacyPathname,
    pendingQuestionImports,
    quizEditorQuizId,
    quizEditorThemeRequested,
    tenantId,
    onClearQuestionImports: () => setPendingQuestionImports([]),
    onCreateQuizFromBank: (questions, options) => void createQuizFromBankQuestions(questions, options),
    onOpenLeaf: openLeaf,
  };

  return (
    <ErgPortalLayout
      contentMode={isPreservedWorkspace || isSchoolManagement ? "flush" : "padded"}
      hideHeaderIdentity
      menuGroups={menuGroups}
      mobileDock={mobileDock}
      portalInfo={portalInfo}
    >
      <AdminShellContext.Provider value={model}>
        <Outlet />
      </AdminShellContext.Provider>
    </ErgPortalLayout>
  );
}

export const LcmsErgPortalShell = AdminErgPortalShell;