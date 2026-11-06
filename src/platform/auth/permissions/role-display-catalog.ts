export type RoleTone = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

export interface RoleDisplayMeta {
  badgeTone: RoleTone;
  category: string;
  description: string;
  keyPermissions: readonly string[];
  label: string;
}

export const ROLE_DISPLAY_CATALOG: Record<string, RoleDisplayMeta> = {
  // Ban Quản trị & Điều hành Hệ thống
  "system.super_admin": {
    badgeTone: "purple",
    category: "Ban Quản trị & Điều hành",
    description: "Toàn quyền quản trị hệ thống, dữ liệu toàn bộ tổ chức, phân quyền cấp cao và hạ tầng.",
    keyPermissions: ["Toàn quyền hệ thống", "Quản trị cơ sở dữ liệu", "Phân quyền tối cao"],
    label: "Quản trị viên cấp cao (Super Admin)",
  },
  "system.admin": {
    badgeTone: "purple",
    category: "Ban Quản trị & Điều hành",
    description: "Quản lý thiết lập hệ thống, tài khoản tổ chức, chính sách bảo mật và dịch vụ tích hợp.",
    keyPermissions: ["Cấu hình tổ chức", "Quản lý tài khoản", "Bảo mật hệ thống"],
    label: "Quản trị viên hệ thống (System Admin)",
  },
  "executive.director": {
    badgeTone: "purple",
    category: "Ban Quản trị & Điều hành",
    description: "Xem toàn bộ báo cáo kinh doanh, chỉ số KPI đào tạo, vận hành và số liệu điều hành toàn diện.",
    keyPermissions: ["Xem báo cáo điều hành", "Theo dõi KPI toàn hệ thống", "Giám sát hiệu suất"],
    label: "Ban Giám đốc điều hành (Executive)",
  },
  it_operator: {
    badgeTone: "info",
    category: "Ban Quản trị & Điều hành",
    description: "Quản lý kỹ thuật, giám sát phiên truy cập, cấp lại mật khẩu/credential và xử lý sự cố kết nối.",
    keyPermissions: ["Quản trị phiên làm việc", "Reset credential", "Audit & Bảo mật IT"],
    label: "Chuyên viên Kỹ thuật & Hạ tầng (IT)",
  },

  // Quản lý Nhà trường & Đào tạo
  "school.manager": {
    badgeTone: "info",
    category: "Quản lý Nhà trường & Đào tạo",
    description: "Điều hành trường học, quản lý danh sách lớp học, phân công chuyên môn và duyệt kế hoạch đào tạo.",
    keyPermissions: ["Quản lý trường học", "Phân công giảng dạy", "Duyệt kế hoạch đào tạo"],
    label: "Quản lý trường học / Hiệu trưởng",
  },
  center_manager: {
    badgeTone: "info",
    category: "Quản lý Nhà trường & Đào tạo",
    description: "Vận hành cơ sở / trung tâm đào tạo, phân bổ phòng học, giảng viên và giám sát sĩ số lớp.",
    keyPermissions: ["Điều hành trung tâm", "Xếp lịch cơ sở", "Quản lý nhân sự cơ sở"],
    label: "Giám đốc trung tâm đào tạo",
  },
  pdt_operator: {
    badgeTone: "info",
    category: "Quản lý Nhà trường & Đào tạo",
    description: "Sắp xếp thời khóa biểu, lịch giảng dạy, kiểm duyệt sổ đầu bài và quản lý danh sách học viên.",
    keyPermissions: ["Sắp xếp thời khóa biểu", "Kiểm duyệt sổ đầu bài", "Quản lý danh sách lớp"],
    label: "Chuyên viên Phòng Đào tạo (PĐT)",
  },
  "lms.admin": {
    badgeTone: "info",
    category: "Quản lý Nhà trường & Đào tạo",
    description: "Quản trị nội dung học thuật, ngân hàng câu hỏi, cấu trúc chương trình khung và tiến trình môn học.",
    keyPermissions: ["Quản trị ngân hàng câu hỏi", "Cấu hình đề thi", "Quản lý học liệu số"],
    label: "Quản trị phân hệ Học thuật (LMS Admin)",
  },

  // Đội ngũ Giảng dạy & Lớp học
  lms_teacher_lead: {
    badgeTone: "success",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Biên tập và duyệt đề cương, duyệt phân phối chương trình, xuất bản thời khóa biểu khối bộ môn.",
    keyPermissions: ["Xuất bản thời khóa biểu", "Duyệt đề cương môn học", "Quản lý tổ bộ môn"],
    label: "Tổ trưởng chuyên môn",
  },
  lms_homeroom_teacher: {
    badgeTone: "success",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Quản lý toàn diện học sinh lớp chủ nhiệm, theo dõi chuyên cần, đánh giá hạnh kiểm và liên lạc phụ huynh.",
    keyPermissions: ["Quản lý lớp chủ nhiệm", "Điểm danh & Chuyên cần", "Quản lý nhóm học sinh"],
    label: "Giáo viên chủ nhiệm",
  },
  lms_subject_teacher: {
    badgeTone: "success",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Giảng dạy bộ môn, giao bài tập về nhà, chấm điểm, ghi nhận sổ đầu bài và quản lý tài nguyên môn học.",
    keyPermissions: ["Giao bài tập & Chấm điểm", "Ghi sổ đầu bài", "Quản lý tài nguyên bài giảng"],
    label: "Giáo viên bộ môn",
  },
  lms_teacher_standard: {
    badgeTone: "success",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Thực hiện giảng dạy, giao bài tập, chấm điểm và quản lý tài liệu học tập của các lớp phụ trách.",
    keyPermissions: ["Giao bài tập & Chấm bài", "Xem sổ điểm", "Quản lý tài liệu lớp"],
    label: "Giáo viên tiêu chuẩn",
  },
  lms_teacher: {
    badgeTone: "success",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Thực hiện giảng dạy, giao bài tập, chấm điểm và quản lý tài liệu học tập của các lớp phụ trách.",
    keyPermissions: ["Giao bài tập & Chấm bài", "Xem sổ điểm", "Quản lý tài liệu lớp"],
    label: "Giáo viên giảng dạy",
  },
  "lms.instructor": {
    badgeTone: "success",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Giảng viên chuyên môn, trực tiếp tương tác bài giảng, chấm điểm bài kiểm tra và hướng dẫn học viên.",
    keyPermissions: ["Giảng dạy chuyên môn", "Chấm bài tập & Thi", "Phản hồi học viên"],
    label: "Giảng viên chuyên môn (Instructor)",
  },
  lms_teacher_assistant: {
    badgeTone: "warning",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Hỗ trợ giáo viên điểm danh, chấm bài tập cơ bản, phụ đạo và giải đáp thắc mắc cho học viên trong lớp.",
    keyPermissions: ["Hỗ trợ điểm danh", "Chấm bài tập cơ bản", "Hỗ trợ nhóm học sinh"],
    label: "Trợ giảng (Teacher Assistant)",
  },
  lms_teacher_readonly: {
    badgeTone: "neutral",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Chỉ xem thông tin lớp học, thời khóa biểu và tiến độ bài tập, không có quyền chỉnh sửa dữ liệu.",
    keyPermissions: ["Xem danh sách lớp", "Xem thời khóa biểu", "Xem kết quả bài tập"],
    label: "Giáo viên (Chỉ xem dữ liệu)",
  },
  "lms.learner": {
    badgeTone: "neutral",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Tài khoản học sinh/học viên, tham gia lớp học, làm bài tập, thi trực tuyến và xem kết quả cá nhân.",
    keyPermissions: ["Làm bài tập & Thi", "Xem bài giảng số", "Xem điểm cá nhân"],
    label: "Học sinh / Học viên (Learner)",
  },
  user: {
    badgeTone: "neutral",
    category: "Đội ngũ Giảng dạy & Lớp học",
    description: "Tài khoản người dùng cơ bản, truy cập các tính năng cơ bản được phân bổ trong tổ chức.",
    keyPermissions: ["Truy cập cổng portal", "Xem thông tin cá nhân"],
    label: "Người dùng cơ bản (Standard User)",
  },

  // Tuyển sinh & Khách hàng (CRM)
  "seo.manager": {
    badgeTone: "warning",
    category: "Tuyển sinh & Khách hàng (CRM)",
    description: "Quản lý toàn bộ phễu tuyển sinh, phân bổ cơ hội bán hàng, chiến dịch tư vấn và chính sách học phí.",
    keyPermissions: ["Quản lý chiến dịch tuyển sinh", "Phân bổ cơ hội CRM", "Báo cáo chuyển đổi Lead"],
    label: "Trưởng phòng Tuyển sinh & CRM",
  },
  "seo.lead": {
    badgeTone: "warning",
    category: "Tuyển sinh & Khách hàng (CRM)",
    description: "Điều phối đội ngũ tư vấn viên, theo dõi chỉ tiêu tuyển sinh cơ sở và phân chia học viên tiềm năng.",
    keyPermissions: ["Điều phối tư vấn viên", "Theo dõi KPI cơ sở", "Phân chia Lead tuyển sinh"],
    label: "Trưởng nhóm Tuyển sinh (Lead)",
  },
  "seo.staff": {
    badgeTone: "warning",
    category: "Tuyển sinh & Khách hàng (CRM)",
    description: "Tiếp nhận hồ sơ học viên tiềm năng, liên hệ tư vấn phụ huynh và chăm sóc thông tin tuyển sinh.",
    keyPermissions: ["Tư vấn tuyển sinh", "Cập nhật trạng thái Lead", "Chăm sóc học viên"],
    label: "Chuyên viên Tuyển sinh & Tư vấn",
  },
};

export function getRoleMeta(roleName: string): RoleDisplayMeta {
  const normalized = roleName.trim().toLowerCase();
  const found = ROLE_DISPLAY_CATALOG[normalized];
  if (found) return found;

  // Fallback for custom or unmapped roles
  const formatted = roleName
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    badgeTone: "neutral",
    category: "Nhóm quyền bổ sung",
    description: `Nhóm quyền nghiệp vụ được định cấu hình riêng trong hệ thống (${roleName}).`,
    keyPermissions: ["Theo cấu hình hệ thống"],
    label: formatted,
  };
}

export interface ScopeDisplayMeta {
  badgeTone: RoleTone;
  description: string;
  label: string;
  placeholder?: string;
  requiresId: boolean;
  scopeType: string;
}

export const SCOPE_DISPLAY_CATALOG: Record<string, ScopeDisplayMeta> = {
  SYSTEM: {
    badgeTone: "purple",
    description: "Áp dụng quyền hạn trên toàn bộ hệ thống ERG (bao gồm mọi tổ chức và mọi trường học).",
    label: "Toàn hệ thống ERG",
    requiresId: false,
    scopeType: "SYSTEM",
  },
  TENANT: {
    badgeTone: "info",
    description: "Áp dụng quyền hạn trên toàn bộ tổ chức hiện tại (bao gồm tất cả trung tâm và trường học trực thuộc).",
    label: "Toàn tổ chức (Toàn Tenant)",
    requiresId: false,
    scopeType: "TENANT",
  },
  CENTER: {
    badgeTone: "success",
    description: "Giới hạn quyền hạn trong phạm vi một cơ sở hoặc trung tâm đào tạo cụ thể.",
    label: "Cơ sở / Trung tâm đào tạo",
    placeholder: "Nhập mã cơ sở (VD: CS-QUAN-1, CENTER-01)...",
    requiresId: true,
    scopeType: "CENTER",
  },
  SCHOOL: {
    badgeTone: "warning",
    description: "Giới hạn quyền hạn trong phạm vi một trường học liên kết cụ thể.",
    label: "Trường học liên kết",
    placeholder: "Nhập mã trường (VD: THCS-TRUONG-CONG-DINH)...",
    requiresId: true,
    scopeType: "SCHOOL",
  },
  CLASS: {
    badgeTone: "warning",
    description: "Giới hạn quyền hạn chỉ áp dụng đối với các lớp học được phân công trực tiếp.",
    label: "Lớp học được phân công",
    placeholder: "Nhập mã lớp (VD: 9A1, 9A2)...",
    requiresId: true,
    scopeType: "CLASS",
  },
};

export function getScopeMeta(scopeType: string): ScopeDisplayMeta {
  const found = SCOPE_DISPLAY_CATALOG[scopeType.toUpperCase()];
  if (found) return found;

  return {
    badgeTone: "neutral",
    description: `Phạm vi nghiệp vụ được tùy chỉnh (${scopeType}).`,
    label: scopeType,
    placeholder: "Nhập ID phạm vi...",
    requiresId: true,
    scopeType,
  };
}

export function groupRolesByCategory<T extends { id: string; name: string }>(roles: T[]) {
  const groups: Record<string, Array<{ item: T; meta: RoleDisplayMeta }>> = {};

  for (const role of roles) {
    const meta = getRoleMeta(role.name);
    const cat = meta.category;
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push({ item: role, meta });
  }

  return groups;
}
