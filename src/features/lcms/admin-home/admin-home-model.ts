import type { EmployeeItem } from "@/lib/api/models/employee-management";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

export type AdminHomeTask = {
  id: string;
  title: string;
  detail: string;
  /** Admin-relative path, e.g. "/schools/students". */
  path: string;
  tone: "error" | "warning" | "info";
};

export type AdminHomeSchoolRow = {
  id: string;
  name: string;
  status: PartnerSchool["status"];
  studentCount: number;
  classCount: number;
  /** Share of learners with at least one subject, null when the school's detail has not loaded. */
  placedRate: number | null;
};

export type AdminHomeSummary = {
  schoolCount: number;
  activeSchoolCount: number;
  studentCount: number;
  classCount: number;
  placedStudents: number;
  staffCount: number | null;
  staffNeverSignedIn: number | null;
  schools: AdminHomeSchoolRow[];
  tasks: AdminHomeTask[];
};

const hasTeacher = (name: string) => Boolean(name.trim()) && name.trim() !== "Chưa phân công";

/**
 * The admin home from real records only: the school directory, each school's operations
 * (classes and learners) when loaded, and the staff list. Tasks are the gaps those records show.
 */
export function buildAdminHomeSummary(
  directory: PartnerSchool[],
  details: Map<string, PartnerSchool>,
  staff: { users: EmployeeItem[]; total: number } | null,
): AdminHomeSummary {
  const schools = directory.map((school): AdminHomeSchoolRow => {
    const detail = details.get(school.id);
    const studentCount = detail?.students.length ?? school.studentCount ?? 0;
    const placed = detail ? detail.students.filter((student) => student.subjectIds.length > 0).length : null;
    return {
      id: school.id,
      name: school.name,
      status: school.status,
      studentCount,
      classCount: detail?.classes.length ?? school.classCount ?? 0,
      placedRate: placed === null || studentCount === 0 ? null : placed / studentCount,
    };
  });

  const loaded = [...details.values()];
  const unplaced = loaded.reduce((sum, school) => sum + school.students.filter((student) => student.subjectIds.length === 0).length, 0);
  const noTeacher = loaded.reduce((sum, school) => sum + school.classes.filter((item) => !hasTeacher(item.homeroomTeacher)).length, 0);
  const staffNeverSignedIn = staff ? staff.users.filter((person) => person.status === "ACTIVE" && !person.last_login_at).length : null;

  const tasks: AdminHomeTask[] = [];
  for (const school of schools) {
    if (school.studentCount === 0) {
      tasks.push({ id: `empty-${school.id}`, title: `${school.name} chưa có người học`, detail: "Nhập danh sách học sinh để bắt đầu xếp lớp.", path: "/schools/imports", tone: "warning" });
    }
  }
  if (unplaced > 0) {
    tasks.push({ id: "unplaced", title: `${unplaced} học sinh chưa được xếp môn`, detail: "Học sinh chưa có môn sẽ không nhận được bài tập.", path: "/schools/students", tone: "error" });
  }
  if (noTeacher > 0) {
    tasks.push({ id: "no-teacher", title: `${noTeacher} lớp chưa phân công giáo viên`, detail: "Giáo viên chỉ thấy lớp đã được phân công.", path: "/schools/list", tone: "warning" });
  }
  if (staffNeverSignedIn) {
    tasks.push({ id: "staff-idle", title: `${staffNeverSignedIn} tài khoản chưa đăng nhập lần nào`, detail: "Kiểm tra email kích hoạt hoặc đặt lại mật khẩu.", path: "/employees", tone: "info" });
  }

  return {
    schoolCount: schools.length,
    activeSchoolCount: schools.filter((school) => school.status === "active").length,
    studentCount: schools.reduce((sum, school) => sum + school.studentCount, 0),
    classCount: schools.reduce((sum, school) => sum + school.classCount, 0),
    placedStudents: loaded.reduce((sum, school) => sum + school.students.filter((student) => student.subjectIds.length > 0).length, 0),
    staffCount: staff ? staff.total : null,
    staffNeverSignedIn,
    schools,
    tasks,
  };
}
