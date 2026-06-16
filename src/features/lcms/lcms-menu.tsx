import type { MenuGroup, MenuItem } from "@/components/portal/CenterUpLayout";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

const defaultDescription =
  "Trang LCMS đang được đồng bộ theo shell CenterUp. Nội dung chi tiết sẽ được nối vào workspace tương ứng.";

function item(input: MenuItem): MenuItem {
  return input;
}

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

export const LCMS_MENU_GROUPS: MenuGroup[] = [
  {
    label: "",
    items: [
      item({
        id: "admin-overview",
        label: "Trang chủ",
        icon: <DashboardRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/",
        description: "Theo dõi nhanh dữ liệu hệ thống, lớp học, học viên và các việc LCMS cần xử lý.",
        section: "Tổng quan",
        variant: "admin-overview",
      }),
      item({
        label: "Báo cáo",
        icon: <BarChartRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { label: "Tổng quan", path: "/report/dashboard-report" },
          { label: "Tuyển sinh", path: "/report/crm-report" },
          { label: "Học viên", path: "/report/student-report" },
          { label: "Công việc", path: "/report/task-report" },
          { label: "Dòng tiền", path: "/report/cash-flow-report" },
          { label: "Lãi lỗ", path: "/report/pnl-report" },
          { label: "Hóa đơn", path: "/report/sale-report" },
        ],
      }),
      item({
        label: "Lịch toàn trung tâm",
        icon: <EventAvailableRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/calendar",
        badge: "beta",
      }),
    ],
  },
  {
    label: "CRM & Hiệu suất",
    items: [
      item({
        label: "Khách hàng",
        icon: <HandshakeRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/customers",
      }),
      item({
        label: "Công việc",
        icon: <AssignmentRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/center-tasks",
      }),
    ],
  },
  {
    label: "Giảng dạy",
    items: [
      item({
        label: "Học viên",
        icon: <GroupsRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { label: "Tài khoản học viên", path: "/students/list-center-student" },
          { label: "Ghi danh trong khóa", path: "/students/list-student-course" },
          { label: "Ghi danh trong lớp", path: "/students/list-class-enroll" },
          { label: "Ghi danh trong buổi học", path: "/students/list-student-session" },
          { label: "Bài tập của học viên", path: "/students/list-student-assignment" },
          { label: "Đơn xin nghỉ của học viên", path: "/students/student-absence" },
        ],
      }),
      item({
        label: "Khóa học",
        icon: <AutoStoriesRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/courses",
      }),
      item({
        label: "Lớp học",
        icon: <SchoolRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/classes",
      }),
      item({
        label: "Buổi học",
        icon: <CalendarMonthRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/sessions",
      }),
      item({
        label: "Bài tập",
        icon: <AssignmentRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/assignments",
      }),
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
        label: "Quản lý học liệu",
        icon: <FolderRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/resources",
        description: "Tạo taxonomy, upload tài liệu, chỉnh metadata và publish học liệu sang LMS.",
        variant: "admin-internal-docs",
      }),
    ],
  },
  {
    label: "Quản lý",
    items: [
      item({
        label: "Nhân sự",
        icon: <HowToRegRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { label: "Tài khoản nhân viên", path: "/employees" },
          { label: "Lịch sử quét khuôn mặt", path: "/employees/face-detection" },
          { label: "Giáo viên tham gia buổi học", path: "/employees/timesheet" },
          { label: "Đơn xin nghỉ của nhân viên", path: "/employees/teacher-absence" },
        ],
      }),
      item({
        label: "Tài chính",
        icon: <PaidRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { label: "Hóa đơn", path: "/finance/orders" },
          { label: "Mua hàng", path: "/finance/product-import-summaries" },
          { label: "Thu khác", path: "/finance/incomes" },
          { label: "Chi khác", path: "/finance/expenses" },
          { label: "Hoàn/Chuyển phí", path: "/finance/refunds" },
          { label: "Giao dịch", path: "/finance/center-transactions" },
          { label: "Giao dịch Coin", path: "/finance/center-transactions/coins" },
        ],
      }),
      item({
        label: "Khác",
        icon: <Inventory2RoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { label: "Hàng hóa", path: "/other/products" },
          { label: "Đối tác", path: "/other/partners" },
        ],
      }),
    ],
  },
  {
    label: "Hệ thống",
    items: [
      item({
        label: "Thiết lập",
        icon: <SettingsRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { label: "Gói sử dụng", path: "/setting/setting-center-feature" },
          { label: "Phân quyền", path: "/setting/setting-center-role" },
          { label: "Khuyến mãi", path: "/setting/promotions/price-discount-programs" },
          { label: "Công việc", path: "/setting/setting-center-task/task-status" },
          { label: "Khách hàng", path: "/setting/setting-center-customer/customer-status" },
          { label: "Phòng học", path: "/setting/setting-class-room" },
          { label: "Sự kiện", path: "/setting/setting-calendar-event" },
          { label: "Điểm thành phần", path: "/setting/setting-criteria-score" },
          { label: "Thu chi", path: "/setting/setting-income-expense" },
        ],
      }),
      item({
        label: "Tích hợp",
        icon: <ExtensionRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { label: "Tổng đài", path: "/integration/setting-call-center" },
          { label: "Tài khoản Zalo", path: "/integration/setting-zalo-account" },
          { label: "API key", path: "/integration/setting-center-api-key" },
        ],
      }),
    ],
  },
];

export function getMenuItemDescription(menuItem: MenuItem) {
  return menuItem.description ?? defaultDescription;
}
