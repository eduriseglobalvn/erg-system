import { useMemo } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { resolveDashboardSurface } from "@/features/elearning/student-dashboard/utils/resolve-dashboard-surface";
import { getDesktopRuntime } from "@/platform/desktop";

export type DashboardSurface = "mobile-web" | "desktop-web" | "desktop-app";

export function useDashboardSurface(): DashboardSurface {
  const isMobile = useIsMobile();
  const isDesktopApp = getDesktopRuntime() === "tauri";

  return useMemo(() => resolveDashboardSurface({ isDesktopApp, isMobile }), [isDesktopApp, isMobile]);
}
