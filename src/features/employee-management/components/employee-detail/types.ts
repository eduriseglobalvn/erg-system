import type { useEmployeeDetail } from "@/features/employee-management/hooks/use-employee-management";

export type EmployeeDetail = NonNullable<ReturnType<typeof useEmployeeDetail>["data"]>;
export type EmployeeAccount = EmployeeDetail["account"]["user"] | undefined;
export type EmployeeProfile = EmployeeDetail["profile"] | undefined;
export type EmployeeSessions = EmployeeDetail["account"]["sessions"];

export type EmployeeEditForm = {
  departmentId: string;
  employeeCode: string;
  employmentType: string;
  experienceSummary: string;
  experienceYears: string;
  fullName: string;
  jobTitle: string;
  managerId: string;
  phone: string;
  workLocation: string;
};
