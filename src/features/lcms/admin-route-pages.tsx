import { lazy, Suspense } from "react";
import Box from "@mui/material/Box";
import { useNavigate } from "@tanstack/react-router";

import { DashboardContent } from "@/layouts/dashboard/components/dashboard-content";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import type { ContentScope, ManagementScope } from "@/types/scope-types";
import { adminContentPathForSection } from "@/features/lcms/admin-content/admin-content-route";
import { AdminContentOverview } from "@/features/lcms/admin-content/components/admin-content-overview";
import { useAdminShellModel } from "@/features/lcms/admin-shell-context";
import { AdminErgPortalWorkspace } from "@/features/lcms/pages/admin-erg-workspaces";

const RolePermissionPage = lazy(() => import("@/features/rbac/components/role-permission-workspace").then((m) => ({ default: m.RolePermissionWorkspace })));
const AuditLogPage = lazy(() => import("@/features/audit/components/audit-log-page").then((m) => ({ default: m.AuditLogPage })));
const EmployeeManagementPage = lazy(() => import("@/features/employee-management/components/employee-list-workspace").then((m) => ({ default: m.EmployeeListWorkspace })));
const EmployeeAccessLogPage = lazy(() => import("@/features/employee-management/components/employee-access-log-workspace").then((m) => ({ default: m.EmployeeAccessLogWorkspace })));
const LearningStandardsPage = lazy(() => import("@/features/lcms/integrations/learning-standards/components/learning-standards-workspace"));
const EnterpriseConnectorsPage = lazy(() => import("@/features/integrations/components/enterprise-connectors-workspace"));
const LearningOutcomesPage = lazy(() => import("@/features/lms/learning-paths").then((m) => ({ default: m.LearningOutcomesAdminWorkspace })));
const AdminHomePage = lazy(() => import("@/features/lcms/admin-home/admin-home-workspace").then((m) => ({ default: m.AdminHomeWorkspace })));
const AdminUiKitPage = lazy(() => import("@/features/lcms/pages/admin-ui-kit"));
const SchoolManagementApp = lazy(() =>
  import("@/features/lcms/school-management").then((module) => ({
    default: module.SchoolManagementApp,
  })),
);

const lcmsScope: ManagementScope = { level: "global" };
const globalContentScope: ContentScope = { type: "global" };

/** One component per Admin child route; the shell renders only <Outlet />. */

export function AdminHomeRoute() {
  const { tenantId } = useAdminShellModel();
  return <Suspense fallback={<ContentPendingSkeleton />}><AdminHomePage tenantId={tenantId} /></Suspense>;
}

// settings/permissions is an alias of settings/roles: one merged screen.
export function AdminPermissionsRoute() {
  return <AdminRolesRoute />;
}

export function AdminRolesRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><RolePermissionPage /></Suspense>;
}

export function AdminAuditLogRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><AuditLogPage /></Suspense>;
}

export function AdminEmployeesRoute() {
  const { tenantId } = useAdminShellModel();
  return <Suspense fallback={<ContentPendingSkeleton />}><EmployeeManagementPage tenantId={tenantId} /></Suspense>;
}

export function AdminEmployeeAccessLogsRoute() {
  const { tenantId } = useAdminShellModel();
  return <Suspense fallback={<ContentPendingSkeleton />}><EmployeeAccessLogPage tenantId={tenantId} /></Suspense>;
}

export function AdminLearningStandardsRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><LearningStandardsPage /></Suspense>;
}

export function AdminEnterpriseConnectorsRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><EnterpriseConnectorsPage /></Suspense>;
}

export function AdminLearningOutcomesRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><LearningOutcomesPage /></Suspense>;
}

export function AdminUiKitRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><AdminUiKitPage /></Suspense>;
}

export function AdminContentOverviewRoute() {
  return <AdminContentOverview />;
}

export function AdminSchoolsRoute() {
  return (
    <Box sx={{ height: "100%", minHeight: 0, overflowX: "hidden", overflowY: "auto", overscrollBehavior: "contain" }}>
      <Suspense fallback={<ContentPendingSkeleton />}>
        <SchoolManagementApp />
      </Suspense>
    </Box>
  );
}

/** Content authoring screens (structure, resources, quiz bank, questions, quiz editor) run inside the dashboard host. */
export function AdminContentWorkspaceRoute() {
  const navigate = useNavigate();
  const model = useAdminShellModel();
  if (!model.isPreservedWorkspace || !model.activeLeaf) return <AdminGenericRoute />;
  return (
    <Box sx={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
      <DashboardContent
        activeLeaf={model.activeLeaf}
        canAccessGlobalErg
        contentScope={globalContentScope}
        managementScope={lcmsScope}
        onOpenLeaf={model.onOpenLeaf}
        onOpenQuiz={(quizId) => void navigate({ href: `${adminContentPathForSection("quiz-editor")}?quizId=${encodeURIComponent(quizId)}` })}
        pendingQuestionImports={model.pendingQuestionImports}
        quizEditorQuizId={model.quizEditorQuizId}
        quizEditorThemeRequested={model.quizEditorThemeRequested}
        onQuizEditorThemeHandled={() => void navigate({ href: `${adminContentPathForSection("quiz-editor")}?quizId=${encodeURIComponent(model.quizEditorQuizId ?? "")}`, replace: true })}
        selectedClassId=""
        selectedSchoolId=""
        onQuestionImportsHandled={model.onClearQuestionImports}
        onCreateQuizFromBank={model.onCreateQuizFromBank}
      />
    </Box>
  );
}

/** Every other Admin menu entry (customers, reports, settings ...) renders through the generic workspace host. */
export function AdminGenericRoute() {
  const { activeItem, legacyPathname } = useAdminShellModel();
  return <AdminErgPortalWorkspace activeItem={activeItem ?? null} pathname={legacyPathname} />;
}

const CalendarMainPage = lazy(() => import("@/features/teaching-calendar/components/main/admin-calendar-main").then((m) => ({ default: m.AdminCalendarMain })));
const CalendarSchedulePage = lazy(() => import("@/features/teaching-calendar/components/schedule-grid/schedule-page").then((m) => ({ default: m.SchedulePage })));
const CalendarOverviewPage = lazy(() => import("@/features/teaching-calendar/components/overview/overview-page").then((m) => ({ default: m.OverviewPage })));
const CalendarTravelPage = lazy(() => import("@/features/teaching-calendar/components/settings/travel-times-page").then((m) => ({ default: m.TravelTimesPage })));
const CalendarPeriodsPage = lazy(() => import("@/features/teaching-calendar/components/settings/school-periods-page").then((m) => ({ default: m.SchoolPeriodsPage })));

export function AdminCalendarRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><CalendarMainPage /></Suspense>;
}

export function AdminCalendarScheduleRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><CalendarSchedulePage /></Suspense>;
}

export function AdminCalendarOverviewRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><CalendarOverviewPage /></Suspense>;
}

export function AdminCalendarPeriodsRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><CalendarPeriodsPage /></Suspense>;
}

export function AdminCalendarTravelRoute() {
  return <Suspense fallback={<ContentPendingSkeleton />}><CalendarTravelPage /></Suspense>;
}
