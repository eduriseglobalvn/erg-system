import type {
  QuestionBankCategory,
  QuestionBankDifficulty,
  QuestionBankQuestion,
  QuestionBankStatus,
  QuestionBankSubject,
  QuestionBankSubjectId,
  QuizBankItem,
  QuizBankKind,
} from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { ContentScope } from "@/types/scope-types";

const globalScope: ContentScope = { type: "global" };
const alphaScope: ContentScope = {
  type: "center",
  centerId: "school-erg-alpha",
  centerName: "ERG Alpha Campus",
};
const eastScope: ContentScope = {
  type: "center",
  centerId: "school-erg-east",
  centerName: "ERG East Learning Point",
};

const ic3Gs6Levels = [
  {
    id: "ic3-l1",
    label: "Level 1",
    description: "Nền tảng máy tính",
    topics: [
      "Thiết bị và hệ điều hành",
      "Quản lý tệp",
      "Gõ phím và nhập liệu",
      "Internet an toàn",
      "Email cơ bản",
      "Word căn bản",
      "Ôn tập level 1",
    ],
  },
  {
    id: "ic3-l2",
    label: "Level 2",
    description: "Ứng dụng văn phòng",
    topics: [
      "Word nâng cao",
      "Excel nhập môn",
      "Công thức Excel",
      "PowerPoint",
      "Làm việc nhóm online",
      "Tìm kiếm thông tin",
      "Ôn tập level 2",
    ],
  },
  {
    id: "ic3-l3",
    label: "Level 3",
    description: "Năng lực số IC3",
    topics: [
      "Bảo mật tài khoản",
      "Dữ liệu và biểu đồ",
      "Tư duy thuật toán",
      "Bản quyền số",
      "Thuyết trình dự án",
      "Kiểm tra mô phỏng IC3",
      "Ôn tập level 3",
    ],
  },
] as const;

const ic3Categories: QuestionBankCategory[] = ic3Gs6Levels.flatMap((level) =>
  level.topics.map((topic, topicIndex) => ({
    id: `${level.id}-topic-${topicIndex + 1}`,
    label: topic,
    levelId: level.id,
  })),
);

export const questionBankSubjects: QuestionBankSubject[] = [
  {
    id: "ic3-gs6",
    label: "IC3 GS6",
    description: "3 level, mỗi level gồm nhiều chủ đề kỹ năng số.",
    companyScopeLabel: "Dùng chung toàn công ty",
    levels: ic3Gs6Levels.map((level) => ({
      id: level.id,
      label: level.label,
      description: level.description,
      categoryIds: ic3Categories.filter((category) => category.levelId === level.id).map((category) => category.id),
    })),
    categories: ic3Categories,
  },
  createLegacySubject("mathematics", "Toán học", ["Phân số", "Hình học", "Thống kê"]),
  createLegacySubject("english", "Tiếng Anh", ["Reading", "Grammar", "Vocabulary"]),
  createLegacySubject("science", "Khoa học", ["Sinh học", "Vật lý", "Trái đất"]),
];

const ic3QuestionBlueprints: Array<{
  levelId: string;
  categoryIndex: number;
  stem: string;
  objective: string;
  type: QuestionType;
  difficulty: QuestionBankDifficulty;
  status: QuestionBankStatus;
  answer?: string;
}> = [
  {
    levelId: "ic3-l1",
    categoryIndex: 0,
    stem: "Thiết bị nào dùng để nhập dữ liệu chữ vào máy tính?",
    objective: "Nhận biết thiết bị nhập liệu cơ bản.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "Bàn phím",
  },
  {
    levelId: "ic3-l1",
    categoryIndex: 1,
    stem: "Khi muốn đổi tên một tệp, thao tác nào là phù hợp nhất?",
    objective: "Thực hiện thao tác quản lý tệp an toàn.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "Rename",
  },
  {
    levelId: "ic3-l1",
    categoryIndex: 3,
    stem: "Dấu hiệu nào cho thấy một website đang dùng kết nối an toàn?",
    objective: "Nhận diện kết nối an toàn khi truy cập Internet.",
    type: "multiple-choice",
    difficulty: "stretch",
    status: "ready",
    answer: "Biểu tượng ổ khóa và HTTPS",
  },
  {
    levelId: "ic3-l1",
    categoryIndex: 5,
    stem: "Trong Word, tính năng nào giúp căn đều hai lề đoạn văn?",
    objective: "Sử dụng định dạng đoạn văn cơ bản.",
    type: "multiple-choice",
    difficulty: "core",
    status: "reviewing",
    answer: "Justify",
  },
  {
    levelId: "ic3-l2",
    categoryIndex: 0,
    stem: "Trong Word, mục lục tự động thường dựa vào thành phần nào?",
    objective: "Hiểu cách dùng heading để tạo mục lục.",
    type: "multiple-choice",
    difficulty: "stretch",
    status: "ready",
    answer: "Heading styles",
  },
  {
    levelId: "ic3-l2",
    categoryIndex: 1,
    stem: "Trong Excel, ô A1 chứa 10 và A2 chứa 15. Công thức nào tính tổng hai ô?",
    objective: "Dùng công thức tính toán cơ bản trong bảng tính.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "=SUM(A1:A2)",
  },
  {
    levelId: "ic3-l2",
    categoryIndex: 2,
    stem: "Hàm nào dùng để tìm giá trị lớn nhất trong một vùng dữ liệu Excel?",
    objective: "Nhận biết hàm thống kê thông dụng.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "MAX",
  },
  {
    levelId: "ic3-l2",
    categoryIndex: 4,
    stem: "Khi làm việc nhóm online, hành vi nào giúp giảm nhầm lẫn phiên bản tài liệu?",
    objective: "Áp dụng nguyên tắc cộng tác tài liệu trực tuyến.",
    type: "multiple-response",
    difficulty: "stretch",
    status: "pilot",
    answer: "Đặt tên phiên bản rõ ràng; bình luận thay vì ghi đè",
  },
  {
    levelId: "ic3-l3",
    categoryIndex: 0,
    stem: "Yếu tố nào làm mật khẩu mạnh hơn?",
    objective: "Áp dụng nguyên tắc bảo mật tài khoản.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "Dài, có chữ hoa, chữ thường, số và ký tự đặc biệt",
  },
  {
    levelId: "ic3-l3",
    categoryIndex: 1,
    stem: "Biểu đồ cột phù hợp nhất khi cần làm gì?",
    objective: "Chọn biểu đồ phù hợp với mục tiêu trình bày dữ liệu.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "So sánh các nhóm dữ liệu",
  },
  {
    levelId: "ic3-l3",
    categoryIndex: 2,
    stem: "Sắp xếp các bước: xác định bài toán, viết thuật toán, chạy thử, sửa lỗi.",
    objective: "Hiểu trình tự tư duy thuật toán cơ bản.",
    type: "sequence",
    difficulty: "challenge",
    status: "ready",
    answer: "Xác định bài toán → viết thuật toán → chạy thử → sửa lỗi",
  },
  {
    levelId: "ic3-l3",
    categoryIndex: 5,
    stem: "Một bài kiểm tra mô phỏng IC3 nên ưu tiên điều gì?",
    objective: "Hiểu mục tiêu của bài test mô phỏng năng lực.",
    type: "multiple-choice",
    difficulty: "challenge",
    status: "reviewing",
    answer: "Đo đúng năng lực theo từng mục tiêu kỹ năng",
  },
];

const ic3Questions: QuestionBankQuestion[] = ic3QuestionBlueprints.map((item, index) => {
  const level = questionBankSubjects[0].levels.find((entry) => entry.id === item.levelId) ?? questionBankSubjects[0].levels[0];
  const categories = questionBankSubjects[0].categories.filter((category) => category.levelId === item.levelId);
  const category = categories[item.categoryIndex] ?? categories[0];

  return {
    id: `qb-ic3-${String(index + 1).padStart(3, "0")}`,
    scope: index % 5 === 3 ? alphaScope : globalScope,
    subjectId: "ic3-gs6",
    subjectLabel: "IC3 GS6",
    levelId: level.id,
    levelLabel: level.label,
    categoryId: category.id,
    categoryLabel: category.label,
    gradeLabel: "Khối 6",
    type: item.type,
    difficulty: item.difficulty,
    status: item.status,
    stem: item.stem,
    objective: item.objective,
    tags: ["IC3 GS6", level.label, category.label],
    masteryRate: 62 + ((index * 7) % 33),
    usageCount: 18 + index * 5,
    schoolsUsing: 3 + (index % 7),
    lastUsedAt: index % 2 === 0 ? "Hôm nay, 10:20" : "Hôm qua, 16:40",
    recommendedCluster: index % 3 === 0 ? "Cụm Trung tâm" : index % 3 === 1 ? "Cụm Đông Bắc" : "Cụm Nam Sài Gòn",
    answer: item.answer,
    rationale: item.answer ? `Đáp án trọng tâm: ${item.answer}.` : undefined,
    choices: createDefaultChoices(item.answer),
  };
});

export const questionBankQuestions: QuestionBankQuestion[] = [
  ...ic3Questions,
  createLegacyQuestion("qb-math-001", "mathematics", "Phân số", "Lan ăn 3/8 chiếc bánh và Minh ăn 1/4 chiếc bánh. Tổng cộng hai bạn đã ăn bao nhiêu chiếc bánh?", "Cộng hai phân số khác mẫu số cơ bản.", "core", 82, globalScope),
  createLegacyQuestion("qb-math-002", "mathematics", "Hình học", "Một hình chữ nhật có chiều dài 12 cm và chiều rộng 7 cm. Chu vi của hình là bao nhiêu?", "Tính chu vi hình chữ nhật.", "stretch", 76, alphaScope),
  createLegacyQuestion("qb-eng-001", "english", "Reading", "Mai walks to school every day because it is near her house. Why does Mai walk to school?", "Xác định thông tin trực tiếp trong câu đọc hiểu ngắn.", "core", 88, alphaScope),
  createLegacyQuestion("qb-sci-001", "science", "Sinh học", "Bộ phận nào của cây có vai trò hút nước và muối khoáng từ đất?", "Nhận biết chức năng cơ bản của rễ cây.", "core", 91, eastScope),
];

export const quizBankItems: QuizBankItem[] = [
  createQuizBankItem({
    id: "quiz-ic3-l1-foundation-train",
    title: "IC3 GS6 L1 - Train nền tảng máy tính",
    kind: "train",
    levelId: "ic3-l1",
    questionIds: ["qb-ic3-001", "qb-ic3-002", "qb-ic3-003", "qb-ic3-004"],
    durationLabel: "20 phút",
    sourceMode: "auto-random",
    status: "ready",
    scope: globalScope,
  }),
  createQuizBankItem({
    id: "quiz-ic3-l2-excel-test",
    title: "IC3 GS6 L2 - Test Excel nhập môn",
    kind: "test",
    levelId: "ic3-l2",
    questionIds: ["qb-ic3-006", "qb-ic3-007"],
    durationLabel: "15 phút",
    sourceMode: "manual",
    status: "ready",
    scope: alphaScope,
  }),
  createQuizBankItem({
    id: "quiz-ic3-l3-security-train",
    title: "IC3 GS6 L3 - Train bảo mật tài khoản",
    kind: "train",
    levelId: "ic3-l3",
    questionIds: ["qb-ic3-009", "qb-ic3-010", "qb-ic3-011"],
    durationLabel: "25 phút",
    sourceMode: "auto-random",
    status: "draft",
    scope: globalScope,
  }),
  createQuizBankItem({
    id: "quiz-ic3-l3-mock-test",
    title: "IC3 GS6 L3 - Test mô phỏng cuối level",
    kind: "test",
    levelId: "ic3-l3",
    questionIds: ["qb-ic3-009", "qb-ic3-010", "qb-ic3-011", "qb-ic3-012"],
    durationLabel: "30 phút",
    sourceMode: "manual",
    status: "reviewing",
    scope: globalScope,
  }),
];

export function getQuestionBankSubject(subjectId: QuestionBankSubjectId) {
  return questionBankSubjects.find((subject) => subject.id === subjectId) ?? questionBankSubjects[0];
}

export function getQuestionBankLevel(subjectId: QuestionBankSubjectId, levelId: string) {
  const subject = getQuestionBankSubject(subjectId);
  return subject.levels.find((level) => level.id === levelId) ?? subject.levels[0];
}

export function getQuestionBankCategoryCount(subjectId: QuestionBankSubjectId, categoryId: string, levelId?: string) {
  return questionBankQuestions.filter(
    (question) =>
      question.subjectId === subjectId &&
      question.categoryId === categoryId &&
      (!levelId || question.levelId === levelId),
  ).length;
}

function createLegacySubject(
  id: Exclude<QuestionBankSubjectId, "ic3-gs6">,
  label: string,
  topicLabels: string[],
): QuestionBankSubject {
  const levelId = `${id}-other`;

  return {
    id,
    label,
    description: "Nguồn câu hỏi dùng chung chưa gắn lộ trình nhiều level.",
    companyScopeLabel: "Dùng chung toàn công ty",
    levels: [{ id: levelId, label: "Khác", description: "Chưa phân level", categoryIds: topicLabels.map((_, index) => `${id}-topic-${index + 1}`) }],
    categories: topicLabels.map((topic, index) => ({
      id: `${id}-topic-${index + 1}`,
      label: topic,
      levelId,
    })),
  };
}

function createLegacyQuestion(
  id: string,
  subjectId: Exclude<QuestionBankSubjectId, "ic3-gs6">,
  categoryLabel: string,
  stem: string,
  objective: string,
  difficulty: QuestionBankDifficulty,
  masteryRate: number,
  scope: ContentScope,
): QuestionBankQuestion {
  const subject = getQuestionBankSubject(subjectId);
  const category = subject.categories.find((item) => item.label === categoryLabel) ?? subject.categories[0];
  const level = subject.levels[0];

  return {
    id,
    scope,
    subjectId,
    subjectLabel: subject.label,
    levelId: level.id,
    levelLabel: level.label,
    categoryId: category.id,
    categoryLabel: category.label,
    gradeLabel: "Khối 6",
    type: "multiple-choice",
    difficulty,
    status: "ready",
    stem,
    objective,
    tags: [subject.label, category.label],
    masteryRate,
    usageCount: 20 + masteryRate % 17,
    schoolsUsing: 5,
    lastUsedAt: "Hôm qua, 09:30",
    recommendedCluster: "Cụm Trung tâm",
    choices: createDefaultChoices("Đáp án đúng"),
  };
}

function createQuizBankItem({
  id,
  title,
  kind,
  levelId,
  questionIds,
  durationLabel,
  sourceMode,
  status,
  scope,
}: {
  id: string;
  title: string;
  kind: QuizBankKind;
  levelId: string;
  questionIds: string[];
  durationLabel: string;
  sourceMode: "manual" | "auto-random";
  status: QuizBankItem["status"];
  scope: ContentScope;
}): QuizBankItem {
  const questions = questionIds
    .map((questionId) => ic3Questions.find((question) => question.id === questionId))
    .filter((question): question is QuestionBankQuestion => Boolean(question));
  const topicLabels = Array.from(new Set(questions.map((question) => question.categoryLabel)));
  const level = getQuestionBankLevel("ic3-gs6", levelId);

  return {
    id,
    scope,
    title,
    kind,
    status,
    subjectId: "ic3-gs6",
    subjectLabel: "IC3 GS6",
    levelId,
    levelLabel: level.label,
    topicLabels,
    questionIds,
    questionCount: questionIds.length,
    durationLabel,
    scopeLabel: getScopeLabel(scope),
    sourceMode,
    ownerLabel: "Academic team",
    updatedAt: "Cập nhật hôm nay",
  };
}

function getScopeLabel(scope: ContentScope) {
  return scope.type === "global" ? "Toàn công ty" : scope.centerName;
}

function createDefaultChoices(correctAnswer?: string) {
  if (!correctAnswer) return undefined;

  return [
    { id: "a", label: correctAnswer, correct: true },
    { id: "b", label: "Phương án gây nhiễu 1", correct: false },
    { id: "c", label: "Phương án gây nhiễu 2", correct: false },
    { id: "d", label: "Phương án gây nhiễu 3", correct: false },
  ];
}
