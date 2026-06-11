import type {
  LearningResourceResourceCard,
  LearningResourceTaxonomyOption,
  LearningResourceTaxonomyResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import type { LocalContentItem } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

export const USE_LEARNING_RESOURCE_AUTHORING_MOCK = true;

const IC3_SUBJECT_ID = "mock-ic3-gs6";
const STEM_SUBJECT_ID = "mock-stem";

export const mockLearningResourceAuthoringTaxonomy: LearningResourceTaxonomyResponse = {
  grades: [],
  subjects: [
    {
      id: IC3_SUBJECT_ID,
      label: "IC3 GS6",
      slug: "ic3-gs6",
      description: "Kho học liệu chứng chỉ IC3 GS6 theo các mảng kiến thức chính.",
      status: "active",
    },
    {
      id: STEM_SUBJECT_ID,
      label: "STEM",
      slug: "stem",
      description: "Kho bài giảng STEM theo chủ đề dự án, kỹ thuật và tư duy thiết kế.",
      status: "active",
    },
  ],
  categories: [
    category("mock-ic3-computing", "Máy tính căn bản", IC3_SUBJECT_ID, 1),
    category("mock-ic3-applications", "Ứng dụng văn phòng", IC3_SUBJECT_ID, 2),
    category("mock-ic3-online", "Sống trực tuyến", IC3_SUBJECT_ID, 3),
    category("mock-ic3-review", "Ôn tập chứng chỉ", IC3_SUBJECT_ID, 4),
    category("mock-stem-foundation", "STEM Foundation", STEM_SUBJECT_ID, 1),
    category("mock-stem-robotics", "Robotics & Engineering", STEM_SUBJECT_ID, 2),
    category("mock-stem-science", "Science Projects", STEM_SUBJECT_ID, 3),
    category("mock-stem-design", "Design Thinking", STEM_SUBJECT_ID, 4),
  ],
  sections: [
    section("mock-ic3-computing-01", "01. Tổng quan phần cứng và hệ điều hành", IC3_SUBJECT_ID, "mock-ic3-computing", 1),
    section("mock-ic3-computing-02", "02. Quản lý thư mục và tệp", IC3_SUBJECT_ID, "mock-ic3-computing", 2),
    section("mock-ic3-computing-03", "03. Bảo mật máy tính cá nhân", IC3_SUBJECT_ID, "mock-ic3-computing", 3),
    section("mock-ic3-applications-01", "01. Word cơ bản", IC3_SUBJECT_ID, "mock-ic3-applications", 1),
    section("mock-ic3-applications-02", "02. Excel cơ bản", IC3_SUBJECT_ID, "mock-ic3-applications", 2),
    section("mock-ic3-applications-03", "03. PowerPoint thuyết trình", IC3_SUBJECT_ID, "mock-ic3-applications", 3),
    section("mock-ic3-online-01", "01. Internet và tìm kiếm thông tin", IC3_SUBJECT_ID, "mock-ic3-online", 1),
    section("mock-ic3-online-02", "02. Email và an toàn số", IC3_SUBJECT_ID, "mock-ic3-online", 2),
    section("mock-ic3-review-01", "01. Bộ đề ôn tập GS6", IC3_SUBJECT_ID, "mock-ic3-review", 1),
    section("mock-ic3-review-02", "02. Mô phỏng bài thi", IC3_SUBJECT_ID, "mock-ic3-review", 2),
    section("mock-stem-foundation-01", "01. Quy trình thiết kế kỹ thuật", STEM_SUBJECT_ID, "mock-stem-foundation", 1),
    section("mock-stem-foundation-02", "02. Đo lường và thu thập dữ liệu", STEM_SUBJECT_ID, "mock-stem-foundation", 2),
    section("mock-stem-robotics-01", "01. Làm quen cảm biến", STEM_SUBJECT_ID, "mock-stem-robotics", 1),
    section("mock-stem-robotics-02", "02. Điều khiển robot theo đường line", STEM_SUBJECT_ID, "mock-stem-robotics", 2),
    section("mock-stem-science-01", "01. Năng lượng tái tạo", STEM_SUBJECT_ID, "mock-stem-science", 1),
    section("mock-stem-science-02", "02. Cầu giấy chịu lực", STEM_SUBJECT_ID, "mock-stem-science", 2),
    section("mock-stem-design-01", "01. Design Thinking cho học sinh", STEM_SUBJECT_ID, "mock-stem-design", 1),
    section("mock-stem-design-02", "02. Prototype và thuyết trình sản phẩm", STEM_SUBJECT_ID, "mock-stem-design", 2),
  ],
  bookSeries: [],
  topics: [
    topic("mock-topic-digital-literacy", "Digital Literacy", IC3_SUBJECT_ID, 1),
    topic("mock-topic-productivity", "Productivity Tools", IC3_SUBJECT_ID, 2),
    topic("mock-topic-online-collaboration", "Online Collaboration", IC3_SUBJECT_ID, 3),
    topic("mock-topic-engineering-design", "Engineering Design", STEM_SUBJECT_ID, 1),
    topic("mock-topic-robotics", "Robotics", STEM_SUBJECT_ID, 2),
    topic("mock-topic-applied-science", "Applied Science", STEM_SUBJECT_ID, 3),
  ],
  fileTypes: ["PPTX", "PDF", "HTML5", "VIDEO"],
  designerPresets: [],
};

export const mockLearningResourceAuthoringResources: LearningResourceResourceCard[] = [
  lecture("mock-ic3-computing-01-pptx", "Bài giảng - Tổng quan phần cứng và hệ điều hành", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-computing", "mock-ic3-computing-01", 1, "mock-topic-digital-literacy"),
  lecture("mock-ic3-computing-02-pptx", "Bài giảng - Quản lý thư mục và tệp", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-computing", "mock-ic3-computing-02", 2, "mock-topic-digital-literacy"),
  lecture("mock-ic3-computing-03-pptx", "Bài giảng - Bảo mật máy tính cá nhân", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-computing", "mock-ic3-computing-03", 3, "mock-topic-digital-literacy"),
  lecture("mock-ic3-applications-01-pptx", "Bài giảng - Word cơ bản", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-applications", "mock-ic3-applications-01", 4, "mock-topic-productivity"),
  lecture("mock-ic3-applications-02-pptx", "Bài giảng - Excel cơ bản", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-applications", "mock-ic3-applications-02", 5, "mock-topic-productivity"),
  lecture("mock-ic3-applications-03-pptx", "Bài giảng - PowerPoint thuyết trình", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-applications", "mock-ic3-applications-03", 6, "mock-topic-productivity"),
  lecture("mock-ic3-online-01-pptx", "Bài giảng - Internet và tìm kiếm thông tin", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-online", "mock-ic3-online-01", 7, "mock-topic-online-collaboration"),
  lecture("mock-ic3-online-02-pptx", "Bài giảng - Email và an toàn số", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-online", "mock-ic3-online-02", 8, "mock-topic-online-collaboration"),
  lecture("mock-ic3-review-01-pptx", "Bài giảng - Bộ đề ôn tập GS6", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-review", "mock-ic3-review-01", 9, "mock-topic-digital-literacy"),
  activity("mock-ic3-review-02-html5", "Bài tập - Mô phỏng bài thi IC3 GS6", "ic3-gs6", IC3_SUBJECT_ID, "mock-ic3-review", "mock-ic3-review-02", "mock-topic-digital-literacy"),
  lecture("mock-stem-foundation-01-pptx", "Bài giảng - Quy trình thiết kế kỹ thuật", "stem", STEM_SUBJECT_ID, "mock-stem-foundation", "mock-stem-foundation-01", 1, "mock-topic-engineering-design"),
  lecture("mock-stem-foundation-02-pptx", "Bài giảng - Đo lường và thu thập dữ liệu", "stem", STEM_SUBJECT_ID, "mock-stem-foundation", "mock-stem-foundation-02", 2, "mock-topic-engineering-design"),
  lecture("mock-stem-robotics-01-pptx", "Bài giảng - Làm quen cảm biến", "stem", STEM_SUBJECT_ID, "mock-stem-robotics", "mock-stem-robotics-01", 3, "mock-topic-robotics"),
  lecture("mock-stem-robotics-02-pptx", "Bài giảng - Điều khiển robot theo đường line", "stem", STEM_SUBJECT_ID, "mock-stem-robotics", "mock-stem-robotics-02", 4, "mock-topic-robotics"),
  lecture("mock-stem-science-01-pptx", "Bài giảng - Năng lượng tái tạo", "stem", STEM_SUBJECT_ID, "mock-stem-science", "mock-stem-science-01", 5, "mock-topic-applied-science"),
  lecture("mock-stem-science-02-pptx", "Bài giảng - Cầu giấy chịu lực", "stem", STEM_SUBJECT_ID, "mock-stem-science", "mock-stem-science-02", 6, "mock-topic-applied-science"),
  lecture("mock-stem-design-01-pptx", "Bài giảng - Design Thinking cho học sinh", "stem", STEM_SUBJECT_ID, "mock-stem-design", "mock-stem-design-01", 7, "mock-topic-engineering-design"),
  lecture("mock-stem-design-02-pptx", "Bài giảng - Prototype và thuyết trình sản phẩm", "stem", STEM_SUBJECT_ID, "mock-stem-design", "mock-stem-design-02", 8, "mock-topic-engineering-design"),
];

export const mockLearningResourceAuthoringLocalContent: LocalContentItem[] = [
  localLecture("mock-local-ic3-files", IC3_SUBJECT_ID, "mock-ic3-computing-02", "Google Slides - Quản lý thư mục và tệp", "Digital Literacy"),
  localExercise("mock-local-ic3-exam", IC3_SUBJECT_ID, "mock-ic3-review-02", "Bài tập - Mô phỏng bài thi IC3 GS6", "Digital Literacy", 45, 60),
  localLecture("mock-local-stem-robot-line", STEM_SUBJECT_ID, "mock-stem-robotics-02", "Google Slides - Robot dò line", "Robotics"),
  localExercise("mock-local-stem-bridge", STEM_SUBJECT_ID, "mock-stem-science-02", "Bài tập - Tính tải trọng cầu giấy", "Applied Science", 12, 35),
];

function category(id: string, label: string, subjectId: string, sortOrder: number): LearningResourceTaxonomyOption {
  return {
    id,
    label,
    slug: id.replace(/^mock-/, ""),
    subjectId,
    sortOrder,
    status: "active",
  };
}

function section(id: string, label: string, subjectId: string, categoryId: string, sortOrder: number): LearningResourceTaxonomyOption {
  return {
    id,
    label,
    slug: id.replace(/^mock-/, ""),
    subjectId,
    categoryId,
    sortOrder,
    status: "active",
  };
}

function topic(id: string, label: string, subjectId: string, sortOrder: number): LearningResourceTaxonomyOption {
  return {
    id,
    label,
    slug: id.replace(/^mock-topic-/, ""),
    subjectId,
    sortOrder,
    status: "active",
  };
}

function lecture(
  id: string,
  title: string,
  programSlug: string,
  subjectId: string,
  categoryId: string,
  sectionId: string,
  sortOrder: number,
  topicId: string,
): LearningResourceResourceCard {
  return resource(id, title, programSlug, subjectId, categoryId, sectionId, topicId, "PPTX", "PPTX", sortOrder);
}

function activity(
  id: string,
  title: string,
  programSlug: string,
  subjectId: string,
  categoryId: string,
  sectionId: string,
  topicId: string,
): LearningResourceResourceCard {
  return resource(id, title, programSlug, subjectId, categoryId, sectionId, topicId, "HTML5", "Quiz", 99);
}

function resource(
  id: string,
  title: string,
  programSlug: string,
  subjectId: string,
  categoryId: string,
  sectionId: string,
  topicId: string,
  selectedFileType: string,
  fileTypeBadge: string,
  sortOrder: number,
): LearningResourceResourceCard {
  return {
    id,
    slug: id.replace(/^mock-/, ""),
    title,
    programSlug,
    subjectId,
    categoryId,
    sectionId,
    topicId,
    selectedFileType,
    fileTypeBadge,
    launchMode: "external",
    priceType: "free",
    accessState: "open",
    visibility: "public",
    status: "published",
    canDownload: selectedFileType !== "PPTX",
    updatedAt: "2026-06-02T07:00:00.000Z",
    subtitle: `Mock ${sortOrder}`,
  };
}

function localLecture(id: string, subjectId: string, sectionId: string, title: string, topicLabel: string): LocalContentItem {
  return {
    id,
    kind: "lecture",
    subjectId,
    parentNodeId: `lesson-${sectionId}`,
    parentOptionId: sectionId,
    title,
    topicLabel,
    slidesUrl: `https://docs.google.com/presentation/d/${id}/preview`,
    status: "published",
  };
}

function localExercise(
  id: string,
  subjectId: string,
  sectionId: string,
  title: string,
  topicLabel: string,
  questionCount: number,
  durationMinutes: number,
): LocalContentItem {
  return {
    id,
    kind: "exercise",
    subjectId,
    parentNodeId: `lesson-${sectionId}`,
    parentOptionId: sectionId,
    title,
    topicLabel,
    resourceUrl: `https://lcms.erg.edu.local/mock/${id}`,
    questionCount,
    durationMinutes,
    status: "published",
  };
}
