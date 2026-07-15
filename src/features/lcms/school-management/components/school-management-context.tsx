import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSchoolManagement } from "@/features/lcms/school-management/hooks/use-school-management";
import { useLocation, useNavigate } from "@/routes/router-compat";

type SchoolManagementModel = ReturnType<typeof useSchoolManagement> & {
  selectSchool: (schoolId: string) => void;
};

const SchoolManagementContext = createContext<SchoolManagementModel | null>(null);

export function SchoolManagementProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSchoolId = useMemo(() => new URLSearchParams(location.search).get("schoolId"), [location.search]);
  const model = useSchoolManagement(initialSchoolId);

  const value = useMemo<SchoolManagementModel>(() => ({
    ...model,
    selectSchool: (schoolId: string) => {
      model.setSelectedSchoolId(schoolId);
      const search = new URLSearchParams(location.search);
      search.set("schoolId", schoolId);
      navigate(`${location.pathname}?${search.toString()}`);
    },
  }), [location.pathname, location.search, model, navigate]);

  return <SchoolManagementContext.Provider value={value}>{children}</SchoolManagementContext.Provider>;
}

// The provider and its feature-scoped hook intentionally share one module.
// eslint-disable-next-line react-refresh/only-export-components
export function useSchoolManagementContext() {
  const value = useContext(SchoolManagementContext);
  if (!value) throw new Error("SchoolManagementProvider is required");
  return value;
}
