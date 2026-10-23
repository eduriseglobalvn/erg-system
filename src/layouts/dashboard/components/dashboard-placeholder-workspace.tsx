import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardPageShell, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
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
        <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => onOpenLeaf(backTarget)}>
          {copy.backToOps}
        </Button>
      }
    >
      <DashboardSectionCard title={template?.title ?? copy.title} description={template?.description ?? copy.description}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" } }}>
          <Box sx={{ bgcolor: "background.default", border: "1px dashed", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
              <Box sx={{ alignItems: "center", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, color: "primary.main", display: "flex", flexShrink: 0, height: 44, justifyContent: "center", width: 44 }}>
                <LayersRoundedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 750 }} variant="subtitle1">{template?.headline ?? copy.title}</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7, mt: 1, maxWidth: 760 }} variant="body2">
                  {template?.body ?? copy.description}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                  {(template?.chips ?? ["Admin LMS", "Teacher source", "Setup"]).map((chip) => (
                    <Chip key={chip} label={chip} size="small" color="secondary" />
                  ))}
                </Box>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.primary", fontSize: 14, fontWeight: 800 }}>
              <ChecklistRoundedIcon color="primary" sx={{ fontSize: 18 }} />
              Checklist
            </Stack>
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {(template?.checklist ?? copy.checklist).map((item) => (
                <Stack direction="row" key={item} spacing={1}>
                  <CheckCircleRoundedIcon color="success" sx={{ flexShrink: 0, fontSize: 17, mt: 0.25 }} />
                  <Typography color="text.secondary" variant="body2">{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </DashboardSectionCard>
    </DashboardPageShell>
  );
}

const viCopy = {
  badge: "Workspace",
  backToOps: "Về tổng quan",
  title: "Workspace đang cấu hình",
  description:
    "Module này đã được đặt đúng vị trí trong Admin LMS để làm nguồn cho Teacher Workspace. Các bước cấu hình chi tiết sẽ nối vào API/workflow tương ứng.",
  checklist: ["Có vị trí trong Admin LMS", "Có liên kết chức năng Teacher", "Sẵn sàng nối API khi backend mở"],
};

const enCopy = {
  badge: "Workspace",
  backToOps: "Back to overview",
  title: "Workspace in setup",
  description:
    "This module is placed in Admin LMS as a Teacher Workspace source surface and is ready for its workflow/API connection.",
  checklist: ["Placed in Admin LMS", "Mapped to a Teacher function", "Ready for API wiring"],
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
      description: "Thiết lập chung cho Admin LMS, Teacher Workspace và Student Workspace.",
      headline: "Cấu hình ít, rõ, kiểm soát được ảnh hưởng.",
      body: "Module này giữ các thiết lập toàn cục như scope mặc định, quy tắc publish, trạng thái nội dung và các nhãn dùng chung giữa Admin LMS và Teacher Workspace.",
      chips: ["System", "Scope", "Defaults"],
      checklist: ["Xác định scope mặc định", "Cấu hình trạng thái nội dung", "Đồng bộ nhãn dùng chung"],
    },
  };

  return templates[id];
}
