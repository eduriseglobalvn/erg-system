import { createContext, useContext, type ReactNode } from "react";

type LearningResourceDashboardScopeValue = {
  selectedSchoolId: string;
  academicYear: string;
};

const LearningResourceDashboardScopeContext = createContext<LearningResourceDashboardScopeValue | null>(null);

export function LearningResourceDashboardScopeProvider({
  value,
  children,
}: {
  value: LearningResourceDashboardScopeValue;
  children: ReactNode;
}) {
  return <LearningResourceDashboardScopeContext.Provider value={value}>{children}</LearningResourceDashboardScopeContext.Provider>;
}

export function useLearningResourceDashboardScope() {
  return useContext(LearningResourceDashboardScopeContext);
}
