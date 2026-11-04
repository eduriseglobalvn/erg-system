import type { CreateEmployeeRequest } from "@/features/employee-management/types/employee-management";

export const steps = ["Định danh", "Thông tin nhân sự", "Role & scope", "Credential", "Review"];

export const DEFAULT_CENTER_OPTIONS = [
  { code: "CS-01", id: "CS-QUAN-1", name: "Cơ sở Đào tạo ERG - Quận 1" },
  { code: "CS-02", id: "CS-TAN-BINH", name: "Cơ sở Đào tạo ERG - Tân Bình" },
  { code: "CS-03", id: "CS-THU-DUC", name: "Cơ sở Đào tạo ERG - Thủ Đức" },
  { code: "CTR-01", id: "CENTER-01", name: "Trung tâm Ngoại ngữ & Khảo thí ERG" },
];

export const STREAMLINED_ROLE_CATEGORIES: Record<string, string[]> = {
  "Đội ngũ Giảng dạy & Lớp học": [
    "lms_subject_teacher",
    "lms_homeroom_teacher",
    "lms_teacher_lead",
    "lms_teacher_assistant",
  ],
  "Quản lý Nhà trường & Đào tạo": [
    "school.manager",
    "pdt_operator",
    "lms.admin",
    "center_manager",
  ],
  "Tuyển sinh & Quản trị Hệ thống": [
    "seo.staff",
    "seo.manager",
    "it_operator",
    "system.admin",
  ],
};

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
  roleName: "lms_subject_teacher",
  roleNames: ["lms_subject_teacher"],
  scopeId: "",
  scopeType: "TENANT",
  selectedCenterIds: [] as string[],
  selectedClassIds: [] as string[],
  selectedSchoolForClass: "",
  selectedSchoolIds: [] as string[],
  workLocation: "",
};

export type EmployeeForm = typeof initialForm;
export type SetEmployeeField = (name: keyof EmployeeForm, value: string) => void;
export type SetEmployeeForm = React.Dispatch<React.SetStateAction<EmployeeForm>>;
