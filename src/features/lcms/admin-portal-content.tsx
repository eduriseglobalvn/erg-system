import { lazy, Suspense } from "react";
import Box from "@mui/material/Box";
import { useNavigate } from "@tanstack/react-router";
import { DashboardContent } from "@/layouts/dashboard/components/dashboard-content";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ADMIN_ENTERPRISE_CONNECTORS_PATH, ADMIN_LEARNING_STANDARDS_PATH } from "@/platform/auth/permissions/portal-route-registry";
import type { MenuItem } from "@/components/portal/ErgPortalLayout";
import type { ContentScope, ManagementScope } from "@/types/scope-types";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import { ADMIN_CONTENT_HOME_PATH, adminContentPathForSection } from "@/features/lcms/admin-content/admin-content-route";
import { AdminContentOverview } from "@/features/lcms/admin-content/components/admin-content-overview";
import { AdminErgPortalWorkspace } from "@/features/lcms/pages/admin-erg-workspaces";

const PermissionCatalogPage = lazy(() => import("@/features/access-management/components/permission-catalog-workspace").then((m) => ({ default: m.PermissionCatalogWorkspace })));
const RoleManagementPage = lazy(() => import("@/features/access-management/components/role-management-workspace").then((m) => ({ default: m.RoleManagementWorkspace })));
const EmployeeManagementPage = lazy(() => import("@/features/employee-management/components/employee-list-workspace").then((m) => ({ default: m.EmployeeListWorkspace })));
const EmployeeAccessLogPage = lazy(() => import("@/features/employee-management/components/employee-access-log-workspace").then((m) => ({ default: m.EmployeeAccessLogWorkspace })));
const LearningStandardsPage = lazy(() => import("@/features/lcms/integrations/learning-standards/components/learning-standards-workspace"));
const EnterpriseConnectorsPage = lazy(() => import("@/features/integrations/components/enterprise-connectors-workspace"));
const LearningOutcomesPage = lazy(() => import("@/features/lms/learning-paths").then((m) => ({ default: m.LearningOutcomesAdminWorkspace })));
const AdminUiKitPage = lazy(() => import("@/features/lcms/pages/admin-ui-kit"));
const SchoolManagementApp = lazy(() =>
  import("@/features/lcms/school-management").then((module) => ({
    default: module.SchoolManagementApp,
  })),
);

const lcmsScope: ManagementScope = { level: "global" };
const globalContentScope: ContentScope = { type: "global" };

const PageFallback = ContentPendingSkeleton;

const ADMIN_LEARNING_OUTCOMES_PATH = "/admin/learning-outcomes";

type AdminPortalContentProps = {
  activeItem: MenuItem | undefined;
  activeLeaf: DashboardLeaf | null;
  isPreservedWorkspace: boolean;
  isSchoolManagement: boolean;
  legacyPathname: string;
  locationPathname: string;
  pathname: string;
  pendingQuestionImports: QuestionBankQuestion[];
  quizEditorQuizId: string | null;
  tenantId: string;
  onClearQuestionImports: () => void;
  onCreateQuizFromBank: (questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) => void;
  onOpenLeaf: (leafId: string) => void;
};

export function AdminPortalContent({
  activeItem,
  activeLeaf,
  isPreservedWorkspace,
  isSchoolManagement,
  legacyPathname,
  locationPathname,
  pathname,
  pendingQuestionImports,
  quizEditorQuizId,
  tenantId,
  onClearQuestionImports,
  onCreateQuizFromBank,
  onOpenLeaf,
}: AdminPortalContentProps) {
  const navigate = useNavigate();
  if (legacyPathname === "/setting/setting-center-role") {
    return <PageFallback />;
  }

  if (legacyPathname === "/settings/permissions") {
    return <Suspense fallback={<PageFallback />}><PermissionCatalogPage tenantId={tenantId} /></Suspense>;
  }

  if (legacyPathname === "/settings/roles") {
    return <Suspense fallback={<PageFallback />}><RoleManagementPage tenantId={tenantId} /></Suspense>;
  }

  // Pages that used to render outside the shell (KE_HOACH 7.2 "Chuẩn đầu ra").
  if (locationPathname === ADMIN_LEARNING_STANDARDS_PATH) {
    return <Suspense fallback={<PageFallback />}><LearningStandardsPage /></Suspense>;
  }

  if (locationPathname === ADMIN_ENTERPRISE_CONNECTORS_PATH) {
    return <Suspense fallback={<PageFallback />}><EnterpriseConnectorsPage /></Suspense>;
  }

  if (locationPathname === ADMIN_LEARNING_OUTCOMES_PATH) {
    return <Suspense fallback={<PageFallback />}><LearningOutcomesPage /></Suspense>;
  }

  if (legacyPathname === "/ui-kit") {
    return <Suspense fallback={<PageFallback />}><AdminUiKitPage /></Suspense>;
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
          onOpenLeaf={onOpenLeaf}
          onOpenQuiz={(quizId) => void navigate({ href: `${adminContentPathForSection("quiz-editor")}?quizId=${encodeURIComponent(quizId)}` })}
          pendingQuestionImports={pendingQuestionImports}
          quizEditorQuizId={quizEditorQuizId}
          selectedClassId=""
          selectedSchoolId=""
          onQuestionImportsHandled={() => onClearQuestionImports()}
          onCreateQuizFromBank={(questions, options) => onCreateQuizFromBank(questions, options)}
        />
      </Box>
    );
  }

  if (legacyPathname === "/" || legacyPathname === "") {
    return <PageFallback />;
  }

  return <AdminErgPortalWorkspace activeItem={activeItem ?? null} pathname={legacyPathname} />;
}
