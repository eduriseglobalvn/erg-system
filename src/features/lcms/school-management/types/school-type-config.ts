import type { SchoolType } from "@/features/lcms/school-management/types/school-management-types";

export type SchoolTypeMeta = {
  label: string;
  shortLabel: string;
  description: string;
  grades: string[];
  learnerLabel: string;
  classLabel: string;
  subjectLabel: string;
};

export const schoolTypeOrder: SchoolType[] = ["primary", "secondary", "high-school", "university", "training-center"];

export const schoolTypeMeta: Record<SchoolType, SchoolTypeMeta> = {
  primary: {
    label: "Trường Tiểu học",
    shortLabel: "Tiểu học",
    description: "Tự động thiết lập khối 1 đến khối 5.",
    grades: ["1", "2", "3", "4", "5"],
    learnerLabel: "Học sinh",
    classLabel: "Lớp học",
    subjectLabel: "Môn học",
  },
  secondary: {
    label: "Trường THCS",
    shortLabel: "THCS",
    description: "Tự động thiết lập khối 6 đến khối 9.",
    grades: ["6", "7", "8", "9"],
    learnerLabel: "Học sinh",
    classLabel: "Lớp học",
    subjectLabel: "Môn học",
  },
  "high-school": {
    label: "Trường THPT",
    shortLabel: "THPT",
    description: "Tự động thiết lập khối 10 đến khối 12.",
    grades: ["10", "11", "12"],
    learnerLabel: "Học sinh",
    classLabel: "Lớp học",
    subjectLabel: "Môn học",
  },
  university: {
    label: "Trường Đại học",
    shortLabel: "Đại học",
    description: "Không sử dụng khối; tổ chức trực tiếp theo lớp hoặc khóa.",
    grades: [],
    learnerLabel: "Sinh viên",
    classLabel: "Lớp / khóa",
    subjectLabel: "Học phần",
  },
  "training-center": {
    label: "Trung tâm đào tạo",
    shortLabel: "Trung tâm",
    description: "Không sử dụng khối; tổ chức trực tiếp theo lớp hoặc nhóm học.",
    grades: [],
    learnerLabel: "Học viên",
    classLabel: "Lớp / nhóm",
    subjectLabel: "Môn / chương trình",
  },
};

export function getDefaultGrades(schoolType: SchoolType) {
  return [...schoolTypeMeta[schoolType].grades];
}

export function schoolTypeUsesGrades(schoolType: SchoolType) {
  return schoolTypeMeta[schoolType].grades.length > 0;
}
