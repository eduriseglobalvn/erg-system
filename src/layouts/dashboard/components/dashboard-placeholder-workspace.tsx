import { ArrowLeft, CheckCircle2, ClipboardList, Layers3 } from "lucide-react";

import { DashboardPageShell, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { Badge, Button } from "@/components/ui/dashboard-kit";
import { useI18n } from "@/platform/i18n";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";

export function DashboardPlaceholderWorkspace({
  activeLeaf,
  onOpenLeaf,
}: {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (leafId: string) => void;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const template = getLcmsTemplate(activeLeaf.id);
  const backTarget = activeLeaf.id.startsWith("admin") || activeLeaf.variant === "lcms-template" ? "admin-overview" : "ops-overview";

  return (
    <DashboardPageShell
      badge={template?.badge ?? copy.badge}
      title={activeLeaf.title}
      description={activeLeaf.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <Button variant="outline" onClick={() => onOpenLeaf(backTarget)}>
          <ArrowLeft className="h-4 w-4" />
          {copy.backToOps}
        </Button>
      }
    >
      <DashboardSectionCard title={template?.title ?? copy.title} description={template?.description ?? copy.description}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-xl border border-dashed border-[#b8c8db] bg-[#f8fbff] p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#d9e2ef] bg-white text-[var(--erg-blue)]">
                <Layers3 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-950">{template?.headline ?? copy.title}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {template?.body ?? copy.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(template?.chips ?? ["LCMS", "LMS source", "Setup"]).map((chip) => (
                    <Badge key={chip} tone="secondary">
                      {chip}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d9e2ef] bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
              <ClipboardList className="h-4 w-4 text-[var(--erg-blue)]" />
              Checklist
            </div>
            <div className="mt-4 space-y-3">
              {(template?.checklist ?? copy.checklist).map((item) => (
                <div key={item} className="flex gap-2 text-sm leading-5 text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardSectionCard>
    </DashboardPageShell>
  );
}

const viCopy = {
  badge: "Workspace",
  backToOps: "Về tổng quan",
  title: "Workspace đang cấu hình",
  description:
    "Module này đã được đặt đúng vị trí trong LCMS để làm nguồn cho LMS. Các bước cấu hình chi tiết sẽ nối vào API/workflow tương ứng.",
  checklist: ["Có vị trí trong LCMS", "Có liên kết chức năng LMS", "Sẵn sàng nối API khi backend mở"],
};

const enCopy = {
  badge: "Workspace",
  backToOps: "Back to overview",
  title: "Workspace in setup",
  description:
    "This module is placed in LCMS as an LMS source surface and is ready for its workflow/API connection.",
  checklist: ["Placed in LCMS", "Mapped to an LMS function", "Ready for API wiring"],
};

function getLcmsTemplate(id: string) {
  const templates: Record<string, {
    badge: string;
    body: string;
    checklist: string[];
    chips: string[];
    description: string;
    headline: string;
    title: string;
  }> = {
    "assignment-templates": {
      badge: "Homework source",
      title: "Gói giao bài cho LMS",
      description: "Nguồn cấu hình để giáo viên giao bài nhanh và nhất quán.",
      headline: "Tạo khuôn mẫu trước khi giáo viên giao homework.",
      body: "Module này quản lý preset giao bài: loại bài, hạn nộp, điều kiện mở, số lần làm, quy tắc trộn câu và cách hiển thị kết quả cho học sinh.",
      chips: ["Homework", "Quiz bank", "Assignment rules"],
      checklist: ["Chọn nguồn quiz hoặc học liệu", "Đặt hạn nộp và điều kiện mở", "Xuất preset sang LMS Homework"],
    },
    "rubric-templates": {
      badge: "Score source",
      title: "Thang điểm và rubric",
      description: "Nguồn phân loại kết quả để bảng điểm LMS đọc nhất quán.",
      headline: "Chuẩn hóa cách chấm trước khi dữ liệu vào Score.",
      body: "Module này giữ thang điểm, nhãn phân loại, ngưỡng cảnh báo và mô tả năng lực để giáo viên không phải tự tạo lại ở từng lớp.",
      chips: ["Score", "Rubric", "Grade rules"],
      checklist: ["Định nghĩa ngưỡng điểm", "Gắn rubric theo môn/level", "Đồng bộ nhãn sang bảng điểm"],
    },
    "session-templates": {
      badge: "Schedule source",
      title: "Mẫu buổi học",
      description: "Nguồn cho lịch học, điểm danh và nhật ký lớp.",
      headline: "Một mẫu buổi học dùng được cho calendar, attendance và class log.",
      body: "Module này quản lý cấu trúc buổi học: mục tiêu, tài nguyên cần dùng, trạng thái điểm danh, ghi chú lớp và checklist sau buổi.",
      chips: ["Calendar", "Attendance", "Class log"],
      checklist: ["Tạo cấu trúc buổi học", "Gắn tài nguyên và mục tiêu", "Đẩy mẫu sang LMS Calendar"],
    },
    "report-templates": {
      badge: "Report source",
      title: "Mẫu báo cáo LMS",
      description: "Nguồn cho báo cáo lớp, học sinh và tiến độ học tập.",
      headline: "Định nghĩa chỉ số trước khi giáo viên xem Reports.",
      body: "Module này quản lý mẫu báo cáo, nhãn cảnh báo, chỉ số hoàn thành và quy tắc gom dữ liệu để báo cáo LMS ngắn gọn và dễ đọc.",
      chips: ["Reports", "Metrics", "Alerts"],
      checklist: ["Chọn chỉ số hiển thị", "Đặt nhãn cảnh báo", "Xuất mẫu sang Reports"],
    },
    "publishing-policy": {
      badge: "Publish flow",
      title: "Duyệt xuất bản",
      description: "Nguồn kiểm soát trước khi nội dung đi sang LMS.",
      headline: "Giữ nội dung đúng scope, đúng quyền và có dấu vết duyệt.",
      body: "Module này gom quy tắc duyệt, pháp lý nội dung, trạng thái publish và audit trail để tránh đưa nhầm học liệu hoặc quiz chưa duyệt vào lớp.",
      chips: ["Approval", "Audit", "Publishing"],
      checklist: ["Kiểm tra scope xuất bản", "Ghi nhận người duyệt", "Khóa nội dung đã phát hành"],
    },
    "general-settings": {
      badge: "System",
      title: "Cấu hình hệ thống",
      description: "Thiết lập chung cho LCMS, LMS và Elearning.",
      headline: "Cấu hình ít, rõ, kiểm soát được ảnh hưởng.",
      body: "Module này giữ các thiết lập toàn cục như scope mặc định, quy tắc publish, trạng thái nội dung và các nhãn dùng chung giữa LCMS và LMS.",
      chips: ["System", "Scope", "Defaults"],
      checklist: ["Xác định scope mặc định", "Cấu hình trạng thái nội dung", "Đồng bộ nhãn dùng chung"],
    },
  };

  return templates[id];
}
