import type {
  SeoCostLine,
  SeoFollowUp,
  SeoHandoverRequest,
  SeoOpportunity,
  SeoPnlSummary,
  SeoRevenueLine,
  SeoSchoolLead,
} from "@/features/seo-crm/types/seo-crm-types";

export const seoSchoolLeads: SeoSchoolLead[] = [
  {
    id: "lead-nguyen-trai",
    schoolName: "THCS Nguyễn Trãi",
    district: "Quận 1",
    province: "TP. Hồ Chí Minh",
    segment: "THCS công lập",
    contactName: "Cô Hạnh",
    contactRole: "Phó hiệu trưởng",
    phone: "0902 118 236",
    source: "Hội thảo chuyển đổi số",
    ownerName: "Đỗ Trần Nam",
    status: "waiting_decision",
    probability: 68,
    expectedStudents: 420,
    expectedClasses: 12,
    nextFollowUpAt: "2026-05-29",
    lastTouchAt: "2026-05-24",
    notes: "Trường quan tâm IC3 và AI cơ bản, cần gửi lại phương án chi phí theo 2 học kỳ.",
    risks: ["Cần hiệu trưởng duyệt ngân sách", "Muốn chạy thử 2 lớp trước"],
  },
  {
    id: "lead-le-quy-don",
    schoolName: "THPT Lê Quý Đôn",
    district: "Quận 3",
    province: "TP. Hồ Chí Minh",
    segment: "THPT chất lượng cao",
    contactName: "Thầy Minh",
    contactRole: "Tổ trưởng Tin học",
    phone: "0918 226 551",
    source: "Referral từ đối tác",
    ownerName: "Nguyễn Thùy Linh",
    status: "negotiating",
    probability: 82,
    expectedStudents: 560,
    expectedClasses: 14,
    nextFollowUpAt: "2026-05-27",
    lastTouchAt: "2026-05-25",
    notes: "Đang thương lượng mức miễn giảm cho khối 10, cần giữ margin tối thiểu 28%.",
    risks: ["Yêu cầu nhiều buổi onsite", "Cần demo dashboard phụ huynh"],
  },
  {
    id: "lead-binh-minh",
    schoolName: "Tiểu học Bình Minh",
    district: "Thủ Đức",
    province: "TP. Hồ Chí Minh",
    segment: "Tiểu học tư thục",
    contactName: "Cô Vy",
    contactRole: "Chủ cơ sở",
    phone: "0937 441 909",
    source: "Inbound website",
    ownerName: "Đỗ Trần Nam",
    status: "consulted",
    probability: 44,
    expectedStudents: 180,
    expectedClasses: 6,
    nextFollowUpAt: "2026-06-02",
    lastTouchAt: "2026-05-22",
    notes: "Phụ huynh muốn học thử hè. Trường cần gói nhẹ, ít thiết bị.",
    risks: ["Quy mô nhỏ", "Nhạy cảm học phí"],
  },
  {
    id: "lead-a-chau",
    schoolName: "Liên cấp Á Châu",
    district: "Bình Thạnh",
    province: "TP. Hồ Chí Minh",
    segment: "Liên cấp tư thục",
    contactName: "Thầy Quốc",
    contactRole: "Giám đốc học thuật",
    phone: "0906 732 018",
    source: "Tái ký năm học mới",
    ownerName: "Trần Mai Anh",
    status: "won_pending_setup",
    probability: 96,
    expectedStudents: 760,
    expectedClasses: 22,
    nextFollowUpAt: "2026-05-28",
    lastTouchAt: "2026-05-26",
    notes: "Đã thống nhất nguyên tắc, chờ admin tạo scope và cấp quyền cho quản lý trung tâm.",
    risks: ["Cần import danh sách lớp trước 05/06"],
  },
];

export const seoOpportunities: SeoOpportunity[] = [
  createOpportunity("opp-nguyen-trai", "lead-nguyen-trai", "SEO-PL-260501", "pnl_review", 12, 35, 950_000, 8),
  createOpportunity("opp-le-quy-don", "lead-le-quy-don", "SEO-PL-260514", "contracting", 14, 40, 1_150_000, 10),
  createOpportunity("opp-binh-minh", "lead-binh-minh", "SEO-PL-260519", "proposal", 6, 30, 780_000, 5),
  createOpportunity("opp-a-chau", "lead-a-chau", "SEO-PL-260526", "handover", 22, 35, 1_080_000, 7),
];

export const seoFollowUps: SeoFollowUp[] = [
  { id: "fu-1", leadId: "lead-le-quy-don", type: "contract", title: "Gửi phụ lục miễn giảm khối 10", dueAt: "2026-05-27", ownerName: "Nguyễn Thùy Linh", done: false },
  { id: "fu-2", leadId: "lead-a-chau", type: "handover", title: "Bàn giao dữ liệu lớp cho quản lý trung tâm", dueAt: "2026-05-28", ownerName: "Trần Mai Anh", done: false },
  { id: "fu-3", leadId: "lead-nguyen-trai", type: "meeting", title: "Họp hiệu trưởng chốt ngân sách", dueAt: "2026-05-29", ownerName: "Đỗ Trần Nam", done: false },
  { id: "fu-4", leadId: "lead-binh-minh", type: "proposal", title: "Gửi proposal gói học thử hè", dueAt: "2026-06-02", ownerName: "Đỗ Trần Nam", done: false },
];

export const seoHandoverRequests: SeoHandoverRequest[] = [
  {
    id: "handover-a-chau",
    leadId: "lead-a-chau",
    opportunityId: "opp-a-chau",
    requestedBy: "Trần Mai Anh",
    requestedAt: "2026-05-26",
    status: "ready",
    checklist: [
      { id: "contract", label: "Có xác nhận chốt/hợp đồng nguyên tắc", done: true },
      { id: "pnl", label: "P&L đạt margin tối thiểu", done: true },
      { id: "scope", label: "Xác định trung tâm phụ trách", done: true },
      { id: "classes", label: "Có danh sách lớp dự kiến", done: false },
    ],
  },
];

export function calculateSeoPnlSummary(opportunity: SeoOpportunity): SeoPnlSummary {
  const grossRevenue = opportunity.revenueLines.reduce((sum, line) => sum + revenueGross(line), 0);
  const totalDiscount = opportunity.revenueLines.reduce((sum, line) => sum + revenueGross(line) * line.discountRate, 0);
  const netRevenue = grossRevenue - totalDiscount;
  const totalCost = opportunity.costLines.reduce((sum, line) => sum + costTotal(line), 0);
  const grossProfit = netRevenue - totalCost;
  const averageNetPrice =
    opportunity.revenueLines.reduce((sum, line) => sum + line.pricePerStudent * (1 - line.discountRate), 0) /
    Math.max(1, opportunity.revenueLines.length);

  return {
    grossRevenue,
    totalDiscount,
    netRevenue,
    totalCost,
    grossProfit,
    marginRate: netRevenue > 0 ? grossProfit / netRevenue : 0,
    breakEvenStudents: averageNetPrice > 0 ? Math.ceil(totalCost / averageNetPrice) : 0,
  };
}

export function revenueGross(line: SeoRevenueLine) {
  return line.classCount * line.studentsPerClass * line.pricePerStudent * line.durationMonths;
}

export function revenueNet(line: SeoRevenueLine) {
  return revenueGross(line) * (1 - line.discountRate);
}

export function costTotal(line: SeoCostLine) {
  return line.quantity * line.unitCost * line.durationMonths;
}

function createOpportunity(
  id: string,
  leadId: string,
  code: string,
  stage: SeoOpportunity["stage"],
  classCount: number,
  studentsPerClass: number,
  pricePerStudent: number,
  discountPercent: number,
): SeoOpportunity {
  return {
    id,
    leadId,
    code,
    stage,
    academicYear: "2026-2027",
    contractTerm: "10 tháng",
    startMonth: "08/2026",
    ownerName: "SEO ERG",
    revenueLines: [
      {
        id: `${id}-rev-core`,
        program: "Tin học chuẩn quốc tế",
        packageName: "IC3 GS6 + LMS",
        classCount,
        studentsPerClass,
        pricePerStudent,
        discountRate: discountPercent / 100,
        durationMonths: 10,
      },
      {
        id: `${id}-rev-ai`,
        program: "AI ứng dụng",
        packageName: "Workshop học kỳ",
        classCount: Math.max(2, Math.round(classCount * 0.45)),
        studentsPerClass,
        pricePerStudent: Math.round(pricePerStudent * 0.32),
        discountRate: 0,
        durationMonths: 2,
      },
    ],
    costLines: [
      {
        id: `${id}-cost-teacher`,
        category: "Nhân sự",
        description: "Giáo viên/trợ giảng triển khai lớp",
        quantity: Math.max(2, Math.ceil(classCount / 4)),
        unitCost: 12_000_000,
        durationMonths: 10,
        requiredForHandover: true,
      },
      {
        id: `${id}-cost-device`,
        category: "Thiết bị",
        description: "Màn hình, tài khoản, thiết bị demo",
        quantity: Math.max(1, Math.ceil(classCount / 6)),
        unitCost: 15_000_000,
        durationMonths: 1,
        requiredForHandover: true,
      },
      {
        id: `${id}-cost-ops`,
        category: "Vận hành",
        description: "Onboarding, training giáo viên trường, CSKH",
        quantity: 1,
        unitCost: Math.round(classCount * 1_800_000),
        durationMonths: 1,
        requiredForHandover: false,
      },
    ],
  };
}
