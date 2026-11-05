"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import ErgPortalLayout from "@/components/portal/ErgPortalLayout";
import { hasApiBase } from "@/lib/api-client";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
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
import { AdminShellContext, type AdminShellModel } from "@/features/lcms/admin-shell-context";
import {
  createClientIdempotencyKey,
  FLAT_MENU_ITEMS,
  resolveActiveMenuItem,
  toDashboardLeaf,
} from "@/features/lcms/admin-portal-shell-helpers";

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
    isPreservedWorkspace,
    legacyPathname,
    pendingQuestionImports,
    quizEditorQuizId,
    tenantId,
    onClearQuestionImports: () => setPendingQuestionImports([]),
    onCreateQuizFromBank: (questions, options) => void createQuizFromBankQuestions(questions, options),
    onOpenLeaf: openLeaf,
  };

  return (
    <ErgPortalLayout
      contentMode={isPreservedWorkspace || isSchoolManagement ? "flush" : "padded"}
      hideHeaderIdentity
      menuGroups={ADMIN_MENU_GROUPS}
      portalInfo={portalInfo}
    >
      <AdminShellContext.Provider value={model}>
        <Outlet />
      </AdminShellContext.Provider>
    </ErgPortalLayout>
  );
}

export const LcmsErgPortalShell = AdminErgPortalShell;