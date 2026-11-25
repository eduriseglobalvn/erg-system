export const ERG_BRAND_SUFFIX = "Trung tâm Ngoại ngữ - Tin học ERG";

export const ERG_ASSETS = {
  logo: "https://media.erg.edu.vn/logo/pwa.png",
  mobileLogo: "https://media.erg.edu.vn/logo/pwa.png",
  favicon: "https://media.erg.edu.vn/logo/pwa.png",
  appleTouchIcon: "https://media.erg.edu.vn/logo/pwa.png",
  ogImage: "https://media.erg.edu.vn/logo/og-image.jpg",
};

// Keep in step with the static copy in index.html, which is what link previews and non-JS crawlers read.
export const SITE_SEO = {
  title: `ERG LMS - Hệ thống ôn luyện MOS & IC3 | ${ERG_BRAND_SUFFIX}`,
  shortName: "ERG LMS",
  description: "Đăng nhập ERG LMS của Trung tâm Ngoại ngữ - Tin học ERG (Edurise Global): học và thi thử MOS, IC3 GS6, IC3 Spark bằng tài khoản do ERG hoặc nhà trường cấp.",
  keywords: [
    "ERG LMS",
    "đăng nhập LMS ERG",
    "ôn thi IC3 GS6 online",
    "luyện thi IC3 Spark",
    "kiểm tra tin học trực tuyến",
    "ôn tập MOS online",
    "hệ thống học tập học sinh ERG",
    "học tin học trực tuyến",
  ],
  ogImage: ERG_ASSETS.ogImage,
  ogImageAlt: "Trung tâm Ngoại ngữ - Tin học ERG",
};

/** Only these are public; everything else sits behind sign-in and must stay out of search results. */
const INDEXABLE_PATHS = new Set(["/", "/login"]);

/** Tab titles by path. A path without a row takes its closest parent's title. */
const PAGE_TITLES: Record<string, string> = {
  "/access-denied": "Không có quyền truy cập",
  "/onboarding": "Thiết lập tài khoản",

  "/student": "Học sinh",

  "/teacher": "Giáo viên",
  "/teacher/home": "Trang chủ",
  "/teacher/dashboard": "Tổng quan",
  "/teacher/attendance": "Điểm danh",
  "/teacher/calendar": "Lịch dạy",
  "/teacher/class-log": "Sổ đầu bài",
  "/teacher/score": "Bảng điểm",
  "/teacher/homework": "Bài tập",
  "/teacher/homework/assign": "Giao bài tập",
  "/teacher/homework/exercise-bank": "Ngân hàng bài tập",
  "/teacher/games": "Trò chơi",
  "/teacher/homework/progress": "Tiến độ bài tập",
  "/teacher/homework/student-groups": "Nhóm học sinh",
  "/teacher/reports": "Báo cáo",
  "/teacher/resources": "Tài nguyên",
  "/teacher/timekeeping": "Chấm công",
  "/teacher/timekeeping/requests": "Đơn từ",
  "/teacher/timekeeping/timesheet": "Bảng công",
  "/teacher/account": "Tài khoản",
  "/teacher/account/login-logs": "Nhật ký đăng nhập",

  "/admin": "Quản trị",
  "/admin/calendar": "Lịch giảng dạy",
  "/admin/schools": "Quản lý trường học",
  "/admin/schools/list": "Danh sách trường",
  "/admin/schools/students": "Người học theo khối/lớp",
  "/admin/schools/reports": "Giám sát đào tạo",
  "/admin/schools/scores": "Bảng điểm lớp",
  "/admin/schools/assessments": "Kiểm tra & câu hỏi",
  "/admin/schools/audit-log": "Nhật ký hoạt động",
  "/admin/content": "Nội dung",
  "/admin/content/quiz-bank": "Ngân hàng bài tập",
  "/admin/content/quiz-editor": "Ngân hàng câu hỏi",
  "/admin/content/resources": "Tài nguyên",
  "/admin/training/lesson-reports": "Báo giảng",
  "/admin/employees": "Tài khoản nhân sự",
  "/admin/employees/access-logs": "Nhật ký truy cập",
  "/admin/employees/timekeeping": "Chấm công",
  "/admin/employees/timesheet": "Bảng công",
  "/admin/employees/teaching-hours": "Công tiết dạy",
  "/admin/employees/teacher-absence": "Duyệt đơn",
  "/admin/employees/timekeeping-settings": "Cấu hình chấm công",
  "/admin/settings": "Cài đặt",
  "/admin/settings/roles": "Vai trò & quyền",
  "/admin/settings/permissions": "Vai trò & quyền",
  "/admin/settings/audit-log": "Nhật ký hệ thống",
  "/admin/setting": "Cài đặt",
  "/admin/report": "Báo cáo",
  "/admin/users": "Người dùng",
  "/admin/customers": "Khách hàng",
  "/admin/integration": "Tích hợp",
  "/admin/integrations": "Tích hợp",
};

/** The same page under /admin, /teacher and /student (and /profile at the root). */
const SHARED_PAGE_TITLES: Record<string, string> = {
  "/help": "Hướng dẫn",
  "/profile": "Hồ sơ cá nhân",
  "/notifications": "Thông báo",
  "/notifications/compose": "Soạn thông báo",
  "/discussion": "Thảo luận",
  "/leaderboard": "Thi đua",
  "/learning-outcomes": "Chuẩn đầu ra",
  "/question-types": "Demo dạng câu hỏi",
  "/exams/portable": "Bài thi ngoại tuyến",
  "/downloads/desktop": "Tải ứng dụng máy tính",
};

function pageTitle(pathname: string) {
  for (let path = pathname.replace(/\/+$/, ""); path; path = path.slice(0, path.lastIndexOf("/"))) {
    const title = PAGE_TITLES[path] ?? SHARED_PAGE_TITLES[path.replace(/^\/(admin|teacher|student)(?=\/)/, "")];
    if (title) return title;
  }
  return undefined;
}

export const formatPageTitle = (page: string) => `${page} | ${SITE_SEO.shortName}`;

export function getSeoForLocation(pathname: string) {
  const page = pageTitle(pathname);
  return {
    ...SITE_SEO,
    title: page ? formatPageTitle(page) : SITE_SEO.title,
    indexable: INDEXABLE_PATHS.has(pathname.replace(/\/+$/, "") || "/"),
  };
}
