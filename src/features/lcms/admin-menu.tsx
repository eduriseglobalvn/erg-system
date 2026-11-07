import type { MenuGroup, MenuItem } from "@/components/portal/ErgPortalLayout";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { ADMIN_ENTERPRISE_CONNECTORS_PATH, ADMIN_LEARNING_STANDARDS_PATH } from "@/app/portal-route-registry";

const defaultDescription =
  "Không gian Admin được tổ chức theo các nhóm vận hành, nội dung và phân quyền.";

function item(input: MenuItem): MenuItem {
  return input;
}

const schoolManagementMenuItem = item({
  id: "school-management",
  label: "Quản lý trường học",
  icon: <SchoolRoundedIcon sx={{ fontSize: 24 }} />,
  description: "Quản lý trường liên kết, khối lớp, môn học, học sinh, đánh giá và dữ liệu nhập hàng loạt.",
  children: [
    { label: "Danh sách trường", path: "/schools/list" },

    { label: "Người học theo khối/lớp", path: "/schools/students" },
    { label: "Giám sát đào tạo", path: "/schools/reports" },
    { label: "Kiểm tra & câu hỏi", path: "/schools/assessments" },
    { label: "Nhập dữ liệu", path: "/schools/imports" },
    { label: "Nhật ký hoạt động", path: "/schools/audit-log" },
  ],
});

export function flattenMenuItems(groups: MenuGroup[]) {
  const output: MenuItem[] = [];

  function walk(items: MenuItem[], section: string) {
    for (const menuItem of items) {
      const withSection = { ...menuItem, section: menuItem.section ?? section };
      output.push(withSection);
      if (menuItem.children?.length) walk(menuItem.children, withSection.section ?? section);
    }
  }

  for (const group of groups) walk(group.items, group.label || "Tổng quan");
  return output;
}

/** Compatibility menu definition. Admin presentation is composed in admin-content-menu.ts. */
export const ADMIN_BASE_MENU_GROUPS: MenuGroup[] = [
  {
    label: "",
    items: [
      item({
        id: "admin-overview",
        label: "Trang chủ",
        icon: <DashboardRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/",
        description: "Theo dõi nhanh dữ liệu hệ thống, lớp học, học viên và các việc quản trị cần xử lý.",
        section: "Tổng quan",
        variant: "admin-overview",
      }),
      item({
        label: "Lịch trung tâm",
        icon: <EventAvailableRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/calendar",
        badge: "beta",
      }),
    ],
  },
  {
    label: "",
    items: [schoolManagementMenuItem],
  },
  {
    label: "Giảng dạy",
    items: [
      item({
        label: "Bài tập & tài liệu",
        icon: <FolderRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          {
            id: "quiz-bank",
            label: "Ngân hàng bài tập",
            path: "/quiz-bank",
            description: "Quản lý quiz Train/Test đã đóng gói để giáo viên giao lại trong LMS.",
            variant: "quiz-bank",
          },
          {
            id: "question-bank",
            label: "Ngân hàng câu hỏi",
            path: "/questions",
            description: "Quản lý câu hỏi nguồn dùng chung toàn ERG và theo phạm vi được cấp.",
            variant: "question-bank",
          },
        ],
      }),
      item({
        id: "course-modules",
        label: "Tạo Quiz",
        icon: <ArticleRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/quiz-editor",
        description: "Tạo hoặc chỉnh sửa quiz nguồn từ câu hỏi, slide và cấu hình player.",
        variant: "quiz-editor",
      }),
      item({
        id: "admin-learning-resources",
        label: "Tài nguyên",
        icon: <FolderRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/resources",
        description: "Tra cứu, mở và quản lý tài nguyên học tập dùng chung cho các lớp học.",
        variant: "admin-internal-docs",
      }),
      item({
        label: "Chuẩn đầu ra",
        icon: <FlagRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/learning-outcomes",
        section: "Giảng dạy",
      }),
    ],
  },
  {
    label: "",
    items: [
      item({
        label: "Nhân sự",
        icon: <HowToRegRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          {
            id: "employee-accounts",
            label: "Tài khoản nhân sự",
            path: "/employees",
            description: "Quản lý hồ sơ, tài khoản, trạng thái và nhóm quyền của nhân sự.",
          },
          {
            id: "employee-access-logs",
            label: "Nhật ký truy cập",
            path: "/employees/access-logs",
            description: "Theo dõi đăng nhập, phiên thiết bị và cảnh báo bảo mật của nhân sự.",
          },
        ],
      }),
      item({
        id: "timekeeping",
        label: "Chấm công",
        icon: <FingerprintRoundedIcon />,
        children: [
          { id: "timekeeping-today", label: "Hôm nay", path: "/employees/timekeeping", description: "Ai đã chấm, ai chưa chấm và các trường hợp cần xử lý." },
          { id: "timekeeping-timesheet", label: "Bảng công", path: "/employees/timesheet", description: "Bảng công tháng của nhân sự, chốt kỳ và xuất Excel." },
          { id: "timekeeping-approvals", label: "Duyệt đơn", path: "/employees/teacher-absence", description: "Duyệt đơn nghỉ phép, giải trình, làm việc tại nhà và công tác." },
          { id: "timekeeping-settings", label: "Cấu hình chấm công", path: "/employees/timekeeping-settings", description: "Địa điểm, ca làm, chính sách và ngày lễ." },
        ],
      }),
    ],
  },
  {
    label: "",
    items: [
      item({
        label: "Quyền & nhóm quyền",
        icon: <SettingsRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { label: "Quyền hệ thống", path: "/settings/permissions" },
          { label: "Nhóm quyền", path: "/settings/roles" },
        ],
      }),
      item({
        label: "Tích hợp",
        icon: <ExtensionRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { label: "Learning Standards", path: ADMIN_LEARNING_STANDARDS_PATH, description: "SCORM, LTI 1.3 và xAPI theo tenant; trạng thái do backend xác nhận." },
          { label: "Enterprise Connectors", path: ADMIN_ENTERPRISE_CONNECTORS_PATH, description: "Kết nối SIS, HRIS, SCIM; dry-run, sync và deprovision có version guard." },
        ],
      }),
    ],
  },
];

/** Drops "Chấm công" entries the session cannot open and shows the pending-approval count on "Duyệt đơn". */
export function withTimekeepingMenuState(groups: MenuGroup[], canAccess: (path: string) => boolean, pendingApprovals = 0): MenuGroup[] {
  const refine = (menuItem: MenuItem): MenuItem[] => {
    if (menuItem.id !== "timekeeping") return [menuItem];
    const children = (menuItem.children ?? [])
      .filter((child) => !child.path || canAccess(child.path))
      .map((child) => (child.id === "timekeeping-approvals" && pendingApprovals > 0 ? { ...child, badge: pendingApprovals > 99 ? "99+" : String(pendingApprovals) } : child));
    return children.length ? [{ ...menuItem, children }] : [];
  };
  return groups.map((group) => ({ ...group, items: group.items.flatMap(refine) }));
}

// Báo cáo (7 màn), Tổng đài, Zalo và API key bị ẩn: backend chưa có API đọc/ghi tương ứng (KE_HOACH 7.6). Chỉ thêm lại khi có endpoint thật.
export const LCMS_MENU_GROUPS = ADMIN_BASE_MENU_GROUPS;

export function getMenuItemDescription(menuItem: MenuItem) {
  return menuItem.description ?? defaultDescription;
}
