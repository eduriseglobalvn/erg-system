import type {
  LearningResourceCategory,
  LearningResourceGrade,
} from "@/features/lms/learning-resources/api/learning-resource-domain-types";

export const LEARNING_RESOURCE_GRADES: LearningResourceGrade[] = [
  { id: "mam-non", label: "Mầm non" },
  ...Array.from({ length: 12 }, (_, index) => {
    const value = String(index + 1);
    return { id: value, label: value };
  }),
];

export const LEARNING_RESOURCE_CATEGORIES: LearningResourceCategory[] = [
  { id: "nhat-ki-ngay-he-vui", label: "Nhật kí ngày hè vui", icon: "document" },
  { id: "sgk-tieng-anh", label: "Học liệu SGK Tiếng Anh", icon: "book" },
  { id: "sach-mem-2", label: "Sách Mềm 2.0", parentId: "sgk-tieng-anh", icon: "document" },
  { id: "hop-phan-bo-tro", label: "Hợp phần bổ trợ", parentId: "sgk-tieng-anh", icon: "document" },
  { id: "tieng-anh-tang-cuong", label: "Tiếng Anh Tăng Cường", icon: "book" },
  { id: "global-maths", label: "Global Maths", parentId: "tieng-anh-tang-cuong", icon: "document" },
  { id: "global-science", label: "Global Science", parentId: "tieng-anh-tang-cuong", icon: "document" },
  { id: "hoc-lieu-thong-minh", label: "Học liệu Thông minh", icon: "smart" },
  { id: "ket-noi-tri-thuc", label: "Kết nối tri thức với cuộc sống", parentId: "hoc-lieu-thong-minh", icon: "document" },
  { id: "chan-troi-sang-tao", label: "Chân trời sáng tạo", parentId: "hoc-lieu-thong-minh", icon: "document" },
  { id: "cung-hoc-phat-trien", label: "Cùng học để phát triển năng lực", parentId: "hoc-lieu-thong-minh", icon: "document" },
  { id: "theo-sgk-khac", label: "Theo SGK khác", parentId: "hoc-lieu-thong-minh", icon: "document" },
  { id: "hoc-lieu-giao-duc-khac", label: "Học liệu Giáo dục khác", icon: "stem" },
  { id: "giao-duc-stem", label: "Học liệu Giáo dục STEM", parentId: "hoc-lieu-giao-duc-khac", icon: "stem" },
  { id: "hoc-lieu-sach-tham-khao", label: "Học liệu Sách tham khảo", parentId: "hoc-lieu-giao-duc-khac", icon: "document" },
  { id: "hoc-lieu-hanh-trang-cong-dan-so", label: "Học liệu Hành trang công dân số", parentId: "hoc-lieu-giao-duc-khac", icon: "document" },
  { id: "hoc-lieu-tin-hoc", label: "Học liệu Tin học", icon: "computer" },
  { id: "tin-hoc-pho-thong", label: "Tin học phổ thông", parentId: "hoc-lieu-tin-hoc", icon: "computer" },
  { id: "scratch-python", label: "Scratch & Python", parentId: "hoc-lieu-tin-hoc", icon: "computer" },
  { id: "chung-chi-tin-hoc", label: "Chứng chỉ Tin học", icon: "certificate" },
  { id: "ic3-digital-literacy", label: "IC3 Digital Literacy", parentId: "chung-chi-tin-hoc", icon: "certificate" },
  { id: "mos", label: "MOS", parentId: "chung-chi-tin-hoc", icon: "certificate" },
];

export const DEFAULT_LEARNING_RESOURCE_SELECTION = {
  gradeId: "1",
  subjectId: "tieng-anh",
  categoryId: "sach-mem-2",
};
