import type { DashboardGroup, DashboardLeaf, DashboardLeafVariant } from "@/layouts/dashboard/types/dashboard-types";
import type { MessageKey } from "@/platform/i18n";

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

export type DashboardScopeMode = "system" | "center" | "school" | "teacher";

type BuildDashboardSectionsOptions = {
  scopeMode?: DashboardScopeMode;
  showMemberManagement?: boolean;
};

function createLeaf(
  id: string,
  title: string,
  sectionTitle: string,
  rootTitle: string,
  description: string,
  variant: DashboardLeafVariant,
): DashboardLeaf {
  return {
    id,
    title,
    breadcrumb: [rootTitle, sectionTitle, title],
    description,
    variant,
  };
}

function buildQuizSection(root: string, genericDescription: string): DashboardGroup {
  return {
    iconKey: "materials",
    title: "Nội dung nguồn",
    items: [
      createLeaf("question-bank", "Ngân hàng câu hỏi", "Nội dung nguồn", root, genericDescription, "question-bank"),
      createLeaf("quiz-bank", "Quiz bank", "Nội dung nguồn", root, genericDescription, "quiz-bank"),
      createLeaf(
        "course-modules",
        "Tạo quiz",
        "Nội dung nguồn",
        root,
        "Tạo quiz nhanh từ ngân hàng câu hỏi hoặc import đã chọn.",
        "quiz-editor",
      ),
      createLeaf(
        "admin-learning-resources",
        "Quản trị học liệu",
        "Nội dung nguồn",
        root,
        "Quản lý cây học liệu và tài nguyên theo giao diện explorer.",
        "admin-internal-docs",
      ),
    ],
  };
}

function buildSystemSections(genericDescription: string): DashboardGroup[] {
  const root = "LMS ERG";

  return [
    {
      iconKey: "operations",
      title: "Báo cáo & Thống kê",
      items: [
        createLeaf(
          "admin-overview",
          "Tổng quan hệ thống",
          "Báo cáo & Thống kê",
          root,
          "Theo dõi nhanh trung tâm, lớp học, học sinh và các việc admin cần xử lý.",
          "admin-overview",
        ),
      ],
    },
    {
      iconKey: "classroom",
      title: "Quản lý trường & lớp",
      items: [
        createLeaf(
          "admin-centers",
          "Trung tâm & cơ sở",
          "Quản lý trường & lớp",
          root,
          "Thêm mới, chỉnh sửa và theo dõi trạng thái vận hành của từng trung tâm hoặc trường.",
          "admin-centers",
        ),
        createLeaf(
          "admin-sheet-import",
          "Import học sinh",
          "Quản lý trường & lớp",
          root,
          "Kiểm tra dữ liệu sheet, map cột, tạo username/password và trả kết quả cho admin.",
          "admin-sheet-import",
        ),
      ],
    },
    {
      iconKey: "members",
      title: "Quản lý thành viên",
      items: [
        createLeaf(
          "admin-members",
          "Danh sách thành viên",
          "Quản lý thành viên",
          root,
          "Xem giáo viên, quản trị viên và người phụ trách trong phạm vi đang chọn.",
          "admin-members",
        ),
        createLeaf(
          "admin-permissions",
          "Phân quyền vai trò",
          "Quản lý thành viên",
          root,
          "Kiểm soát ai được dùng scope ERG, trung tâm, trường và học liệu toàn hệ thống.",
          "admin-permissions",
        ),
      ],
    },
    buildQuizSection(root, genericDescription),
    {
      iconKey: "settings",
      title: "Cấu hình",
      items: [
        createLeaf("general-settings", "Thiết lập chung", "Cấu hình", root, genericDescription, "placeholder"),
      ],
    },
  ];
}

function buildCenterSections(genericDescription: string, showMemberManagement: boolean): DashboardGroup[] {
  const root = "LMS ERG";
  const sections: DashboardGroup[] = [
    {
      iconKey: "operations",
      title: "Báo cáo trung tâm",
      items: [
        createLeaf(
          "admin-overview",
          "Tổng quan trung tâm",
          "Báo cáo trung tâm",
          root,
          "Theo dõi trường, lớp, học sinh và các việc trung tâm cần xử lý.",
          "admin-overview",
        ),
      ],
    },
    {
      iconKey: "classroom",
      title: "Quản lý trường & lớp",
      items: [
        createLeaf(
          "admin-centers",
          "Trường trực thuộc",
          "Quản lý trường & lớp",
          root,
          "Theo dõi trường, lớp và trạng thái vận hành trong phạm vi trung tâm.",
          "admin-centers",
        ),
        createLeaf(
          "admin-sheet-import",
          "Import học sinh",
          "Quản lý trường & lớp",
          root,
          "Import danh sách học sinh bằng Google Sheet cho các trường/lớp thuộc trung tâm.",
          "admin-sheet-import",
        ),
      ],
    },
    buildQuizSection(root, genericDescription),
  ];

  if (showMemberManagement) {
    sections.splice(2, 0, {
      iconKey: "members",
      title: "Quản lý thành viên",
      items: [
        createLeaf(
          "admin-members",
          "Danh sách thành viên",
          "Quản lý thành viên",
          root,
          "Quản lý giáo viên và người phụ trách trong phạm vi trung tâm.",
          "admin-members",
        ),
        createLeaf(
          "admin-permissions",
          "Phân quyền vai trò",
          "Quản lý thành viên",
          root,
          "Cấp quyền theo nhóm và phạm vi cho giáo viên hoặc quản trị viên trung tâm.",
          "admin-permissions",
        ),
      ],
    });
  }

  return sections;
}

function buildSchoolSections(genericDescription: string): DashboardGroup[] {
  const root = "LMS ERG";

  return [
    {
      iconKey: "operations",
      title: "Báo cáo & Thống kê",
      items: [
        createLeaf(
          "ops-overview",
          "Báo cáo tổng quan",
          "Báo cáo & Thống kê",
          root,
          "Nhìn nhanh tiến độ học tập, bài đang mở và các học sinh cần hỗ trợ.",
          "overview",
        ),
        createLeaf(
          "school-pulse",
          "Báo cáo trường/lớp",
          "Báo cáo & Thống kê",
          root,
          "Theo dõi sức khỏe lớp học, hoàn thành bài và các lớp cần chú ý.",
          "school-pulse",
        ),
      ],
    },
    {
      iconKey: "classroom",
      title: "Quản lý lớp học",
      items: [
        createLeaf(
          "class-active",
          "Lớp đang hoạt động",
          "Quản lý lớp học",
          root,
          "Xem lớp đang dạy, giáo viên phụ trách, số học sinh và trạng thái học tập.",
          "class-active",
        ),
        createLeaf(
          "class-ended",
          "Lớp đã kết thúc",
          "Quản lý lớp học",
          root,
          "Tra cứu các lớp đã hoàn tất để xem lại báo cáo và dữ liệu học sinh.",
          "class-ended",
        ),
        createLeaf(
          "class-students",
          "Học sinh trong lớp",
          "Quản lý lớp học",
          root,
          "Xem danh sách học sinh, tiến độ và trạng thái cần hỗ trợ theo lớp.",
          "class-students",
        ),
        createLeaf(
          "class-reports",
          "Báo cáo lớp",
          "Quản lý lớp học",
          root,
          "Tổng hợp tiến độ, bài tập và mức độ hoàn thành của từng lớp.",
          "class-reports",
        ),
      ],
    },
    buildQuizSection(root, genericDescription),
  ];
}

function buildTeacherSections(genericDescription: string, showMemberManagement: boolean): DashboardGroup[] {
  const root = "LMS ERG";
  const sections: DashboardGroup[] = [
    {
      iconKey: "operations",
      title: "Báo cáo & Thống kê",
      items: [
        createLeaf(
          "ops-overview",
          "Báo cáo tổng quan",
          "Báo cáo & Thống kê",
          root,
          "Nhìn nhanh tiến độ học tập, bài đang mở và các học sinh cần hỗ trợ.",
          "overview",
        ),
        createLeaf(
          "school-pulse",
          "Báo cáo trường/lớp",
          "Báo cáo & Thống kê",
          root,
          "Theo dõi sức khỏe lớp học, hoàn thành bài và các lớp cần chú ý.",
          "school-pulse",
        ),
      ],
    },
    {
      iconKey: "classroom",
      title: "Quản lý lớp học",
      items: [
        createLeaf(
          "class-active",
          "Lớp đang hoạt động",
          "Quản lý lớp học",
          root,
          "Xem lớp đang dạy, giáo viên phụ trách, số học sinh và trạng thái học tập.",
          "class-active",
        ),
        createLeaf(
          "class-students",
          "Học sinh trong lớp",
          "Quản lý lớp học",
          root,
          "Xem danh sách học sinh, tiến độ và trạng thái cần hỗ trợ theo lớp.",
          "class-students",
        ),
        createLeaf("class-reports", "Báo cáo lớp", "Quản lý lớp học", root, genericDescription, "class-reports"),
      ],
    },
    buildQuizSection(root, genericDescription),
    {
      iconKey: "settings",
      title: "Cấu hình",
      items: [createLeaf("general-settings", "Thiết lập chung", "Cấu hình", root, genericDescription, "placeholder")],
    },
  ];

  if (showMemberManagement) {
    sections.splice(3, 0, {
      iconKey: "members",
      title: "Quản lý thành viên",
      items: [
        createLeaf(
          "members-list",
          "Danh sách thành viên",
          "Quản lý thành viên",
          root,
          "Xem giáo viên và người phụ trách trong phạm vi đang chọn.",
          "admin-members",
        ),
      ],
    });
  }

  return sections;
}
export function buildDashboardSections(t: Translate, options: BuildDashboardSectionsOptions = {}): DashboardGroup[] {
  const genericDescription = t("dashboard.defaultWorkspaceDescription");
  const scopeMode = options.scopeMode ?? "teacher";

  if (scopeMode === "system") {
    return buildSystemSections(genericDescription);
  }

  if (scopeMode === "center") {
    return buildCenterSections(genericDescription, Boolean(options.showMemberManagement));
  }

  if (scopeMode === "school") {
    return buildSchoolSections(genericDescription);
  }

  return buildTeacherSections(genericDescription, Boolean(options.showMemberManagement));
}
