import { createContext, useContext, type ReactNode } from "react";

type HocLieuDashboardScopeValue = {
  selectedSchoolId: string;
  academicYear: string;
};

const HocLieuDashboardScopeContext = createContext<HocLieuDashboardScopeValue | null>(null);

export function HocLieuDashboardScopeProvider({
  value,
  children,
}: {
  value: HocLieuDashboardScopeValue;
  children: ReactNode;
}) {
  return <HocLieuDashboardScopeContext.Provider value={value}>{children}</HocLieuDashboardScopeContext.Provider>;
}

export function useHocLieuDashboardScope() {
  return useContext(HocLieuDashboardScopeContext);
}
