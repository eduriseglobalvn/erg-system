import type { LearningResourceCategory, LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-data";

export function matchesResource(
  resource: LearningResourceResource,
  selected: { gradeId: string; subjectId: string; categoryId: string; keyword: string },
) {
  const categoryMatches = resource.categoryId === selected.categoryId || resource.sectionId === selected.categoryId;
  const categoryOwnsSubject = ["giao-duc-stem", "ic3-digital-literacy", "mos", "tin-hoc-pho-thong"].includes(selected.categoryId);
  const subjectMatches = categoryOwnsSubject || selected.subjectId === "all" || resource.subjectId === selected.subjectId;
  const gradeMatches =
    !resource.gradeId ||
    resource.gradeId === selected.gradeId ||
    ["ic3", "mos", "tin-hoc"].includes(resource.subjectId) ||
    resource.subjectId.startsWith("mock-");
  const keyword = selected.keyword.trim().toLowerCase();
  const keywordMatches =
    keyword.length === 0 ||
    [resource.title, resource.subtitle, resource.formatBadge, resource.viewer.title]
      .join(" ")
      .toLowerCase()
      .includes(keyword);

  return categoryMatches && subjectMatches && gradeMatches && keywordMatches;
}

export function getDefaultSelectionForGrade(gradeId: string) {
  return {
    gradeId,
    subjectId: "tieng-anh",
    categoryId: "sgk-tieng-anh",
  };
}

export function getLearningResourceExplorerSubjects() {
  return [
    { id: "all", label: "Tất cả" },
    { id: "toan", label: "Toán" },
    { id: "tieng-viet", label: "Tiếng Việt" },
    { id: "tu-nhien-xa-hoi", label: "Tự nhiên và Xã hội", gradeIds: ["1", "2", "3"] },
    { id: "ngu-van", label: "Ngữ văn" },
    { id: "tieng-anh", label: "Tiếng Anh" },
    { id: "khoa-hoc-tu-nhien", label: "Khoa học tự nhiên" },
    { id: "lich-su-dia-li", label: "Lịch sử và Địa lí" },
    { id: "giao-duc-stem", label: "Giáo dục STEM" },
    { id: "giao-duc-ki-nang-cong-dan-so", label: "Giáo dục Kĩ năng Công dân số" },
    { id: "tin-hoc", label: "Tin học" },
    { id: "ic3", label: "IC3" },
    { id: "mos", label: "MOS" },
  ];
}

export function getLearningResourceExplorerCategories() {
  return [
    { id: "nhat-ki-ngay-he-vui", label: "Nhật kí ngày hè vui", icon: "document" as const },
    { id: "sgk-tieng-anh", label: "Học liệu SGK Tiếng Anh", icon: "book" as const },
    { id: "sach-mem-2", label: "Sách Mềm 2.0", parentId: "sgk-tieng-anh", icon: "document" as const },
    { id: "hop-phan-bo-tro", label: "Hợp phần bổ trợ", parentId: "sgk-tieng-anh", icon: "document" as const },
    { id: "tieng-anh-tang-cuong", label: "Tiếng Anh Tăng Cường", icon: "book" as const },
    { id: "global-maths", label: "Global Maths", parentId: "tieng-anh-tang-cuong", icon: "document" as const },
    { id: "global-science", label: "Global Science", parentId: "tieng-anh-tang-cuong", icon: "document" as const },
    { id: "hoc-lieu-thong-minh", label: "Học liệu Thông minh", icon: "smart" as const },
    { id: "ket-noi-tri-thuc", label: "Kết nối tri thức với cuộc sống", parentId: "hoc-lieu-thong-minh", icon: "document" as const },
    { id: "chan-troi-sang-tao", label: "Chân trời sáng tạo", parentId: "hoc-lieu-thong-minh", icon: "document" as const },
    { id: "cung-hoc-phat-trien", label: "Cùng học để phát triển năng lực", parentId: "hoc-lieu-thong-minh", icon: "document" as const },
    { id: "theo-sgk-khac", label: "Theo SGK khác", parentId: "hoc-lieu-thong-minh", icon: "document" as const },
    { id: "hoc-lieu-giao-duc-khac", label: "Học liệu Giáo dục khác", icon: "stem" as const },
    { id: "giao-duc-stem", label: "Học liệu Giáo dục STEM", parentId: "hoc-lieu-giao-duc-khac", icon: "stem" as const },
    { id: "hoc-lieu-sach-tham-khao", label: "Học liệu Sách tham khảo", parentId: "hoc-lieu-giao-duc-khac", icon: "document" as const },
    { id: "hoc-lieu-hanh-trang-cong-dan-so", label: "Học liệu Hành trang công dân số", parentId: "hoc-lieu-giao-duc-khac", icon: "document" as const },
    { id: "hoc-lieu-tin-hoc", label: "Học liệu Tin học", icon: "computer" as const },
    { id: "tin-hoc-pho-thong", label: "Tin học phổ thông", parentId: "hoc-lieu-tin-hoc", icon: "computer" as const },
    { id: "scratch-python", label: "Scratch & Python", parentId: "hoc-lieu-tin-hoc", icon: "computer" as const },
    { id: "chung-chi-tin-hoc", label: "Chứng chỉ Tin học", icon: "certificate" as const },
    { id: "ic3-digital-literacy", label: "IC3 Digital Literacy", parentId: "chung-chi-tin-hoc", icon: "certificate" as const },
    { id: "mos", label: "MOS", parentId: "chung-chi-tin-hoc", icon: "certificate" as const },
  ];
}

export function getTopLevelCategoriesFrom(categories: LearningResourceCategory[]) {
  return categories.filter((category) => !category.parentId);
}

export function getCategoryChildrenFrom(categories: LearningResourceCategory[], parentId: string) {
  return categories.filter((category) => category.parentId === parentId);
}

export function getCategoryPathFrom(categories: LearningResourceCategory[], categoryId: string): LearningResourceCategory[] {
  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) return [];
  if (!category.parentId) return [category];
  return [...getCategoryPathFrom(categories, category.parentId), category];
}

export function getStableDate(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
  const month = (hash % 12) + 1;
  const day = (hash % 26) + 1;
  const hour = (hash % 12) + 1;
  const minute = hash % 60;
  return `${month}/${day}/2026 ${hour}:${String(minute).padStart(2, "0")} ${hash % 2 ? "AM" : "PM"}`;
}

export function getExplorerSize(resource: LearningResourceResource) {
  if (resource.fileType === "AUDIO" || resource.fileType === "VIDEO") return resource.viewer.duration ?? "";
  let hash = 0;
  for (const char of resource.id) hash = (hash * 17 + char.charCodeAt(0)) % 240_000;
  return `${Math.max(24, hash).toLocaleString("en-US")} KB`;
}

export function getExplorerType(resource: LearningResourceResource) {
  if (resource.fileType === "PPTX") return "Bài giảng";
  if (resource.fileType === "AUDIO") return "Audio";
  if (resource.fileType === "VIDEO") return "Video";
  if (resource.fileType === "QUIZ") return "Bài tập";
  if (resource.fileType === "IMAGE") return "Ảnh";
  if (resource.fileType === "ZIP") return "Tệp nén";
  return resource.formatBadge;
}

export function getLearningCardMeta(resource: LearningResourceResource) {
  let hash = 0;
  for (const char of resource.id) hash = (hash * 29 + char.charCodeAt(0)) % 997;
  const testNo = (hash % 7) + 1;
  const unitNo = (hash % 6) + 1;
  const minutes = resource.resourceType === "slide" ? 35 + (hash % 3) * 5 : 45 + (hash % 2) * 15;
  const questions = resource.resourceType === "slide" ? 18 + (hash % 8) : 40 + (hash % 3) * 5;
  const isLesson = resource.resourceType === "slide" || resource.fileType === "PPTX";
  const isExercise = resource.resourceType === "quiz" || resource.fileType === "QUIZ";

  return {
    action: isLesson ? "Mở bài" : isExercise ? "Làm bài" : "Mở file",
    heading: isLesson ? "Bài giảng" : isExercise ? "Luyện tập" : "Học liệu",
    tag: isLesson ? "BG" : isExercise ? `Đề ${testNo}` : resource.fileType,
    unit: `Unit ${String(unitNo).padStart(2, "0")}`,
    minutes,
    questions,
  };
}
