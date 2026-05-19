import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BrainCircuit,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  GraduationCap,
  Layout,
  LibraryBig,
  MonitorPlay,
  Presentation,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export type CourseColor = "blue" | "red" | "indigo" | "emerald";

export type CourseModule = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export type CourseProgram = {
  name: string;
  slug: string;
  color: CourseColor;
  badge: string;
  summary: string;
  href: string;
  items: CourseModule[];
};

export type CourseGroup = {
  title: string;
  description: string;
  programs: CourseProgram[];
};

export type QuickAccessItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type ProgramDetail = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  accent: CourseColor;
  stats: Array<{ label: string; value: string }>;
  modules: Array<{ title: string; detail: string; duration: string }>;
  resources: Array<{ title: string; type: string; detail: string }>;
  workflow: Array<{ title: string; detail: string }>;
  support: Array<{ title: string; detail: string }>;
};

export type HubCollection = {
  title: string;
  subtitle: string;
  metric: string;
  href: string;
  tags: string[];
};

export type CommunityChannel = {
  title: string;
  summary: string;
  cadence: string;
  href: string;
};

export type PortfolioStream = {
  title: string;
  summary: string;
  volume: string;
  href: string;
};

export type QuizTrack = {
  title: string;
  summary: string;
  questionCount: string;
  href: string;
};

export const COURSE_GROUPS: CourseGroup[] = [
  {
    title: "Tiếng Anh và học liệu SGK",
    description: "Kho tài nguyên sát giáo trình, phù hợp cho giáo viên dạy trên lớp mỗi ngày.",
    programs: [
      {
        name: "Global Success",
        slug: "global-success",
        color: "blue",
        badge: "Core",
        summary: "Sách mềm, hợp phần bổ trợ, video minh họa và tài nguyên classroom-ready cho giáo viên Tiếng Anh.",
        href: "/chuong-trinh/global-success",
        items: [
          { name: "Sách mềm 2.0", href: "/kho-hoc-lieu", icon: BookOpen },
          { name: "Hợp phần bổ trợ", href: "/kho-hoc-lieu", icon: Layout },
          { name: "Video minh họa", href: "/kho-hoc-lieu", icon: MonitorPlay },
        ],
      },
    ],
  },
  {
    title: "Tin học và chứng chỉ",
    description: "Nhóm chương trình dạy học có tính hệ thống, phục vụ cả dạy chính khóa và luyện thi chứng chỉ.",
    programs: [
      {
        name: "IC3 Digital Literacy",
        slug: "ic3-gs6",
        color: "red",
        badge: "IC3",
        summary: "Lesson kit, practice pack và mock quiz cho Computing Fundamentals, Key Applications và Living Online.",
        href: "/chuong-trinh/ic3-gs6",
        items: [
          { name: "Lesson kit", href: "/kho-hoc-lieu", icon: GraduationCap },
          { name: "Practice quiz", href: "/kho-hoc-lieu", icon: BrainCircuit },
          { name: "Mock exam", href: "/quizzes", icon: ShieldCheck },
        ],
      },
      {
        name: "MOS Office Skills",
        slug: "mos",
        color: "indigo",
        badge: "MOS",
        summary: "Bộ tài nguyên Word, Excel, PowerPoint theo objective, có bài giảng, file thao tác và bài tập đánh giá.",
        href: "/chuong-trinh/mos",
        items: [
          { name: "Word", href: "/kho-hoc-lieu", icon: FileText },
          { name: "Excel", href: "/kho-hoc-lieu", icon: FileSpreadsheet },
          { name: "PowerPoint", href: "/kho-hoc-lieu", icon: Presentation },
        ],
      },
      {
        name: "Tin học phổ thông",
        slug: "tin-hoc",
        color: "emerald",
        badge: "Tin học",
        summary: "Scratch, Python và học liệu thực hành có cấu trúc đơn giản, phù hợp cho dạy học trên lớp và CLB.",
        href: "/chuong-trinh/tin-hoc",
        items: [
          { name: "Scratch", href: "/kho-hoc-lieu", icon: Sparkles },
          { name: "Python", href: "/kho-hoc-lieu", icon: BookOpen },
          { name: "Project file", href: "/kho-hoc-lieu", icon: FolderKanban },
        ],
      },
    ],
  },
  {
    title: "Học liệu mở rộng",
    description: "Nhóm tài nguyên điểm nhấn để dạy dự án, STEM và các tiết học cần nhiều vật liệu minh họa.",
    programs: [
      {
        name: "Giáo dục STEM",
        slug: "stem",
        color: "blue",
        badge: "STEM",
        summary: "Kế hoạch dạy học, bài giảng điện tử, phiếu học tập và sản phẩm mẫu cho tiết học hoạt động.",
        href: "/chuong-trinh/stem",
        items: [
          { name: "Kế hoạch dạy học", href: "/kho-hoc-lieu", icon: Layout },
          { name: "Bài giảng điện tử", href: "/kho-hoc-lieu", icon: Presentation },
          { name: "Phiếu học tập", href: "/kho-hoc-lieu", icon: FileText },
        ],
      },
    ],
  },
];

export const QUICK_ACCESS_NAV: QuickAccessItem[] = [
  {
    label: "Chương trình",
    href: "/chuong-trinh",
    icon: Search,
    description: "Danh mục chương trình và bộ lesson kit",
  },
  {
    label: "Kho học liệu",
    href: "/kho-hoc-lieu",
    icon: LibraryBig,
    description: "Thư viện tài nguyên theo lớp, môn và định dạng file",
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: FolderKanban,
    description: "Bài giảng mẫu và template đã được sử dụng",
  },
  {
    label: "Quiz bank",
    href: "/quizzes",
    icon: BrainCircuit,
    description: "Warm-up quiz, mock quiz và bài đánh giá nhanh",
  },
  {
    label: "Cộng đồng",
    href: "/cong-dong",
    icon: Users,
    description: "Kênh trao đổi và mentor review nội bộ",
  },
];

export const FLAT_PROGRAMS = COURSE_GROUPS.flatMap((group) => group.programs);
export const TOTAL_LESSON_SHELVES = FLAT_PROGRAMS.reduce((total, program) => total + program.items.length, 0);

export const HUB_COLLECTIONS: HubCollection[] = [
  {
    title: "Thư viện file dạy học",
    subtitle: "PDF, PPTX, VIDEO, AUDIO, QUIZ và ZIP được hiển thị theo một kiểu card thống nhất.",
    metric: "6 định dạng chính",
    href: "/kho-hoc-lieu",
    tags: ["PDF", "PPTX", "VIDEO"],
  },
  {
    title: "Bộ lesson kit giáo viên",
    subtitle: "Gồm khung tiết dạy, slide, tài liệu bổ trợ và ghi chú cho giáo viên để sử dụng ngay.",
    metric: "5 nhóm lesson kit",
    href: "/chuong-trinh",
    tags: ["Lesson plan", "Slides", "Rubric"],
  },
  {
    title: "Kho mở rộng IC3 / MOS / Tin học",
    subtitle: "Kho mở rộng cho IC3, MOS và Tin học, ưu tiên dữ liệu thật từ BE khi triển khai.",
    metric: "IC3 + MOS + Tin học",
    href: "/kho-hoc-lieu",
    tags: ["IC3", "MOS", "Tin học"],
  },
];

export const COMMUNITY_CHANNELS: CommunityChannel[] = [
  {
    title: "Mentor review",
    summary: "Nơi giáo viên gửi bài giảng và nhận góp ý ngắn, đúng trong vận tốc dạy học thực tế.",
    cadence: "Hàng tuần",
    href: "/cong-dong",
  },
  {
    title: "Q&A classroom",
    summary: "Trao đổi tình huống trên lớp, xử lý bài tập và chia sẻ cách sử dụng học liệu cho từng đối tượng học sinh.",
    cadence: "Mỗi ngày",
    href: "/cong-dong",
  },
  {
    title: "Resource exchange",
    summary: "Chia sẻ worksheet, handout và bổ trợ thực hành đã được sử dụng tốt.",
    cadence: "Liên tục",
    href: "/cong-dong",
  },
];

export const PORTFOLIO_STREAMS: PortfolioStream[] = [
  {
    title: "Deck bài giảng đã dạy thật",
    summary: "Bộ slide có ghi chú, luồng dạy và dấu mốc để giáo viên tham khảo nhanh.",
    volume: "42 decks",
    href: "/portfolio",
  },
  {
    title: "Template tiết dạy",
    summary: "Mẫu khung tiết dạy, rubric, phiếu giao việc và worksheet có thể nhân bản nhanh.",
    volume: "28 templates",
    href: "/portfolio",
  },
  {
    title: "Case study lớp học",
    summary: "Tổng hợp bài học kinh nghiệm từ các tiết dạy đã triển khai trên lớp.",
    volume: "12 cases",
    href: "/portfolio",
  },
];

export const QUIZ_TRACKS: QuizTrack[] = [
  {
    title: "Quiz bank IC3",
    summary: "Bộ câu hỏi warm-up, checkpoint và mock cho các strand chính của IC3.",
    questionCount: "420 câu hỏi",
    href: "/quizzes",
  },
  {
    title: "Quiz bank MOS",
    summary: "Bộ đánh giá nhanh theo objective Word, Excel và PowerPoint.",
    questionCount: "360 câu hỏi",
    href: "/quizzes",
  },
  {
    title: "Quiz bank Tin học",
    summary: "Bộ câu hỏi cho Scratch, Python và kỹ năng tin học thông dụng.",
    questionCount: "210 câu hỏi",
    href: "/quizzes",
  },
];

export const PROGRAM_DETAILS: ProgramDetail[] = [
  {
    slug: "global-success",
    title: "Global Success teaching library",
    eyebrow: "Tiếng Anh THCS",
    description: "Trang tổng hợp sách mềm, hợp phần bổ trợ và bộ bài giảng dùng nhanh cho giáo viên Tiếng Anh.",
    accent: "blue",
    stats: [
      { label: "Sách và workbook", value: "12" },
      { label: "Tài nguyên bổ trợ", value: "18" },
      { label: "Định dạng file", value: "PDF + VIDEO" },
    ],
    modules: [
      { title: "Sách mềm 2.0", detail: "Sách học sinh, workbook và tài liệu đọc theo từng lớp.", duration: "Core" },
      { title: "Hợp phần bổ trợ", detail: "Audio, bài giảng, giáo án, video minh họa và bổ trợ phát âm.", duration: "Support" },
      { title: "Tài nguyên đánh giá", detail: "Quiz nhanh, worksheet và bộ tổng hợp từ vựng cho tiết dạy.", duration: "Assessment" },
    ],
    resources: [
      { title: "Sách học sinh và workbook", type: "PDF", detail: "Viewer dạng ebook/PDF, có badge file trên card." },
      { title: "Audio và video bổ trợ", type: "AUDIO / VIDEO", detail: "Player riêng cho media, phục vụ tiết dạy trên lớp." },
      { title: "Bài giảng và giáo án", type: "PPTX / DOC", detail: "Bộ file để giáo viên dạy nhanh hoặc tùy biến thêm." },
    ],
    workflow: [
      { title: "Chọn lớp và môn", detail: "Lọc theo lớp, môn và nhóm tài nguyên trước khi mở file." },
      { title: "Mở đúng viewer", detail: "Mỗi định dạng file đi vào một giao diện viewer riêng." },
      { title: "Tải hoặc sử dụng trên lớp", detail: "Nếu có quyền, giáo viên tải file hoặc mở trực tiếp để dạy." },
    ],
    support: [
      { title: "Bộ lọc rõ ràng", detail: "Giao diện ưu tiên tác vụ chọn tài nguyên nhanh, không đẩy marketing." },
      { title: "Card thống nhất", detail: "Tất cả file cùng theo một hệ card, để giáo viên nhận loại file ngay." },
    ],
  },
  {
    slug: "ic3-gs6",
    title: "IC3 digital literacy track",
    eyebrow: "Chứng chỉ IC3",
    description: "Kho tài nguyên dạy học và luyện tập cho IC3, sắp xếp để giáo viên mở đúng lesson kit và quiz theo strand.",
    accent: "red",
    stats: [
      { label: "Strands", value: "3" },
      { label: "Lesson kits", value: "15" },
      { label: "Mock quiz", value: "9" },
    ],
    modules: [
      { title: "Computing fundamentals", detail: "Nền tảng máy tính, file, thư mục và thao tác cơ bản.", duration: "5 tuần" },
      { title: "Key applications", detail: "Ứng dụng Word, Excel, PowerPoint theo mục tiêu dạy học có cấu trúc.", duration: "6 tuần" },
      { title: "Living online", detail: "An toàn số, tìm kiếm thông tin và thói quen sử dụng Internet.", duration: "4 tuần" },
    ],
    resources: [
      { title: "Lesson kit theo strand", type: "PPTX / PDF", detail: "Giáo án, slide, worksheet và note cho giáo viên." },
      { title: "Practice quiz", type: "QUIZ", detail: "Bộ câu hỏi đánh giá nhanh và luyện tập theo từng strand." },
      { title: "Exam pack", type: "ZIP", detail: "Gói file tổng hợp để tải về khi cần chuyển giao offline." },
    ],
    workflow: [
      { title: "Chọn strand", detail: "Giáo viên vào đúng nhóm strand để không bị loạn tài nguyên." },
      { title: "Mở bài giảng hoặc quiz", detail: "PPTX vào viewer slide, QUIZ vào trang launch riêng." },
      { title: "Theo dõi và bổ sung", detail: "Sau tiết học có thể quay lại lấy worksheet hoặc exam pack." },
    ],
    support: [
      { title: "Sẵn sàng nối API", detail: "FE đọc resource thật từ BE khi API khả dụng, dữ liệu cấu hình chỉ còn vai trò dự phòng." },
      { title: "Đường tích hợp rõ", detail: "BE sẽ cấp launchMode, fileType và viewerTokenUrl khi go live." },
    ],
  },
  {
    slug: "mos",
    title: "MOS office skills track",
    eyebrow: "Chứng chỉ MOS",
    description: "Word, Excel và PowerPoint được tách thành các nhóm học liệu để giáo viên mở đúng task file và bài giảng ngay.",
    accent: "indigo",
    stats: [
      { label: "Môn", value: "Word / Excel / PPT" },
      { label: "Task files", value: "24" },
      { label: "Decks", value: "12" },
    ],
    modules: [
      { title: "MOS Word", detail: "Styles, references, document formatting và bộ bài tập thao tác.", duration: "4 tuần" },
      { title: "MOS Excel", detail: "Formula, chart, table và tình huống xử lý bảng tính.", duration: "5 tuần" },
      { title: "MOS PowerPoint", detail: "Layout, animation, presenter workflow và sản phẩm thực hành.", duration: "3 tuần" },
    ],
    resources: [
      { title: "Task file library", type: "ZIP / XLSX / DOCX", detail: "Bộ file thao tác phục vụ bài học và bài kiểm tra." },
      { title: "Slide lecture", type: "PPTX", detail: "Bài giảng điện tử mở qua viewer slide không lộ link gốc." },
      { title: "Demo video", type: "VIDEO", detail: "Video thao tác nhanh để giáo viên dùng trên lớp." },
    ],
    workflow: [
      { title: "Lọc theo môn MOS", detail: "Giao diện library cho phép nhảy thẳng vào Word, Excel hoặc PowerPoint." },
      { title: "Mở task file", detail: "File ZIP/DOCX/XLSX hiện card rõ loại file trước khi mở." },
      { title: "Luyện tập và đánh giá", detail: "Kết hợp quiz nhanh và file bài tập để đánh giá trên lớp." },
    ],
    support: [
      { title: "Badge file rõ ràng", detail: "Mỗi card hiện PDF, PPTX, VIDEO, ZIP ở góc dưới phải." },
      { title: "Viewer slide ẩn link", detail: "PPTX xem qua shell embed, FE không lộ URL gốc cho giáo viên." },
    ],
  },
  {
    slug: "tin-hoc",
    title: "Tin học phổ thông",
    eyebrow: "Scratch và Python",
    description: "Trang tổng hợp học liệu Tin học với hướng dạy đơn giản, rõ dạng file và dễ mở rộng khi có data thật.",
    accent: "emerald",
    stats: [
      { label: "Chuyên đề", value: "2" },
      { label: "Projects", value: "8" },
      { label: "Practice packs", value: "10" },
    ],
    modules: [
      { title: "Scratch", detail: "Dự án cơ bản, block logic và mini game classroom-ready.", duration: "6 bài" },
      { title: "Python", detail: "Nhập môn biến, điều kiện, vòng lặp và bài tập thực hành.", duration: "8 bài" },
      { title: "Project file", detail: "Bộ tài nguyên tổng hợp cho giáo viên giao bài và chấm bài.", duration: "Support" },
    ],
    resources: [
      { title: "Project starter pack", type: "ZIP", detail: "Gói file khởi tạo dự án và dữ liệu phục vụ bài học." },
      { title: "Hướng dẫn từng bước", type: "PDF / VIDEO", detail: "Tài liệu mở từng bước và video demo ngắn." },
      { title: "Bài đánh giá nhanh", type: "QUIZ", detail: "Bộ câu hỏi cho Scratch, Python và tin học thông dụng." },
    ],
    workflow: [
      { title: "Chọn chuyên đề", detail: "Giáo viên vào Scratch hay Python để lọc đúng tài nguyên." },
      { title: "Mở hướng dẫn", detail: "PDF, video và ZIP có viewer / launch flow riêng." },
      { title: "Phát bài và thu bài", detail: "Bộ project file có thể dùng làm nhiệm vụ trên lớp." },
    ],
    support: [
      { title: "Sẵn sàng nối API", detail: "Luồng Tin học dùng cùng contract resource/viewer với các môn còn lại." },
      { title: "Mở rộng dễ dàng", detail: "Khi có API thật chỉ cần thay data, UI và viewer không đổi." },
    ],
  },
  {
    slug: "stem",
    title: "Giáo dục STEM resource hub",
    eyebrow: "STEM classroom",
    description: "Kho học liệu gồm sách giáo viên, kế hoạch dạy học, bài giảng điện tử và sản phẩm mẫu theo dạng tiết dạy STEM.",
    accent: "blue",
    stats: [
      { label: "Bộ tài liệu", value: "8" },
      { label: "Viewer slide", value: "PPTX" },
      { label: "Tài nguyên mẫu", value: "Image + Video" },
    ],
    modules: [
      { title: "Kế hoạch dạy học", detail: "Phân bổ tiết dạy, mục tiêu và điều kiện triển khai.", duration: "Planning" },
      { title: "Bài giảng điện tử", detail: "Deck slide mở qua giao diện viewer riêng.", duration: "Presentation" },
      { title: "Phiếu học tập và sản phẩm mẫu", detail: "Tài liệu để học sinh thực hành và giáo viên đánh giá.", duration: "Practice" },
    ],
    resources: [
      { title: "PPTX bài giảng điện tử", type: "PPTX", detail: "Mở qua shell viewer theo cấu trúc Google Slides embed." },
      { title: "Sách giáo viên", type: "PDF", detail: "Đọc tại chỗ hoặc tải về khi giáo viên cần tham khảo." },
      { title: "Video thao tác", type: "VIDEO", detail: "Video ngắn phục vụ minh họa trên lớp." },
    ],
    workflow: [
      { title: "Chọn bộ tài liệu", detail: "Bắt đầu từ card tổng quan để vào đúng nhóm tài liệu." },
      { title: "Xem slide hoặc sách", detail: "Mỗi loại file đi vào viewer riêng theo phân tích đã chốt." },
      { title: "Tải và triển khai", detail: "Giáo viên có thể tải bộ tài liệu khi cần dạy offline." },
    ],
    support: [
      { title: "Viewer theo định dạng", detail: "PPTX, PDF, VIDEO và QUIZ được thể hiện khác nhau nhưng cùng một hệ thống." },
      { title: "UI tối giản", detail: "Tập trung vào chọn nhanh, đọc nhanh và mở nhanh, không chèn marketing." },
    ],
  },
];

export const HOCLIEU_STATS = [
  { label: "Chương trình", value: `${FLAT_PROGRAMS.length}` },
  { label: "Nhóm tài nguyên", value: `${COURSE_GROUPS.length}` },
  { label: "Lesson shelves", value: `${TOTAL_LESSON_SHELVES}+` },
];

export const HOCLIEU_HERO_ACTIONS = [
  { label: "Mở danh mục chương trình", href: "/chuong-trinh", icon: Search },
  { label: "Đi vào kho học liệu", href: "/kho-hoc-lieu", icon: LibraryBig },
];

export const HOCLIEU_COMMUNITY_HIGHLIGHTS = [
  "Review bài giảng theo từng tiết dạy",
  "Hỏi đáp nhanh về lesson kit và worksheet",
  "Chia sẻ mẫu triển khai đã dùng trên lớp",
];

export function getProgramBySlug(slug: string) {
  return FLAT_PROGRAMS.find((program) => program.slug === slug);
}

export function getProgramDetailBySlug(slug: string) {
  return PROGRAM_DETAILS.find((program) => program.slug === slug);
}
