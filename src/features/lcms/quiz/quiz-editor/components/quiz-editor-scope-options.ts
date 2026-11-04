export type CourseScopeOption = {
  id: string;
  label: string;
  meta: string;
};

export type LevelScopeOption = {
  id: string;
  courseId: string;
  label: string;
  meta: string;
};

export type TopicOption = {
  id: string;
  label: string;
  description: string;
  count: number;
};

export const courseScopeOptions: CourseScopeOption[] = [
  {
    id: "ic3-gs6",
    label: "IC3 GS6",
    meta: "Digital Literacy · 3 levels · 36 chủ đề",
  },
  {
    id: "life-science-a2",
    label: "Khoa học đời sống A2",
    meta: "Bài 03 · Dinh dưỡng cân bằng",
  },
  {
    id: "teacher-method-foundation",
    label: "Phương pháp giảng dạy",
    meta: "Foundation · Thiết kế hoạt động học",
  },
];

export const levelScopeOptions: LevelScopeOption[] = [
  {
    id: "ic3-gs6-level-1",
    courseId: "ic3-gs6",
    label: "Level 1",
    meta: "Máy tính căn bản, internet, công dân số",
  },
  {
    id: "ic3-gs6-level-2",
    courseId: "ic3-gs6",
    label: "Level 2",
    meta: "Ứng dụng văn phòng, cộng tác, dữ liệu",
  },
  {
    id: "ic3-gs6-level-3",
    courseId: "ic3-gs6",
    label: "Level 3",
    meta: "An toàn số, dữ liệu nâng cao, dự án",
  },
];

export const emptyCourseScopeOption: CourseScopeOption = {
  id: "",
  label: "",
  meta: "",
};
