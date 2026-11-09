export type SchoolAcademicYearRecord = {
  id: string;
  startYear: number;
  endYear: number;
  displayName: string;
  status: string;
  startsOn?: string | null;
  endsOn?: string | null;
  version: number;
};

export type SchoolGradeRecord = {
  id: string;
  academicYearId: string;
  gradeCode: string;
  label: string;
  sortOrder: number;
  status: string;
  source: string;
};

export type SchoolPermissions = {
  canCreateSchool: boolean;
  canUpdateSchool: boolean;
  canArchiveSchool: boolean;
  canManageClasses: boolean;
};

export type SchoolClassInput = {
  name: string;
  grade?: string | null;
  academicYear?: string | null;
  homeroomTeacherId?: string | null;
  status?: string | null;
};

export type SchoolStudentInput = {
  studentCode: string;
  fullName: string;
  academicClassId?: string | null;
  email?: string | null;
  username?: string | null;
  gender?: string | null;
  birthday?: string | null;
  phone?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentRelationship?: string | null;
  enrollmentDate?: string | null;
  note?: string | null;
  status?: string | null;
  /** With a username, makes the backend create the student's login account in the same call. */
  password?: string | null;
};

export type SchoolSubjectInput = {
  name: string;
  code: string;
  schoolId?: string | null;
  status?: string | null;
};

export type SchoolEnrollmentItem = {
  studentId: string;
  classId: string;
  academicYear?: string | null;
};

export type OperationalClassRecord = {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  grade?: string | null;
  academicYear?: string | null;
  homeroomTeacherId?: string | null;
  status: string;
  version: number;
  updatedAt?: string | null;
};

export type OperationalStudentRecord = {
  id: string;
  tenantId: string;
  schoolId: string;
  academicClassId?: string | null;
  studentCode: string;
  fullName: string;
  username?: string | null;
  authUserId?: string | null;
  email?: string | null;
  gender?: string | null;
  birthday?: string | null;
  phone?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentRelationship?: string | null;
  enrollmentDate?: string | null;
  note?: string | null;
  status: string;
  version: number;
  updatedAt?: string | null;
};

export type OperationalSubjectRecord = {
  id: string;
  tenantId: string;
  schoolId?: string | null;
  name: string;
  code: string;
  status: string;
  version: number;
  updatedAt?: string | null;
};

export type OperationalEnrollmentRecord = {
  id: string;
  tenantId: string;
  schoolId: string;
  studentId: string;
  classId: string;
  academicYear?: string | null;
  status: string;
  version: number;
  replayed: boolean;
  updatedAt?: string | null;
};

export type BulkStudentImportResult = {
  idempotencyKey?: string | null;
  requested: number;
  created: number;
  replayed: number;
  items: OperationalStudentRecord[];
};

export type BulkEnrollmentResult = {
  idempotencyKey?: string | null;
  requested: number;
  enrolled: number;
  replayed: number;
  items: OperationalEnrollmentRecord[];
};

export type DirectoryItem = {
  id: string;
  name: string;
  schoolType: string;
  status: string;
  district?: string | null;
  academicYear?: string | null;
  classCount: number;
  studentCount: number;
  version: number;
};

export type DirectoryWorkspace = {
  items: DirectoryItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type OperationsWorkspace = {
  school: {
    id: string;
    name: string;
    schoolType: string;
    status: string;
    address?: string | null;
    district?: string | null;
    principalName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    currentAcademicYearId?: string | null;
    version: number;
  };
  summary: { classCount: number; activeClassCount: number; studentCount: number; gradeCount: number };
  academicYears: Array<Omit<SchoolAcademicYearRecord, "version"> & { version: string | number }>;
  grades: SchoolGradeRecord[];
  classes: Array<{ id: string; name: string; grade?: string | null; homeroomTeacher?: string | null; studentCount: number; status?: string | null }>;
  students: Array<{ id: string; code?: string | null; fullName: string; birthDate?: string | null; grade?: string | null; className?: string | null; guardianPhone?: string | null; subjectIds: string[]; status: string; averageScore?: number | null }>;
  subjects: Array<{ id: string; name: string; code?: string | null; studentCount: number; teacherCount: number }>;
  permissions: SchoolPermissions;
};

export type SchoolCommandResponse = OperationsWorkspace["school"] & {
  currentAcademicYear?: SchoolAcademicYearRecord | null;
  grades?: SchoolGradeRecord[];
};
