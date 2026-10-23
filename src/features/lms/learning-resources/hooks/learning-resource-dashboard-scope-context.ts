import { createContext, useContext } from "react";

export type LearningResourceDashboardScopeValue = {
  accountId?: string;
  academicYear: string;
  selectedSchoolId: string;
  tenantId?: string;
};

export const LearningResourceDashboardScopeContext = createContext<LearningResourceDashboardScopeValue | null>(null);

export function useLearningResourceDashboardScope() {
  return useContext(LearningResourceDashboardScopeContext);
}
