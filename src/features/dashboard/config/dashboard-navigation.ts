import type { DashboardGroup, DashboardLeaf, DashboardLeafVariant } from "@/features/dashboard/types/dashboard-types";
import type { MessageKey } from "@/features/i18n";

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

export type DashboardScopeMode = "system" | "center" | "school" | "teacher" | "hoclieu";

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
    title: "Quiz",
    items: [
      createLeaf("question-bank", "Ngân hàng câu hỏi", "Quiz", root, genericDescription, "question-bank"),
      createLeaf("quiz-bank", "Quiz bank", "Quiz", root, genericDescription, "quiz-bank"),
      createLeaf(
        "course-modules",
        "Tạo quiz",
        "Quiz",
        root,
        "Tạo quiz nhanh từ ngân hàng câu hỏi hoặc import đã chọn.",
        "quiz-editor",
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
          "admin-students",
          "Học sinh",
          "Quản lý trường & lớp",
          root,
          "Tra cứu học sinh theo toàn hệ thống, trung tâm, trường hoặc lớp.",
          "admin-students",
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
        createLeaf(
          "admin-public-disclosure",
          "Công khai pháp lý",
          "Cấu hình",
          root,
          "Quản lý PDF công khai, metadata, vị trí public và watermark trước khi xuất bản.",
          "admin-public-disclosure",
        ),
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
          "admin-students",
          "Học sinh",
          "Quản lý trường & lớp",
          root,
          "Tra cứu học sinh theo trường và lớp trong phạm vi trung tâm.",
          "admin-students",
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

function buildHocLieuStudioSectionsV2(genericDescription: string): DashboardGroup[] {
  const root = "Hoclieu Studio";

  return [
    {
      iconKey: "materials",
      title: "Cấu trúc học liệu",
      items: [
        createLeaf(
          "admin-hoclieu-studio",
          "Cấu trúc môn học",
          "Cấu trúc học liệu",
          root,
          "Tạo môn học, nhóm học liệu, chủ đề và bài học theo một cây cấu trúc thống nhất.",
          "admin-internal-docs",
        ),
      ],
    },
    {
      iconKey: "docs",
      title: "Kho học liệu",
      items: [
        createLeaf(
          "admin-hoclieu-resources",
          "Danh sách học liệu",
          "Kho học liệu",
          root,
          "Tra cứu, rà soát và cập nhật tài liệu, bài giảng và bài tập đã có trong hệ thống.",
          "admin-internal-docs",
        ),
      ],
    },
    {
      iconKey: "admin",
      title: "Nhập học liệu",
      items: [
        createLeaf(
          "admin-hoclieu-upload",
          "Thêm bài giảng và tài liệu",
          "Nhập học liệu",
          root,
          "Thêm file, link Google Slides hoặc bài tập và gắn vào đúng vị trí trong cây học liệu.",
          "admin-internal-docs",
        ),
      ],
    },
    {
      iconKey: "members",
      title: "Kiểm tra xuất bản",
      items: [
        createLeaf(
          "admin-hoclieu-publish",
          "Xuất bản học liệu",
          "Kiểm tra xuất bản",
          root,
          "Kiểm tra trạng thái sẵn sàng, nội dung còn thiếu và chất lượng trước khi xuất bản.",
          "admin-internal-docs",
        ),
      ],
    },
    {
      iconKey: "settings",
      title: "Cấu hình học liệu",
      items: [
        createLeaf(
          "admin-public-disclosure",
          "Công khai học liệu",
          "Cấu hình học liệu",
          root,
          "Quản lý PDF công khai, metadata, vị trí public và watermark trước khi xuất bản.",
          "admin-public-disclosure",
        ),
        createLeaf("general-settings", "Thiết lập chung", "Cấu hình học liệu", root, genericDescription, "placeholder"),
      ],
    },
  ];
}

export function buildDashboardSections(t: Translate, options: BuildDashboardSectionsOptions = {}): DashboardGroup[] {
  const genericDescription = t("dashboard.defaultWorkspaceDescription");
  const scopeMode = options.scopeMode ?? "teacher";

  if (scopeMode === "hoclieu") {
    return buildHocLieuStudioSectionsV2(genericDescription);
  }

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
