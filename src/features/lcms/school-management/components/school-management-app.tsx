import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { SchoolManagementProvider, useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { useLocation, useNavigate } from "@tanstack/react-router";

const screens: Record<string, LazyExoticComponent<ComponentType>> = {
  "/schools": lazy(() => import("@/features/lcms/school-management/screens/school-directory-screen")),
  "/schools/list": lazy(() => import("@/features/lcms/school-management/screens/school-directory-screen")),
  "/schools/detail": lazy(() => import("@/features/lcms/school-management/screens/school-detail-flow-screen")),
  "/schools/overview": lazy(() => import("@/features/lcms/school-management/screens/school-overview-screen")),
  "/schools/profile": lazy(() => import("@/features/lcms/school-management/screens/school-profile-screen")),
  "/schools/academic-years": lazy(() => import("@/features/lcms/school-management/screens/school-academic-years-screen")),
  "/schools/grades": lazy(() => import("@/features/lcms/school-management/screens/school-grades-screen")),
  "/schools/classes": lazy(() => import("@/features/lcms/school-management/screens/school-classes-screen")),
  "/schools/students": lazy(() => import("@/features/lcms/school-management/screens/school-students-screen")),
  "/schools/subjects": lazy(() => import("@/features/lcms/school-management/screens/school-subjects-screen")),
  "/schools/subject-enrollments": lazy(() => import("@/features/lcms/school-management/screens/school-enrollments-screen")),
  "/schools/imports": lazy(() => import("@/features/lcms/school-management/screens/school-imports-screen")),
  "/schools/reviews": lazy(() => import("@/features/lcms/school-management/screens/school-reviews-screen")),
  "/schools/reports": lazy(() => import("@/features/lcms/school-management/screens/school-reports-screen")),
  "/schools/assessments": lazy(() => import("@/features/lcms/school-management/screens/school-assessments-screen")),
  "/schools/audit-log": lazy(() => import("@/features/lcms/school-management/screens/school-audit-screen")),
};

function normalizeSchoolRoute(pathname: string) {
  const path = pathname.split(/[?#]/)[0] ?? "";
  if (path.startsWith("/admin/")) {
    return path.slice("/admin".length);
  }
  return path;
}

// These screens render nothing without a selected school; the directory and detail screens handle that themselves.
const SCHOOL_SCOPED_ROUTES = new Set(["/schools/overview", "/schools/classes", "/schools/students", "/schools/subjects", "/schools/subject-enrollments", "/schools/imports", "/schools/reviews", "/schools/reports"]);

export function SchoolManagementApp() {
  const location = useLocation();
  const normalizedPath = normalizeSchoolRoute(location.pathname);
  const Screen = screens[normalizedPath] ?? screens[location.pathname] ?? screens["/schools/list"];
  const screen = <Suspense fallback={<SchoolRouteSkeleton />}><Screen /></Suspense>;
  return <SchoolManagementProvider>{SCHOOL_SCOPED_ROUTES.has(normalizedPath) ? <SelectedSchoolGate>{screen}</SelectedSchoolGate> : screen}</SchoolManagementProvider>;
}

function SelectedSchoolGate({ children }: { children: ReactNode }) {
  const { error, isLoading, selectedSchool } = useSchoolManagementContext();
  const navigate = useNavigate();
  if (selectedSchool) return children;
  if (isLoading) return <SchoolRouteSkeleton />;
  const toList = <ErgButton onClick={() => void navigate({ href: adminPath("/schools/list") })} variant="outlined">Danh sách trường</ErgButton>;
  return (
    <Box sx={{ p: 3 }}>
      {error
        ? <ErgErrorState action={toList} description="Vui lòng kiểm tra kết nối, phiên đăng nhập hoặc quyền truy cập rồi thử lại." title="Không tải được dữ liệu trường học" />
        : <ErgEmptyState action={toList} description="Tạo hoặc chọn một trường trong danh sách để xem mục này." title="Chưa chọn trường" />}
    </Box>
  );
}

function SchoolRouteSkeleton() {
  return <Box sx={{ display: "grid", gap: 2, p: 3 }}><Skeleton height={72} variant="rounded" /><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" } }}><Skeleton height={148} variant="rounded" /><Skeleton height={148} variant="rounded" /><Skeleton height={148} variant="rounded" /></Box><Skeleton height={360} variant="rounded" /></Box>;
}
