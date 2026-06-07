export type InternalDocumentTypeId = "slides" | "textbook" | "program-plan" | "lesson-plan";

export type InternalDocumentType = {
  id: InternalDocumentTypeId;
  label: string;
  shortLabel: string;
  description: string;
};

export type InternalDocument = {
  id: string;
  type: InternalDocumentTypeId;
  title: string;
  description: string;
  programSlug: string;
  programName: string;
  moduleName: string;
  version: string;
  updatedAt: string;
  owner: string;
  format: string;
};

export const INTERNAL_DOCUMENT_TYPES: InternalDocumentType[] = [
  {
    id: "slides",
    label: "Bài giảng",
    shortLabel: "Slide",
    description: "Deck trình chiếu và ghi chú nhịp giảng để giáo viên mở lên là dạy được ngay.",
  },
  {
    id: "textbook",
    label: "Giáo trình",
    shortLabel: "Giáo trình",
    description: "Tài liệu học, workbook và phần đọc thêm theo đúng chương trình đang triển khai.",
  },
  {
    id: "program-plan",
    label: "Phân phối chương trình",
    shortLabel: "PPCT",
    description: "Khung tuần, số buổi, mục tiêu và nhịp kiểm tra cho từng level hoặc module.",
  },
  {
    id: "lesson-plan",
    label: "Giáo án",
    shortLabel: "Giáo án",
    description: "Kế hoạch dạy theo buổi, gồm mục tiêu, hoạt động lớp, kiểm tra nhanh và dặn dò.",
  },
];

export const INTERNAL_DOCUMENTS: InternalDocument[] = [
  {
    id: "ic3-gs6-l1-slide-01",
    type: "slides",
    title: "Slide buổi 01 - Thiết bị và hệ điều hành",
    description: "Bản trình chiếu mở đầu Level 1, có phần khởi động và demo thao tác cơ bản.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v2.1",
    updatedAt: "22/04/2026",
    owner: "Academic Team",
    format: "PPTX",
  },
  {
    id: "ic3-gs6-l1-slide-02",
    type: "slides",
    title: "Slide buổi 02 - Quản lý tệp và thư mục",
    description: "Deck thực hành thao tác file, folder, đường dẫn và quy tắc đặt tên.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v2.0",
    updatedAt: "20/04/2026",
    owner: "Academic Team",
    format: "PPTX",
  },
  {
    id: "ic3-gs6-textbook-l1",
    type: "textbook",
    title: "Giáo trình IC3 GS6 Level 1 - Nền tảng máy tính",
    description: "Bản giáo trình chuẩn cho học sinh, bám sát các chủ đề nền tảng máy tính.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v1.8",
    updatedAt: "18/04/2026",
    owner: "Curriculum Team",
    format: "PDF",
  },
  {
    id: "ic3-gs6-workbook-l1",
    type: "textbook",
    title: "Workbook thực hành IC3 GS6 Level 1",
    description: "Bài luyện theo chủ đề, dùng cho hoạt động cá nhân hoặc bài về nhà.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v1.4",
    updatedAt: "15/04/2026",
    owner: "Curriculum Team",
    format: "PDF",
  },
  {
    id: "ic3-gs6-ppct-l1",
    type: "program-plan",
    title: "PPCT IC3 GS6 Level 1 - 7 chủ đề / 14 buổi",
    description: "Phân bổ số buổi, mục tiêu từng chủ đề, bài kiểm tra và mốc ôn tập.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v3.0",
    updatedAt: "12/04/2026",
    owner: "Academic Ops",
    format: "XLSX",
  },
  {
    id: "ic3-gs6-ppct-review",
    type: "program-plan",
    title: "PPCT ôn tập và kiểm tra cuối Level 1",
    description: "Nhịp ôn tập, mock test, chữa lỗi và tiêu chí hoàn thành trước khi lên level tiếp theo.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v1.2",
    updatedAt: "10/04/2026",
    owner: "Academic Ops",
    format: "XLSX",
  },
  {
    id: "ic3-gs6-lesson-01",
    type: "lesson-plan",
    title: "Giáo án buổi 01 - Thiết bị và hệ điều hành",
    description: "Kịch bản dạy 90 phút, gồm warm-up, demo, thực hành và exit ticket.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v2.3",
    updatedAt: "22/04/2026",
    owner: "Mentor Team",
    format: "DOCX",
  },
  {
    id: "ic3-gs6-lesson-02",
    type: "lesson-plan",
    title: "Giáo án buổi 02 - Quản lý tệp",
    description: "Kế hoạch lớp có hoạt động nhóm, checkpoint giữa buổi và bài luyện cuối giờ.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v2.1",
    updatedAt: "20/04/2026",
    owner: "Mentor Team",
    format: "DOCX",
  },
  {
    id: "mos-slide-word",
    type: "slides",
    title: "Slide Word Specialist - Styles và References",
    description: "Bài giảng thao tác Word theo objective thi MOS.",
    programSlug: "mos",
    programName: "MOS Master",
    moduleName: "Word Specialist",
    version: "v1.6",
    updatedAt: "16/04/2026",
    owner: "MOS Team",
    format: "PPTX",
  },
  {
    id: "tech-lesson-scratch",
    type: "lesson-plan",
    title: "Giáo án Scratch - Mini game đầu tiên",
    description: "Buổi học theo project nhỏ, có checklist hỗ trợ nhóm học nhanh và nhóm cần kèm.",
    programSlug: "tech",
    programName: "AI & Programming",
    moduleName: "Scratch Programming",
    version: "v1.1",
    updatedAt: "09/04/2026",
    owner: "Tech Team",
    format: "DOCX",
  },
];

export function getInternalDocumentsByProgram(programSlug: string) {
  return INTERNAL_DOCUMENTS.filter((document) => document.programSlug === programSlug);
}

export function getInternalDocumentsByType(type: InternalDocumentTypeId, documents = INTERNAL_DOCUMENTS) {
  return documents.filter((document) => document.type === type);
}

export function getInternalDocumentType(type: InternalDocumentTypeId) {
  return INTERNAL_DOCUMENT_TYPES.find((item) => item.id === type);
}
