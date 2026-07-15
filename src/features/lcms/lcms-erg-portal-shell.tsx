"use client";

import { lazy, Suspense, useMemo, useState } from "react";
import { Box, LinearProgress } from "@mui/material";
import { toast } from "sonner";
import ErgPortalLayout, { type MenuItem } from "@/components/portal/ErgPortalLayout";
import { defaultClassId, defaultSchoolId } from "@/features/lms/classroom/api/mock-classroom-data";
import { hasApiBase } from "@/lib/api-client";
import { DashboardContent } from "@/layouts/dashboard/components/dashboard-content";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { useLocation, useNavigate } from "@/routes/router-compat";
import type { ContentScope, ManagementScope } from "@/types/scope-types";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import {
  createQuizFromBankQuestions as runCreateQuizFromBankQuestions,
  type CreateQuizFromBankOptions,
} from "@/features/lcms/create-quiz-from-bank";
import {
  useCreateQuizEditorQuizMutation,
  useSaveQuizEditorDraftMutation,
} from "@/features/lcms/quiz/quiz-editor";
import {
  flattenMenuItems,
  getMenuItemDescription,
  LCMS_MENU_GROUPS,
} from "@/features/lcms/lcms-menu";
import { LcmsErgPortalWorkspace } from "@/features/lcms/pages/lcms-erg-workspaces";

const LcmsDashboard = lazy(() => import("./pages/lcms-dashboard"));
const SchoolManagementApp = lazy(() =>
  import("@/features/lcms/school-management").then((module) => ({
    default: module.SchoolManagementApp,
  })),
);

const FLAT_MENU_ITEMS = flattenMenuItems(LCMS_MENU_GROUPS);
const PRESERVED_WORKSPACE_VARIANTS = new Set(["question-bank", "quiz-bank", "quiz-editor", "admin-internal-docs"]);
const lcmsScope: ManagementScope = { level: "global" };
const globalContentScope: ContentScope = { type: "global" };

function PageFallback() {
  return (
    <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: 240 }}>
      <LinearProgress sx={{ width: 128 }} />
    </Box>
  );
}

export default function LcmsErgPortalShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { account } = useAuthSession("lcms");
  const [pendingQuestionImports, setPendingQuestionImports] = useState<QuestionBankQuestion[]>([]);
  const createQuizMutation = useCreateQuizEditorQuizMutation();
  const saveDraftMutation = useSaveQuizEditorDraftMutation();

  const pathname = location.pathname || "/";
  const quizEditorQuizId = useMemo(() => {
    const value = new URLSearchParams(location.search).get("quizId")?.trim();
    return value || null;
  }, [location.search]);
  const activeItem = useMemo(() => resolveActiveMenuItem(pathname), [pathname]);
  const activeLeaf = useMemo(() => (activeItem ? toDashboardLeaf(activeItem) : null), [activeItem]);
  const isPreservedWorkspace = Boolean(
    activeLeaf?.variant && PRESERVED_WORKSPACE_VARIANTS.has(activeLeaf.variant),
  );
  const isSchoolManagement = pathname === "/schools" || pathname.startsWith("/schools/");

  const portalInfo = useMemo(
    () => ({
      name: "LCMS ERG",
      plan: "ADVANCED",
      centerName: "ERG Education",
      userName: account?.fullName || account?.email?.split("@")[0] || "ERG Super Admin",
      userEmail: account?.email || "",
    }),
    [account],
  );

  function openLeaf(leafId: string) {
    if (leafId === "admin-learning-structure" || leafId === "admin-learning-resource-list") {
      navigate("/resources");
      return;
    }

    const target = FLAT_MENU_ITEMS.find((item) => item.id === leafId || item.variant === leafId);
    navigate(target?.path ?? "/");
  }

  async function createQuizFromBankQuestions(questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) {
    await runCreateQuizFromBankQuestions(questions, {
      createIdempotencyKey: createClientIdempotencyKey,
      createQuiz: createQuizMutation.mutateAsync,
      hasApiBase,
      navigate,
      saveDraft: saveDraftMutation.mutateAsync,
      setPendingQuestionImports,
      toastError: toast.error,
      toastSuccess: toast.success,
    }, options);
  }

  function renderContent() {
    if (isSchoolManagement) {
      return (
        <Box sx={{ height: "100%", minHeight: 0, overflowX: "hidden", overflowY: "auto", overscrollBehavior: "contain" }}>
          <Suspense fallback={<PageFallback />}>
            <SchoolManagementApp />
          </Suspense>
        </Box>
      );
    }

    if (isPreservedWorkspace && activeLeaf) {
      return (
        <Box sx={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
          <DashboardContent
            activeLeaf={activeLeaf}
            canAccessGlobalErg
            contentScope={globalContentScope}
            managementScope={lcmsScope}
            onOpenLeaf={openLeaf}
            onOpenQuiz={(quizId) => navigate(`/quiz-editor?quizId=${encodeURIComponent(quizId)}`)}
            pendingQuestionImports={pendingQuestionImports}
            quizEditorQuizId={quizEditorQuizId}
            selectedClassId={defaultClassId}
            selectedSchoolId={defaultSchoolId}
            onQuestionImportsHandled={() => setPendingQuestionImports([])}
            onCreateQuizFromBank={(questions, options) => void createQuizFromBankQuestions(questions, options)}
          />
        </Box>
      );
    }

    if (pathname === "/" || pathname === "") {
      return (
        <Suspense fallback={<PageFallback />}>
          <LcmsDashboard />
        </Suspense>
      );
    }

    return <LcmsErgPortalWorkspace activeItem={activeItem ?? null} pathname={pathname} />;
  }

  return (
    <ErgPortalLayout
      contentMode={isPreservedWorkspace || isSchoolManagement ? "flush" : "padded"}
      hideHeaderIdentity
      menuGroups={LCMS_MENU_GROUPS}
      portalInfo={portalInfo}
    >
      {renderContent()}
    </ErgPortalLayout>
  );
}

function createClientIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }

  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}

function resolveActiveMenuItem(pathname: string) {
  const normalized = pathname === "" ? "/" : pathname;
  const exact = FLAT_MENU_ITEMS.find((item) => item.path === normalized);
  if (exact) return exact;

  return (
    FLAT_MENU_ITEMS
      .filter((item) => item.path && item.path !== "/" && normalized.startsWith(item.path))
      .sort((left, right) => (right.path?.length ?? 0) - (left.path?.length ?? 0))[0] ?? FLAT_MENU_ITEMS[0]
  );
}

function toDashboardLeaf(menuItem: MenuItem): DashboardLeaf {
  return {
    id: menuItem.id ?? menuItem.path?.replace(/^\/+/, "").replaceAll("/", "-") ?? "placeholder",
    title: menuItem.label,
    breadcrumb: ["LCMS", menuItem.section ?? "Tổng quan", menuItem.label],
    description: getMenuItemDescription(menuItem),
    variant: menuItem.variant ?? "placeholder",
  };
}
