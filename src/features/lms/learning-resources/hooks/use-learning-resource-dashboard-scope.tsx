import { type ReactNode } from "react";

import {
  LearningResourceDashboardScopeContext,
  type LearningResourceDashboardScopeValue,
} from "@/features/lms/learning-resources/hooks/learning-resource-dashboard-scope-context";

export function LearningResourceDashboardScopeProvider({
  value,
  children,
}: {
  value: LearningResourceDashboardScopeValue;
  children: ReactNode;
}) {
  return <LearningResourceDashboardScopeContext.Provider value={value}>{children}</LearningResourceDashboardScopeContext.Provider>;
}
