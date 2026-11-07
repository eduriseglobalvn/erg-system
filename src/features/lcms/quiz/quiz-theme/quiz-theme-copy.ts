import type { QuizThemeGroup, QuizThemePresetId } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";

export type QuizThemeCopy = {
  title: string;
  description: string;
  libraryLabel: string;
  groups: Record<QuizThemeGroup | "all", string>;
  presets: Record<QuizThemePresetId, string>;
  custom: string;
  defaultTheme: string;
  customizeFrom: (name: string) => string;
  undo: string;
  colorSection: string;
  backgroundTone: string;
  tones: { "soft-blue": string; paper: string; contrast: string };
  accentColor: string;
  highlightColor: string;
  otherColor: string;
  contrast: {
    title: string;
    chipPass: string;
    chipFail: (n: number) => string;
    pass: string;
    fail: string;
    pairs: { "text-bg": string; "onAccent-accent": string; "highlight-bg": string };
  };
  layoutSection: string;
  layout: string;
  layouts: { classic: string; focus: string; split: string };
  playerSize: string;
  sizes: { standard: string; wide: string };
  optionSection: string;
  roundedCorners: string;
  textLabels: string;
  soundSection: string;
  sounds: { subtle: string; off: string };
  previewLabel: string;
  preview: {
    quizTitle: string;
    progress: string;
    questionType: string;
    question: string;
    options: readonly string[];
    previous: string;
    next: string;
    questionList: string;
    start: string;
    startMeta: string;
    correct: string;
    summaryTitle: string;
    summaryMeta: string;
    startScreen: string;
    feedbackScreen: string;
    summaryScreen: string;
    note: string;
    stateLabel: string;
    states: { playing: string; correct: string; wrong: string };
    deviceLabel: string;
    devices: { phone: string; desktop: string };
    yourChoice: string;
    correctAnswer: string;
  };
  resetDefault: string;
  cancel: string;
  apply: string;
  applyCount: (n: number) => string;
};

/** "Áp dụng cho 20 câu"; the bare verb when the count is unknown or zero. */
export function applyLabel(count: number | undefined, copy: QuizThemeCopy = viCopy): string {
  return count ? copy.applyCount(count) : copy.apply;
}

export const viCopy: QuizThemeCopy = {
  title: "Theme của bài tập",
  description: "Chọn một lần, áp dụng cho mọi câu, màn bắt đầu và màn tổng kết.",
  libraryLabel: "Thư viện theme",
  groups: { all: "Tất cả", default: "Mặc định", school: "Học đường", exam: "Thi cử", fun: "Vui nhộn", dark: "Tối" },
  presets: {
    "erg-blue": "ERG Xanh",
    sky: "Bầu trời",
    "grid-paper": "Giấy kẻ ô",
    chalkboard: "Bảng đen",
    "exam-room": "Phòng thi",
    night: "Đêm",
    summer: "Nắng hè",
    forest: "Rừng xanh",
    lavender: "Tím mộng",
  },
  custom: "Tuỳ chỉnh",
  defaultTheme: "Mặc định",
  customizeFrom: (name) => `Tự chỉnh từ “${name}”`,
  undo: "Hoàn tác",
  colorSection: "Màu và nền",
  backgroundTone: "Kiểu nền",
  tones: { "soft-blue": "Xanh nhạt", paper: "Giấy", contrast: "Tương phản" },
  accentColor: "Màu nhấn",
  highlightColor: "Màu tô đậm",
  otherColor: "Màu khác",
  contrast: {
    title: "Độ tương phản",
    chipPass: "Đạt WCAG AA",
    chipFail: (n) => `${n} cặp màu chưa đạt AA`,
    pass: "Đạt",
    fail: "Chưa đạt",
    pairs: { "text-bg": "Chữ / nền", "onAccent-accent": "Chữ trên nút / màu nhấn", "highlight-bg": "Chữ trên vùng tô đậm" },
  },
  layoutSection: "Bố cục",
  layout: "Kiểu bố cục",
  layouts: { classic: "Cổ điển", focus: "Tập trung", split: "Chia đôi" },
  playerSize: "Khổ hiển thị",
  sizes: { standard: "Chuẩn", wide: "Rộng" },
  optionSection: "Phương án và nút",
  roundedCorners: "Bo góc",
  textLabels: "Nhãn A B C",
  soundSection: "Âm thanh",
  sounds: { subtle: "Nhẹ", off: "Tắt" },
  previewLabel: "Xem trước",
  preview: {
    quizTitle: "Ôn tập hàm cơ bản",
    progress: "Câu 3 / 10",
    questionType: "MỘT ĐÁP ÁN",
    question: "Hàm nào dùng để tính tổng một vùng ô trong Excel?",
    options: ["COUNT", "SUM", "AVERAGE", "MAX"],
    previous: "Câu trước",
    next: "Câu sau",
    questionList: "Danh sách câu",
    start: "Bắt đầu",
    startMeta: "10 câu · không giới hạn",
    correct: "Chính xác! +10 điểm",
    summaryTitle: "Làm tốt lắm!",
    summaryMeta: "8/10 câu đúng",
    startScreen: "Màn bắt đầu",
    feedbackScreen: "Phản hồi đúng / sai · màu cố định",
    summaryScreen: "Màn tổng kết",
    note: "Theme chỉ đổi cách hiển thị. Màu Đúng (xanh lá) và Sai (đỏ) cố định ở mọi theme để học viên không nhầm.",
    stateLabel: "Trạng thái câu hỏi",
    states: { playing: "Đang làm", correct: "Đúng", wrong: "Sai" },
    deviceLabel: "Thiết bị",
    devices: { phone: "Điện thoại", desktop: "Máy tính" },
    yourChoice: "Bạn chọn",
    correctAnswer: "Đáp án đúng",
  },
  resetDefault: "Về mặc định",
  cancel: "Hủy",
  apply: "Áp dụng",
  applyCount: (n) => `Áp dụng cho ${n} câu`,
};

export const enCopy: QuizThemeCopy = {
  title: "Quiz theme",
  description: "Pick once; it applies to every question, the start screen and the summary screen.",
  libraryLabel: "Theme library",
  groups: { all: "All", default: "Default", school: "School", exam: "Exam", fun: "Playful", dark: "Dark" },
  presets: {
    "erg-blue": "ERG Blue",
    sky: "Sky",
    "grid-paper": "Grid paper",
    chalkboard: "Chalkboard",
    "exam-room": "Exam room",
    night: "Night",
    summer: "Summer",
    forest: "Forest",
    lavender: "Lavender",
  },
  custom: "Custom",
  defaultTheme: "Default",
  customizeFrom: (name) => `Customize “${name}”`,
  undo: "Undo",
  colorSection: "Colors and background",
  backgroundTone: "Background",
  tones: { "soft-blue": "Soft blue", paper: "Paper", contrast: "Contrast" },
  accentColor: "Accent color",
  highlightColor: "Selected answer fill",
  otherColor: "Other color",
  contrast: {
    title: "Contrast",
    chipPass: "Meets WCAG AA",
    chipFail: (n) => `${n} color ${n === 1 ? "pair" : "pairs"} below AA`,
    pass: "Pass",
    fail: "Fail",
    pairs: { "text-bg": "Text / background", "onAccent-accent": "Text on button / accent", "highlight-bg": "Text on selected fill" },
  },
  layoutSection: "Layout",
  layout: "Layout style",
  layouts: { classic: "Classic", focus: "Focus", split: "Split" },
  playerSize: "Player size",
  sizes: { standard: "Standard", wide: "Wide" },
  optionSection: "Answers and buttons",
  roundedCorners: "Round corners",
  textLabels: "A B C labels",
  soundSection: "Sound",
  sounds: { subtle: "Subtle", off: "Off" },
  previewLabel: "Preview",
  preview: {
    quizTitle: "Basic functions review",
    progress: "Question 3 / 10",
    questionType: "SINGLE ANSWER",
    question: "Which function adds up a range of cells in Excel?",
    options: ["COUNT", "SUM", "AVERAGE", "MAX"],
    previous: "Previous",
    next: "Next",
    questionList: "Questions",
    start: "Start",
    startMeta: "10 questions · no time limit",
    correct: "Correct! +10 points",
    summaryTitle: "Well done!",
    summaryMeta: "8/10 correct",
    startScreen: "Start screen",
    feedbackScreen: "Right / wrong feedback · fixed colors",
    summaryScreen: "Summary screen",
    note: "A theme only changes the look. Right (green) and wrong (red) colors stay fixed in every theme so learners are never confused.",
    stateLabel: "Question state",
    states: { playing: "In progress", correct: "Correct", wrong: "Wrong" },
    deviceLabel: "Device",
    devices: { phone: "Phone", desktop: "Desktop" },
    yourChoice: "Your pick",
    correctAnswer: "Correct answer",
  },
  resetDefault: "Reset to default",
  cancel: "Cancel",
  apply: "Apply",
  applyCount: (n) => `Apply to ${n} ${n === 1 ? "question" : "questions"}`,
};
