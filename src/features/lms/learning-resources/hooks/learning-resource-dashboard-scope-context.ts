import { createContext, useContext } from "react";

export type LearningResourceDashboardScopeValue = {
  selectedSchoolId: string;
  academicYear: string;
};

export const LearningResourceDashboardScopeContext = createContext<LearningResourceDashboardScopeValue | null>(null);

export function useLearningResourceDashboardScope() {
  return useContext(LearningResourceDashboardScopeContext);
}
