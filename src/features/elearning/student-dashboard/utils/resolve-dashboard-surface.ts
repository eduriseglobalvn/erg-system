import type { DashboardSurface } from "@/features/elearning/student-dashboard/hooks/use-dashboard-surface";

export function resolveDashboardSurface({
  isDesktopApp = false,
  isMobile,
}: {
  isDesktopApp?: boolean;
  isMobile: boolean;
}): DashboardSurface {
  if (isDesktopApp) {
    return "desktop-app";
  }

  return isMobile ? "mobile-web" : "desktop-web";
}
