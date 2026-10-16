import { type ElementType } from "react";
import AlertTriangle from "@mui/icons-material/WarningAmberOutlined";
import BarChart3 from "@mui/icons-material/BarChartOutlined";
import BookOpenCheck from "@mui/icons-material/LibraryBooksOutlined";
import Building2 from "@mui/icons-material/BusinessOutlined";
import CalendarDays from "@mui/icons-material/CalendarMonthOutlined";
import ClipboardCheck from "@mui/icons-material/FactCheckOutlined";
import FileText from "@mui/icons-material/DescriptionOutlined";
import LibraryBig from "@mui/icons-material/LocalLibraryOutlined";
import UsersRound from "@mui/icons-material/GroupsOutlined";
import { DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import type { ClassroomSchool } from "@/features/lms/classroom/types/classroom-types";
import { LcmsActionRow, LcmsMetricCard, LcmsStatusChip } from "@/features/lcms/components/lcms-ui";
import { ActionItem, CenterRow } from "./admin-operations-support";

export function AdminOverview({
  centers,
  classCount,
  onOpenLeaf,
  studentCount,
}: {
  centers: ClassroomSchool[];
  classCount: number;
  onOpenLeaf: (leafId: string) => void;
  studentCount: number;
}) {
  const flaggedStudents = centers.reduce((sum, center) => sum + center.flaggedStudents, 0);
  const coverageItems = [
    {
      icon: ClipboardCheck,
      lmsArea: "Homework",
      lcmsSource: "Quiz bank + Gói giao bài",
      status: "Đủ nguồn",
      leafId: "quiz-bank",
      detail: "Bài Train/Test có thể giao lại ngay.",
    },
    {
      icon: BarChart3,
      lmsArea: "Score",
      lcmsSource: "Thang điểm + rubric",
      status: "Setup",
      leafId: "rubric-templates",
      detail: "Chuẩn phân loại kết quả trước khi đẩy sang bảng điểm.",
    },
    {
      icon: CalendarDays,
      lmsArea: "Attendance, Calendar",
      lcmsSource: "Mẫu buổi học",
      status: "Setup",
      leafId: "session-templates",
      detail: "Khung buổi học, ghi chú lớp và quy tắc điểm danh.",
    },
    {
      icon: LibraryBig,
      lmsArea: "Resources",
      lcmsSource: "Quản trị học liệu",
      status: "Đang dùng",
      leafId: "resources",
      detail: "Taxonomy, metadata, file học liệu và publish.",
    },
    {
      icon: FileText,
      lmsArea: "Reports",
      lcmsSource: "Mẫu báo cáo",
      status: "Setup",
      leafId: "report-templates",
      detail: "Chỉ số, nhãn cảnh báo và cấu trúc tổng hợp.",
    },
    {
      icon: BookOpenCheck,
      lmsArea: "Quiz runtime",
      lcmsSource: "Tạo quiz",
      status: "Đang dùng",
      leafId: "course-modules",
      detail: "Biên soạn slide, câu hỏi và cấu hình player.",
    },
  ] satisfies Array<{
    detail: string;
    icon: ElementType;
    leafId: string;
    lcmsSource: string;
    lmsArea: string;
    status: string;
  }>;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <LcmsMetricCard icon={<Building2 className="h-4 w-4" />} label="Đơn vị trong scope" value={String(centers.length)} detail="Đơn vị backend cấp quyền quản trị." tone="blue" />
        <LcmsMetricCard icon={<Building2 className="h-4 w-4" />} label="Lớp học" value={String(classCount)} detail="Đang nhận nội dung." tone="emerald" />
        <LcmsMetricCard icon={<UsersRound className="h-4 w-4" />} label="Học sinh" value={studentCount.toLocaleString("vi-VN")} detail="Tài khoản đích." tone="violet" />
        <LcmsMetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Cần rà soát" value={String(flaggedStudents)} detail="Ảnh hưởng vận hành LMS." tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <DashboardSectionCard
          title="Admin cung cấp gì cho Teacher Workspace"
          description="Mỗi chức năng giáo viên dùng trong Teacher Workspace đều có nguồn cấu hình hoặc nội dung tương ứng ở Admin."
        >
          <div className="mt-2 grid gap-3">
            {coverageItems.map((item) => (
              <LmsCoverageRow key={item.lmsArea} item={item} onOpenLeaf={onOpenLeaf} />
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Việc cần xử lý"
          description="Chỉ giữ các việc ảnh hưởng trực tiếp tới khả năng giao bài và xuất bản."
        >
          <div className="mt-2 space-y-3">
            {flaggedStudents > 0 ? <ActionItem title="Học sinh cần rà soát" detail={`${flaggedStudents} học sinh được backend đánh dấu trong scope hiện tại.`} urgent /> : null}
            {centers.length === 0 ? <ActionItem title="Chưa có dữ liệu đơn vị" detail="Backend chưa trả đơn vị nào cho scope hiện tại; kiểm tra quyền hoặc tải lại." urgent /> : null}
            {flaggedStudents === 0 && centers.length > 0 ? <ActionItem title="Không có cảnh báo" detail="Backend chưa trả cảnh báo vận hành trong scope hiện tại." /> : null}
          </div>
        </DashboardSectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)]">
        <DashboardSectionCard 
          title="Sức khỏe vận hành theo đơn vị" 
          description="Theo dõi cơ sở đang nhận nội dung, lớp học và tín hiệu cần hỗ trợ."
        >
          <div className="mt-2 grid gap-3 lg:grid-cols-2">
            {centers.map((center) => (
              <CenterRow key={center.id} center={center} />
            ))}
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  );
}

export function LmsCoverageRow({
  item,
  onOpenLeaf,
}: {
  item: {
    detail: string;
    icon: ElementType;
    leafId: string;
    lcmsSource: string;
    lmsArea: string;
    status: string;
  };
  onOpenLeaf: (leafId: string) => void;
}) {
  const Icon = item.icon;
  const setup = item.status === "Setup";

  return (
    <LcmsActionRow
      onClick={() => onOpenLeaf(item.leafId)}
      icon={<Icon className="h-4 w-4" />}
      tone={setup ? "amber" : "blue"}
      action={<LcmsStatusChip tone={setup ? "amber" : "emerald"}>{item.status}</LcmsStatusChip>}
    >
      <span className="grid gap-1 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] sm:gap-4">
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase text-slate-400">LMS</span>
          <span className="mt-0.5 block truncate text-sm font-bold text-slate-950">{item.lmsArea}</span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-slate-700">{item.lcmsSource}</span>
          <span className="mt-1 block line-clamp-2 text-xs font-medium leading-5 text-slate-500">{item.detail}</span>
        </span>
      </span>
    </LcmsActionRow>
  );
}
