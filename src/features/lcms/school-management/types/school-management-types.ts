export type SchoolStatus = "active" | "onboarding" | "paused";

export type SchoolType = "primary" | "secondary" | "high-school" | "university" | "training-center";

export type SchoolStudent = {
  id: string;
  code: string;
  fullName: string;
  birthDate: string;
  grade: string;
  className: string;
  guardianPhone: string;
  subjectIds: string[];
  status: "studying" | "at-risk" | "inactive";
};

export type SchoolClass = {
  id: string;
  name: string;
  grade: string;
  homeroomTeacher: string;
  studentCount: number;
};

export type SchoolSubject = {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  teacherCount: number;
};

export type SchoolReview = {
  id: string;
  author: string;
  role: string;
  rating: number;
  content: string;
  createdAt: string;
};

export type PartnerSchool = {
  id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  principal: string;
  contactPhone: string;
  contactEmail: string;
  academicYear: string;
  schoolType: SchoolType;
  status: SchoolStatus;
  joinedAt: string;
  students: SchoolStudent[];
  classes: SchoolClass[];
  grades: string[];
  subjects: SchoolSubject[];
  reviews: SchoolReview[];
  version?: number;
  studentCount?: number;
  classCount?: number;
  academicYears?: import("@/features/lcms/school-management/api/school-management-api").SchoolAcademicYearRecord[];
  gradeRecords?: import("@/features/lcms/school-management/api/school-management-api").SchoolGradeRecord[];
  permissions?: import("@/features/lcms/school-management/api/school-management-api").SchoolPermissions;
};

export type SchoolDraft = Pick<
  PartnerSchool,
  "name" | "address" | "district" | "principal" | "contactPhone" | "contactEmail" | "academicYear" | "schoolType" | "status"
>;

export type StudentImportRow = Omit<SchoolStudent, "id" | "subjectIds" | "status"> & {
  id: string;
  note: string;
  valid: boolean;
};
