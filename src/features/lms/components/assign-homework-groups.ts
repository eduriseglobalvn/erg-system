import { classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";

export const allGroupSourcesFilterValue = "all-groups";

export const groupColorOptions = [
  "var(--erg-blue)",
  "#0ea5e9",
  "var(--erg-blue)",
  "#10b981",
  "#14b8a6",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#f43f5e",
  "#8b5cf6",
  "#7c3aed",
  "#ec4899",
  "#d946ef",
  "#eab308",
  "#f59e0b",
  "#a16207",
  "#64748b",
  "#334155",
];

export const assignmentGroups = [
  {
    id: "assign-group-a",
    name: "Nh\u00f3m A (Kh\u00e1)",
    color: groupColorOptions[0],
    source: "Nh\u00f3m n\u00e2ng cao",
    studentIds: classroomStudents.filter((student) => student.status === "ahead").slice(0, 10).map((student) => student.id),
  },
  {
    id: "assign-group-b",
    name: "Nh\u00f3m B (C\u1ea7n h\u1ed7 tr\u1ee3)",
    color: groupColorOptions[6],
    source: "Nh\u00f3m c\u1ea7n h\u1ed7 tr\u1ee3",
    studentIds: classroomStudents.filter((student) => student.status === "support").slice(0, 10).map((student) => student.id),
  },
  {
    id: "assign-group-c",
    name: "Nh\u00f3m luy\u1ec7n t\u1eadp cu\u1ed1i tu\u1ea7n",
    color: groupColorOptions[3],
    source: "Nh\u00f3m \u00f4n t\u1eadp",
    studentIds: classroomStudents.slice(8, 22).map((student) => student.id),
  },
  {
    id: "assign-group-d",
    name: "Nh\u00f3m t\u1ed1c \u0111\u1ed9 nhanh",
    color: groupColorOptions[9],
    source: "Nh\u00f3m n\u00e2ng cao",
    studentIds: classroomStudents.filter((student, index) => student.status === "ahead" || index % 7 === 0).slice(0, 12).map((student) => student.id),
  },
  {
    id: "assign-group-e",
    name: "Nh\u00f3m c\u1ee7ng c\u1ed1 n\u1ec1n t\u1ea3ng",
    color: groupColorOptions[14],
    source: "Nh\u00f3m c\u1ea7n h\u1ed7 tr\u1ee3",
    studentIds: classroomStudents.filter((student, index) => student.status === "support" || index % 6 === 0).slice(0, 11).map((student) => student.id),
  },
  {
    id: "assign-group-f",
    name: "Nh\u00f3m ki\u1ec3m tra l\u1ea1i",
    color: groupColorOptions[8],
    source: "Nh\u00f3m ki\u1ec3m tra",
    studentIds: classroomStudents.slice(18, 32).map((student) => student.id),
  },
  {
    id: "assign-group-g",
    name: "Nh\u00f3m h\u1ecdc sinh m\u1edbi",
    color: groupColorOptions[4],
    source: "Nh\u00f3m \u00f4n t\u1eadp",
    studentIds: classroomStudents.filter((_, index) => index % 5 === 0).slice(0, 10).map((student) => student.id),
  },
  {
    id: "assign-group-h",
    name: "Nh\u00f3m thi th\u1eed IC3",
    color: groupColorOptions[16],
    source: "Nh\u00f3m ki\u1ec3m tra",
    studentIds: classroomStudents.slice(28, 44).map((student) => student.id),
  },
];
