"use client";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import { toast } from "sonner";
import ErgPortalLayout, { type MenuItem } from "@/components/portal/ErgPortalLayout";
import { defaultClassId, defaultSchoolId } from "@/features/lms/classroom/api/mock-classroom-data";
import { hasApiBase } from "@/lib/api-client";
import { DashboardContent } from "@/layouts/dashboard/components/dashboard-content";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { useLocation, useNavigate } from "@tanstack/react-router";
import type { ContentScope, ManagementScope } from "@/types/scope-types";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import {
  createQuizFromBankQuestions as runCreateQuizFromBankQuestions,
  type CreateQuizFromBankOptions,
} from "@/features/lcms/create-quiz-from-bank";
import {
  useCreateQuizEditorQuizMutation,
  useSaveQuizEditorDraftMutation,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import {
  flattenMenuItems,
  getMenuItemDescription,
} from "@/features/lcms/lcms-menu";
import { ADMIN_MENU_GROUPS } from "@/features/lcms/admin-content/admin-content-menu";
import {
  ADMIN_CONTENT_HOME_PATH,
  adminContentPathForSection,
  canonicalAdminWorkspacePath,
  legacyAdminWorkspacePath,
} from "@/features/lcms/admin-content/admin-content-route";
import { AdminContentOverview } from "@/features/lcms/admin-content/components/admin-content-overview";
import { LcmsErgPortalWorkspace } from "@/features/lcms/pages/lcms-erg-workspaces";

const LcmsDashboard = lazy(() => import("./pages/lcms-dashboard"));
const PermissionCatalogPage = lazy(() => import("@/features/access-management/components/permission-catalog-workspace").then((m) => ({ default: m.PermissionCatalogWorkspace })));
const RoleManagementPage = lazy(() => import("@/features/access-management/components/role-management-workspace").then((m) => ({ default: m.RoleManagementWorkspace })));
const EmployeeManagementPage = lazy(() => import("@/features/employee-management/components/employee-list-workspace").then((m) => ({ default: m.EmployeeListWorkspace })));
const EmployeeAccessLogPage = lazy(() => import("@/features/employee-management/components/employee-access-log-workspace").then((m) => ({ default: m.EmployeeAccessLogWorkspace })));
const SchoolManagementApp = lazy(() =>
  import("@/features/lcms/school-management").then((module) => ({
    default: module.SchoolManagementApp,
  })),
);

const FLAT_MENU_ITEMS = flattenMenuItems(ADMIN_MENU_GROUPS);
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
  const headerBreadcrumb = useMemo(() => {
    if (!activeItem) return null;
    return (
      <Box sx={{ alignItems: "center", display: "flex", gap: 0.75, minWidth: 0 }}>
        {activeItem.section && activeItem.section !== activeItem.label ? (
          <>
            <Typography noWrap sx={{ color: "#64748B", fontSize: { xs: 12, sm: 13 }, fontWeight: 500 }}>
              {activeItem.section}
            </Typography>
            <Typography sx={{ color: "#CBD5E1", fontSize: 12, lineHeight: 1 }}>/</Typography>
          </>
        ) : null}
        <Typography noWrap sx={{ color: "#0F172A", fontSize: { xs: 12.5, sm: 13.5 }, fontWeight: 700 }}>
          {activeItem.label}
        </Typography>
      </Box>
    );
  }, [activeItem]);
  const isPreservedWorkspace = Boolean(
    activeLeaf?.variant && PRESERVED_WORKSPACE_VARIANTS.has(activeLeaf.variant),
  );
  const isSchoolManagement = legacyPathname === "/schools" || legacyPathname.startsWith("/schools/");
  const tenantId = session?.tenantId ?? import.meta.env.VITE_TENANT_ID ?? "erg";

  useEffect(() => {
    if (legacyPathname === "/setting/setting-center-role") {
      void navigate({ replace: true, href: "/admin/settings/roles" });
    }
  }, [legacyPathname, navigate]);

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

  function renderContent() {
    if (legacyPathname === "/setting/setting-center-role") {
      return <PageFallback />;
    }

    if (legacyPathname === "/settings/permissions") {
      return <Suspense fallback={<PageFallback />}><PermissionCatalogPage tenantId={tenantId} /></Suspense>;
    }

    if (legacyPathname === "/settings/roles") {
      return <Suspense fallback={<PageFallback />}><RoleManagementPage tenantId={tenantId} /></Suspense>;
    }

    if (legacyPathname === "/employees") {
      return <Suspense fallback={<PageFallback />}><EmployeeManagementPage tenantId={tenantId} /></Suspense>;
    }

    if (legacyPathname === "/employees/access-logs") {
      return <Suspense fallback={<PageFallback />}><EmployeeAccessLogPage tenantId={tenantId} /></Suspense>;
    }

    if (pathname === ADMIN_CONTENT_HOME_PATH) {
      return <AdminContentOverview />;
    }

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
            onOpenQuiz={(quizId) => void navigate({ href: `${adminContentPathForSection("quiz-editor")}?quizId=${encodeURIComponent(quizId)}` })}
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

    if (legacyPathname === "/" || legacyPathname === "") {
      return (
        <Suspense fallback={<PageFallback />}>
          <LcmsDashboard />
        </Suspense>
      );
    }

    return <LcmsErgPortalWorkspace activeItem={activeItem ?? null} pathname={legacyPathname} />;
  }

  return (
    <ErgPortalLayout
      contentMode={isPreservedWorkspace || isSchoolManagement ? "flush" : "padded"}
      headerControls={headerBreadcrumb}
      hideHeaderIdentity
      menuGroups={ADMIN_MENU_GROUPS}
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
    breadcrumb: ["Admin", menuItem.section ?? "Tá»•ng quan", menuItem.label],
    description: getMenuItemDescription(menuItem),
    variant: menuItem.variant ?? "placeholder",
  };
}
