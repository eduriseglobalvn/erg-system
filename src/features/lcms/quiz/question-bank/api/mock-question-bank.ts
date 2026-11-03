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
  createLeveledSubject("python", "Python", [
    { id: "python-foundation", label: "Foundation", topics: ["Biến và kiểu dữ liệu", "Điều kiện", "Vòng lặp", "Hàm cơ bản", "Ôn tập Python foundation"] },
    { id: "python-intermediate", label: "Intermediate", topics: ["List và dictionary", "Xử lý chuỗi", "Đọc ghi file", "Debug và test", "Mini project"] },
  ]),
  createLeveledSubject("mos", "MOS", [
    { id: "mos-word", label: "Word Associate", topics: ["Định dạng văn bản", "Bảng và hình ảnh", "Tham chiếu và mail merge", "Ôn tập Word"] },
    { id: "mos-excel", label: "Excel Associate", topics: ["Công thức cơ bản", "Bảng dữ liệu", "Biểu đồ", "Ôn tập Excel"] },
    { id: "mos-powerpoint", label: "PowerPoint Associate", topics: ["Bố cục slide", "Transition và animation", "Trình chiếu", "Ôn tập PowerPoint"] },
  ]),
  createLeveledSubject("scratch", "Scratch", [
    { id: "scratch-intro", label: "Thiếu nhi", topics: ["Làm quen khối lệnh", "Chuyển động và âm thanh", "Sự kiện và điều khiển", "Dự án mê cung"] },
  ]),
  createLeveledSubject("tin-hoc-tre", "Tin học trẻ", [
    { id: "tht-bang-a", label: "Đội tuyển", topics: ["Tư duy thuật toán", "Dãy số và ước số", "Hình học và đồ họa", "Mini contest"] },
  ]),
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
  // Level 1: Nền tảng máy tính
  {
    levelId: "ic3-l1",
    categoryIndex: 0,
    stem: "Thiết bị nào sau đây dùng để nhập dữ liệu chữ và số vào máy tính?",
    objective: "Nhận biết thiết bị nhập liệu cơ bản.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "Bàn phím (Keyboard)",
  },
  {
    levelId: "ic3-l1",
    categoryIndex: 0,
    stem: "Cổng kết nối nào truyền tải đồng thời cả tín hiệu hình ảnh và âm thanh kỹ thuật số chất lượng cao?",
    objective: "Nhận biết các chuẩn cổng kết nối phần cứng máy tính.",
    type: "multiple-choice",
    difficulty: "stretch",
    status: "ready",
    answer: "Cổng HDMI",
  },
  {
    levelId: "ic3-l1",
    categoryIndex: 1,
    stem: "Phím tắt nào dùng để sao chép (Copy) tệp hoặc thư mục trong File Explorer?",
    objective: "Thao tác quản lý tệp và thư mục nhanh.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "Ctrl + C",
  },
  {
    levelId: "ic3-l1",
    categoryIndex: 1,
    stem: "Đuôi mở rộng .docx cho biết đây là định dạng tệp của ứng dụng nào?",
    objective: "Nhận diện định dạng tệp văn bản tiêu chuẩn.",
    type: "multiple-choice",
    difficulty: "stretch",
    status: "ready",
    answer: "Microsoft Word",
  },
  {
    levelId: "ic3-l1",
    categoryIndex: 3,
    stem: "Khi lướt web, biểu tượng ổ khóa cạnh thanh địa chỉ (HTTPS) biểu thị điều gì?",
    objective: "Nhận diện kết nối web an toàn.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "Kết nối đã được mã hóa an toàn",
  },
  {
    levelId: "ic3-l1",
    categoryIndex: 3,
    stem: "Hành vi nào giúp bảo vệ thông tin cá nhân tốt nhất khi sử dụng mạng Wi-Fi công cộng?",
    objective: "Áp dụng thói quen an toàn thông tin trên mạng công cộng.",
    type: "multiple-choice",
    difficulty: "challenge",
    status: "ready",
    answer: "Không đăng nhập tài khoản ngân hàng và sử dụng VPN",
  },
  {
    levelId: "ic3-l1",
    categoryIndex: 5,
    stem: "Để in đậm đoạn văn bản đã chọn trong Word, em nhấn tổ hợp phím nào?",
    objective: "Sử dụng phím tắt định dạng văn bản cơ bản.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "Ctrl + B",
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
    stem: "Trong Excel, công thức nào tính trung bình cộng của các ô từ B2 đến B10?",
    objective: "Áp dụng hàm tính trung bình trong bảng tính.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "=AVERAGE(B2:B10)",
  },
  {
    levelId: "ic3-l2",
    categoryIndex: 2,
    stem: "Khi sao chép công thức sang ô khác, tham chiếu tuyệt đối $A$1 sẽ thay đổi như thế nào?",
    objective: "Hiểu bản chất tham chiếu tuyệt đối trong công thức Excel.",
    type: "multiple-choice",
    difficulty: "stretch",
    status: "ready",
    answer: "Giữ nguyên không thay đổi",
  },
  {
    levelId: "ic3-l2",
    categoryIndex: 3,
    stem: "Chức năng Transition trong PowerPoint dùng để thiết lập hiệu ứng cho đối tượng nào?",
    objective: "Phân biệt hiệu ứng chuyển trang Transition và hiệu ứng Animation.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "Chuyển đổi giữa các trang slide",
  },
  {
    levelId: "ic3-l2",
    categoryIndex: 4,
    stem: "Khi cùng chỉnh sửa tài liệu trên Google Docs, tính năng nào giúp trao đổi ý kiến mà không sửa trực tiếp vào bài?",
    objective: "Áp dụng kỹ năng cộng tác tài liệu nhóm trực tuyến.",
    type: "multiple-choice",
    difficulty: "stretch",
    status: "ready",
    answer: "Tính năng Bình luận (Comment)",
  },

  // Level 3: Năng lực số IC3
  {
    levelId: "ic3-l3",
    categoryIndex: 0,
    stem: "Xác thực 2 yếu tố (2FA) bảo vệ tài khoản bằng cách nào?",
    objective: "Áp dụng bảo mật nâng cao cho tài khoản trực tuyến.",
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    answer: "Yêu cầu mật khẩu và mã OTP gửi qua điện thoại",
  },
  {
    levelId: "ic3-l3",
    categoryIndex: 1,
    stem: "Dạng biểu đồ nào thích hợp nhất để thể hiện tỉ lệ phần trăm cơ cấu học sinh của các khối lớp?",
    objective: "Chọn dạng biểu đồ trực quan hóa dữ liệu thống kê phù hợp.",
    type: "multiple-choice",
    difficulty: "stretch",
    status: "ready",
    answer: "Biểu đồ tròn (Pie chart)",
  },
  {
    levelId: "ic3-l3",
    categoryIndex: 2,
    stem: "Thứ tự chuẩn để giải quyết một bài toán lập trình máy tính là gì?",
    objective: "Hiểu tư duy thuật toán và quy trình lập trình cơ bản.",
    type: "multiple-choice",
    difficulty: "challenge",
    status: "ready",
    answer: "Xác định bài toán → Thiết kế thuật toán → Viết mã → Kiểm thử",
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
  createLegacyQuestion("qb-python-001", "python", "Biến và kiểu dữ liệu", "Kiểu dữ liệu nào phù hợp để lưu giá trị đúng/sai trong Python?", "Nhận biết bool trong Python.", "core", 82, globalScope),
  createLegacyQuestion("qb-python-002", "python", "Điều kiện", "Câu lệnh nào dùng để kiểm tra điều kiện trong Python?", "Nhận biết câu lệnh if.", "core", 76, alphaScope),
  createLegacyQuestion("qb-python-003", "python", "List và dictionary", "Những cấu trúc nào có thể lưu nhiều giá trị trong Python?", "Phân biệt list và dictionary.", "stretch", 88, alphaScope),
  createLegacyQuestion("qb-python-004", "python", "Vòng lặp", "Cú pháp vòng lặp for i in range(1, 10) sẽ lặp bao nhiêu lần?", "Hiểu cơ chế range() trong Python.", "core", 85, globalScope),
  createLegacyQuestion("qb-python-005", "python", "Hàm cơ bản", "Từ khóa nào trong Python dùng để định nghĩa một hàm mới?", "Cú pháp định nghĩa hàm def.", "core", 90, globalScope),
  createLegacyQuestion("qb-mos-001", "mos", "Định dạng văn bản", "Trong Microsoft Word, công cụ nào dùng để áp dụng nhanh bộ định dạng tiêu đề?", "Sử dụng Styles trong Word.", "core", 91, eastScope),
  createLegacyQuestion("qb-mos-002", "mos", "Công thức cơ bản", "Trong Excel, công thức nào tính tổng vùng A1 đến A5?", "Sử dụng hàm SUM.", "core", 84, globalScope),
  createLegacyQuestion("qb-mos-003", "mos", "Bố cục slide", "Trong PowerPoint, Slide Master giúp làm gì?", "Quản lý bố cục và định dạng chung.", "stretch", 79, eastScope),
  createLegacyQuestion("qb-mos-004", "mos", "Biểu đồ", "Loại biểu đồ nào trong Excel thể hiện xu hướng thay đổi dữ liệu theo thời gian tốt nhất?", "Vẽ biểu đồ đường (Line chart).", "stretch", 82, globalScope),
  createLegacyQuestion("qb-scratch-001", "scratch", "Làm quen khối lệnh", "Khối lệnh nào trong Scratch dùng để bắt đầu chạy chương trình khi bấm lá cờ xanh?", "Khối sự kiện Khi bấm cờ xanh.", "core", 95, globalScope),
  createLegacyQuestion("qb-scratch-002", "scratch", "Chuyển động và âm thanh", "Để nhân vật di chuyển 10 bước về phía trước, ta sử dụng khối lệnh nào?", "Khối lệnh move 10 steps.", "core", 92, globalScope),
  createLegacyQuestion("qb-scratch-003", "scratch", "Dự án mê cung", "Làm thế nào để phát hiện nhân vật chạm vào tường mê cung trong Scratch?", "Khối lệnh cảm biến Touching color.", "stretch", 80, globalScope),
  createLegacyQuestion("qb-tht-001", "tin-hoc-tre", "Tư duy thuật toán", "Thuật toán tìm kiếm nhị phân yêu cầu dãy số đầu vào phải thỏa mãn điều kiện gì?", "Dãy số đã được sắp xếp tăng dần.", "stretch", 75, globalScope),
  createLegacyQuestion("qb-tht-002", "tin-hoc-tre", "Dãy số và ước số", "Số nguyên dương lớn hơn 1 chỉ có đúng hai ước số là 1 và chính nó được gọi là gì?", "Định nghĩa số nguyên tố.", "core", 88, globalScope),
  createLegacyQuestion("qb-tht-003", "tin-hoc-tre", "Mini contest", "Độ phức tạp thời gian O(log N) thường xuất hiện trong thuật toán nào?", "Phân tích độ phức tạp thuật toán.", "challenge", 70, globalScope),
];

export const quizBankItems: QuizBankItem[] = [
  createQuizBankItem({
    id: "quiz-ic3-l1-foundation-train",
    title: "IC3 GS6 L1 - Luyện tập nền tảng máy tính",
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
    title: "IC3 GS6 L2 - Kiểm tra Excel nhập môn",
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
    title: "IC3 GS6 L3 - Luyện tập bảo mật tài khoản",
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
    title: "IC3 GS6 L3 - Kiểm tra mô phỏng cuối level",
    kind: "test",
    levelId: "ic3-l3",
    questionIds: ["qb-ic3-009", "qb-ic3-010", "qb-ic3-011", "qb-ic3-012"],
    durationLabel: "30 phút",
    sourceMode: "manual",
    status: "reviewing",
    scope: globalScope,
  }),
  createQuizBankItem({
    id: "quiz-python-foundation-train",
    title: "Python Foundation - Luyện tập biến và điều kiện",
    kind: "train",
    levelId: "python-foundation",
    questionIds: ["qb-python-001", "qb-python-002"],
    durationLabel: "15 phút",
    sourceMode: "auto-random",
    status: "ready",
    scope: globalScope,
  }),
  createQuizBankItem({
    id: "quiz-python-intermediate-test",
    title: "Python Intermediate - Kiểm tra cấu trúc dữ liệu",
    kind: "test",
    levelId: "python-intermediate",
    questionIds: ["qb-python-003"],
    durationLabel: "10 phút",
    sourceMode: "manual",
    status: "ready",
    scope: alphaScope,
  }),
  createQuizBankItem({
    id: "quiz-mos-office-readiness",
    title: "MOS Office - Kiểm tra sẵn sàng chứng chỉ",
    kind: "test",
    levelId: "mos-excel",
    questionIds: ["qb-mos-001", "qb-mos-002", "qb-mos-003"],
    durationLabel: "20 phút",
    sourceMode: "manual",
    status: "ready",
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

function createLeveledSubject(
  id: Exclude<QuestionBankSubjectId, "ic3-gs6">,
  label: string,
  levels: Array<{ id: string; label: string; topics: string[] }>,
): QuestionBankSubject {
  const categories: QuestionBankCategory[] = levels.flatMap((level) =>
    level.topics.map((topic, index) => ({
      id: `${level.id}-topic-${index + 1}`,
      label: topic,
      levelId: level.id,
    })),
  );

  return {
    id,
    label,
    description: `${label} question bank`,
    companyScopeLabel: "Dung chung toan cong ty",
    levels: levels.map((level) => ({
      id: level.id,
      label: level.label,
      description: level.label,
      categoryIds: categories.filter((category) => category.levelId === level.id).map((category) => category.id),
    })),
    categories,
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
  const level = subject.levels.find((item) => item.id === category.levelId) ?? subject.levels[0];

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
    .map((questionId) => questionBankQuestions.find((question) => question.id === questionId))
    .filter((question): question is QuestionBankQuestion => Boolean(question));
  const topicLabels = Array.from(new Set(questions.map((question) => question.categoryLabel)));
  const categoryId = questions[0]?.categoryId;
  const subject = getQuestionBankSubject(questions[0]?.subjectId ?? "ic3-gs6");
  const level = getQuestionBankLevel(subject.id, levelId);

  return {
    id,
    scope,
    title,
    kind,
    status,
    subjectId: subject.id,
    subjectLabel: subject.label,
    levelId,
    levelLabel: level.label,
    categoryId,
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
