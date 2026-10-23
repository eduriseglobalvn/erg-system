import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSchoolManagement } from "@/features/lcms/school-management/hooks/use-school-management";
import { useLocation, useNavigate } from "@tanstack/react-router";

type SchoolManagementModel = ReturnType<typeof useSchoolManagement> & {
  selectSchool: (schoolId: string) => void;
};

const SchoolManagementContext = createContext<SchoolManagementModel | null>(null);

export function SchoolManagementProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSchoolId = useMemo(() => new URLSearchParams(location.searchStr).get("schoolId"), [location.searchStr]);
  const model = useSchoolManagement(initialSchoolId);

  const value = useMemo<SchoolManagementModel>(() => ({
    ...model,
    selectSchool: (schoolId: string) => {
      model.setSelectedSchoolId(schoolId);
      const search = new URLSearchParams(location.searchStr);
      search.set("schoolId", schoolId);
      void navigate({ href: `${location.pathname}?${search.toString()}` });
    },
  }), [location.pathname, location.searchStr, model, navigate]);

  return <SchoolManagementContext.Provider value={value}>{children}</SchoolManagementContext.Provider>;
}

// The provider and its feature-scoped hook intentionally share one module.

export function useSchoolManagementContext() {
  const value = useContext(SchoolManagementContext);
  if (!value) throw new Error("SchoolManagementProvider is required");
  return value;
}
