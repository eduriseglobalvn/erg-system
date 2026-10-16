import Chip from "@mui/material/Chip";
import { CalendarClock, Handshake, LineChart, TrendingUp, UsersRound } from "lucide-react";

import { DashboardMetricCard, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { calculateSeoPnlSummary } from "@/features/crm/seo/api/seo-crm-pnl";
import type { SeoFollowUp, SeoOpportunity, SeoSchoolLead } from "@/features/crm/seo/types/seo-crm-types";
import {
  formatCurrencyCompact, formatDate, formatPercent, pipelineStatuses, statusLabelMap, statusToneMap, toChipProps,
} from "@/features/crm/seo/components/seo-crm-workspace-shared";

export function SeoOverview({ leads, opportunities, followUps, onOpenLeaf, onSelectLead }: {
  leads: SeoSchoolLead[];
  opportunities: SeoOpportunity[];
  followUps: SeoFollowUp[];
  onOpenLeaf: (leafId: string) => void;
  onSelectLead: (leadId: string) => void;
}) {
  const opportunitySummaries = opportunities.map((opportunity) => ({
    opportunity,
    lead: leads.find((lead) => lead.id === opportunity.leadId),
    pnl: calculateSeoPnlSummary(opportunity),
  }));
  const pipelineValue = opportunitySummaries.reduce((sum, item) => sum + item.pnl.netRevenue * ((item.lead?.probability ?? 0) / 100), 0);
  const avgMargin = opportunitySummaries.reduce((sum, item) => sum + item.pnl.marginRate, 0) / Math.max(1, opportunitySummaries.length);
  const closingSoon = leads.filter((lead) => ["waiting_decision", "negotiating", "won_pending_setup"].includes(lead.status)).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard label="Trường pipeline" value={String(leads.length)} detail="lead SEO đang theo dõi" tone="blue" icon={<UsersRound className="size-5" />} />
        <DashboardMetricCard label="Weighted P&L" value={formatCurrencyCompact(pipelineValue)} detail="doanh thu theo xác suất chốt" tone="emerald" icon={<TrendingUp className="size-5" />} />
        <DashboardMetricCard label="Margin TB" value={formatPercent(avgMargin)} detail="theo P&L hiện tại" tone={avgMargin >= 0.28 ? "emerald" : "amber"} icon={<LineChart className="size-5" />} />
        <DashboardMetricCard label="Cần chốt" value={String(closingSoon)} detail="đang chờ quyết định/đàm phán" tone="amber" icon={<Handshake className="size-5" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <DashboardSectionCard title="Pipeline chốt trường" description="Theo dõi trạng thái từ tư vấn đến active. Cột Active là dữ liệu đã bàn giao cho vận hành.">
          <div className="grid gap-3 lg:grid-cols-6">
            {pipelineStatuses.map((status) => {
              const statusLeads = leads.filter((lead) => lead.status === status);
              return (
                <section key={status} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">{statusLabelMap[status]}</span>
                    <Chip label={statusLeads.length} size="small" {...toChipProps(statusToneMap[status])} />
                  </div>
                  <div className="mt-3 space-y-2">
                    {statusLeads.map((lead) => (
                      <button key={lead.id} type="button" onClick={() => { onSelectLead(lead.id); onOpenLeaf("seo-schools"); }} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-[#b8d6fa] hover:bg-[var(--erg-blue-light)]">
                        <div className="font-semibold text-slate-950">{lead.schoolName}</div>
                        <div className="mt-1 text-xs text-slate-500">{lead.expectedClasses} lớp · {lead.probability}% chốt</div>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title="Việc SEO cần xử lý" description="Các điểm chặn trước khi chuyển sang vận hành.">
          <div className="space-y-3">
            {followUps.slice(0, 4).map((followUp) => {
              const lead = leads.find((item) => item.id === followUp.leadId);
              return (
                <button key={followUp.id} type="button" onClick={() => lead ? onSelectLead(lead.id) : undefined} className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-[#b8d6fa] hover:bg-[var(--erg-blue-light)]">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]"><CalendarClock className="size-4" /></span>
                    <span className="min-w-0"><span className="block font-semibold text-slate-950">{followUp.title}</span><span className="mt-1 block text-sm text-slate-500">{lead?.schoolName ?? "Trường"} · {formatDate(followUp.dueAt)}</span></span>
                  </div>
                </button>
              );
            })}
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  );
}
