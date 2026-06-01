import { useMemo } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { resolveDashboardSurface } from "@/features/elearning/student-dashboard/utils/resolve-dashboard-surface";

export type DashboardSurface = "mobile-web" | "desktop-web" | "desktop-app";

export function useDashboardSurface(): DashboardSurface {
  const isMobile = useIsMobile();

  return useMemo(() => resolveDashboardSurface({ isMobile }), [isMobile]);
}
