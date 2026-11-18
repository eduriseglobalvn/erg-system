import type { CreateEmployeeRequest } from "@/features/employee-management/types/employee-management";

export const initialForm = {
  credentialDelivery: "EMAIL_INVITE" as CreateEmployeeRequest["credentialDelivery"],
  departmentId: "",
  email: "",
  emergencyName: "",
  emergencyPhone: "",
  employeeCode: "",
  employmentType: "FULL_TIME",
  experienceSummary: "",
  experienceYears: "",
  fullName: "",
  jobTitle: "",
  joinedAt: "",
  managerId: "",
  phone: "",
  recoveryEmail: "",
  roleName: "",
  roleNames: [] as string[],
  workLocation: "",
};

export type EmployeeForm = typeof initialForm;
export type SetEmployeeField = (name: keyof EmployeeForm, value: string) => void;
export type SetEmployeeForm = React.Dispatch<React.SetStateAction<EmployeeForm>>;
