import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

const studentNames = [
  "Nguyễn Minh Anh", "Trần Gia Huy", "Lê Khánh Linh", "Phạm Hoàng Nam", "Võ Ngọc Hà",
  "Đỗ Đức Anh", "Bùi Thảo My", "Nguyễn Hải Đăng", "Trương Tuệ Nhi", "Hoàng Quang Minh",
];

function createStudents(prefix: string, total: number, classNames: string[]) {
  return Array.from({ length: total }, (_, index) => ({
    id: `${prefix}-student-${index + 1}`,
    code: `${prefix.toUpperCase()}${String(index + 1).padStart(4, "0")}`,
    fullName: studentNames[index % studentNames.length],
    birthDate: `201${index % 4}-0${(index % 8) + 1}-${String((index % 20) + 1).padStart(2, "0")}`,
    grade: String(6 + (index % 4)),
    className: classNames[index % classNames.length],
    guardianPhone: `09${String(12000000 + index * 791).slice(0, 8)}`,
    subjectIds: index % 3 === 0 ? ["math", "english", "science"] : ["math", "english"],
    status: index % 11 === 0 ? "at-risk" as const : "studying" as const,
  }));
}

export const initialPartnerSchools: PartnerSchool[] = [
  {
    id: "school-nguyen-du", code: "THCS-ND", name: "THCS Nguyễn Du", address: "137 Nguyễn Du, Hai Bà Trưng", district: "Hai Bà Trưng",
    principal: "Nguyễn Thị Lan", contactPhone: "024 3822 1976", contactEmail: "contact@thcsnguyendu.edu.vn", academicYear: "2026–2027",
    schoolType: "secondary", status: "active", joinedAt: "12/08/2024", grades: ["6", "7", "8", "9"],
    classes: [
      { id: "nd-6a1", name: "6A1", grade: "6", homeroomTeacher: "Cô Trần Thu Hà", studentCount: 38 },
      { id: "nd-7a2", name: "7A2", grade: "7", homeroomTeacher: "Thầy Lê Mạnh Hùng", studentCount: 41 },
      { id: "nd-8a1", name: "8A1", grade: "8", homeroomTeacher: "Cô Vũ Thanh Mai", studentCount: 39 },
      { id: "nd-9a3", name: "9A3", grade: "9", homeroomTeacher: "Thầy Phạm Quốc Anh", studentCount: 36 },
    ],
    subjects: [
      { id: "math", name: "Toán học", code: "TOAN", studentCount: 154, teacherCount: 6 },
      { id: "english", name: "Tiếng Anh", code: "ANH", studentCount: 154, teacherCount: 5 },
      { id: "science", name: "Khoa học tự nhiên", code: "KHTN", studentCount: 82, teacherCount: 4 },
    ],
    students: createStudents("nd", 34, ["6A1", "7A2", "8A1", "9A3"]),
    reviews: [
      { id: "review-1", author: "Nguyễn Thị Lan", role: "Hiệu trưởng", rating: 4.8, content: "Quy trình triển khai rõ ràng, giáo viên được hỗ trợ sát trong giai đoạn đầu.", createdAt: "18/06/2026" },
      { id: "review-2", author: "Trần Thu Hà", role: "Giáo viên chủ nhiệm", rating: 4.5, content: "Báo cáo tiến độ giúp nhà trường phát hiện sớm học sinh cần hỗ trợ.", createdAt: "02/06/2026" },
    ],
  },
  {
    id: "school-le-quy-don", code: "THPT-LQD", name: "THPT Lê Quý Đôn", address: "195 Nguyễn Thị Minh Khai, Quận 3", district: "Quận 3",
    principal: "Lê Hoàng Phúc", contactPhone: "028 3930 5260", contactEmail: "vanphong@lqd.edu.vn", academicYear: "2026–2027",
    schoolType: "high-school", status: "onboarding", joinedAt: "03/05/2026", grades: ["10", "11", "12"],
    classes: [{ id: "lqd-10a1", name: "10A1", grade: "10", homeroomTeacher: "Cô Hà Ngọc Anh", studentCount: 42 }],
    subjects: [{ id: "english", name: "Tiếng Anh", code: "ANH", studentCount: 42, teacherCount: 2 }],
    students: createStudents("lqd", 18, ["10A1"]), reviews: [],
  },
  {
    id: "school-tran-dai-nghia", code: "THPT-TDN", name: "THPT chuyên Trần Đại Nghĩa", address: "53 Nguyễn Du, Quận 1", district: "Quận 1",
    principal: "Phạm Thùy Dương", contactPhone: "028 3829 2290", contactEmail: "contact@trandainghia.edu.vn", academicYear: "2026–2027",
    schoolType: "high-school", status: "active", joinedAt: "19/09/2025", grades: ["10", "11", "12"],
    classes: [{ id: "tdn-11ca", name: "11 chuyên Anh", grade: "11", homeroomTeacher: "Thầy Nguyễn Minh Trí", studentCount: 35 }],
    subjects: [{ id: "english", name: "Tiếng Anh", code: "ANH", studentCount: 35, teacherCount: 3 }],
    students: createStudents("tdn", 22, ["11 chuyên Anh"]), reviews: [],
  },
];
