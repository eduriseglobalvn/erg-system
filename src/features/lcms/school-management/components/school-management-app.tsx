import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { SchoolManagementProvider } from "@/features/lcms/school-management/components/school-management-context";
import { useLocation } from "@/routes/router-compat";

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

export function SchoolManagementApp() {
  const location = useLocation();
  const Screen = screens[location.pathname] ?? screens["/schools/list"];
  return <SchoolManagementProvider><Suspense fallback={<SchoolRouteSkeleton />}><Screen /></Suspense></SchoolManagementProvider>;
}

function SchoolRouteSkeleton() {
  return <Box sx={{ display: "grid", gap: 2, p: 3 }}><Skeleton height={72} variant="rounded" /><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" } }}><Skeleton height={148} variant="rounded" /><Skeleton height={148} variant="rounded" /><Skeleton height={148} variant="rounded" /></Box><Skeleton height={360} variant="rounded" /></Box>;
}
