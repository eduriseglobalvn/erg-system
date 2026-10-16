import Button from "@mui/material/Button";
import { ArrowRight, ClipboardCheck, DollarSign, LineChart, UsersRound } from "lucide-react";

import { DashboardMetricCard, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { calculateSeoPnlSummary, costTotal, revenueNet } from "@/features/crm/seo/api/seo-crm-pnl";
import type { SeoLeadStatus, SeoOpportunity, SeoSchoolLead } from "@/features/crm/seo/types/seo-crm-types";
import { DecisionLine, formatCurrency, formatCurrencyCompact, formatDate, formatPercent, statusLabelMap } from "@/features/crm/seo/components/seo-crm-workspace-shared";

export function SeoPnlWorkspace({ lead, opportunity, onUpdateLeadStatus }: {
  lead?: SeoSchoolLead;
  opportunity?: SeoOpportunity;
  onUpdateLeadStatus: (leadId: string, status: SeoLeadStatus) => void;
}) {
  if (!lead || !opportunity) return null;
  const summary = calculateSeoPnlSummary(opportunity);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard label="Doanh thu net" value={formatCurrencyCompact(summary.netRevenue)} detail={`Sau miễn giảm ${formatCurrencyCompact(summary.totalDiscount)}`} tone="emerald" icon={<DollarSign className="size-5" />} />
        <DashboardMetricCard label="Tổng chi phí" value={formatCurrencyCompact(summary.totalCost)} detail="nhân sự, thiết bị, vận hành" tone="amber" icon={<ClipboardCheck className="size-5" />} />
        <DashboardMetricCard label="Lợi nhuận" value={formatCurrencyCompact(summary.grossProfit)} detail={`Margin ${formatPercent(summary.marginRate)}`} tone={summary.marginRate >= 0.28 ? "emerald" : "rose"} icon={<LineChart className="size-5" />} />
        <DashboardMetricCard label="Hòa vốn" value={`${summary.breakEvenStudents} HS`} detail="ước tính theo giá net TB" tone="blue" icon={<UsersRound className="size-5" />} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <DashboardSectionCard title={`P&L ${opportunity.code}`} description={`${lead.schoolName} · năm học ${opportunity.academicYear} · bắt đầu ${opportunity.startMonth}`}>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.6fr_0.8fr_0.6fr_0.9fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400"><span>Chương trình</span><span>Gói</span><span>Lớp</span><span>HS/lớp</span><span>Đơn giá</span><span>Giảm</span><span className="text-right">Doanh thu</span></div>
              <div className="divide-y divide-slate-200 bg-white">
                {opportunity.revenueLines.map((line) => <div key={line.id} className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.6fr_0.8fr_0.6fr_0.9fr] gap-3 px-4 py-4 text-sm"><span className="font-semibold text-slate-950">{line.program}</span><span className="text-slate-600">{line.packageName}</span><span>{line.classCount}</span><span>{line.studentsPerClass}</span><span>{formatCurrency(line.pricePerStudent)}</span><span>{formatPercent(line.discountRate)}</span><span className="text-right font-semibold">{formatCurrency(revenueNet(line))}</span></div>)}
              </div>
            </div>
          </DashboardSectionCard>
          <DashboardSectionCard title="Dự trù chi phí" description="Các dòng bắt buộc sẽ đi kèm checklist bàn giao để trung tâm chuẩn bị vận hành.">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[0.8fr_1.5fr_0.5fr_0.8fr_0.7fr_0.9fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400"><span>Loại</span><span>Diễn giải</span><span>SL</span><span>Đơn giá</span><span>Tháng</span><span className="text-right">Thành tiền</span></div>
              <div className="divide-y divide-slate-200 bg-white">
                {opportunity.costLines.map((line) => <div key={line.id} className="grid grid-cols-[0.8fr_1.5fr_0.5fr_0.8fr_0.7fr_0.9fr] gap-3 px-4 py-4 text-sm"><span className="font-semibold text-slate-950">{line.category}</span><span className="text-slate-600">{line.description}</span><span>{line.quantity}</span><span>{formatCurrency(line.unitCost)}</span><span>{line.durationMonths}</span><span className="text-right font-semibold">{formatCurrency(costTotal(line))}</span></div>)}
              </div>
            </div>
          </DashboardSectionCard>
        </div>
        <DashboardSectionCard title="Quyết định chốt" description="SEO chỉ chuyển sang bàn giao, không tự cấp lớp/giáo viên/học sinh.">
          <div className="space-y-3">
            <DecisionLine label="Điều kiện margin" ok={summary.marginRate >= 0.28} value={formatPercent(summary.marginRate)} />
            <DecisionLine label="Có trường phụ trách" ok value={lead.ownerName} />
            <DecisionLine label="Có lịch follow-up" ok value={formatDate(lead.nextFollowUpAt)} />
            <DecisionLine label="Trạng thái hiện tại" ok={lead.status !== "lost"} value={statusLabelMap[lead.status]} />
          </div>
          <Button variant="contained" fullWidth className="mt-4" endIcon={<ArrowRight className="size-4" />} disabled={summary.marginRate < 0.2 || lead.status === "lost"} onClick={() => onUpdateLeadStatus(lead.id, "won_pending_setup")}>Chốt và chuyển chờ triển khai</Button>
        </DashboardSectionCard>
      </div>
    </div>
  );
}
