import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

import { DashboardPageShell, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { Button } from "@/components/ui/dashboard-kit";
import { useI18n } from "@/features/i18n";
import type { DashboardLeaf } from "@/features/dashboard/types/dashboard-types";

export function DashboardPlaceholderWorkspace({
  activeLeaf,
  onOpenLeaf,
}: {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (leafId: string) => void;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;

  return (
    <DashboardPageShell
      badge={copy.badge}
      title={activeLeaf.title}
      description={activeLeaf.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <Button onClick={() => onOpenLeaf(activeLeaf.id.startsWith("admin") ? "admin-overview" : "ops-overview")}>
          {copy.backToOps}
        </Button>
      }
    >
      <DashboardSectionCard title={copy.title} description={copy.description}>
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-900 text-white">
            <InsightsOutlinedIcon fontSize="inherit" />
          </div>
          <div className="mt-5 max-w-xl text-lg font-semibold text-slate-950">{copy.title}</div>
          <div className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{copy.description}</div>
        </div>
      </DashboardSectionCard>
    </DashboardPageShell>
  );
}

const viCopy = {
  badge: "Workspace",
  backToOps: "Về bảng điều hành",
  title: "Khu vực này sẽ được mở ở phiên bản tiếp theo.",
  description:
    "Các luồng chính đã được ưu tiên trước: bảng điều hành, lớp học, thành viên, học liệu và quiz. Màn này giữ chỗ cho cấu hình nâng cao.",
};

const enCopy = {
  badge: "Workspace",
  backToOps: "Back to ops dashboard",
  title: "This area is reserved for the next implementation pass.",
  description:
    "The current build prioritizes the teacher-heavy workflows first: operations dashboard, question bank, student management, competition reports, and learner journey.",
};
